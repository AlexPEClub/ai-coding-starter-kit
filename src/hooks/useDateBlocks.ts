'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface DateBlock {
  id: string
  user_id: string
  start_date: string
  end_date: string | null
  created_at: string
}

export function useDateBlocks() {
  const { user } = useAuth()
  const [blocks, setBlocks] = useState<DateBlock[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBlocks = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('user_date_blocks')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: true })
    setBlocks((data as DateBlock[] | null) ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchBlocks()
  }, [fetchBlocks])

  async function addBlock(startDate: string, endDate?: string): Promise<{ error: string | null }> {
    if (!user) return { error: 'Nicht eingeloggt' }
    if (endDate && endDate < startDate) {
      return { error: 'Das Enddatum muss nach dem Startdatum liegen' }
    }
    const { error } = await supabase
      .from('user_date_blocks')
      .insert({ user_id: user.id, start_date: startDate, end_date: endDate ?? null })
    if (error) return { error: error.message }
    await fetchBlocks()
    return { error: null }
  }

  async function deleteBlock(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_date_blocks')
      .delete()
      .eq('id', id)
    if (error) return false
    setBlocks(prev => prev.filter(b => b.id !== id))
    return true
  }

  return { blocks, loading, addBlock, deleteBlock, refetch: fetchBlocks }
}
