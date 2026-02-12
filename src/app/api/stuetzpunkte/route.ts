import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const CreateStuetzpunktSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(200),
  strasse: z.string().min(1, 'Straße ist erforderlich'),
  hausnummer: z.string().min(1, 'Hausnummer ist erforderlich'),
  plz: z.string().min(1, 'PLZ ist erforderlich'),
  ort: z.string().min(1, 'Ort ist erforderlich'),
  land: z.string().min(1, 'Land ist erforderlich').default('CH'),
  telefon: z.string().min(1, 'Telefon ist erforderlich'),
  email: z.string().email('Ungültige E-Mail-Adresse').optional().or(z.literal('')).nullable(),
  website: z.string().url().optional().or(z.literal('')),
  bild_url: z.string().optional().or(z.literal('')),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  status: z.enum(['aktiv', 'temporaer_geschlossen']).default('aktiv'),
  oeffnungszeiten_typ: z.enum(['tagsueber', '24h']).default('tagsueber'),
  oeffnungszeiten_von: z.string().optional().nullable(),
  oeffnungszeiten_bis: z.string().optional().nullable(),
  service_ids: z.array(z.string().uuid()).optional().default([]),
})

// GET /api/stuetzpunkte - Liste mit Suche, Sortierung, Pagination
export async function GET(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const sortBy = searchParams.get('sortBy') || 'name'
  const sortDir = searchParams.get('sortDir') === 'desc' ? false : true
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  let query = supabase
    .from('stuetzpunkte')
    .select('*, stuetzpunkt_services(service_typ_id, service_typen(id, name, icon))', { count: 'exact' })

  if (search) {
    query = query.or(`name.ilike.%${search}%,plz.ilike.%${search}%,ort.ilike.%${search}%`)
  }

  const validSortColumns = ['name', 'plz', 'ort', 'status', 'created_at']
  const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'name'

  query = query
    .order(sortColumn, { ascending: sortDir })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    stuetzpunkte: data,
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  })
}

// POST /api/stuetzpunkte - Neuen Stützpunkt anlegen
export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = CreateStuetzpunktSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const { service_ids, ...stuetzpunktData } = parsed.data

  // Stützpunkt erstellen
  const { data, error } = await supabase
    .from('stuetzpunkte')
    .insert({
      ...stuetzpunktData,
      email: stuetzpunktData.email || null,
      website: stuetzpunktData.website || null,
      bild_url: stuetzpunktData.bild_url || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Services zuordnen
  if (service_ids.length > 0) {
    const serviceLinks = service_ids.map((serviceId) => ({
      stuetzpunkt_id: data.id,
      service_typ_id: serviceId,
    }))

    await supabase.from('stuetzpunkt_services').insert(serviceLinks)
  }

  return NextResponse.json({ stuetzpunkt: data }, { status: 201 })
}
