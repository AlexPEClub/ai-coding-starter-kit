import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useDateBlocks } from './useDateBlocks'

// ─── Supabase mock ─────────────────────────────────────────────────────────────

const { mockFetchResult, mockInsertResult, mockDeleteEq } = vi.hoisted(() => ({
  mockFetchResult: vi.fn(),
  mockInsertResult: vi.fn(),
  mockDeleteEq: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: mockFetchResult,
        }),
      }),
      insert: () => mockInsertResult(),
      delete: () => ({
        eq: mockDeleteEq,
      }),
    }),
  },
}))

// ─── Auth mock ─────────────────────────────────────────────────────────────────

const MOCK_USER = { id: 'user-1' }

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: MOCK_USER }),
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeBlock(id: string, start: string, end: string | null = null) {
  return { id, user_id: 'user-1', start_date: start, end_date: end, created_at: '2026-01-01' }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useDateBlocks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchResult.mockResolvedValue({ data: [] })
  })

  it('loads blocks on mount', async () => {
    const blocks = [makeBlock('b1', '2026-07-01'), makeBlock('b2', '2026-07-05', '2026-07-10')]
    mockFetchResult.mockResolvedValue({ data: blocks })
    const { result } = renderHook(() => useDateBlocks())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.blocks).toHaveLength(2)
  })

  describe('addBlock', () => {
    it('rejects end date before start date (client-side validation)', async () => {
      const { result } = renderHook(() => useDateBlocks())
      await waitFor(() => expect(result.current.loading).toBe(false))
      let res: { error: string | null }
      await act(async () => {
        res = await result.current.addBlock('2026-07-10', '2026-07-05')
      })
      expect(res!.error).toBe('Das Enddatum muss nach dem Startdatum liegen')
      expect(mockInsertResult).not.toHaveBeenCalled()
    })

    it('allows end date equal to start date (same-day block)', async () => {
      mockInsertResult.mockResolvedValue({ error: null })
      mockFetchResult.mockResolvedValue({ data: [makeBlock('b1', '2026-07-10', '2026-07-10')] })
      const { result } = renderHook(() => useDateBlocks())
      await waitFor(() => expect(result.current.loading).toBe(false))
      let res: { error: string | null }
      await act(async () => {
        res = await result.current.addBlock('2026-07-10', '2026-07-10')
      })
      expect(res!.error).toBeNull()
      expect(mockInsertResult).toHaveBeenCalledTimes(1)
    })

    it('inserts a single-day block when no end date is provided', async () => {
      mockInsertResult.mockResolvedValue({ error: null })
      mockFetchResult.mockResolvedValue({ data: [makeBlock('b1', '2026-07-10')] })
      const { result } = renderHook(() => useDateBlocks())
      await waitFor(() => expect(result.current.loading).toBe(false))
      let res: { error: string | null }
      await act(async () => {
        res = await result.current.addBlock('2026-07-10')
      })
      expect(res!.error).toBeNull()
    })

    it('returns error message on DB insert failure', async () => {
      mockInsertResult.mockResolvedValue({ error: { message: 'constraint violation' } })
      const { result } = renderHook(() => useDateBlocks())
      await waitFor(() => expect(result.current.loading).toBe(false))
      let res: { error: string | null }
      await act(async () => {
        res = await result.current.addBlock('2026-07-01', '2026-07-15')
      })
      expect(res!.error).toBe('constraint violation')
    })

    it('refreshes the list after a successful add', async () => {
      mockInsertResult.mockResolvedValue({ error: null })
      const freshBlocks = [makeBlock('b1', '2026-07-01')]
      let fetchCallCount = 0
      mockFetchResult.mockImplementation(async () => {
        fetchCallCount++
        return fetchCallCount === 1 ? { data: [] } : { data: freshBlocks }
      })
      const { result } = renderHook(() => useDateBlocks())
      await waitFor(() => expect(result.current.loading).toBe(false))
      await act(async () => {
        await result.current.addBlock('2026-07-01')
      })
      await waitFor(() => expect(result.current.blocks).toHaveLength(1))
    })
  })

  describe('deleteBlock', () => {
    it('removes the block from local state optimistically on success', async () => {
      const initialBlocks = [makeBlock('b1', '2026-07-01'), makeBlock('b2', '2026-07-05')]
      mockFetchResult.mockResolvedValue({ data: initialBlocks })
      mockDeleteEq.mockResolvedValue({ error: null })
      const { result } = renderHook(() => useDateBlocks())
      await waitFor(() => expect(result.current.blocks).toHaveLength(2))
      let ok: boolean
      await act(async () => {
        ok = await result.current.deleteBlock('b1')
      })
      expect(ok!).toBe(true)
      await waitFor(() => expect(result.current.blocks).toHaveLength(1))
      expect(result.current.blocks[0].id).toBe('b2')
    })

    it('returns false on DB delete error', async () => {
      const initialBlocks = [makeBlock('b1', '2026-07-01')]
      mockFetchResult.mockResolvedValue({ data: initialBlocks })
      mockDeleteEq.mockResolvedValue({ error: { message: 'delete failed' } })
      const { result } = renderHook(() => useDateBlocks())
      await waitFor(() => expect(result.current.blocks).toHaveLength(1))
      let ok: boolean
      await act(async () => {
        ok = await result.current.deleteBlock('b1')
      })
      expect(ok!).toBe(false)
      expect(result.current.blocks).toHaveLength(1)
    })
  })
})
