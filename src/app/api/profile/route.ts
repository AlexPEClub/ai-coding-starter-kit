import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const UpdateProfileSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name:  z.string().min(1).max(100).optional(),
  phone:      z.string().max(30).optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
})

// GET /api/profile — returns the authenticated user's profile + their tenant
export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
      id,
      user_id,
      tenant_id,
      role,
      full_name,
      first_name,
      last_name,
      phone,
      avatar_url,
      created_at,
      tenant:tenants (
        id,
        name,
        slug,
        plan,
        logo_url,
        created_at
      )
    `)
    .eq('user_id', user.id)
    .single()

  if (error || !profile) {
    return NextResponse.json({ error: 'Profil nicht gefunden' }, { status: 404 })
  }

  return NextResponse.json(profile)
}

// PUT /api/profile — updates first_name, last_name, phone, avatar_url
export async function PUT(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 })
  }

  const parsed = UpdateProfileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validierungsfehler', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const updates = parsed.data

  // Recompute full_name when first or last name changes
  if (updates.first_name !== undefined || updates.last_name !== undefined) {
    const { data: current } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', user.id)
      .single()

    const first = updates.first_name ?? current?.first_name ?? ''
    const last  = updates.last_name  ?? current?.last_name  ?? ''
    ;(updates as Record<string, unknown>)['full_name'] = [first, last].filter(Boolean).join(' ') || null
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Aktualisierung fehlgeschlagen' }, { status: 500 })
  }

  return NextResponse.json(data)
}
