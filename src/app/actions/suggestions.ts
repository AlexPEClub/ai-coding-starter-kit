'use server'

import { createClient } from '@/lib/supabase-server'

export async function updateSuggestionStatus(
  id: string,
  status: 'approved' | 'rejected' | 'pending'
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('suggestions')
    .update({
      status,
      reviewed_at: status !== 'pending' ? new Date().toISOString() : null,
    })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }
  return { success: true }
}
