'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type DayColor = 'green' | 'yellow' | 'red' | 'grey'

export interface MemberAvailability {
  user_id: string
  display_name: string
  calendar_type: 'google' | 'manual' | null
  busy_ranges: { start: string; end: string }[]
}

interface GroupAvailabilityResponse {
  members: MemberAvailability[]
  cached_at?: string
}

export interface UseGroupAvailabilityResult {
  loading: boolean
  error: string | null
  members: MemberAvailability[]
  cachedAt: Date | null
  membersWithoutCalendar: number
  totalMembers: number
  getDayColor: (date: Date) => DayColor
  refresh: () => Promise<void>
}

function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function buildColorMap(members: MemberAvailability[]): Map<string, DayColor> {
  const map = new Map<string, DayColor>()
  const knownMembers = members.filter((m) => m.calendar_type !== null)
  const totalKnown = knownMembers.length

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Pre-parse busy ranges once
  const parsed = knownMembers.map((m) => ({
    ranges: m.busy_ranges.map((r) => ({
      start: new Date(r.start).getTime(),
      end: new Date(r.end).getTime(),
    })),
  }))

  for (let i = 0; i <= 365; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const key = toDateKey(date)

    if (totalKnown === 0) {
      map.set(key, 'grey')
      continue
    }

    const dayStart = date.getTime()
    const dayEnd = dayStart + 86400000 - 1 // 23:59:59.999

    let busyCount = 0
    for (const member of parsed) {
      if (member.ranges.some((r) => r.start <= dayEnd && r.end >= dayStart)) {
        busyCount++
      }
    }

    const ratio = busyCount / totalKnown
    if (ratio === 0) map.set(key, 'green')
    else if (ratio < 0.5) map.set(key, 'yellow')
    else map.set(key, 'red')
  }

  return map
}

export function useGroupAvailability(
  groupId: string,
  enabled: boolean = true
): UseGroupAvailabilityResult {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [members, setMembers] = useState<MemberAvailability[]>([])
  const [cachedAt, setCachedAt] = useState<Date | null>(null)

  const fetchAvailability = useCallback(async () => {
    if (!groupId || !enabled) return
    setLoading(true)
    setError(null)

    try {
      const today = new Date()
      const dateFrom = toDateKey(today)
      const to = new Date(today)
      to.setFullYear(today.getFullYear() + 1)
      const dateTo = toDateKey(to)

      const { data, error: fnError } = await supabase.functions.invoke<GroupAvailabilityResponse>(
        'get-group-availability',
        { body: { group_id: groupId, date_from: dateFrom, date_to: dateTo } }
      )

      if (fnError || !data) {
        setError('Verfügbarkeiten konnten nicht geladen werden.')
        setMembers([])
      } else {
        setMembers(data.members ?? [])
        setCachedAt(data.cached_at ? new Date(data.cached_at) : new Date())
      }
    } catch {
      setError('Verfügbarkeiten konnten nicht geladen werden.')
      setMembers([])
    } finally {
      setLoading(false)
    }
  }, [groupId, enabled])

  useEffect(() => {
    if (enabled) fetchAvailability()
  }, [enabled, fetchAvailability])

  const colorMap = useMemo(() => buildColorMap(members), [members])

  const getDayColor = useCallback(
    (date: Date): DayColor => colorMap.get(toDateKey(date)) ?? 'grey',
    [colorMap]
  )

  const membersWithoutCalendar = members.filter((m) => m.calendar_type === null).length
  const totalMembers = members.length

  return {
    loading,
    error,
    members,
    cachedAt,
    membersWithoutCalendar,
    totalMembers,
    getDayColor,
    refresh: fetchAvailability,
  }
}
