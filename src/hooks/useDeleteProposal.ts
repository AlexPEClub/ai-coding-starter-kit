'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useDeleteProposal() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteProposal = useCallback(
    async (activityId: string): Promise<{ error: string | null }> => {
      setLoading(true)
      setError(null)

      // activity_votes cascade-deleted via FK ON DELETE CASCADE
      const { error: deleteErr } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId)
        .eq('status', 'vorschlag')

      setLoading(false)

      if (deleteErr) {
        setError(deleteErr.message)
        return { error: deleteErr.message }
      }

      return { error: null }
    },
    []
  )

  return { deleteProposal, loading, error }
}
