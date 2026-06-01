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

import { GET, PATCH } from './route'

function chain(result: unknown) {
  const c: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'update']) c[m] = vi.fn(() => c)
  c.single = vi.fn(() => Promise.resolve(result))
  c.then = (resolve: (v: unknown) => unknown) => resolve(result)
  return c
}

const params = { params: Promise.resolve({ id: 'o1' }) }

function authed() {
  mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
}
function profile() {
  return chain({ data: { tenant_id: 't1' }, error: null })
}
function patchRequest(body?: unknown) {
  return new Request('http://localhost/api/owners/o1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

describe('GET /api/owners/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    const res = await GET(new Request('http://localhost/api/owners/o1'), params)
    expect(res.status).toBe(401)
  })

  it('returns 404 when not found', async () => {
    authed()
    mockFrom.mockReturnValueOnce(profile()).mockReturnValueOnce(chain({ data: null, error: { message: 'no rows' } }))
    const res = await GET(new Request('http://localhost/api/owners/o1'), params)
    expect(res.status).toBe(404)
  })

  it('returns owner with patients (200)', async () => {
    authed()
    const owner = { id: 'o1', first_name: 'Anna', patients: [{ id: 'p1', name: 'Max', species: 'Hund', status: 'active' }] }
    mockFrom.mockReturnValueOnce(profile()).mockReturnValueOnce(chain({ data: owner, error: null }))
    const res = await GET(new Request('http://localhost/api/owners/o1'), params)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.patients).toHaveLength(1)
  })
})

describe('PATCH /api/owners/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    const res = await PATCH(patchRequest({ first_name: 'Anna' }), params)
    expect(res.status).toBe(401)
  })

  it('returns 400 for an empty patch', async () => {
    authed()
    mockFrom.mockReturnValueOnce(profile())
    const res = await PATCH(patchRequest({}), params)
    expect(res.status).toBe(400)
  })

  it('returns 400 when clearing the last contact channel', async () => {
    authed()
    // current row has only email; patch clears it → must be rejected
    mockFrom
      .mockReturnValueOnce(profile())
      .mockReturnValueOnce(chain({ data: { email: 'a@x.de', phone: null }, error: null }))
    const res = await PATCH(patchRequest({ email: null }), params)
    expect(res.status).toBe(400)
  })

  it('updates the owner (200)', async () => {
    authed()
    const updated = { id: 'o1', first_name: 'Bernd', last_name: 'Schmidt', email: 'a@x.de', phone: null }
    mockFrom
      .mockReturnValueOnce(profile())
      .mockReturnValueOnce(chain({ data: { email: 'a@x.de', phone: null }, error: null }))
      .mockReturnValueOnce(chain({ data: updated, error: null }))
    const res = await PATCH(patchRequest({ first_name: 'Bernd' }), params)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.first_name).toBe('Bernd')
  })
})
