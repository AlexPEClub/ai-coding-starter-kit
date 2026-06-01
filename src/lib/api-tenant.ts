import { createClient } from '@/lib/supabase/server'

export type ServerClient = Awaited<ReturnType<typeof createClient>>

/**
 * Resolves the authenticated user and their tenant_id for an API route.
 * Returns `{ user: null }` when unauthenticated and `{ tenantId: null }` when
 * the user has no profile (the "no workspace" recovery state from PROJ-2).
 */
export async function resolveTenant(supabase: ServerClient): Promise<{
  user: { id: string } | null
  tenantId: string | null
}> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return { user: null, tenantId: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single()

  return { user, tenantId: profile?.tenant_id ?? null }
}
