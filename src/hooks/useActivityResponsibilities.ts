'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ActivityResponsibility, CreateResponsibilityInput } from '@/lib/activity-types'

interface UseActivityResponsibilitiesResult {
  responsibilities: ActivityResponsibility[]
  loading: boolean
  error: string | null
  addResponsibility: (input: CreateResponsibilityInput) => Promise<boolean>
  deleteResponsibility: (responsibilityId: string) => Promise<boolean>
}

export function useActivityResponsibilities(
  activityId: string | null
): UseActivityResponsibilitiesResult {
  const [responsibilities, setResponsibilities] = useState<ActivityResponsibility[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchResponsibilities = useCallback(async () => {
    if (!activityId) return
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('activity_responsibilities')
      .select(`
        *,
        assigned_user:profiles!activity_responsibilities_assigned_user_id_fkey(id, display_name, avatar_url)
      `)
      .eq('activity_id', activityId)
      .order('created_at', { ascending: true })

    if (err) {
      setError('Verantwortlichkeiten konnten nicht geladen werden.')
    } else {
      setResponsibilities((data ?? []) as ActivityResponsibility[])
    }
    setLoading(false)
  }, [activityId])

  useEffect(() => {
    fetchResponsibilities()
  }, [fetchResponsibilities])

  async function addResponsibility(input: CreateResponsibilityInput): Promise<boolean> {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return false

    const { error: err } = await supabase.from('activity_responsibilities').insert({
      activity_id: input.activity_id,
      label: input.label,
      assigned_user_id: input.assigned_user_id,
      created_by: userData.user.id,
    })

    if (err) return false
    await fetchResponsibilities()
    return true
  }

  async function deleteResponsibility(responsibilityId: string): Promise<boolean> {
    const { error: err } = await supabase
      .from('activity_responsibilities')
      .delete()
      .eq('id', responsibilityId)

    if (err) return false
    await fetchResponsibilities()
    return true
  }

  return { responsibilities, loading, error, addResponsibility, deleteResponsibility }
}
