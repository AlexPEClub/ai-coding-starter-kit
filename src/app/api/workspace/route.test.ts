import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Supabase server client mock ───────────────────────────────────────────────
const { mockGetUser, mockFrom, mockSupabase } = vi.hoisted(() => {
  const mockGetUser  = vi.fn()
  const mockFrom     = vi.fn()
  const mockSupabase = { auth: { getUser: mockGetUser }, from: mockFrom }
  return { mockGetUser, mockFrom, mockSupabase }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}))

vi.mock('next/headers', () => ({ cookies: vi.fn().mockReturnValue({ getAll: () => [], set: vi.fn() }) }))

import { GET, PUT } from './route'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body?: unknown): Request {
  return new Request('http://localhost/api/workspace', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

function singleResult(data: unknown, error: unknown = null) {
  return {
    select: vi.fn().mockReturnThis(),
    eq:     vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    update: vi.fn().mockReturnThis(),
  }
}

const mockProfile = { tenant_id: 't1', role: 'owner' }
const mockTenant  = { id: 't1', name: 'Tierphysio München', slug: 'tierphysio-muenchen', plan: 'trial', logo_url: null, created_at: '2026-05-31T00:00:00Z' }

// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/workspace', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns 404 when no profile found', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockFrom.mockReturnValue(singleResult(null, { message: 'not found' }))

    const res = await GET()
    expect(res.status).toBe(404)
  })

  it('returns 200 with tenant data when authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })

    // First call = profiles query, second call = tenants query
    mockFrom
      .mockReturnValueOnce(singleResult(mockProfile))
      .mockReturnValueOnce(singleResult(mockTenant))

    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.name).toBe('Tierphysio München')
    expect(body.plan).toBe('trial')
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('PUT /api/workspace', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const res = await PUT(makeRequest({ name: 'Neue Praxis' }))
    expect(res.status).toBe(401)
  })

  it('returns 403 when user is not the workspace owner', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockFrom.mockReturnValue(singleResult({ tenant_id: 't1', role: 'therapist' }))

    const res = await PUT(makeRequest({ name: 'Neue Praxis' }))
    expect(res.status).toBe(403)
  })

  it('returns 400 for empty name', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockFrom.mockReturnValue(singleResult(mockProfile))

    const res = await PUT(makeRequest({ name: '' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.details).toBeTruthy()
  })

  it('returns 400 for invalid JSON', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockFrom.mockReturnValue(singleResult(mockProfile))

    const req = new Request('http://localhost/api/workspace', {
      method: 'PUT',
      body: 'bad-json',
      headers: { 'Content-Type': 'text/plain' },
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it('returns 200 with updated tenant on success', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })

    const updatedTenant = { ...mockTenant, name: 'Neue Praxis GmbH' }
    const updateChain = {
      update: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: updatedTenant, error: null }),
    }

    mockFrom
      .mockReturnValueOnce(singleResult(mockProfile))
      .mockReturnValueOnce(updateChain)

    const res = await PUT(makeRequest({ name: 'Neue Praxis GmbH' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.name).toBe('Neue Praxis GmbH')
  })

  it('returns 500 when database update fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })

    const failChain = {
      update: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'db error' } }),
    }

    mockFrom
      .mockReturnValueOnce(singleResult(mockProfile))
      .mockReturnValueOnce(failChain)

    const res = await PUT(makeRequest({ name: 'Valid Name' }))
    expect(res.status).toBe(500)
  })
})
