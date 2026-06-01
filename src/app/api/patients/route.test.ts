import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockGetUser, mockFrom, mockSupabase } = vi.hoisted(() => {
  const mockGetUser = vi.fn()
  const mockFrom = vi.fn()
  const mockSupabase = { auth: { getUser: mockGetUser }, from: mockFrom }
  return { mockGetUser, mockFrom, mockSupabase }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}))
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockReturnValue({ getAll: () => [], set: vi.fn() }),
}))

import { GET, POST } from './route'

// A thenable query chain: every builder returns itself, and awaiting the chain
// (or calling .single()) resolves to `result`. Handles both terminal styles.
function chain(result: unknown) {
  const c: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'order', 'limit', 'or', 'insert', 'update']) {
    c[m] = vi.fn(() => c)
  }
  c.single = vi.fn(() => Promise.resolve(result))
  c.maybeSingle = vi.fn(() => Promise.resolve(result))
  c.then = (resolve: (v: unknown) => unknown) => resolve(result)
  return c
}

// A valid RFC 4122 v4 UUID — z.uuid() checks the version/variant nibbles.
const VALID_OWNER_ID = '3f9a1b2c-4d5e-4f6a-8b9c-1d2e3f4a5b6c'

function authed() {
  mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
}
function profile(tenantId: string | null = 't1') {
  return chain({ data: tenantId ? { tenant_id: tenantId } : null, error: null })
}
function listRequest(qs = '') {
  return new Request(`http://localhost/api/patients${qs}`)
}
function postRequest(body?: unknown) {
  return new Request('http://localhost/api/patients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

describe('GET /api/patients', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    const res = await GET(listRequest())
    expect(res.status).toBe(401)
  })

  it('returns active patients and filters by search across owner name', async () => {
    authed()
    const rows = [
      { id: 'p1', name: 'Max', species: 'Hund', breed: null, photo_url: null, status: 'active', owner: { first_name: 'Anna', last_name: 'Schmidt' } },
      { id: 'p2', name: 'Bello', species: 'Hund', breed: null, photo_url: null, status: 'active', owner: { first_name: 'Tom', last_name: 'Müller' } },
    ]
    mockFrom.mockReturnValueOnce(profile()).mockReturnValueOnce(chain({ data: rows, error: null }))

    const res = await GET(listRequest('?status=active&search=schmidt'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].name).toBe('Max')
  })

  it('returns 500 when the DB query errors', async () => {
    authed()
    mockFrom.mockReturnValueOnce(profile()).mockReturnValueOnce(chain({ data: null, error: { message: 'boom' } }))
    const res = await GET(listRequest())
    expect(res.status).toBe(500)
  })
})

describe('POST /api/patients', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    const res = await POST(postRequest({ name: 'Max', species: 'Hund', owner_id: VALID_OWNER_ID }))
    expect(res.status).toBe(401)
  })

  it('returns 400 on validation error (missing name)', async () => {
    authed()
    mockFrom.mockReturnValueOnce(profile())
    const res = await POST(postRequest({ species: 'Hund', owner_id: VALID_OWNER_ID }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when neither owner_id nor new_owner is provided', async () => {
    authed()
    mockFrom.mockReturnValueOnce(profile())
    const res = await POST(postRequest({ name: 'Max', species: 'Hund' }))
    expect(res.status).toBe(400)
  })

  it('creates a patient with an existing owner (201)', async () => {
    authed()
    const created = { id: 'p1', name: 'Max', tenant_id: 't1', owner_id: VALID_OWNER_ID }
    mockFrom
      .mockReturnValueOnce(profile()) // resolveTenant
      .mockReturnValueOnce(chain({ data: { id: VALID_OWNER_ID }, error: null })) // owner tenant check
      .mockReturnValueOnce(chain({ data: created, error: null })) // patient insert

    const res = await POST(postRequest({ name: 'Max', species: 'Hund', owner_id: VALID_OWNER_ID }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe('p1')
  })

  it('returns 404 when owner_id is not in the caller tenant (RLS hides it)', async () => {
    authed()
    mockFrom
      .mockReturnValueOnce(profile()) // resolveTenant
      .mockReturnValueOnce(chain({ data: null, error: null })) // owner lookup → no row

    const res = await POST(postRequest({ name: 'Max', species: 'Hund', owner_id: VALID_OWNER_ID }))
    expect(res.status).toBe(404)
  })

  it('creates a new owner then the patient when new_owner is given', async () => {
    authed()
    const owner = { id: 'o1' }
    const created = { id: 'p1', name: 'Max', tenant_id: 't1', owner_id: 'o1' }
    mockFrom
      .mockReturnValueOnce(profile())
      .mockReturnValueOnce(chain({ data: owner, error: null }))
      .mockReturnValueOnce(chain({ data: created, error: null }))

    const res = await POST(
      postRequest({
        name: 'Max',
        species: 'Hund',
        new_owner: { first_name: 'Anna', last_name: 'Schmidt', email: 'anna@example.com' },
      }),
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.owner_id).toBe('o1')
  })

  it('rejects a new_owner without email or phone (400)', async () => {
    authed()
    mockFrom.mockReturnValueOnce(profile())
    const res = await POST(
      postRequest({
        name: 'Max',
        species: 'Hund',
        new_owner: { first_name: 'Anna', last_name: 'Schmidt' },
      }),
    )
    expect(res.status).toBe(400)
  })
})
