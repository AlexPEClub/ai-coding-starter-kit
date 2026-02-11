import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const SUPPORTED_LANGS = ['de', 'fr', 'it']

// GET /api/widget/stuetzpunkte - Öffentlicher Endpoint für Widget
// Unterstützt: Suche, Service-Filter, Umkreissuche, Pagination, Sprache
export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const search = searchParams.get('search') || ''
  const serviceFilter = searchParams.get('services') || ''
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const radius = parseInt(searchParams.get('radius') || '0')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  const langParam = searchParams.get('lang') || 'de'
  const lang = SUPPORTED_LANGS.includes(langParam) ? langParam : 'de'

  // Basis-Query: Nur aktive + temporär geschlossene Stützpunkte mit Services
  let query = supabase
    .from('stuetzpunkte')
    .select(`
      *,
      stuetzpunkt_services(
        service_typ_id,
        service_typen(id, name, icon)
      )
    `, { count: 'exact' })

  // Textsuche
  if (search) {
    query = query.or(`name.ilike.%${search}%,plz.ilike.%${search}%,ort.ilike.%${search}%`)
  }

  // Nur Stützpunkte mit Koordinaten (für Kartenanzeige)
  query = query.not('latitude', 'is', null)

  query = query
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let results = data || []

  // Service-Filter (client-seitig, da Supabase keine einfache N:M Filterung hat)
  if (serviceFilter) {
    const filterIds = serviceFilter.split(',')
    results = results.filter((s) => {
      const serviceIds = (s.stuetzpunkt_services || []).map(
        (ss: { service_typ_id: string }) => ss.service_typ_id
      )
      return filterIds.every((fid) => serviceIds.includes(fid))
    })
  }

  // Umkreissuche (Haversine)
  if (lat && lng && radius > 0) {
    const userLat = parseFloat(lat)
    const userLng = parseFloat(lng)

    results = results.filter((s) => {
      if (!s.latitude || !s.longitude) return false
      const distance = haversineDistance(userLat, userLng, s.latitude, s.longitude)
      return distance <= radius
    })

    // Nach Entfernung sortieren
    results.sort((a, b) => {
      const distA = haversineDistance(userLat, userLng, a.latitude!, a.longitude!)
      const distB = haversineDistance(userLat, userLng, b.latitude!, b.longitude!)
      return distA - distB
    })
  }

  // Übersetzungen für Service-Typ-Namen anwenden
  if (lang !== 'de' && results.length > 0) {
    const allServiceIds = new Set<string>()
    for (const sp of results) {
      for (const ss of sp.stuetzpunkt_services || []) {
        if (ss.service_typen?.id) {
          allServiceIds.add(ss.service_typen.id)
        }
      }
    }

    if (allServiceIds.size > 0) {
      const { data: translations } = await supabase
        .from('translations')
        .select('row_id, value')
        .eq('table_name', 'service_typen')
        .eq('field_name', 'name')
        .eq('language', lang)
        .in('row_id', Array.from(allServiceIds))

      if (translations && translations.length > 0) {
        const translationMap = new Map(translations.map((t) => [t.row_id, t.value]))

        results = results.map((sp) => ({
          ...sp,
          stuetzpunkt_services: (sp.stuetzpunkt_services || []).map(
            (ss: { service_typ_id: string; service_typen: { id: string; name: string; icon: string } | null }) => ({
              ...ss,
              service_typen: ss.service_typen ? {
                ...ss.service_typen,
                name: translationMap.get(ss.service_typen.id) || ss.service_typen.name,
              } : ss.service_typen,
            })
          ),
        }))
      }
    }
  }

  // CORS Header für Cross-Origin Widget-Embedding
  const response = NextResponse.json({
    stuetzpunkte: results,
    total: serviceFilter || (lat && lng && radius) ? results.length : (count ?? 0),
    page,
    limit,
  })

  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET')
  return response
}

// Haversine-Formel: Distanz zwischen zwei Koordinaten in km
function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371 // Erdradius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}
