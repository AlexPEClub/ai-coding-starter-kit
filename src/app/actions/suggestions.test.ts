import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.hoisted(() => vi.fn())
const mockEq = vi.hoisted(() => vi.fn())
const mockUpdate = vi.hoisted(() => vi.fn())
const mockSingle = vi.hoisted(() => vi.fn())
const mockSelect = vi.hoisted(() => vi.fn())
const mockUpsert = vi.hoisted(() => vi.fn())
const mockMaybeSingle = vi.hoisted(() => vi.fn())
const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase-server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}))

vi.mock('@/lib/monday', () => ({
  fetchBoard: vi.fn(),
  createNoraBizDevBoard: vi.fn(),
  ensureGroup: vi.fn().mockResolvedValue('group-123'),
  createTask: vi.fn().mockResolvedValue({ id: 'item-123', url: 'https://monday.com/boards/1/pulses/123' }),
  addUpdate: vi.fn().mockResolvedValue(undefined),
  CATEGORY_TO_GROUP: { marketing: 'Marketing', product: 'Produkt', operations: 'Operations' },
}))

import { updateSuggestionStatus } from './suggestions'

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'

const MOCK_SUGGESTION = {
  title: 'Test Vorschlag',
  body: 'Test Body',
  insight: 'Test Insight',
  source: 'Test Quelle',
  category: 'marketing',
}

function setupFromMock(forApproval = false) {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'app_config') {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: { value: 'board-123' } }),
          }),
        }),
        upsert: mockUpsert,
      }
    }
    if (table === 'suggestions') {
      return {
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: MOCK_SUGGESTION, error: null }),
          }),
        }),
        update: mockUpdate,
      }
    }
    return { update: mockUpdate, select: mockSelect, upsert: mockUpsert }
  })
  mockUpdate.mockReturnValue({ eq: mockEq })
  mockEq.mockResolvedValue({ error: null })
}

describe('updateSuggestionStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    setupFromMock()
  })

  it('gibt error zurück bei ungültiger UUID', async () => {
    const result = await updateSuggestionStatus('keine-uuid', 'approved')
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('gibt error zurück wenn Nutzer nicht eingeloggt ist', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await updateSuggestionStatus(VALID_UUID, 'rejected')
    expect(result.success).toBe(false)
    expect(result.error).toContain('eingeloggt')
  })

  it('gibt success zurück für rejected Status ohne Monday', async () => {
    const result = await updateSuggestionStatus(VALID_UUID, 'rejected')
    expect(result.success).toBe(true)
    expect(result.monday_task_url).toBeUndefined()
  })

  it('gibt success zurück für pending (Rückgängig) ohne Monday', async () => {
    const result = await updateSuggestionStatus(VALID_UUID, 'pending')
    expect(result.success).toBe(true)
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pending', reviewed_at: null })
    )
  })

  it('setzt reviewed_at beim Ablehnen', async () => {
    await updateSuggestionStatus(VALID_UUID, 'rejected')
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'rejected', reviewed_at: expect.any(String) })
    )
  })

  it('gibt error zurück wenn Datenbankupdate für rejected fehlschlägt', async () => {
    mockEq.mockResolvedValue({ error: { message: 'DB-Fehler' } })
    const result = await updateSuggestionStatus(VALID_UUID, 'rejected')
    expect(result.success).toBe(false)
    expect(result.error).toBe('DB-Fehler')
  })

  describe('approved — Monday.com Integration', () => {
    it('gibt error zurück wenn MONDAY_API_KEY fehlt', async () => {
      delete process.env.MONDAY_API_KEY
      const result = await updateSuggestionStatus(VALID_UUID, 'approved')
      expect(result.success).toBe(false)
      expect(result.error).toContain('API-Key fehlt')
    })

    it('gibt success + monday_task_url zurück bei erfolgreicher Erstellung', async () => {
      process.env.MONDAY_API_KEY = 'test-key'
      const { fetchBoard } = await import('@/lib/monday')
      vi.mocked(fetchBoard).mockResolvedValue({ id: 'board-123', groups: [{ id: 'g1', title: 'Marketing' }] })

      const result = await updateSuggestionStatus(VALID_UUID, 'approved')
      expect(result.success).toBe(true)
      expect(result.monday_task_url).toBe('https://monday.com/boards/1/pulses/123')
    })

    it('gibt error zurück wenn Monday API fehlschlägt (kein DB-Update)', async () => {
      process.env.MONDAY_API_KEY = 'test-key'
      const { createTask } = await import('@/lib/monday')
      vi.mocked(createTask).mockRejectedValue(new Error('Monday.com nicht erreichbar (HTTP 503).'))

      const { fetchBoard } = await import('@/lib/monday')
      vi.mocked(fetchBoard).mockResolvedValue({ id: 'board-123', groups: [{ id: 'g1', title: 'Marketing' }] })

      const result = await updateSuggestionStatus(VALID_UUID, 'approved')
      expect(result.success).toBe(false)
      expect(result.error).toContain('nicht erreichbar')
      // Supabase update should NOT have been called
      expect(mockUpdate).not.toHaveBeenCalled()
    })
  })
})
