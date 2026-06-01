import { createClient } from '@/lib/supabase/server'
import { resolveTenant } from '@/lib/api-tenant'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const UpdatePatientSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    species: z.string().min(1).max(80).optional(),
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
    status: z.enum(['active', 'archived']).optional(),
    photo_url: z.url().max(1000).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Keine Änderungen übergeben' })

type Params = { params: Promise<{ id: string }> }

// GET /api/patients/[id] — full patient + owner + all of the owner's animals
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { user, tenantId } = await resolveTenant(supabase)
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  if (!tenantId) return NextResponse.json({ error: 'Kein Workspace gefunden' }, { status: 404 })

  const { data: patient, error } = await supabase
    .from('patients')
    .select('*, owner:owners(*)')
    .eq('id', id)
    .single()

  if (error || !patient) {
    return NextResponse.json({ error: 'Patient nicht gefunden' }, { status: 404 })
  }

  // All animals of the same owner (for the "weitere Tiere" section).
  const { data: ownerPatients } = await supabase
    .from('patients')
    .select('id, name, species, status')
    .eq('owner_id', patient.owner_id)
    .order('name', { ascending: true })

  return NextResponse.json({ ...patient, ownerPatients: ownerPatients ?? [] })
}

// PATCH /api/patients/[id] — partial update (incl. archive/reactivate, notes, photo)
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

  const parsed = UpdatePatientSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validierungsfehler', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { data, error } = await supabase
    .from('patients')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    // No row updated → either not found or outside the tenant (RLS).
    return NextResponse.json({ error: 'Patient nicht gefunden' }, { status: 404 })
  }

  return NextResponse.json(data)
}
