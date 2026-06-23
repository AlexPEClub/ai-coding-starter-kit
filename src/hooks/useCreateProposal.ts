'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { CreateActivityInput } from '@/lib/activity-types'

export function useCreateProposal(groupId: string) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createProposal = useCallback(
    async (input: CreateActivityInput): Promise<{ id: string | null; error: string | null }> => {
      if (!user) return { id: null, error: 'Nicht eingeloggt' }
      setLoading(true)
      setError(null)

      const { data, error: insertErr } = await supabase
        .from('activities')
        .insert({
          group_id: groupId,
          initiator_id: user.id,
          name: input.name.trim(),
          duration_category: input.duration_category,
          required_votes: input.required_votes,
          url: input.url?.trim() || null,
          description: input.description?.trim() || null,
          og_image_url: input.og_image_url || null,
          status: 'vorschlag',
        })
        .select('id')
        .single()

      setLoading(false)

      if (insertErr) {
        setError(insertErr.message)
        return { id: null, error: insertErr.message }
      }

      return { id: data.id, error: null }
    },
    [user, groupId]
  )

  return { createProposal, loading, error }
}
