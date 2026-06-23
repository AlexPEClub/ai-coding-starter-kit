'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { ActivityWithInitiator, DurationCategory } from '@/lib/activity-types'

function sortByVoteProgress(proposals: ActivityWithInitiator[]): ActivityWithInitiator[] {
  return [...proposals].sort((a, b) => {
    const pctA = a.current_votes / a.required_votes
    const pctB = b.current_votes / b.required_votes
    if (pctB !== pctA) return pctB - pctA
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

export function useActivityProposals(groupId: string) {
  const { user } = useAuth()
  const [proposals, setProposals] = useState<ActivityWithInitiator[]>([])
  const [myVotedIds, setMyVotedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const fetchProposals = useCallback(async () => {
    if (!user || !groupId) {
      setLoading(false)
      return
    }
    setError(null)

    const [{ data: activitiesData, error: actErr }, { data: votesData }] = await Promise.all([
      supabase
        .from('activities')
        .select('*, initiator:profiles!initiator_id(id, display_name, avatar_url)')
        .eq('group_id', groupId)
        .eq('status', 'vorschlag')
        .limit(100),
      supabase
        .from('activity_votes')
        .select('activity_id')
        .eq('user_id', user.id),
    ])

    if (actErr) {
      setError(actErr.message)
      setLoading(false)
      return
    }

    const voted = new Set((votesData ?? []).map((v) => v.activity_id))
    setMyVotedIds(voted)
    setProposals(sortByVoteProgress((activitiesData ?? []) as ActivityWithInitiator[]))
    setLoading(false)
  }, [user, groupId])

  useEffect(() => {
    fetchProposals()
  }, [fetchProposals])

  // Realtime subscription on activities filtered by group_id
  useEffect(() => {
    if (!groupId) return

    const channel = supabase
      .channel(`activities:group_id=eq.${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          fetchProposals()
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId, fetchProposals])

  function filterByCategory(category: DurationCategory | null): ActivityWithInitiator[] {
    if (!category) return proposals
    return proposals.filter((p) => p.duration_category === category)
  }

  return { proposals, myVotedIds, loading, error, refetch: fetchProposals, filterByCategory }
}
