import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useVote } from './useVote'

// --- Supabase mock ---
const mockInsertResult = vi.fn()
const mockDeleteResult = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      delete: () => ({
        eq: () => ({
          eq: () => mockDeleteResult(),
        }),
      }),
      insert: () => mockInsertResult(),
    }),
  },
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-abc' } }),
}))

describe('useVote — optimistic update + rollback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fires optimistic update immediately when adding a vote', async () => {
    mockInsertResult.mockResolvedValue({ error: null })
    const { result } = renderHook(() => useVote())
    const onOptimistic = vi.fn()

    await act(async () => {
      await result.current.toggleVote('act-1', false, onOptimistic)
    })

    // First call must be the optimistic update: voted = true
    expect(onOptimistic).toHaveBeenNthCalledWith(1, 'act-1', true)
  })

  it('fires optimistic update immediately when removing a vote', async () => {
    mockDeleteResult.mockResolvedValue({ error: null })
    const { result } = renderHook(() => useVote())
    const onOptimistic = vi.fn()

    await act(async () => {
      await result.current.toggleVote('act-1', true, onOptimistic)
    })

    // Optimistic update: voted = false
    expect(onOptimistic).toHaveBeenNthCalledWith(1, 'act-1', false)
    // No rollback on success
    expect(onOptimistic).toHaveBeenCalledTimes(1)
  })

  it('rolls back optimistic update when insert fails', async () => {
    mockInsertResult.mockResolvedValue({ error: { message: 'unique constraint violated' } })
    const onError = vi.fn()
    const { result } = renderHook(() => useVote({ onError }))
    const onOptimistic = vi.fn()

    await act(async () => {
      await result.current.toggleVote('act-2', false, onOptimistic)
    })

    expect(onOptimistic).toHaveBeenCalledTimes(2)
    // First: optimistic add
    expect(onOptimistic).toHaveBeenNthCalledWith(1, 'act-2', true)
    // Second: rollback to original
    expect(onOptimistic).toHaveBeenNthCalledWith(2, 'act-2', false)
  })

  it('rolls back optimistic update when delete fails', async () => {
    mockDeleteResult.mockResolvedValue({ error: { message: 'not found' } })
    const onError = vi.fn()
    const { result } = renderHook(() => useVote({ onError }))
    const onOptimistic = vi.fn()

    await act(async () => {
      await result.current.toggleVote('act-3', true, onOptimistic)
    })

    expect(onOptimistic).toHaveBeenCalledTimes(2)
    expect(onOptimistic).toHaveBeenNthCalledWith(1, 'act-3', false)
    expect(onOptimistic).toHaveBeenNthCalledWith(2, 'act-3', true)
  })

  it('calls onError with the error message on failure', async () => {
    mockInsertResult.mockResolvedValue({ error: { message: 'DB connection error' } })
    const onError = vi.fn()
    const { result } = renderHook(() => useVote({ onError }))

    await act(async () => {
      await result.current.toggleVote('act-4', false, vi.fn())
    })

    expect(onError).toHaveBeenCalledWith('DB connection error')
  })

  it('does not call onError on success', async () => {
    mockInsertResult.mockResolvedValue({ error: null })
    const onError = vi.fn()
    const { result } = renderHook(() => useVote({ onError }))

    await act(async () => {
      await result.current.toggleVote('act-5', false, vi.fn())
    })

    expect(onError).not.toHaveBeenCalled()
  })

  it('tracks pending state: activity is pending during async call', async () => {
    let resolveInsert: (v: { error: null }) => void
    mockInsertResult.mockReturnValue(
      new Promise((res) => { resolveInsert = res })
    )

    const { result } = renderHook(() => useVote())

    act(() => {
      result.current.toggleVote('act-6', false, vi.fn())
    })

    // Pending immediately after kick-off
    expect(result.current.pending.has('act-6')).toBe(true)

    await act(async () => {
      resolveInsert!({ error: null })
    })

    // Cleared after completion
    expect(result.current.pending.has('act-6')).toBe(false)
  })

  it('ignores duplicate toggleVote calls while already pending', async () => {
    let resolveFirst: (v: { error: null }) => void
    mockInsertResult.mockReturnValueOnce(
      new Promise((res) => { resolveFirst = res })
    )
    mockInsertResult.mockResolvedValue({ error: null })

    const { result } = renderHook(() => useVote())
    const onOptimistic = vi.fn()

    act(() => {
      result.current.toggleVote('act-7', false, onOptimistic)
    })

    // Second call while pending — should be ignored
    await act(async () => {
      await result.current.toggleVote('act-7', false, onOptimistic)
    })

    await act(async () => {
      resolveFirst!({ error: null })
    })

    // Optimistic update fired only once (first call), second call was a no-op
    expect(onOptimistic).toHaveBeenCalledTimes(1)
  })
})
