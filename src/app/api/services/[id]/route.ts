import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const UpdateServiceSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100).optional(),
  icon: z.string().min(1, 'Icon ist erforderlich').optional(),
})

// PUT /api/services/[id] - Service aktualisieren
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
  const parsed = UpdateServiceSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('service_typen')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Service-Name bereits vorhanden' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ service: data })
}

// DELETE /api/services/[id] - Service löschen
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

  // Prüfe ob Service Stützpunkten zugeordnet ist
  const { count } = await supabase
    .from('stuetzpunkt_services')
    .select('*', { count: 'exact', head: true })
    .eq('service_typ_id', id)

  if (count && count > 0) {
    return NextResponse.json(
      {
        error: `Service ist ${count} Stützpunkt${count === 1 ? '' : 'en'} zugeordnet. Bitte zuerst Zuordnung entfernen.`,
      },
      { status: 409 }
    )
  }

  const { error } = await supabase
    .from('service_typen')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
