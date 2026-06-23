'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { UpdateActivityInput } from '@/lib/activity-types'

export function useEditProposal(activityId: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const editProposal = useCallback(
    async (input: UpdateActivityInput): Promise<{ error: string | null }> => {
      setLoading(true)
      setError(null)

      const patch: Record<string, unknown> = {}
      if (input.name !== undefined) patch.name = input.name.trim()
      if (input.duration_category !== undefined) patch.duration_category = input.duration_category
      if (input.required_votes !== undefined) patch.required_votes = input.required_votes
      if ('url' in input) patch.url = input.url?.trim() || null
      if ('description' in input) patch.description = input.description?.trim() || null
      if ('og_image_url' in input) patch.og_image_url = input.og_image_url || null

      const { error: updateErr } = await supabase
        .from('activities')
        .update(patch)
        .eq('id', activityId)
        .eq('status', 'vorschlag')

      setLoading(false)

      if (updateErr) {
        setError(updateErr.message)
        return { error: updateErr.message }
      }

      return { error: null }
    },
    [activityId]
  )

  return { editProposal, loading, error }
}
