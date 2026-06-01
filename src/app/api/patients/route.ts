import { createClient } from '@/lib/supabase/server'
import { resolveTenant } from '@/lib/api-tenant'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const LIST_LIMIT = 200

// Tier (animal) fields shared by create. birth_date accepts an ISO date string.
const PatientFields = {
  name: z.string().min(1, 'Tiername ist erforderlich').max(120),
  species: z.string().min(1, 'Tierart ist erforderlich').max(80),
  breed: z.string().max(120).nullable().optional(),
  birth_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datum')
    .nullable()
    .optional(),
  sex: z
    .enum(['male', 'female', 'male_neutered', 'female_spayed', 'unknown'])
    .nullable()
    .optional(),
  weight_kg: z.number().positive().max(2000).nullable().optional(),
  anamnesis: z.string().max(5000).nullable().optional(),
}

const NewOwnerSchema = z
  .object({
    first_name: z.string().min(1).max(100),
    last_name: z.string().min(1).max(100),
    email: z.email().max(200).nullable().optional(),
    phone: z.string().max(30).nullable().optional(),
  })
  .refine((o) => Boolean(o.email?.trim() || o.phone?.trim()), {
    message: 'Mindestens E-Mail oder Telefon ist erforderlich',
    path: ['email'],
  })

const CreatePatientSchema = z
  .object({
    ...PatientFields,
    owner_id: z.uuid().optional(),
    new_owner: NewOwnerSchema.optional(),
  })
  .refine((v) => Boolean(v.owner_id) !== Boolean(v.new_owner), {
    message: 'Entweder owner_id oder new_owner angeben',
    path: ['owner_id'],
  })

// GET /api/patients?status=active|archived&search= — list patients of the tenant
export async function GET(request: Request) {
  const supabase = await createClient()
  const { user, tenantId } = await resolveTenant(supabase)
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  if (!tenantId) return NextResponse.json({ error: 'Kein Workspace gefunden' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const statusParam = searchParams.get('status') === 'archived' ? 'archived' : 'active'
  const search = (searchParams.get('search') ?? '').trim().toLowerCase()

  const { data, error } = await supabase
    .from('patients')
    .select('id, name, species, breed, photo_url, status, owner:owners(first_name, last_name)')
    .eq('status', statusParam)
    .order('name', { ascending: true })
    .limit(LIST_LIMIT)

  if (error) {
    console.error('[patients] list error:', error)
    return NextResponse.json({ error: 'Laden fehlgeschlagen' }, { status: 500 })
  }

  // Search matches tiername OR owner first/last name (case-insensitive).
  // Done in JS so the OR spans the joined owner — list is capped at 200 rows.
  const rows = data ?? []
  const filtered = search
    ? rows.filter((p) => {
        const owner = p.owner as { first_name: string; last_name: string } | null
        const haystack = [p.name, owner?.first_name, owner?.last_name]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(search)
      })
    : rows

  return NextResponse.json(filtered)
}

// POST /api/patients — create a patient, optionally creating a new owner first
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

  const parsed = CreatePatientSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validierungsfehler', details: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const { owner_id, new_owner, ...tier } = parsed.data

  // Resolve the owner: use an existing id or create a new owner in this tenant.
  let resolvedOwnerId = owner_id ?? null
  if (new_owner) {
    const { data: owner, error: ownerError } = await supabase
      .from('owners')
      .insert({
        tenant_id: tenantId,
        first_name: new_owner.first_name.trim(),
        last_name: new_owner.last_name.trim(),
        email: new_owner.email?.trim() || null,
        phone: new_owner.phone?.trim() || null,
      })
      .select('id')
      .single()

    if (ownerError || !owner) {
      console.error('[patients] owner create error:', ownerError)
      return NextResponse.json({ error: 'Besitzer konnte nicht angelegt werden' }, { status: 500 })
    }
    resolvedOwnerId = owner.id
  } else if (owner_id) {
    // Verify the existing owner belongs to the caller's tenant before linking.
    // The request-scoped client is RLS-bound, so a foreign/unknown owner_id
    // returns no row → reject (prevents a dangling cross-tenant reference).
    const { data: existingOwner, error: lookupError } = await supabase
      .from('owners')
      .select('id')
      .eq('id', owner_id)
      .maybeSingle()

    if (lookupError) {
      console.error('[patients] owner lookup error:', lookupError)
      return NextResponse.json({ error: 'Besitzer konnte nicht geprüft werden' }, { status: 500 })
    }
    if (!existingOwner) {
      return NextResponse.json({ error: 'Besitzer nicht gefunden' }, { status: 404 })
    }
  }

  if (!resolvedOwnerId) {
    return NextResponse.json({ error: 'Kein Besitzer angegeben' }, { status: 400 })
  }

  const { data: patient, error } = await supabase
    .from('patients')
    .insert({
      tenant_id: tenantId,
      owner_id: resolvedOwnerId,
      name: tier.name.trim(),
      species: tier.species.trim(),
      breed: tier.breed ?? null,
      birth_date: tier.birth_date ?? null,
      sex: tier.sex ?? null,
      weight_kg: tier.weight_kg ?? null,
      anamnesis: tier.anamnesis ?? null,
    })
    .select()
    .single()

  if (error || !patient) {
    console.error('[patients] create error:', error)
    return NextResponse.json({ error: 'Anlegen fehlgeschlagen' }, { status: 500 })
  }

  return NextResponse.json(patient, { status: 201 })
}
