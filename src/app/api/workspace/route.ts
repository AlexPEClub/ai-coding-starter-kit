import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const UpdateWorkspaceSchema = z.object({
  name:     z.string().min(1, 'Praxisname ist erforderlich').max(200).optional(),
  logo_url: z.string().url().optional().nullable(),
})

// GET /api/workspace — returns the tenant belonging to the authenticated user
export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  // get_tenant_id() is a SECURITY DEFINER helper in the DB;
  // we resolve tenant_id through the profile join instead so RLS handles it.
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Kein Workspace gefunden' }, { status: 404 })
  }

  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('id, name, slug, plan, logo_url, created_at')
    .eq('id', profile.tenant_id)
    .single()

  if (error || !tenant) {
    return NextResponse.json({ error: 'Workspace nicht gefunden' }, { status: 404 })
  }

  return NextResponse.json(tenant)
}

// PUT /api/workspace — updates workspace name and/or logo_url (owners only)
export async function PUT(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  // Verify ownership — only 'owner' role may update workspace settings
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profil nicht gefunden' }, { status: 404 })
  }

  if (profile.role !== 'owner') {
    return NextResponse.json(
      { error: 'Nur Workspace-Admins können diese Einstellungen ändern' },
      { status: 403 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 })
  }

  const parsed = UpdateWorkspaceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validierungsfehler', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('tenants')
    .update(parsed.data)
    .eq('id', profile.tenant_id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Aktualisierung fehlgeschlagen' }, { status: 500 })
  }

  return NextResponse.json(data)
}
