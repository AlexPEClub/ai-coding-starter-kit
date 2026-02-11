import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const CreateServiceSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100),
  icon: z.string().min(1, 'Icon ist erforderlich'),
})

const UpdateSortOrderSchema = z.object({
  orderedIds: z.array(z.string().uuid()),
})

// GET /api/services - Alle Service-Typen
export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('service_typen')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ services: data })
}

// POST /api/services - Neuen Service anlegen
export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = CreateServiceSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  // Nächste sort_order ermitteln
  const { data: maxOrder } = await supabase
    .from('service_typen')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextOrder = (maxOrder?.sort_order ?? 0) + 1

  const { data, error } = await supabase
    .from('service_typen')
    .insert({
      name: parsed.data.name,
      icon: parsed.data.icon,
      sort_order: nextOrder,
    })
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

  return NextResponse.json({ service: data }, { status: 201 })
}

// PUT /api/services - Sortierreihenfolge aktualisieren
export async function PUT(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = UpdateSortOrderSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  // Alle sort_orders in einer Transaktion aktualisieren
  const updates = parsed.data.orderedIds.map((id, index) =>
    supabase
      .from('service_typen')
      .update({ sort_order: index + 1 })
      .eq('id', id)
  )

  const results = await Promise.all(updates)
  const hasError = results.find((r) => r.error)

  if (hasError?.error) {
    return NextResponse.json({ error: hasError.error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
