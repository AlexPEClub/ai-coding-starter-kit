import { createClient } from '@/lib/supabase/server'
import { resolveTenant } from '@/lib/api-tenant'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const OWNER_SEARCH_LIMIT = 20

const CreateOwnerSchema = z
  .object({
    first_name: z.string().min(1, 'Vorname ist erforderlich').max(100),
    last_name: z.string().min(1, 'Nachname ist erforderlich').max(100),
    email: z.email().max(200).nullable().optional(),
    phone: z.string().max(30).nullable().optional(),
  })
  .refine((o) => Boolean(o.email?.trim() || o.phone?.trim()), {
    message: 'Mindestens E-Mail oder Telefon ist erforderlich',
    path: ['email'],
  })

// GET /api/owners?search= — search owners of the tenant by name
export async function GET(request: Request) {
  const supabase = await createClient()
  const { user, tenantId } = await resolveTenant(supabase)
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  if (!tenantId) return NextResponse.json({ error: 'Kein Workspace gefunden' }, { status: 404 })

  const search = (new URL(request.url).searchParams.get('search') ?? '').trim()

  let query = supabase
    .from('owners')
    .select('id, first_name, last_name, email, phone')
    .order('last_name', { ascending: true })
    .limit(OWNER_SEARCH_LIMIT)

  if (search) {
    // Escape PostgREST reserved chars in the user term before interpolation.
    const safe = search.replace(/[%,()]/g, ' ')
    query = query.or(`first_name.ilike.%${safe}%,last_name.ilike.%${safe}%`)
  }

  const { data, error } = await query
  if (error) {
    console.error('[owners] list error:', error)
    return NextResponse.json({ error: 'Laden fehlgeschlagen' }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

// POST /api/owners — create a new owner in the tenant
export async function POST(request: Request) {
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

  const parsed = CreateOwnerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validierungsfehler', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { data, error } = await supabase
    .from('owners')
    .insert({
      tenant_id: tenantId,
      first_name: parsed.data.first_name.trim(),
      last_name: parsed.data.last_name.trim(),
      email: parsed.data.email?.trim() || null,
      phone: parsed.data.phone?.trim() || null,
    })
    .select()
    .single()

  if (error || !data) {
    console.error('[owners] create error:', error)
    return NextResponse.json({ error: 'Anlegen fehlgeschlagen' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
