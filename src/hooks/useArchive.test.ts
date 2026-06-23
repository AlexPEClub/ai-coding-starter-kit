import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useArchive } from './useArchive'

// ─── Supabase mock ─────────────────────────────────────────────────────────────

const { mockMemberships, mockActivitiesResult } = vi.hoisted(() => ({
  mockMemberships: vi.fn(),
  mockActivitiesResult: vi.fn(),
}))

// Build a mock that dispatches calls by table name
vi.mock('@/lib/supabase', () => {
  // We need the table-specific mock to work with a chained API.
  // group_members → select().eq() → mockMemberships
  // activities → select().eq().in().order().range() → mockActivitiesResult

  function buildActivitiesChain() {
    const chain: Record<string, unknown> = {}
    chain.eq = () => chain
    chain.in = () => chain
    chain.order = () => chain
    chain.range = mockActivitiesResult
    return chain
  }

  return {
    supabase: {
      from: (table: string) => {
        if (table === 'group_members') {
          return {
            select: () => ({
              eq: () => mockMemberships(),
            }),
          }
        }
        if (table === 'activities') {
          return {
            select: () => buildActivitiesChain(),
          }
        }
        return {}
      },
    },
  }
})

// ─── Auth mock ─────────────────────────────────────────────────────────────────

const MOCK_USER = { id: 'user-1' }

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: MOCK_USER }),
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeActivity(id: string) {
  return {
    id,
    name: `Aktivität ${id}`,
    group_id: 'group-1',
    og_image_url: null,
    description: null,
    location: null,
    start_date: null,
    end_date: null,
    status: 'abgeschlossen',
    created_at: '2026-01-01',
    groups: { id: 'group-1', name: 'Freunde' },
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useArchive', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty list when user has no group memberships', async () => {
    mockMemberships.mockResolvedValue({ data: [] })
    const { result } = renderHook(() => useArchive())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.activities).toHaveLength(0)
    expect(result.current.hasMore).toBe(false)
  })

  it('fetches and maps activities from groups the user belongs to', async () => {
    mockMemberships.mockResolvedValue({ data: [{ group_id: 'group-1' }] })
    mockActivitiesResult.mockResolvedValue({ data: [makeActivity('a1'), makeActivity('a2')] })
    const { result } = renderHook(() => useArchive())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.activities).toHaveLength(2)
    expect(result.current.activities[0].group_name).toBe('Freunde')
    expect(result.current.activities[0].status).toBe('abgeschlossen')
  })

  it('falls back to "Unbekannte Gruppe" when groups join is null', async () => {
    mockMemberships.mockResolvedValue({ data: [{ group_id: 'group-1' }] })
    const actWithoutGroup = { ...makeActivity('a1'), groups: null }
    mockActivitiesResult.mockResolvedValue({ data: [actWithoutGroup] })
    const { result } = renderHook(() => useArchive())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.activities[0].group_name).toBe('Unbekannte Gruppe')
  })

  it('sets hasMore=true when a full page (20) is returned', async () => {
    mockMemberships.mockResolvedValue({ data: [{ group_id: 'group-1' }] })
    const fullPage = Array.from({ length: 20 }, (_, i) => makeActivity(`a${i}`))
    mockActivitiesResult.mockResolvedValue({ data: fullPage })
    const { result } = renderHook(() => useArchive())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.hasMore).toBe(true)
  })

  it('sets hasMore=false when fewer than 20 items are returned', async () => {
    mockMemberships.mockResolvedValue({ data: [{ group_id: 'group-1' }] })
    mockActivitiesResult.mockResolvedValue({ data: [makeActivity('a1')] })
    const { result } = renderHook(() => useArchive())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.hasMore).toBe(false)
  })

  it('appends activities on loadMore and does not replace existing ones', async () => {
    mockMemberships.mockResolvedValue({ data: [{ group_id: 'group-1' }] })
    const page1 = Array.from({ length: 20 }, (_, i) => makeActivity(`a${i}`))
    const page2 = [makeActivity('b0'), makeActivity('b1')]
    let activitiesCallCount = 0
    mockActivitiesResult.mockImplementation(async () => {
      activitiesCallCount++
      return activitiesCallCount === 1 ? { data: page1 } : { data: page2 }
    })
    const { result } = renderHook(() => useArchive())
    await waitFor(() => expect(result.current.activities).toHaveLength(20))
    act(() => result.current.loadMore())
    await waitFor(() => expect(result.current.activities).toHaveLength(22))
    expect(result.current.activities[20].id).toBe('b0')
    expect(result.current.hasMore).toBe(false)
  })
})
