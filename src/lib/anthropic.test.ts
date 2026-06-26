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

vi.mock('./digital-product-research', () => ({
  DIGITAL_PRODUCT_RESEARCH: 'MOCK_RESEARCH_SHEET mit bewährten Formaten',
}))

// notion.ts is imported for the ElaboratedSection type — no side effects
vi.mock('./notion', () => ({}))

// live-context.ts is imported for the LiveContext type only — no side effects needed
vi.mock('./live-context', () => ({}))

import { elaborateDocument, generateSuggestions, generateProductOpportunity } from './anthropic'

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

  it('enthält "Markenkonforme Lösung" im Prompt für Design-Kategorie (PROJ-10)', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    mockSuccess()
    await elaborateDocument({ title: 'T', body: 'B', insight: null, source: null, category: 'design' })
    const prompt = mockParse.mock.calls[0][0].messages[0].content as string
    expect(prompt).toContain('Markenkonforme Lösung')
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

const EMPTY_LIVE_CONTEXT = {
  supabaseHistory: [],
  notionBizDevEntries: [],
  livingSpecContent: null,
}

describe('generateSuggestions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('ist eine Funktion', () => {
    expect(typeof generateSuggestions).toBe('function')
  })

  it('wirft wenn ANTHROPIC_API_KEY fehlt', async () => {
    delete process.env.ANTHROPIC_API_KEY
    await expect(generateSuggestions(EMPTY_LIVE_CONTEXT)).rejects.toThrow('ANTHROPIC_API_KEY')
  })

  it('gibt Vorschläge zurück bei erfolgreichem Aufruf', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    const mockSuggestions = [
      { category: 'marketing', title: 'T1', body: 'B1', insight: 'I1', source: 'S1' },
    ]
    mockParse.mockResolvedValue({ parsed_output: { suggestions: mockSuggestions } })
    const result = await generateSuggestions(EMPTY_LIVE_CONTEXT)
    expect(result).toEqual(mockSuggestions)
  })

  it('bietet die vier Kategorien inkl. design im Generierungs-Prompt an (PROJ-10)', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    mockParse.mockResolvedValue({ parsed_output: { suggestions: [{ category: 'design', title: 'T', body: 'B', insight: 'I', source: 'S' }] } })
    const result = await generateSuggestions(EMPTY_LIVE_CONTEXT)
    const prompt = mockParse.mock.calls[0][0].messages[0].content as string
    expect(prompt).toContain('vier Kategorien')
    expect(prompt).toContain('design')
    expect(prompt).toContain('Design & Brand')
    // design ist eine gültige Kategorie im Output
    expect(result[0].category).toBe('design')
  })

  it('enthält Living Spec im Prompt wenn vorhanden', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    mockParse.mockResolvedValue({ parsed_output: { suggestions: [{ category: 'marketing', title: 'T', body: 'B', insight: 'I', source: 'S' }] } })
    await generateSuggestions({
      supabaseHistory: [],
      notionBizDevEntries: [],
      livingSpecContent: 'QualiPilot Stand: IQ-Dokument automatisierung.',
    })
    const prompt = mockParse.mock.calls[0][0].messages[0].content as string
    expect(prompt).toContain('QualiPilot Stand')
    expect(prompt).toContain('Living Spec')
  })

  it('enthält abgelehnte Vorschläge im Prompt', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    mockParse.mockResolvedValue({ parsed_output: { suggestions: [{ category: 'marketing', title: 'T', body: 'B', insight: 'I', source: 'S' }] } })
    await generateSuggestions({
      supabaseHistory: [{ title: 'Alter Vorschlag', category: 'marketing', status: 'rejected' }],
      notionBizDevEntries: [],
      livingSpecContent: null,
    })
    const prompt = mockParse.mock.calls[0][0].messages[0].content as string
    expect(prompt).toContain('Alter Vorschlag')
    expect(prompt).toContain('Abgelehnt')
  })

  it('enthält bestätigte Vorschläge im Prompt', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    mockParse.mockResolvedValue({ parsed_output: { suggestions: [{ category: 'marketing', title: 'T', body: 'B', insight: 'I', source: 'S' }] } })
    await generateSuggestions({
      supabaseHistory: [{ title: 'Bestätigter Vorschlag', category: 'operations', status: 'approved' }],
      notionBizDevEntries: [],
      livingSpecContent: null,
    })
    const prompt = mockParse.mock.calls[0][0].messages[0].content as string
    expect(prompt).toContain('Bestätigter Vorschlag')
    expect(prompt).toContain('bestätigt')
  })

  it('enthält umgesetzte Vorschläge im Prompt', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    mockParse.mockResolvedValue({ parsed_output: { suggestions: [{ category: 'marketing', title: 'T', body: 'B', insight: 'I', source: 'S' }] } })
    await generateSuggestions({
      supabaseHistory: [{ title: 'Umgesetzter Vorschlag', category: 'product', status: 'implemented' }],
      notionBizDevEntries: [],
      livingSpecContent: null,
    })
    const prompt = mockParse.mock.calls[0][0].messages[0].content as string
    expect(prompt).toContain('Umgesetzter Vorschlag')
    expect(prompt).toContain('umgesetzt')
  })

  it('zeigt umgesetzte Vorschläge über den bestätigten (stärkeres Signal)', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    mockParse.mockResolvedValue({ parsed_output: { suggestions: [{ category: 'marketing', title: 'T', body: 'B', insight: 'I', source: 'S' }] } })
    await generateSuggestions({
      supabaseHistory: [
        { title: 'Bestätigter Vorschlag', category: 'operations', status: 'approved' },
        { title: 'Umgesetzter Vorschlag', category: 'product', status: 'implemented' },
      ],
      notionBizDevEntries: [],
      livingSpecContent: null,
    })
    const prompt = mockParse.mock.calls[0][0].messages[0].content as string
    const implementedIndex = prompt.indexOf('Bereits umgesetzt')
    const approvedIndex = prompt.indexOf('Bereits bestätigt')
    expect(implementedIndex).toBeGreaterThan(-1)
    expect(approvedIndex).toBeGreaterThan(-1)
    expect(implementedIndex).toBeLessThan(approvedIndex)
  })
})

const PRODUCT_OPP_OUTPUT = {
  title: 'Notion-Template: Freelancer-Finanz-OS',
  format: 'Notion-Template',
  price_range: '19–39 $',
  promise: 'Führe deine Finanzen aus einem Workspace',
  target_customer: 'Freelancer und Solopreneure',
  problem: 'Verstreute Finanz-Tools, keine Übersicht',
  platforms: 'Gumroad, Notion-Gallery',
  demand_evidence: 'Top-Creator verdienen 500–10.000 $/Monat',
  proven_format: 'Notion Business-/Creator-OS-Template',
}

describe('generateProductOpportunity', () => {
  beforeEach(() => vi.clearAllMocks())

  it('gibt null zurück wenn ANTHROPIC_API_KEY fehlt (best-effort, kein Wurf)', async () => {
    delete process.env.ANTHROPIC_API_KEY
    const result = await generateProductOpportunity(EMPTY_LIVE_CONTEXT)
    expect(result).toBeNull()
  })

  it('liefert eine zusammengesetzte Produkt-Chance mit Kategorie digital_product', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    mockParse.mockResolvedValue({ parsed_output: PRODUCT_OPP_OUTPUT })
    const result = await generateProductOpportunity(EMPTY_LIVE_CONTEXT)
    expect(result).not.toBeNull()
    expect(result!.category).toBe('digital_product')
    expect(result!.title).toBe('Notion-Template: Freelancer-Finanz-OS')
    // Detailfelder im body sichtbar (AC)
    expect(result!.body).toContain('Notion-Template')
    expect(result!.body).toContain('19–39 $')
    expect(result!.body).toContain('Freelancer und Solopreneure')
    // insight = Nachfrage-Beleg, source = belegendes Format
    expect(result!.insight).toContain('500–10.000')
    expect(result!.source).toContain('Belegt durch')
    expect(result!.source).toContain('Notion Business-/Creator-OS-Template')
  })

  it('enthält die Research-Sheet im Prompt', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    mockParse.mockResolvedValue({ parsed_output: PRODUCT_OPP_OUTPUT })
    await generateProductOpportunity(EMPTY_LIVE_CONTEXT)
    const prompt = mockParse.mock.calls[0][0].messages[0].content as string
    expect(prompt).toContain('MOCK_RESEARCH_SHEET')
  })

  it('listet bereits vorgeschlagene Produkt-Chancen zur Deduplizierung', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    mockParse.mockResolvedValue({ parsed_output: PRODUCT_OPP_OUTPUT })
    await generateProductOpportunity({
      supabaseHistory: [
        { title: 'Budget-Planner Bundle', category: 'digital_product', status: 'rejected' },
        { title: 'LinkedIn-Post', category: 'marketing', status: 'approved' },
      ],
      notionBizDevEntries: [],
      livingSpecContent: null,
    })
    const prompt = mockParse.mock.calls[0][0].messages[0].content as string
    expect(prompt).toContain('NICHT wiederholen')
    expect(prompt).toContain('Budget-Planner Bundle')
    // Nur digital_product-Historie, keine Marketing-Einträge
    expect(prompt).not.toContain('LinkedIn-Post')
  })

  it('gibt null zurück wenn Claude wiederholt fehlschlägt (best-effort)', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    mockParse.mockRejectedValue(new Error('API down'))
    const result = await generateProductOpportunity(EMPTY_LIVE_CONTEXT)
    expect(result).toBeNull()
    expect(mockParse).toHaveBeenCalledTimes(3)
  }, 15000)
})
