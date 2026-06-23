'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useResetVotes() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetVotes = useCallback(
    async (activityId: string): Promise<{ error: string | null }> => {
      setLoading(true)
      setError(null)

      const { error: rpcErr } = await supabase.rpc('reset_activity_votes', {
        p_activity_id: activityId,
      })

      setLoading(false)

      if (rpcErr) {
        setError(rpcErr.message)
        return { error: rpcErr.message }
      }

      return { error: null }
    },
    []
  )

  return { resetVotes, loading, error }
}
