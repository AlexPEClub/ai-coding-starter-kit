import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET /api/geocode?address=Musterstrasse+1+3000+Bern+CH
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')

  if (!address) {
    return NextResponse.json({ error: 'Adresse ist erforderlich' }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          'User-Agent': 'HeizmannStorefinder/1.0',
        },
      }
    )

    if (!response.ok) {
      return NextResponse.json({ error: 'Geocoding fehlgeschlagen' }, { status: 502 })
    }

    const results = await response.json()

    if (results.length === 0) {
      return NextResponse.json({ error: 'Adresse nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json({
      latitude: parseFloat(results[0].lat),
      longitude: parseFloat(results[0].lon),
      display_name: results[0].display_name,
    })
  } catch {
    return NextResponse.json({ error: 'Geocoding-Service nicht erreichbar' }, { status: 502 })
  }
}
