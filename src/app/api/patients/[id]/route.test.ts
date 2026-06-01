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
  for (const m of ['select', 'eq', 'order', 'limit', 'update']) c[m] = vi.fn(() => c)
  c.single = vi.fn(() => Promise.resolve(result))
  c.then = (resolve: (v: unknown) => unknown) => resolve(result)
  return c
}

const params = { params: Promise.resolve({ id: 'p1' }) }

function authed() {
  mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
}
function profile() {
  return chain({ data: { tenant_id: 't1' }, error: null })
}
function patchRequest(body?: unknown) {
  return new Request('http://localhost/api/patients/p1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

describe('GET /api/patients/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    const res = await GET(new Request('http://localhost/api/patients/p1'), params)
    expect(res.status).toBe(401)
  })

  it('returns 404 when the patient does not exist', async () => {
    authed()
    mockFrom.mockReturnValueOnce(profile()).mockReturnValueOnce(chain({ data: null, error: { message: 'no rows' } }))
    const res = await GET(new Request('http://localhost/api/patients/p1'), params)
    expect(res.status).toBe(404)
  })

  it('returns the patient with owner and ownerPatients', async () => {
    authed()
    const patient = { id: 'p1', name: 'Max', owner_id: 'o1', owner: { id: 'o1', first_name: 'Anna' } }
    const others = [{ id: 'p1', name: 'Max', species: 'Hund', status: 'active' }]
    mockFrom
      .mockReturnValueOnce(profile())
      .mockReturnValueOnce(chain({ data: patient, error: null }))
      .mockReturnValueOnce(chain({ data: others, error: null }))

    const res = await GET(new Request('http://localhost/api/patients/p1'), params)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.name).toBe('Max')
    expect(body.owner.first_name).toBe('Anna')
    expect(body.ownerPatients).toHaveLength(1)
  })
})

describe('PATCH /api/patients/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    const res = await PATCH(patchRequest({ status: 'archived' }), params)
    expect(res.status).toBe(401)
  })

  it('returns 400 for an empty patch', async () => {
    authed()
    mockFrom.mockReturnValueOnce(profile())
    const res = await PATCH(patchRequest({}), params)
    expect(res.status).toBe(400)
  })

  it('returns 400 for an invalid status value', async () => {
    authed()
    mockFrom.mockReturnValueOnce(profile())
    const res = await PATCH(patchRequest({ status: 'deleted' }), params)
    expect(res.status).toBe(400)
  })

  it('archives a patient (200)', async () => {
    authed()
    const updated = { id: 'p1', status: 'archived' }
    mockFrom.mockReturnValueOnce(profile()).mockReturnValueOnce(chain({ data: updated, error: null }))
    const res = await PATCH(patchRequest({ status: 'archived' }), params)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('archived')
  })

  it('returns 404 when the update matches no row (RLS / not found)', async () => {
    authed()
    mockFrom.mockReturnValueOnce(profile()).mockReturnValueOnce(chain({ data: null, error: { message: 'no rows' } }))
    const res = await PATCH(patchRequest({ anamnesis: 'Notiz' }), params)
    expect(res.status).toBe(404)
  })
})
