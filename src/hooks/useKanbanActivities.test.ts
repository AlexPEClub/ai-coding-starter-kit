import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useKanbanActivities } from './useKanbanActivities'
import { KANBAN_STATUSES } from '@/lib/activity-types'

// --- Supabase mock (hoisted so the factory can reference them) ---
const { mockQueryResult, mockRemoveChannel, mockSubscribe, mockOn } = vi.hoisted(() => ({
  mockQueryResult: vi.fn(),
  mockRemoveChannel: vi.fn(),
  mockSubscribe: vi.fn().mockReturnValue({}),
  mockOn: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          in: () => ({
            order: () => mockQueryResult(),
          }),
        }),
      }),
    }),
    channel: () => ({
      on: (...args: unknown[]) => {
        mockOn(...args)
        return { subscribe: mockSubscribe }
      },
    }),
    removeChannel: mockRemoveChannel,
  },
}))

const MOCK_ACTIVITIES = [
  {
    id: 'act-1',
    group_id: 'group-1',
    initiator_id: 'user-1',
    name: 'Klettern',
    status: 'zu_planen',
    start_date: null,
    end_date: null,
    initiator: { id: 'user-1', display_name: 'Alice', avatar_url: null },
  },
  {
    id: 'act-2',
    group_id: 'group-1',
    initiator_id: 'user-2',
    name: 'Bowling',
    status: 'in_planung',
    start_date: '2026-08-01',
    end_date: '2026-08-03',
    initiator: { id: 'user-2', display_name: 'Bob', avatar_url: null },
  },
]

describe('useKanbanActivities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns fetched activities on success', async () => {
    mockQueryResult.mockResolvedValue({ data: MOCK_ACTIVITIES, error: null })

    const { result } = renderHook(() => useKanbanActivities('group-1'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.activities).toEqual(MOCK_ACTIVITIES)
    expect(result.current.error).toBeNull()
  })

  it('returns empty array and error message on DB failure', async () => {
    mockQueryResult.mockResolvedValue({ data: null, error: { message: 'relation does not exist' } })

    const { result } = renderHook(() => useKanbanActivities('group-1'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.activities).toEqual([])
    expect(result.current.error).toBe('Aktivitäten konnten nicht geladen werden.')
  })

  it('treats null data as empty array without error', async () => {
    mockQueryResult.mockResolvedValue({ data: null, error: null })

    const { result } = renderHook(() => useKanbanActivities('group-1'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.activities).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('does not fetch when groupId is empty string', async () => {
    const { result } = renderHook(() => useKanbanActivities(''))

    // Loading must stay false — no fetch was initiated
    expect(result.current.loading).toBe(false)
    expect(mockQueryResult).not.toHaveBeenCalled()
  })

  it('calls removeChannel on unmount', async () => {
    mockQueryResult.mockResolvedValue({ data: [], error: null })

    const { result, unmount } = renderHook(() => useKanbanActivities('group-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    unmount()

    expect(mockRemoveChannel).toHaveBeenCalledTimes(1)
  })

  it('subscribes to a Supabase Realtime channel keyed by groupId', async () => {
    mockQueryResult.mockResolvedValue({ data: [], error: null })

    const { result } = renderHook(() => useKanbanActivities('group-abc'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    // The .on() call should be for postgres_changes on activities
    expect(mockOn).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: '*',
        schema: 'public',
        table: 'activities',
        filter: 'group_id=eq.group-abc',
      }),
      expect.any(Function)
    )
    expect(mockSubscribe).toHaveBeenCalled()
  })

  it('KANBAN_STATUSES contains all four kanban columns', () => {
    expect(KANBAN_STATUSES).toContain('zu_planen')
    expect(KANBAN_STATUSES).toContain('in_planung')
    expect(KANBAN_STATUSES).toContain('planung_abgeschlossen')
    expect(KANBAN_STATUSES).toContain('abgeschlossen')
    expect(KANBAN_STATUSES).toHaveLength(4)
  })
})
