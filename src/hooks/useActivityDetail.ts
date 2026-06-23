'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ActivityWithInitiator, UpdateActivityDetailInput } from '@/lib/activity-types'

interface UseActivityDetailResult {
  activity: ActivityWithInitiator | null
  loading: boolean
  error: string | null
  updateActivity: (input: UpdateActivityDetailInput) => Promise<boolean>
  reload: () => void
}

export function useActivityDetail(activityId: string | null): UseActivityDetailResult {
  const [activity, setActivity] = useState<ActivityWithInitiator | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchActivity = useCallback(async () => {
    if (!activityId) return
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('activities')
      .select(`
        *,
        initiator:profiles!activities_initiator_id_fkey(id, display_name, avatar_url)
      `)
      .eq('id', activityId)
      .single()

    if (err) {
      setError('Aktivität konnte nicht geladen werden.')
    } else {
      setActivity(data as ActivityWithInitiator)
    }
    setLoading(false)
  }, [activityId])

  useEffect(() => {
    fetchActivity()
  }, [fetchActivity])

  async function updateActivity(input: UpdateActivityDetailInput): Promise<boolean> {
    if (!activityId) return false
    const { error: err } = await supabase
      .from('activities')
      .update({
        name: input.name,
        description: input.description ?? null,
        location: input.location ?? null,
        url: input.url ?? null,
      })
      .eq('id', activityId)

    if (err) return false
    await fetchActivity()
    return true
  }

  return { activity, loading, error, updateActivity, reload: fetchActivity }
}
