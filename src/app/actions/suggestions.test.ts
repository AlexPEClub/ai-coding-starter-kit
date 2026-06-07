import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.hoisted(() => vi.fn())
const mockEq = vi.hoisted(() => vi.fn())
const mockUpdate = vi.hoisted(() => vi.fn())
const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase-server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}))

import { updateSuggestionStatus } from './suggestions'

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'

describe('updateSuggestionStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    mockEq.mockResolvedValue({ error: null })
    mockUpdate.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ update: mockUpdate })
  })

  it('gibt success zurück wenn Status erfolgreich gesetzt wird', async () => {
    const result = await updateSuggestionStatus(VALID_UUID, 'approved')
    expect(result.success).toBe(true)
    expect(mockFrom).toHaveBeenCalledWith('suggestions')
    expect(mockEq).toHaveBeenCalledWith('id', VALID_UUID)
  })

  it('gibt error zurück bei ungültiger UUID', async () => {
    const result = await updateSuggestionStatus('keine-uuid', 'approved')
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('gibt error zurück wenn Nutzer nicht eingeloggt ist', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await updateSuggestionStatus(VALID_UUID, 'approved')
    expect(result.success).toBe(false)
    expect(result.error).toContain('eingeloggt')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('gibt error zurück wenn Datenbankupdate fehlschlägt', async () => {
    mockEq.mockResolvedValue({ error: { message: 'DB-Fehler' } })
    const result = await updateSuggestionStatus(VALID_UUID, 'approved')
    expect(result.success).toBe(false)
    expect(result.error).toBe('DB-Fehler')
  })

  it('setzt reviewed_at auf null beim Rückgängig (pending)', async () => {
    await updateSuggestionStatus(VALID_UUID, 'pending')
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pending', reviewed_at: null })
    )
  })

  it('setzt reviewed_at beim Bestätigen', async () => {
    await updateSuggestionStatus(VALID_UUID, 'approved')
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'approved', reviewed_at: expect.any(String) })
    )
  })

  it('gibt success zurück für rejected Status', async () => {
    const result = await updateSuggestionStatus(VALID_UUID, 'rejected')
    expect(result.success).toBe(true)
  })
})
