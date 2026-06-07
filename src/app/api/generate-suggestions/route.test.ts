import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { NextRequest } from 'next/server'

const mockGetUser = vi.hoisted(() => vi.fn())
const mockGenerate = vi.hoisted(() => vi.fn())
const dbConfig = vi.hoisted(() => ({ value: {} as Record<string, unknown> }))

vi.mock('@/lib/supabase-server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
  }),
  createServiceRoleClient: vi.fn(() => buildDb(dbConfig.value)),
}))

vi.mock('@/lib/anthropic', () => ({
  generateSuggestions: mockGenerate,
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
        insert: () => Promise.resolve(config[`${table}.insert`] ?? { error: null }),
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

  beforeEach(() => {
    vi.clearAllMocks()
    dbConfig.value = {}
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockGenerate.mockResolvedValue(SAMPLE)
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
})
