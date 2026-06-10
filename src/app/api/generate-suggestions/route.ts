import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { generateSuggestions } from '@/lib/anthropic'
import { fetchLiveContext } from '@/lib/live-context'

// Generierung kann mehrere Sekunden dauern (Claude + Retries + Notion-Fetches).
export const maxDuration = 60

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Prüft, ob die Anfrage berechtigt ist: entweder gültiges Cron-Secret
 * (Vercel-Cron) ODER eine eingeloggte Nutzer-Session (Dashboard-Button).
 */
async function isAuthorized(request: NextRequest): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return !!user
  } catch {
    return false
  }
}

async function handleGenerate(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  }

  let db: ReturnType<typeof createServiceRoleClient>
  try {
    db = createServiceRoleClient()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Service-Client konnte nicht initialisiert werden.'
    return NextResponse.json(
      { error: 'Generierung fehlgeschlagen.', detail: message },
      { status: 500 }
    )
  }

  const today = todayUTC()

  // 1. Doppellauf-Schutz: existiert heute schon ein erfolgreicher Report?
  const { data: existingReport } = await db
    .from('daily_reports')
    .select('generation_status')
    .eq('report_date', today)
    .maybeSingle()

  if (existingReport?.generation_status === 'sent') {
    return NextResponse.json({ skipped: true, reason: 'already_generated' })
  }

  // 2. Live-Kontext laden (Supabase-Historie + Notion BizDev DB + QualiPilot Living Spec).
  const liveContext = await fetchLiveContext(db)

  // 3. Generierung (Claude + Retry-Logik in generateSuggestions).
  try {
    const suggestions = await generateSuggestions(liveContext)

    // 4a. Erfolg: Vorschläge speichern + Report auf "sent".
    const rows = suggestions.map(s => ({
      report_date: today,
      category: s.category,
      title: s.title,
      body: s.body,
      insight: s.insight,
      source: s.source,
      status: 'pending',
    }))

    const { error: insertError } = await db.from('suggestions').insert(rows)
    if (insertError) {
      throw new Error(`DB-Insert fehlgeschlagen: ${insertError.message}`)
    }

    await db.from('daily_reports').upsert(
      {
        report_date: today,
        suggestions_count: rows.length,
        generation_status: 'sent',
      },
      { onConflict: 'report_date' }
    )

    return NextResponse.json({ success: true, count: rows.length })
  } catch (error) {
    // 4b. Endgültiger Fehler: kein halber Report, Status "failed" protokollieren.
    await db.from('daily_reports').upsert(
      {
        report_date: today,
        suggestions_count: 0,
        generation_status: 'failed',
      },
      { onConflict: 'report_date' }
    )

    const message = error instanceof Error ? error.message : 'Unbekannter Fehler.'
    return NextResponse.json(
      { error: 'Generierung fehlgeschlagen.', detail: message },
      { status: 500 }
    )
  }
}

// POST: vom Dashboard-Button (eingeloggte Session).
export async function POST(request: NextRequest) {
  return handleGenerate(request)
}

// GET: von Vercel Cron (Authorization: Bearer CRON_SECRET).
export async function GET(request: NextRequest) {
  return handleGenerate(request)
}
