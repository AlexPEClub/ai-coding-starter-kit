import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// POST /api/upload - Bild hochladen
export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'Keine Datei hochgeladen' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Ungültiges Format. Erlaubt: JPG, PNG, WebP' },
      { status: 400 }
    )
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: 'Datei zu groß. Maximum: 5 MB' },
      { status: 400 }
    )
  }

  const ext = file.name.split('.').pop() || 'jpg'
  const fileName = `${crypto.randomUUID()}.${ext}`
  const filePath = `stuetzpunkte/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('stuetzpunkt-bilder')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage
    .from('stuetzpunkt-bilder')
    .getPublicUrl(filePath)

  return NextResponse.json({ url: urlData.publicUrl }, { status: 201 })
}
