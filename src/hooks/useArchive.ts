'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { ActivityStatus } from '@/lib/activity-types'

const PAGE_SIZE = 20

export interface ArchiveActivity {
  id: string
  name: string
  group_id: string
  group_name: string
  og_image_url: string | null
  description: string | null
  location: string | null
  start_date: string | null
  end_date: string | null
  status: ActivityStatus
  created_at: string
}

export function useArchive() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<ArchiveActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(0)

  const fetchPage = useCallback(async (pageIndex: number, append: boolean) => {
    if (!user) {
      setLoading(false)
      return
    }

    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id)

    const groupIds = (memberships ?? []).map(m => m.group_id)
    if (groupIds.length === 0) {
      setActivities([])
      setLoading(false)
      setLoadingMore(false)
      return
    }

    const from = pageIndex * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    type ActivityRow = {
      id: string
      name: string
      group_id: string
      og_image_url: string | null
      description: string | null
      location: string | null
      start_date: string | null
      end_date: string | null
      status: string
      created_at: string
      groups: { id: string; name: string } | null
    }

    const { data } = await supabase
      .from('activities')
      .select('id, name, group_id, og_image_url, description, location, start_date, end_date, status, created_at, groups(id, name)')
      .eq('status', 'abgeschlossen')
      .in('group_id', groupIds)
      .order('created_at', { ascending: false })
      .range(from, to)

    const rows = (data ?? []) as unknown as ActivityRow[]
    const mapped: ArchiveActivity[] = rows.map((a) => ({
      id: a.id,
      name: a.name,
      group_id: a.group_id,
      group_name: a.groups?.name ?? 'Unbekannte Gruppe',
      og_image_url: a.og_image_url,
      description: a.description,
      location: a.location,
      start_date: a.start_date,
      end_date: a.end_date,
      status: a.status as ActivityStatus,
      created_at: a.created_at,
    }))

    if (append) {
      setActivities(prev => [...prev, ...mapped])
    } else {
      setActivities(mapped)
    }
    setHasMore(mapped.length === PAGE_SIZE)
    setLoading(false)
    setLoadingMore(false)
  }, [user])

  useEffect(() => {
    setPage(0)
    setLoading(true)
    fetchPage(0, false)
  }, [fetchPage])

  function loadMore() {
    const nextPage = page + 1
    setPage(nextPage)
    setLoadingMore(true)
    fetchPage(nextPage, true)
  }

  return { activities, loading, loadingMore, hasMore, loadMore }
}
