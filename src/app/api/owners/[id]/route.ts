import { createClient } from '@/lib/supabase/server'
import { resolveTenant } from '@/lib/api-tenant'
import type { Database } from '@/lib/database.types'
import { NextResponse } from 'next/server'
import { z } from 'zod'

type OwnerUpdate = Database['public']['Tables']['owners']['Update']

const UpdateOwnerSchema = z
  .object({
    first_name: z.string().min(1).max(100).optional(),
    last_name: z.string().min(1).max(100).optional(),
    email: z.email().max(200).nullable().optional(),
    phone: z.string().max(30).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Keine Änderungen übergeben' })

type Params = { params: Promise<{ id: string }> }

// GET /api/owners/[id] — owner record plus their animals
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { user, tenantId } = await resolveTenant(supabase)
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  if (!tenantId) return NextResponse.json({ error: 'Kein Workspace gefunden' }, { status: 404 })

  const { data: owner, error } = await supabase
    .from('owners')
    .select('*, patients(id, name, species, status)')
    .eq('id', id)
    .single()

  if (error || !owner) {
    return NextResponse.json({ error: 'Besitzer nicht gefunden' }, { status: 404 })
  }

  return NextResponse.json(owner)
}

// PATCH /api/owners/[id] — update owner contact data
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { user, tenantId } = await resolveTenant(supabase)
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  if (!tenantId) return NextResponse.json({ error: 'Kein Workspace gefunden' }, { status: 404 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 })
  }

  const parsed = UpdateOwnerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validierungsfehler', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  // Enforce "at least email or phone" against the merged (current + patch) row,
  // since a PATCH may clear one channel while the other already exists.
  const { data: current, error: currentError } = await supabase
    .from('owners')
    .select('email, phone')
    .eq('id', id)
    .single()

  if (currentError || !current) {
    return NextResponse.json({ error: 'Besitzer nicht gefunden' }, { status: 404 })
  }

  const nextEmail = parsed.data.email !== undefined ? parsed.data.email : current.email
  const nextPhone = parsed.data.phone !== undefined ? parsed.data.phone : current.phone
  if (!nextEmail?.trim() && !nextPhone?.trim()) {
    return NextResponse.json(
      { error: 'Mindestens E-Mail oder Telefon ist erforderlich' },
      { status: 400 },
    )
  }

  const updates: OwnerUpdate = {}
  if (parsed.data.first_name !== undefined) updates.first_name = parsed.data.first_name.trim()
  if (parsed.data.last_name !== undefined) updates.last_name = parsed.data.last_name.trim()
  if (parsed.data.email !== undefined) updates.email = parsed.data.email?.trim() || null
  if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone?.trim() || null

  const { data, error } = await supabase
    .from('owners')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Besitzer nicht gefunden' }, { status: 404 })
  }

  return NextResponse.json(data)
}
