import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useUpdateActivityStatus } from './useUpdateActivityStatus'

// --- Supabase mock ---
const mockUpdateResult = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      update: () => ({
        eq: () => mockUpdateResult(),
      }),
    }),
  },
}))

describe('useUpdateActivityStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error: null on successful update', async () => {
    mockUpdateResult.mockResolvedValue({ error: null })

    const { result } = renderHook(() => useUpdateActivityStatus())
    let updateResult: { error: string | null }

    await act(async () => {
      updateResult = await result.current.updateStatus({
        activityId: 'act-1',
        status: 'in_planung',
        startDate: '2026-08-01',
        endDate: '2026-08-05',
      })
    })

    expect(updateResult!.error).toBeNull()
  })

  it('returns german error message on DB failure', async () => {
    mockUpdateResult.mockResolvedValue({ error: { message: 'policy violation' } })

    const { result } = renderHook(() => useUpdateActivityStatus())
    let updateResult: { error: string | null }

    await act(async () => {
      updateResult = await result.current.updateStatus({
        activityId: 'act-1',
        status: 'planung_abgeschlossen',
      })
    })

    expect(updateResult!.error).toBe('Statuswechsel fehlgeschlagen. Bitte erneut versuchen.')
  })

  it('sets loading=true during call and false after completion', async () => {
    let resolve: (v: { error: null }) => void
    mockUpdateResult.mockReturnValue(
      new Promise<{ error: null }>((res) => { resolve = res })
    )

    const { result } = renderHook(() => useUpdateActivityStatus())

    act(() => {
      result.current.updateStatus({ activityId: 'act-1', status: 'in_planung' })
    })

    expect(result.current.loading).toBe(true)

    await act(async () => {
      resolve!({ error: null })
    })

    expect(result.current.loading).toBe(false)
  })

  it('sets loading=false even after an error', async () => {
    mockUpdateResult.mockResolvedValue({ error: { message: 'DB error' } })

    const { result } = renderHook(() => useUpdateActivityStatus())

    await act(async () => {
      await result.current.updateStatus({ activityId: 'act-1', status: 'abgeschlossen' })
    })

    expect(result.current.loading).toBe(false)
  })

  it('works with status-only update (no dates)', async () => {
    mockUpdateResult.mockResolvedValue({ error: null })

    const { result } = renderHook(() => useUpdateActivityStatus())
    let updateResult: { error: string | null }

    await act(async () => {
      updateResult = await result.current.updateStatus({
        activityId: 'act-2',
        status: 'planung_abgeschlossen',
      })
    })

    expect(updateResult!.error).toBeNull()
    expect(mockUpdateResult).toHaveBeenCalledTimes(1)
  })

  it('can update all four kanban target statuses', async () => {
    mockUpdateResult.mockResolvedValue({ error: null })
    const { result } = renderHook(() => useUpdateActivityStatus())

    for (const status of ['in_planung', 'planung_abgeschlossen', 'abgeschlossen'] as const) {
      await act(async () => {
        const r = await result.current.updateStatus({ activityId: 'act-x', status })
        expect(r.error).toBeNull()
      })
    }

    expect(mockUpdateResult).toHaveBeenCalledTimes(3)
  })
})
