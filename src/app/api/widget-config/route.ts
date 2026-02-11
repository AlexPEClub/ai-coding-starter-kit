import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const UpdateConfigSchema = z.object({
  map_provider: z.enum(['openstreetmap', 'google_maps']),
  google_maps_api_key: z.string().optional().nullable(),
  default_language: z.enum(['de', 'fr', 'it']),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Ungültiger HEX-Farbwert'),
  default_radius_km: z.number().int().positive(),
  default_center_lat: z.number().min(-90).max(90),
  default_center_lng: z.number().min(-180).max(180),
  default_zoom: z.number().int().min(1).max(20),
})

// GET /api/widget-config - Admin: Volle Konfiguration laden (inkl. API Key)
export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('widget_config')
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ config: data })
}

// PUT /api/widget-config - Admin: Konfiguration speichern
export async function PUT(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = UpdateConfigSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const updateData = {
    ...parsed.data,
    google_maps_api_key: parsed.data.map_provider === 'google_maps'
      ? parsed.data.google_maps_api_key
      : null,
  }

  const { data, error } = await supabase
    .from('widget_config')
    .update(updateData)
    .eq('id', 1)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ config: data })
}
