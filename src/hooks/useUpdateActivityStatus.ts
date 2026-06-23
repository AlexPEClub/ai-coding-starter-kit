'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { KanbanStatus } from '@/lib/activity-types'

interface UpdateStatusInput {
  activityId: string
  status: KanbanStatus
  startDate?: string | null
  endDate?: string | null
}

interface UseUpdateActivityStatusResult {
  updateStatus: (input: UpdateStatusInput) => Promise<{ error: string | null }>
  loading: boolean
}

export function useUpdateActivityStatus(): UseUpdateActivityStatusResult {
  const [loading, setLoading] = useState(false)

  async function updateStatus({
    activityId,
    status,
    startDate,
    endDate,
  }: UpdateStatusInput): Promise<{ error: string | null }> {
    setLoading(true)
    const update: Record<string, unknown> = { status }
    if (startDate !== undefined) update.start_date = startDate
    if (endDate !== undefined) update.end_date = endDate

    const { error } = await supabase
      .from('activities')
      .update(update)
      .eq('id', activityId)

    setLoading(false)
    if (error) return { error: 'Statuswechsel fehlgeschlagen. Bitte erneut versuchen.' }
    return { error: null }
  }

  return { updateStatus, loading }
}
