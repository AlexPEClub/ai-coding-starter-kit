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

function chain(result: unknown) {
  const c: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'order', 'limit', 'or', 'insert']) c[m] = vi.fn(() => c)
  c.single = vi.fn(() => Promise.resolve(result))
  c.then = (resolve: (v: unknown) => unknown) => resolve(result)
  return c
}

function authed() {
  mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
}
function profile() {
  return chain({ data: { tenant_id: 't1' }, error: null })
}
function postRequest(body?: unknown) {
  return new Request('http://localhost/api/owners', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

describe('GET /api/owners', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    const res = await GET(new Request('http://localhost/api/owners'))
    expect(res.status).toBe(401)
  })

  it('returns the owner list (200)', async () => {
    authed()
    const owners = [{ id: 'o1', first_name: 'Anna', last_name: 'Schmidt', email: 'a@x.de', phone: null }]
    mockFrom.mockReturnValueOnce(profile()).mockReturnValueOnce(chain({ data: owners, error: null }))
    const res = await GET(new Request('http://localhost/api/owners?search=anna'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body[0].first_name).toBe('Anna')
  })
})

describe('POST /api/owners', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    const res = await POST(postRequest({ first_name: 'Anna', last_name: 'Schmidt', email: 'a@x.de' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when neither email nor phone is provided', async () => {
    authed()
    mockFrom.mockReturnValueOnce(profile())
    const res = await POST(postRequest({ first_name: 'Anna', last_name: 'Schmidt' }))
    expect(res.status).toBe(400)
  })

  it('creates an owner (201)', async () => {
    authed()
    const created = { id: 'o1', first_name: 'Anna', last_name: 'Schmidt', email: 'a@x.de', phone: null }
    mockFrom.mockReturnValueOnce(profile()).mockReturnValueOnce(chain({ data: created, error: null }))
    const res = await POST(postRequest({ first_name: 'Anna', last_name: 'Schmidt', phone: '+49 89 1' }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe('o1')
  })
})
