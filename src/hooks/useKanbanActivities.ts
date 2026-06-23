'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ActivityWithInitiator } from '@/lib/activity-types'
import { KANBAN_STATUSES } from '@/lib/activity-types'

interface UseKanbanActivitiesResult {
  activities: ActivityWithInitiator[]
  loading: boolean
  error: string | null
}

export function useKanbanActivities(groupId: string): UseKanbanActivitiesResult {
  const [activities, setActivities] = useState<ActivityWithInitiator[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  async function fetchActivities() {
    if (!groupId) return
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('activities')
      .select(`
        *,
        initiator:profiles!activities_initiator_id_fkey(id, display_name, avatar_url)
      `)
      .eq('group_id', groupId)
      .in('status', KANBAN_STATUSES)
      .order('created_at', { ascending: false })

    if (err) {
      setError('Aktivitäten konnten nicht geladen werden.')
    } else {
      setActivities((data ?? []) as ActivityWithInitiator[])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!groupId) return

    fetchActivities()

    // Realtime subscription filtered by group_id
    const channel = supabase
      .channel(`kanban:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          fetchActivities()
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId])

  return { activities, loading, error }
}
