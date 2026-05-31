import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Supabase server client mock ───────────────────────────────────────────────
// vi.mock is hoisted above imports, so variables used inside the factory must
// be created with vi.hoisted() to avoid "Cannot access before initialization".
const { mockGetUser, mockFrom, mockSupabase } = vi.hoisted(() => {
  const mockGetUser  = vi.fn()
  const mockFrom     = vi.fn()
  const mockSupabase = { auth: { getUser: mockGetUser }, from: mockFrom }
  return { mockGetUser, mockFrom, mockSupabase }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}))

// next/headers is only available inside Next.js runtime; stub it for Vitest.
vi.mock('next/headers', () => ({ cookies: vi.fn().mockReturnValue({ getAll: () => [], set: vi.fn() }) }))

import { GET, PUT } from './route'

// ── Helper builders ───────────────────────────────────────────────────────────

function makeRequest(body?: unknown): Request {
  return new Request('http://localhost/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

function chainQuery(result: unknown) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq:     vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    update: vi.fn().mockReturnThis(),
  }
  return chain
}

// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/profile', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when the user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const res = await GET()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })

  it('returns 404 when no profile exists for the user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    const chain = chainQuery({ data: null, error: { message: 'not found' } })
    mockFrom.mockReturnValue(chain)

    const res = await GET()
    expect(res.status).toBe(404)
  })

  it('returns 200 with profile data when authenticated and profile exists', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })

    const mockProfile = {
      id: 'p1',
      user_id: 'u1',
      tenant_id: 't1',
      role: 'owner',
      full_name: 'Anna Müller',
      first_name: 'Anna',
      last_name: 'Müller',
      phone: null,
      avatar_url: null,
      created_at: '2026-05-31T00:00:00Z',
      tenant: { id: 't1', name: 'Tierphysio München', slug: 'tierphysio-muenchen', plan: 'trial', logo_url: null },
    }
    const chain = chainQuery({ data: mockProfile, error: null })
    mockFrom.mockReturnValue(chain)

    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.first_name).toBe('Anna')
    expect(body.tenant.name).toBe('Tierphysio München')
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('PUT /api/profile', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const res = await PUT(makeRequest({ first_name: 'Max' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid JSON body', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })

    const req = new Request('http://localhost/api/profile', {
      method: 'PUT',
      body: 'not-json',
      headers: { 'Content-Type': 'text/plain' },
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for validation errors (empty first_name)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })

    const res = await PUT(makeRequest({ first_name: '' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.details).toBeTruthy()
  })

  it('returns 200 and updated profile on success', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })

    const currentChain = chainQuery({ data: { first_name: 'Old', last_name: 'Name' }, error: null })
    const updatedProfile = { id: 'p1', first_name: 'Anna', last_name: 'Name', full_name: 'Anna Name' }
    const updateChain = {
      update: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: updatedProfile, error: null }),
    }

    // First call = fetch current profile for full_name recomputation;
    // second call = update.
    mockFrom
      .mockReturnValueOnce(currentChain)
      .mockReturnValueOnce(updateChain)

    const res = await PUT(makeRequest({ first_name: 'Anna' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.first_name).toBe('Anna')
    expect(body.full_name).toBe('Anna Name')
  })

  it('returns 500 if the database update fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })

    const currentChain = chainQuery({ data: { first_name: 'X', last_name: 'Y' }, error: null })
    const failChain = {
      update: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'db error' } }),
    }
    mockFrom.mockReturnValueOnce(currentChain).mockReturnValueOnce(failChain)

    const res = await PUT(makeRequest({ first_name: 'Anna' }))
    expect(res.status).toBe(500)
  })
})
