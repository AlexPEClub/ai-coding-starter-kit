import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET /api/widget/config - Öffentliche Widget-Konfiguration
export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('widget_config')
    .select('map_provider, default_language, primary_color, default_radius_km, default_center_lat, default_center_lng, default_zoom')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Services auch laden (für Filter-Chips im Widget)
  const { data: services } = await supabase
    .from('service_typen')
    .select('id, name, icon')
    .order('sort_order', { ascending: true })

  const response = NextResponse.json({
    config: data,
    services: services ?? [],
  })

  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET')
  return response
}
