import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useGroupAvailability } from './useGroupAvailability'

// ─── Supabase mock ─────────────────────────────────────────────────────────────

const { mockInvoke } = vi.hoisted(() => ({ mockInvoke: vi.fn() }))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: { invoke: mockInvoke },
  },
}))

const TODAY = new Date()
TODAY.setHours(0, 0, 0, 0)

function dateKey(offset: number): string {
  const d = new Date(TODAY)
  d.setDate(TODAY.getDate() + offset)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function isoDay(offset: number): string {
  return dateKey(offset) + 'T00:00:00Z'
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeGoogleMember(userId: string, busyOffsets: number[] = []) {
  return {
    user_id: userId,
    display_name: 'Test User',
    calendar_type: 'google' as const,
    busy_ranges: busyOffsets.map((o) => ({
      start: isoDay(o),
      end: new Date(new Date(isoDay(o)).getTime() + 86400000 - 1).toISOString(),
    })),
  }
}

function makeNullMember(userId: string) {
  return {
    user_id: userId,
    display_name: 'No Calendar',
    calendar_type: null as null,
    busy_ranges: [],
  }
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('useGroupAvailability — initial state', () => {
  it('is not loading when disabled', () => {
    mockInvoke.mockResolvedValue({ data: null, error: null })
    const { result } = renderHook(() => useGroupAvailability('grp-1', false))
    expect(result.current.loading).toBe(false)
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it('starts loading when enabled', () => {
    mockInvoke.mockResolvedValue({ data: null, error: null })
    const { result } = renderHook(() => useGroupAvailability('grp-1', true))
    expect(result.current.loading).toBe(true)
  })
})

describe('useGroupAvailability — successful fetch', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sets members from API response', async () => {
    const members = [makeGoogleMember('u1'), makeNullMember('u2')]
    mockInvoke.mockResolvedValue({ data: { members, cached_at: new Date().toISOString() }, error: null })

    const { result } = renderHook(() => useGroupAvailability('grp-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.members).toHaveLength(2)
    expect(result.current.error).toBeNull()
  })

  it('sets cachedAt from response', async () => {
    const cached_at = '2024-06-15T10:00:00Z'
    mockInvoke.mockResolvedValue({
      data: { members: [], cached_at },
      error: null,
    })

    const { result } = renderHook(() => useGroupAvailability('grp-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.cachedAt).toEqual(new Date(cached_at))
  })

  it('counts membersWithoutCalendar correctly', async () => {
    const members = [
      makeGoogleMember('u1'),
      makeNullMember('u2'),
      makeNullMember('u3'),
    ]
    mockInvoke.mockResolvedValue({ data: { members, cached_at: new Date().toISOString() }, error: null })

    const { result } = renderHook(() => useGroupAvailability('grp-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.membersWithoutCalendar).toBe(2)
    expect(result.current.totalMembers).toBe(3)
  })
})

describe('useGroupAvailability — error handling', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sets error state on API failure', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: new Error('Network error') })

    const { result } = renderHook(() => useGroupAvailability('grp-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBeTruthy()
    expect(result.current.members).toHaveLength(0)
  })

  it('sets error state on thrown exception', async () => {
    mockInvoke.mockRejectedValue(new Error('Network failure'))

    const { result } = renderHook(() => useGroupAvailability('grp-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBeTruthy()
  })
})

describe('useGroupAvailability — getDayColor (color map logic)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns grey when all members have calendar_type null', async () => {
    const members = [makeNullMember('u1'), makeNullMember('u2')]
    mockInvoke.mockResolvedValue({ data: { members, cached_at: new Date().toISOString() }, error: null })

    const { result } = renderHook(() => useGroupAvailability('grp-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    expect(result.current.getDayColor(today)).toBe('grey')
  })

  it('returns green when no known member is busy', async () => {
    // u1 is busy tomorrow, not today
    const members = [makeGoogleMember('u1', [1]), makeGoogleMember('u2', [2])]
    mockInvoke.mockResolvedValue({ data: { members, cached_at: new Date().toISOString() }, error: null })

    const { result } = renderHook(() => useGroupAvailability('grp-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    expect(result.current.getDayColor(today)).toBe('green')
  })

  it('returns red when ≥50% of known members are busy', async () => {
    // 2 of 2 members busy today → 100% → red
    const members = [makeGoogleMember('u1', [0]), makeGoogleMember('u2', [0])]
    mockInvoke.mockResolvedValue({ data: { members, cached_at: new Date().toISOString() }, error: null })

    const { result } = renderHook(() => useGroupAvailability('grp-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    expect(result.current.getDayColor(today)).toBe('red')
  })

  it('returns yellow when <50% of known members are busy (minority conflict)', async () => {
    // 1 of 3 members busy today → 33% → yellow
    const members = [
      makeGoogleMember('u1', [0]),
      makeGoogleMember('u2', []),
      makeGoogleMember('u3', []),
    ]
    mockInvoke.mockResolvedValue({ data: { members, cached_at: new Date().toISOString() }, error: null })

    const { result } = renderHook(() => useGroupAvailability('grp-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    expect(result.current.getDayColor(today)).toBe('yellow')
  })

  it('returns red when exactly 50% of known members are busy', async () => {
    // 1 of 2 members busy → 50% → red (≥50% threshold)
    const members = [makeGoogleMember('u1', [0]), makeGoogleMember('u2', [])]
    mockInvoke.mockResolvedValue({ data: { members, cached_at: new Date().toISOString() }, error: null })

    const { result } = renderHook(() => useGroupAvailability('grp-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    expect(result.current.getDayColor(today)).toBe('red')
  })

  it('ignores null-calendar members in ratio calculation', async () => {
    // 1 google member (free), 1 null member → only known = u1, 0% busy → green
    const members = [makeGoogleMember('u1', []), makeNullMember('u2')]
    mockInvoke.mockResolvedValue({ data: { members, cached_at: new Date().toISOString() }, error: null })

    const { result } = renderHook(() => useGroupAvailability('grp-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    expect(result.current.getDayColor(today)).toBe('green')
  })

  it('returns grey for a date outside the 12-month window', async () => {
    const members = [makeGoogleMember('u1', [])]
    mockInvoke.mockResolvedValue({ data: { members, cached_at: new Date().toISOString() }, error: null })

    const { result } = renderHook(() => useGroupAvailability('grp-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    // 400 days from now — outside the 366-day map
    const farFuture = new Date()
    farFuture.setDate(farFuture.getDate() + 400)
    farFuture.setHours(0, 0, 0, 0)
    expect(result.current.getDayColor(farFuture)).toBe('grey')
  })
})

describe('useGroupAvailability — refresh', () => {
  beforeEach(() => vi.clearAllMocks())

  it('re-fetches when refresh() is called', async () => {
    const members = [makeGoogleMember('u1')]
    mockInvoke.mockResolvedValue({ data: { members, cached_at: new Date().toISOString() }, error: null })

    const { result } = renderHook(() => useGroupAvailability('grp-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(mockInvoke).toHaveBeenCalledTimes(1)

    await act(async () => {
      await result.current.refresh()
    })

    expect(mockInvoke).toHaveBeenCalledTimes(2)
  })
})
