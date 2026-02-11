import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const CreateAdminSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
})

// GET /api/admins - Liste aller Admins
export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }

  // Supabase Admin API kann nicht direkt aus dem Client aufgerufen werden.
  // Wir geben den aktuellen User zurück und nutzen die Admin API serverseitig.
  // Für eine vollständige Admin-Liste wird die Supabase Admin API (Service Role Key) benötigt.
  return NextResponse.json({
    admins: [{ id: user.id, email: user.email, created_at: user.created_at }],
    note: 'Vollständige Admin-Liste benötigt Service Role Key (serverseitig konfigurieren)',
  })
}

// POST /api/admins - Neuen Admin anlegen
export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = CreateAdminSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  // Neuen Admin über Supabase Auth anlegen
  // HINWEIS: Dies erfordert den Service Role Key für Admin-Operationen.
  // In Production würde dies über eine separate Server-Action mit dem Service Role Key laufen.
  const { data, error } = await supabase.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return NextResponse.json(
        { error: 'E-Mail-Adresse ist bereits vergeben' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(
    { admin: { id: data.user.id, email: data.user.email } },
    { status: 201 }
  )
}
