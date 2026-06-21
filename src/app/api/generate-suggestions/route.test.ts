import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { NextRequest } from 'next/server'

const mockGetUser = vi.hoisted(() => vi.fn())
const mockGenerate = vi.hoisted(() => vi.fn())
const mockProductOpportunity = vi.hoisted(() => vi.fn())
const mockFetchLiveContext = vi.hoisted(() => vi.fn())
const dbConfig = vi.hoisted(() => ({ value: {} as Record<string, unknown> }))

vi.mock('@/lib/supabase-server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
  }),
  createServiceRoleClient: vi.fn(() => buildDb(dbConfig.value)),
}))

vi.mock('@/lib/anthropic', () => ({
  generateSuggestions: mockGenerate,
  generateProductOpportunity: mockProductOpportunity,
}))

vi.mock('@/lib/live-context', () => ({
  fetchLiveContext: mockFetchLiveContext,
}))

// Chainbarer Supabase-Mock: liefert konfigurierte Ergebnisse je Tabelle/Operation.
function buildDb(config: Record<string, unknown>) {
  return {
    from(table: string) {
      const builder: Record<string, unknown> = {
        select: () => builder,
        eq: () => builder,
        gte: () => builder,
        order: () => builder,
        limit: () => Promise.resolve(config[`${table}.list`] ?? { data: [] }),
        maybeSingle: () => Promise.resolve(config[`${table}.single`] ?? { data: null }),
        insert: () => {
          // Array → pro Aufruf das nächste Ergebnis (für getrennte Inserts: Kern + Produkt-Chance).
          const v = config[`${table}.insert`]
          if (Array.isArray(v)) return Promise.resolve(v.shift() ?? { error: null })
          return Promise.resolve(v ?? { error: null })
        },
        upsert: () => Promise.resolve(config[`${table}.upsert`] ?? { error: null }),
      }
      return builder
    },
  }
}

import { POST } from './route'

function makeReq(authHeader: string | null = null): NextRequest {
  return {
    headers: { get: (k: string) => (k === 'authorization' ? authHeader : null) },
  } as unknown as NextRequest
}

const SAMPLE = [
  { category: 'marketing', title: 'T1', body: 'B1', insight: 'I1', source: 'S1' },
  { category: 'product', title: 'T2', body: 'B2', insight: 'I2', source: 'S2' },
  { category: 'operations', title: 'T3', body: 'B3', insight: 'I3', source: 'S3' },
]

describe('POST /api/generate-suggestions', () => {
  const ORIGINAL_ENV = { ...process.env }

  const MOCK_LIVE_CONTEXT = {
    supabaseHistory: [],
    notionBizDevEntries: [],
    livingSpecContent: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    dbConfig.value = {}
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockGenerate.mockResolvedValue(SAMPLE)
    mockProductOpportunity.mockResolvedValue(null)
    mockFetchLiveContext.mockResolvedValue(MOCK_LIVE_CONTEXT)
    delete process.env.CRON_SECRET
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it('lehnt nicht autorisierte Anfragen mit 401 ab', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await POST(makeReq())
    expect(res.status).toBe(401)
    expect(mockGenerate).not.toHaveBeenCalled()
  })

  it('akzeptiert ein gültiges Cron-Secret ohne Session', async () => {
    process.env.CRON_SECRET = 'geheim'
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await POST(makeReq('Bearer geheim'))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('überspringt, wenn heute bereits ein erfolgreicher Report existiert', async () => {
    dbConfig.value = { 'daily_reports.single': { data: { generation_status: 'sent' } } }
    const res = await POST(makeReq())
    const body = await res.json()
    expect(body.skipped).toBe(true)
    expect(mockGenerate).not.toHaveBeenCalled()
  })

  it('erlaubt erneuten Versuch nach einem fehlgeschlagenen Report', async () => {
    dbConfig.value = { 'daily_reports.single': { data: { generation_status: 'failed' } } }
    const res = await POST(makeReq())
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(mockGenerate).toHaveBeenCalled()
  })

  it('speichert Vorschläge und liefert die Anzahl bei Erfolg', async () => {
    const res = await POST(makeReq())
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.count).toBe(3)
  })

  it('protokolliert "failed" und gibt 500 zurück, wenn die Generierung scheitert', async () => {
    mockGenerate.mockRejectedValue(new Error('Claude down'))
    const res = await POST(makeReq())
    const body = await res.json()
    expect(res.status).toBe(500)
    expect(body.error).toBeDefined()
  })

  it('gibt 500 zurück, wenn der DB-Insert fehlschlägt', async () => {
    dbConfig.value = { 'suggestions.insert': { error: { message: 'insert kaputt' } } }
    const res = await POST(makeReq())
    expect(res.status).toBe(500)
  })

  it('hängt eine Produkt-Chance an den Batch an, wenn eine erzeugt wurde (PROJ-9)', async () => {
    mockProductOpportunity.mockResolvedValue({
      category: 'digital_product',
      title: 'Notion-Template: Freelancer-Finanz-OS',
      body: '**Format:** Notion-Template',
      insight: 'Top-Creator verdienen 500–10.000 $/Monat',
      source: 'Belegt durch: Notion Business-/Creator-OS-Template',
    })
    const res = await POST(makeReq())
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.count).toBe(4)
  })

  it('läuft normal weiter, wenn keine Produkt-Chance erzeugt wurde (best-effort)', async () => {
    mockProductOpportunity.mockResolvedValue(null)
    const res = await POST(makeReq())
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.count).toBe(3)
  })

  it('rettet den Kern-Batch, wenn der separate Produkt-Chance-Insert fehlschlägt (BUG-2)', async () => {
    // Kern-Insert ok (1. Aufruf), Produkt-Chance-Insert abgelehnt (2. Aufruf)
    dbConfig.value = {
      'suggestions.insert': [{ error: null }, { error: { message: 'category constraint' } }],
    }
    mockProductOpportunity.mockResolvedValue({
      category: 'digital_product',
      title: 'PC',
      body: 'Format: X',
      insight: 'I',
      source: 'Belegt durch: Y',
    })
    const res = await POST(makeReq())
    const body = await res.json()
    // Tageslauf erfolgreich, Produkt-Chance fällt still weg → count bleibt 3
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.count).toBe(3)
  })
})
