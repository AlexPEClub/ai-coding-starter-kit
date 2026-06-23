'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface UseVoteOptions {
  onError?: (message: string) => void
}

export function useVote(options?: UseVoteOptions) {
  const { user } = useAuth()
  const [pending, setPending] = useState<Set<string>>(new Set())

  const toggleVote = useCallback(
    async (
      activityId: string,
      currentlyVoted: boolean,
      onOptimisticUpdate: (activityId: string, voted: boolean) => void
    ): Promise<void> => {
      if (!user || pending.has(activityId)) return

      // Optimistic update
      onOptimisticUpdate(activityId, !currentlyVoted)
      setPending((prev) => new Set(prev).add(activityId))

      let error: { message: string } | null = null

      if (currentlyVoted) {
        const { error: delErr } = await supabase
          .from('activity_votes')
          .delete()
          .eq('activity_id', activityId)
          .eq('user_id', user.id)
        error = delErr
      } else {
        const { error: insErr } = await supabase
          .from('activity_votes')
          .insert({ activity_id: activityId, user_id: user.id })
        error = insErr
      }

      setPending((prev) => {
        const next = new Set(prev)
        next.delete(activityId)
        return next
      })

      if (error) {
        // Rollback optimistic update
        onOptimisticUpdate(activityId, currentlyVoted)
        options?.onError?.(error.message)
      }
    },
    [user, pending, options]
  )

  return { toggleVote, pending }
}
