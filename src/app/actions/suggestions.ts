'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase-server'

const VALID_STATUSES = ['approved', 'rejected', 'pending'] as const

const UpdateStatusSchema = z.object({
  id: z.string().uuid('Ungültige Vorschlag-ID.'),
  status: z.enum(VALID_STATUSES),
})

export async function updateSuggestionStatus(
  id: string,
  status: 'approved' | 'rejected' | 'pending'
): Promise<{ success: boolean; error?: string }> {
  const parsed = UpdateStatusSchema.safeParse({ id, status })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe.' }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Nicht eingeloggt.' }
  }

  const { error } = await supabase
    .from('suggestions')
    .update({
      status: parsed.data.status,
      reviewed_at: parsed.data.status !== 'pending' ? new Date().toISOString() : null,
    })
    .eq('id', parsed.data.id)

  if (error) {
    return { success: false, error: error.message }
  }
  return { success: true }
}
