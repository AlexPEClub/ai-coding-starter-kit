import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const UpdateStuetzpunktSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  strasse: z.string().min(1).optional(),
  hausnummer: z.string().min(1).optional(),
  plz: z.string().min(1).optional(),
  ort: z.string().min(1).optional(),
  land: z.string().min(1).optional(),
  telefon: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  website: z.string().url().optional().or(z.literal('')).nullable(),
  bild_url: z.string().optional().or(z.literal('')).nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  status: z.enum(['aktiv', 'temporaer_geschlossen']).optional(),
  oeffnungszeiten_typ: z.enum(['tagsueber', '24h']).optional(),
  oeffnungszeiten_von: z.string().optional().nullable(),
  oeffnungszeiten_bis: z.string().optional().nullable(),
  service_ids: z.array(z.string().uuid()).optional(),
})

// GET /api/stuetzpunkte/[id] - Einzelnen Stützpunkt laden
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('stuetzpunkte')
    .select('*, stuetzpunkt_services(service_typ_id)')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  return NextResponse.json({ stuetzpunkt: data })
}

// PUT /api/stuetzpunkte/[id] - Stützpunkt aktualisieren
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = UpdateStuetzpunktSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const { service_ids, ...updateData } = parsed.data

  // Stützpunkt aktualisieren
  const { data, error } = await supabase
    .from('stuetzpunkte')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Services aktualisieren (wenn mitgeliefert)
  if (service_ids !== undefined) {
    // Alle bestehenden entfernen
    await supabase
      .from('stuetzpunkt_services')
      .delete()
      .eq('stuetzpunkt_id', id)

    // Neue zuordnen
    if (service_ids.length > 0) {
      const serviceLinks = service_ids.map((serviceId) => ({
        stuetzpunkt_id: id,
        service_typ_id: serviceId,
      }))
      await supabase.from('stuetzpunkt_services').insert(serviceLinks)
    }
  }

  return NextResponse.json({ stuetzpunkt: data })
}

// DELETE /api/stuetzpunkte/[id] - Stützpunkt löschen
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }

  const { error } = await supabase
    .from('stuetzpunkte')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
