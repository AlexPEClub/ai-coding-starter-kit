import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const ALLOWED_TABLES = ['service_typen']

const UpsertSchema = z.object({
  table_name: z.string().min(1),
  row_id: z.string().uuid(),
  field_name: z.string().min(1),
  language: z.enum(['fr', 'it']),
  value: z.string(),
})

// GET /api/translations?table=service_typen&field=name
export async function GET(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const tableName = searchParams.get('table')
  const fieldName = searchParams.get('field')

  if (!tableName || !ALLOWED_TABLES.includes(tableName)) {
    return NextResponse.json({ error: 'Ungültiger table-Parameter' }, { status: 400 })
  }

  let query = supabase
    .from('translations')
    .select('*')
    .eq('table_name', tableName)

  if (fieldName) {
    query = query.eq('field_name', fieldName)
  }

  query = query.order('row_id')

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ translations: data ?? [] })
}

// PUT /api/translations - Upsert einer Übersetzung
export async function PUT(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = UpsertSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const { table_name, row_id, field_name, language, value } = parsed.data

  if (!ALLOWED_TABLES.includes(table_name)) {
    return NextResponse.json({ error: 'Tabelle nicht erlaubt' }, { status: 400 })
  }

  const trimmed = value.trim()

  // Leerer Wert = Übersetzung löschen
  if (!trimmed) {
    const { error } = await supabase
      .from('translations')
      .delete()
      .eq('table_name', table_name)
      .eq('row_id', row_id)
      .eq('field_name', field_name)
      .eq('language', language)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ deleted: true })
  }

  // Upsert: Einfügen oder aktualisieren
  const { data, error } = await supabase
    .from('translations')
    .upsert(
      {
        table_name,
        row_id,
        field_name,
        language,
        value: trimmed,
      },
      { onConflict: 'table_name,row_id,field_name,language' }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ translation: data })
}
