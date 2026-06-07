import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockParse = vi.hoisted(() => vi.fn())

vi.mock('@anthropic-ai/sdk', () => ({
  // Must use 'function' (not arrow) so it can be called with 'new'
  default: vi.fn().mockImplementation(function() {
    return { messages: { parse: mockParse } }
  }),
}))

vi.mock('@anthropic-ai/sdk/helpers/zod', () => ({
  zodOutputFormat: vi.fn().mockReturnValue({ type: 'json_schema', json_schema: {} }),
}))

vi.mock('./nora-context', () => ({
  NORA_COMPANY_CONTEXT: 'MOCK_CONTEXT',
}))

// notion.ts is imported for the ElaboratedSection type — no side effects
vi.mock('./notion', () => ({}))

import { elaborateDocument, generateSuggestions } from './anthropic'

const MOCK_SECTIONS = [
  { heading: 'LinkedIn-Post-Entwurf', content: 'Fertiger Post-Text.' },
  { heading: 'Hintergrund & Strategie', content: 'Warum dieser Post jetzt.' },
]

function mockSuccess(sections = MOCK_SECTIONS) {
  mockParse.mockResolvedValue({ parsed_output: { sections } })
}

describe('elaborateDocument', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => vi.restoreAllMocks())

  it('gibt sections zurück bei erfolgreichem Claude-Aufruf', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    mockSuccess()
    const result = await elaborateDocument({
      title: 'Test Titel',
      body: 'Test Body',
      insight: 'Test Insight',
      source: 'Test Quelle',
      category: 'marketing',
    })
    expect(result.sections).toEqual(MOCK_SECTIONS)
  })

  it('wirft wenn ANTHROPIC_API_KEY fehlt', async () => {
    delete process.env.ANTHROPIC_API_KEY
    await expect(
      elaborateDocument({ title: 'T', body: 'B', insight: null, source: null, category: 'marketing' })
    ).rejects.toThrow('ANTHROPIC_API_KEY')
  })

  it('enthält "LinkedIn" im Prompt für Marketing-Kategorie', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    mockSuccess()
    await elaborateDocument({ title: 'T', body: 'B', insight: null, source: null, category: 'marketing' })
    const prompt = mockParse.mock.calls[0][0].messages[0].content as string
    expect(prompt).toContain('LinkedIn')
  })

  it('enthält "Umsetzungsschritte" im Prompt für Produkt-Kategorie', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    mockSuccess()
    await elaborateDocument({ title: 'T', body: 'B', insight: null, source: null, category: 'product' })
    const prompt = mockParse.mock.calls[0][0].messages[0].content as string
    expect(prompt).toContain('Umsetzungsschritte')
  })

  it('enthält "Checkliste" im Prompt für Operations-Kategorie', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    mockSuccess()
    await elaborateDocument({ title: 'T', body: 'B', insight: null, source: null, category: 'operations' })
    const prompt = mockParse.mock.calls[0][0].messages[0].content as string
    expect(prompt).toContain('Checkliste')
  })

  it('verwendet Default-Prompt für unbekannte Kategorie', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    mockSuccess()
    await elaborateDocument({ title: 'T', body: 'B', insight: null, source: null, category: 'unknown' })
    const prompt = mockParse.mock.calls[0][0].messages[0].content as string
    expect(prompt).toContain('Nächste Aktion')
  })

  it('enthält Titel und Body im Prompt', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    mockSuccess()
    await elaborateDocument({ title: 'Mein Titel', body: 'Mein Vorschlag', insight: null, source: null, category: 'marketing' })
    const prompt = mockParse.mock.calls[0][0].messages[0].content as string
    expect(prompt).toContain('Mein Titel')
    expect(prompt).toContain('Mein Vorschlag')
  })

  it('enthält Insight im Prompt wenn vorhanden', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    mockSuccess()
    await elaborateDocument({ title: 'T', body: 'B', insight: 'Mein Insight', source: null, category: 'marketing' })
    const prompt = mockParse.mock.calls[0][0].messages[0].content as string
    expect(prompt).toContain('Mein Insight')
  })

  it('wirft nach MAX_RETRIES Versuchen wenn Claude immer fehlschlägt', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    mockParse.mockRejectedValue(new Error('API-Fehler'))
    await expect(
      elaborateDocument({ title: 'T', body: 'B', insight: null, source: null, category: 'marketing' })
    ).rejects.toThrow('fehlgeschlagen')
    expect(mockParse).toHaveBeenCalledTimes(3)
  }, 15000)

  it('wirft wenn Claude leere sections liefert', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    mockParse.mockResolvedValue({ parsed_output: { sections: [] } })
    await expect(
      elaborateDocument({ title: 'T', body: 'B', insight: null, source: null, category: 'marketing' })
    ).rejects.toThrow('fehlgeschlagen')
  }, 15000)
})

describe('generateSuggestions (Smoke-Test)', () => {
  it('ist eine Funktion', () => {
    expect(typeof generateSuggestions).toBe('function')
  })
})
