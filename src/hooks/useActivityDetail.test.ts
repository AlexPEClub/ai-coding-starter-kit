import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useActivityDetail } from './useActivityDetail'

// ─── Supabase mock ─────────────────────────────────────────────────────────────

const { mockSelectSingle, mockUpdateEq } = vi.hoisted(() => ({
  mockSelectSingle: vi.fn(),
  mockUpdateEq: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: mockSelectSingle,
        }),
      }),
      update: () => ({
        eq: mockUpdateEq,
      }),
    }),
  },
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_ACTIVITY = {
  id: 'act-1',
  group_id: 'group-1',
  initiator_id: 'user-1',
  name: 'Klettern',
  description: 'Eine tolle Aktivität',
  location: 'Berlin',
  url: 'https://example.com',
  og_image_url: null,
  status: 'vorschlag',
  duration_category: 'spontan',
  required_votes: 3,
  current_votes: 1,
  start_date: null,
  end_date: null,
  created_at: '2026-01-01',
  initiator: { id: 'user-1', display_name: 'Alice', avatar_url: null },
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useActivityDetail', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null activity, no loading, no error when activityId is null', () => {
    const { result } = renderHook(() => useActivityDetail(null))
    expect(result.current.activity).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(mockSelectSingle).not.toHaveBeenCalled()
  })

  it('starts loading when activityId is provided', () => {
    mockSelectSingle.mockReturnValue(new Promise(() => {})) // never resolves
    const { result } = renderHook(() => useActivityDetail('act-1'))
    expect(result.current.loading).toBe(true)
  })

  it('loads and exposes activity data on success', async () => {
    mockSelectSingle.mockResolvedValue({ data: MOCK_ACTIVITY, error: null })
    const { result } = renderHook(() => useActivityDetail('act-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.activity?.name).toBe('Klettern')
    expect(result.current.activity?.initiator.display_name).toBe('Alice')
    expect(result.current.error).toBeNull()
  })

  it('sets error state and keeps activity null when fetch fails', async () => {
    mockSelectSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } })
    const { result } = renderHook(() => useActivityDetail('act-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.activity).toBeNull()
    expect(result.current.error).toMatch(/konnte nicht geladen/)
  })

  it('re-fetches when activityId changes', async () => {
    const activity2 = { ...MOCK_ACTIVITY, id: 'act-2', name: 'Bowling' }
    mockSelectSingle
      .mockResolvedValueOnce({ data: MOCK_ACTIVITY, error: null })
      .mockResolvedValueOnce({ data: activity2, error: null })

    const { result, rerender } = renderHook(
      ({ id }: { id: string }) => useActivityDetail(id),
      { initialProps: { id: 'act-1' } }
    )
    await waitFor(() => expect(result.current.activity?.name).toBe('Klettern'))

    rerender({ id: 'act-2' })
    await waitFor(() => expect(result.current.activity?.name).toBe('Bowling'))
    expect(mockSelectSingle).toHaveBeenCalledTimes(2)
  })
})

describe('useActivityDetail — updateActivity', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns true and re-fetches on successful update', async () => {
    mockSelectSingle.mockResolvedValue({ data: MOCK_ACTIVITY, error: null })
    mockUpdateEq.mockResolvedValue({ error: null })

    const { result } = renderHook(() => useActivityDetail('act-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    let ok = false
    await act(async () => {
      ok = await result.current.updateActivity({
        name: 'Neuer Name',
        description: null,
        location: null,
        url: null,
      })
    })

    expect(ok).toBe(true)
    // mockSelectSingle called twice: initial load + re-fetch after update
    expect(mockSelectSingle).toHaveBeenCalledTimes(2)
  })

  it('returns false when update fails (does not re-fetch)', async () => {
    mockSelectSingle.mockResolvedValue({ data: MOCK_ACTIVITY, error: null })
    mockUpdateEq.mockResolvedValue({ error: { message: 'Update failed' } })

    const { result } = renderHook(() => useActivityDetail('act-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    let ok = true
    await act(async () => {
      ok = await result.current.updateActivity({ name: 'Neuer Name' })
    })

    expect(ok).toBe(false)
    // Only the initial load, no re-fetch on error
    expect(mockSelectSingle).toHaveBeenCalledTimes(1)
  })

  it('returns false immediately when activityId is null', async () => {
    const { result } = renderHook(() => useActivityDetail(null))

    let ok = true
    await act(async () => {
      ok = await result.current.updateActivity({ name: 'Neuer Name' })
    })

    expect(ok).toBe(false)
    expect(mockUpdateEq).not.toHaveBeenCalled()
  })
})
