import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const SUPPORTED_LANGS = ['de', 'fr', 'it']

// GET /api/widget/config?lang=de - Öffentliche Widget-Konfiguration
export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const langParam = searchParams.get('lang') || 'de'
  const lang = SUPPORTED_LANGS.includes(langParam) ? langParam : 'de'

  const { data, error } = await supabase
    .from('widget_config')
    .select('map_provider, default_language, primary_color, default_radius_km, default_center_lat, default_center_lng, default_zoom')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Services laden (für Filter-Chips im Widget)
  const { data: services } = await supabase
    .from('service_typen')
    .select('id, name, icon')
    .order('sort_order', { ascending: true })

  let translatedServices = services ?? []

  // Übersetzungen anwenden wenn nicht DE
  if (lang !== 'de' && translatedServices.length > 0) {
    const serviceIds = translatedServices.map((s) => s.id)

    const { data: translations } = await supabase
      .from('translations')
      .select('row_id, value')
      .eq('table_name', 'service_typen')
      .eq('field_name', 'name')
      .eq('language', lang)
      .in('row_id', serviceIds)

    if (translations && translations.length > 0) {
      const translationMap = new Map(translations.map((t) => [t.row_id, t.value]))
      translatedServices = translatedServices.map((s) => ({
        ...s,
        name: translationMap.get(s.id) || s.name,
      }))
    }
  }

  const response = NextResponse.json({
    config: data,
    services: translatedServices,
  })

  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET')
  return response
}
