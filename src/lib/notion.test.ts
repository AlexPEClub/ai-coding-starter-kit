import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  fetchDatabase,
  createNoraBizDevDatabase,
  createPage,
  normalizeNotionId,
  CATEGORY_TO_NOTION,
  type ElaboratedSection,
} from './notion'

const TEST_KEY = 'secret_testkey123'
const TEST_DB_ID = 'db-aabbccdd-1234-5678-90ab-cdef01234567'
const TEST_PAGE_ID = 'page-aabbccdd-1234-5678-90ab-cdef01234567'
const TEST_PAGE_URL = 'https://www.notion.so/Test-Seite-aabbccdd'
const TEST_PARENT_ID = 'aabbccdd112233445566778899aabbcc'
const TEST_PARENT_ID_UUID = 'aabbccdd-1122-3344-5566-778899aabbcc'

function mockFetch(response: unknown, status = 200) {
  return vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(response),
  } as Response)
}

describe('normalizeNotionId', () => {
  const EXPECTED = '32a3c7c0-25d9-80f8-b069-d827abcdef01'

  it('formatiert rohe 32-stellige Hex-ID als UUID', () => {
    expect(normalizeNotionId('32a3c7c025d980f8b069d827abcdef01')).toBe(EXPECTED)
  })

  it('lässt bereits gestrichelte UUID unverändert', () => {
    expect(normalizeNotionId(EXPECTED)).toBe(EXPECTED)
  })

  it('extrahiert die ID aus einer vollen Notion-URL', () => {
    expect(
      normalizeNotionId('https://www.notion.so/Nora-32a3c7c025d980f8b069d827abcdef01')
    ).toBe(EXPECTED)
  })

  it('extrahiert die ID aus einer app.notion.com/p-URL', () => {
    expect(
      normalizeNotionId('https://app.notion.com/p/Nora-32a3c7c025d980f8b069d827abcdef01')
    ).toBe(EXPECTED)
  })

  it('ignoriert Query-Parameter (z.B. ?v=...)', () => {
    expect(
      normalizeNotionId('https://www.notion.so/Nora-32a3c7c025d980f8b069d827abcdef01?pvs=4')
    ).toBe(EXPECTED)
  })

  it('gibt den Originalwert zurück wenn keine 32-Hex-ID gefunden wird', () => {
    expect(normalizeNotionId('kein-gültiger-wert')).toBe('kein-gültiger-wert')
  })
})

describe('notion.ts — API Client', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => vi.restoreAllMocks())

  describe('fetchDatabase', () => {
    it('gibt { id } zurück wenn Datenbank existiert', async () => {
      mockFetch({ object: 'database', id: TEST_DB_ID })
      const result = await fetchDatabase(TEST_KEY, TEST_DB_ID)
      expect(result).toEqual({ id: TEST_DB_ID })
    })

    it('gibt null zurück bei HTTP 404 (gelöscht)', async () => {
      mockFetch({}, 404)
      const result = await fetchDatabase(TEST_KEY, TEST_DB_ID)
      expect(result).toBeNull()
    })

    it('wirft bei HTTP 429 die Überlastungs-Fehlermeldung', async () => {
      mockFetch({}, 429)
      await expect(fetchDatabase(TEST_KEY, TEST_DB_ID)).rejects.toThrow('überlastet')
    })

    it('wirft bei HTTP 403 die Zugriff-verweigert-Meldung', async () => {
      mockFetch({ message: 'Unauthorized' }, 403)
      await expect(fetchDatabase(TEST_KEY, TEST_DB_ID)).rejects.toThrow('Zugriff verweigert')
    })

    it('wirft bei anderen Fehlern mit Notion-Fehlermeldung', async () => {
      mockFetch({ message: 'Internal Server Error' }, 500)
      await expect(fetchDatabase(TEST_KEY, TEST_DB_ID)).rejects.toThrow('Internal Server Error')
    })

    it('wirft mit HTTP-Statusnummer wenn keine message vorhanden', async () => {
      mockFetch({}, 500)
      await expect(fetchDatabase(TEST_KEY, TEST_DB_ID)).rejects.toThrow('HTTP 500')
    })

    it('sendet Notion-Version-Header', async () => {
      const spy = mockFetch({ object: 'database', id: TEST_DB_ID })
      await fetchDatabase(TEST_KEY, TEST_DB_ID)
      const headers = spy.mock.calls[0][1]?.headers as Record<string, string>
      expect(headers['Notion-Version']).toBe('2022-06-28')
    })

    it('sendet Authorization mit Bearer-Prefix', async () => {
      const spy = mockFetch({ object: 'database', id: TEST_DB_ID })
      await fetchDatabase(TEST_KEY, TEST_DB_ID)
      const headers = spy.mock.calls[0][1]?.headers as Record<string, string>
      expect(headers['Authorization']).toBe(`Bearer ${TEST_KEY}`)
    })
  })

  describe('createNoraBizDevDatabase', () => {
    it('gibt die neue Datenbank-ID zurück', async () => {
      mockFetch({ id: TEST_DB_ID })
      const result = await createNoraBizDevDatabase(TEST_KEY, TEST_PARENT_ID)
      expect(result).toEqual({ id: TEST_DB_ID })
    })

    it('setzt parent auf die normalisierte Parent-Page-ID (UUID-Format)', async () => {
      const spy = mockFetch({ id: TEST_DB_ID })
      await createNoraBizDevDatabase(TEST_KEY, TEST_PARENT_ID)
      const body = JSON.parse(spy.mock.calls[0][1]?.body as string)
      expect(body.parent).toEqual({ type: 'page_id', page_id: TEST_PARENT_ID_UUID })
    })

    it('normalisiert eine volle Notion-URL als Parent-Page-ID', async () => {
      const spy = mockFetch({ id: TEST_DB_ID })
      await createNoraBizDevDatabase(TEST_KEY, `https://app.notion.com/p/Nora-${TEST_PARENT_ID}`)
      const body = JSON.parse(spy.mock.calls[0][1]?.body as string)
      expect(body.parent.page_id).toBe(TEST_PARENT_ID_UUID)
    })

    it('enthält alle vier Properties (Name, Kategorie, Datum, Monday-Task-Link)', async () => {
      const spy = mockFetch({ id: TEST_DB_ID })
      await createNoraBizDevDatabase(TEST_KEY, TEST_PARENT_ID)
      const body = JSON.parse(spy.mock.calls[0][1]?.body as string)
      expect(body.properties).toHaveProperty('Name')
      expect(body.properties).toHaveProperty('Kategorie')
      expect(body.properties).toHaveProperty('Datum')
      expect(body.properties).toHaveProperty('Monday-Task-Link')
    })

    it('enthält alle drei Kategorie-Optionen', async () => {
      const spy = mockFetch({ id: TEST_DB_ID })
      await createNoraBizDevDatabase(TEST_KEY, TEST_PARENT_ID)
      const body = JSON.parse(spy.mock.calls[0][1]?.body as string)
      const options = body.properties.Kategorie.select.options.map((o: { name: string }) => o.name)
      expect(options).toContain('Marketing')
      expect(options).toContain('Produkt')
      expect(options).toContain('Operations')
    })

    it('wirft bei HTTP 403', async () => {
      mockFetch({ message: 'Could not find page' }, 403)
      await expect(createNoraBizDevDatabase(TEST_KEY, TEST_PARENT_ID)).rejects.toThrow('Zugriff verweigert')
    })
  })

  describe('createPage', () => {
    const baseParams = {
      title: 'Testtitel',
      category: 'marketing',
      mondayUrl: 'https://kordixai.monday.com/boards/1/pulses/123',
      body: 'Test Body',
      insight: 'Test Insight',
      source: 'Test Quelle',
    }

    it('gibt Page-ID und URL zurück', async () => {
      mockFetch({ id: TEST_PAGE_ID, url: TEST_PAGE_URL })
      const result = await createPage(TEST_KEY, TEST_DB_ID, baseParams)
      expect(result).toEqual({ id: TEST_PAGE_ID, url: TEST_PAGE_URL })
    })

    it('setzt parent auf database_id', async () => {
      const spy = mockFetch({ id: TEST_PAGE_ID, url: TEST_PAGE_URL })
      await createPage(TEST_KEY, TEST_DB_ID, baseParams)
      const body = JSON.parse(spy.mock.calls[0][1]?.body as string)
      expect(body.parent).toEqual({ type: 'database_id', database_id: TEST_DB_ID })
    })

    it('setzt Kategorie-Property auf deutschen Namen', async () => {
      const spy = mockFetch({ id: TEST_PAGE_ID, url: TEST_PAGE_URL })
      await createPage(TEST_KEY, TEST_DB_ID, baseParams)
      const body = JSON.parse(spy.mock.calls[0][1]?.body as string)
      expect(body.properties.Kategorie).toEqual({ select: { name: 'Marketing' } })
    })

    it('mappt alle drei Kategorien korrekt', async () => {
      expect(CATEGORY_TO_NOTION['marketing']).toBe('Marketing')
      expect(CATEGORY_TO_NOTION['product']).toBe('Produkt')
      expect(CATEGORY_TO_NOTION['operations']).toBe('Operations')
    })

    it('setzt Datum auf heutiges Datum', async () => {
      const spy = mockFetch({ id: TEST_PAGE_ID, url: TEST_PAGE_URL })
      await createPage(TEST_KEY, TEST_DB_ID, baseParams)
      const body = JSON.parse(spy.mock.calls[0][1]?.body as string)
      const today = new Date().toISOString().split('T')[0]
      expect(body.properties.Datum).toEqual({ date: { start: today } })
    })

    it('setzt Monday-Task-Link wenn mondayUrl gesetzt ist', async () => {
      const spy = mockFetch({ id: TEST_PAGE_ID, url: TEST_PAGE_URL })
      await createPage(TEST_KEY, TEST_DB_ID, baseParams)
      const body = JSON.parse(spy.mock.calls[0][1]?.body as string)
      expect(body.properties['Monday-Task-Link']).toEqual({ url: baseParams.mondayUrl })
    })

    it('lässt Monday-Task-Link weg wenn mondayUrl null ist', async () => {
      const spy = mockFetch({ id: TEST_PAGE_ID, url: TEST_PAGE_URL })
      await createPage(TEST_KEY, TEST_DB_ID, { ...baseParams, mondayUrl: null })
      const body = JSON.parse(spy.mock.calls[0][1]?.body as string)
      expect(body.properties).not.toHaveProperty('Monday-Task-Link')
    })

    it('kürzt Titel auf 2000 Zeichen', async () => {
      const spy = mockFetch({ id: TEST_PAGE_ID, url: TEST_PAGE_URL })
      const longTitle = 'A'.repeat(2500)
      await createPage(TEST_KEY, TEST_DB_ID, { ...baseParams, title: longTitle })
      const body = JSON.parse(spy.mock.calls[0][1]?.body as string)
      const titleContent = body.properties.Name.title[0].text.content
      expect(titleContent.length).toBe(2000)
    })

    it('enthält Body, Insight und Quelle als Blöcke', async () => {
      const spy = mockFetch({ id: TEST_PAGE_ID, url: TEST_PAGE_URL })
      await createPage(TEST_KEY, TEST_DB_ID, baseParams)
      const body = JSON.parse(spy.mock.calls[0][1]?.body as string)
      const blocks = body.children
      expect(blocks[0].type).toBe('paragraph')
      expect(blocks[0].paragraph.rich_text[0].text.content).toBe('Test Body')
      const types = blocks.map((b: { type: string }) => b.type)
      expect(types).toContain('heading_3')
    })

    it('lässt Insight-Blöcke weg wenn insight null ist', async () => {
      const spy = mockFetch({ id: TEST_PAGE_ID, url: TEST_PAGE_URL })
      await createPage(TEST_KEY, TEST_DB_ID, { ...baseParams, insight: null })
      const body = JSON.parse(spy.mock.calls[0][1]?.body as string)
      const texts = body.children.flatMap(
        (b: { type: string; paragraph?: { rich_text: Array<{ text: { content: string } }> }; heading_3?: { rich_text: Array<{ text: { content: string } }> } }) =>
          b.paragraph?.rich_text ?? b.heading_3?.rich_text ?? []
      ).map((rt: { text: { content: string } }) => rt.text.content)
      expect(texts.join('')).not.toContain('💡')
    })

    it('lässt Quellen-Blöcke weg wenn source null ist', async () => {
      const spy = mockFetch({ id: TEST_PAGE_ID, url: TEST_PAGE_URL })
      await createPage(TEST_KEY, TEST_DB_ID, { ...baseParams, source: null })
      const body = JSON.parse(spy.mock.calls[0][1]?.body as string)
      const texts = body.children.flatMap(
        (b: { type: string; paragraph?: { rich_text: Array<{ text: { content: string } }> }; heading_3?: { rich_text: Array<{ text: { content: string } }> } }) =>
          b.paragraph?.rich_text ?? b.heading_3?.rich_text ?? []
      ).map((rt: { text: { content: string } }) => rt.text.content)
      expect(texts.join('')).not.toContain('📎')
    })

    it('enthält nur Body-Block wenn insight und source null sind', async () => {
      const spy = mockFetch({ id: TEST_PAGE_ID, url: TEST_PAGE_URL })
      await createPage(TEST_KEY, TEST_DB_ID, { ...baseParams, insight: null, source: null })
      const body = JSON.parse(spy.mock.calls[0][1]?.body as string)
      expect(body.children).toHaveLength(1)
      expect(body.children[0].type).toBe('paragraph')
    })

    it('wirft bei HTTP 429', async () => {
      mockFetch({}, 429)
      await expect(createPage(TEST_KEY, TEST_DB_ID, baseParams)).rejects.toThrow('überlastet')
    })

    describe('mit elaboratedSections (PROJ-8)', () => {
      const sections: ElaboratedSection[] = [
        { heading: 'LinkedIn-Post-Entwurf', content: 'Fertig formulierter Post.' },
        { heading: 'Hintergrund & Strategie', content: 'Warum dieser Post jetzt.' },
      ]

      it('verwendet heading_2-Blöcke wenn elaboratedSections gesetzt sind', async () => {
        const spy = mockFetch({ id: TEST_PAGE_ID, url: TEST_PAGE_URL })
        await createPage(TEST_KEY, TEST_DB_ID, { ...baseParams, elaboratedSections: sections })
        const body = JSON.parse(spy.mock.calls[0][1]?.body as string)
        const types = body.children.map((b: { type: string }) => b.type)
        expect(types).toContain('heading_2')
      })

      it('enthält Abschnittsüberschriften und Inhalte in korrekter Reihenfolge', async () => {
        const spy = mockFetch({ id: TEST_PAGE_ID, url: TEST_PAGE_URL })
        await createPage(TEST_KEY, TEST_DB_ID, { ...baseParams, elaboratedSections: sections })
        const body = JSON.parse(spy.mock.calls[0][1]?.body as string)
        const headings = body.children
          .filter((b: { type: string }) => b.type === 'heading_2')
          .map((b: { heading_2: { rich_text: Array<{ text: { content: string } }> } }) => b.heading_2.rich_text[0].text.content)
        expect(headings[0]).toBe('LinkedIn-Post-Entwurf')
        expect(headings[1]).toBe('Hintergrund & Strategie')
      })

      it('fügt Insight und Quelle als heading_3 am Ende an', async () => {
        const spy = mockFetch({ id: TEST_PAGE_ID, url: TEST_PAGE_URL })
        await createPage(TEST_KEY, TEST_DB_ID, { ...baseParams, elaboratedSections: sections })
        const body = JSON.parse(spy.mock.calls[0][1]?.body as string)
        const h3Texts = body.children
          .filter((b: { type: string }) => b.type === 'heading_3')
          .map((b: { heading_3: { rich_text: Array<{ text: { content: string } }> } }) => b.heading_3.rich_text[0].text.content)
        expect(h3Texts).toContain('💡 Insight')
        expect(h3Texts).toContain('📎 Quelle')
        // Heading_3 must come after all heading_2 blocks
        const lastH2Idx = body.children.map((b: { type: string }) => b.type).lastIndexOf('heading_2')
        const firstH3Idx = body.children.map((b: { type: string }) => b.type).indexOf('heading_3')
        expect(firstH3Idx).toBeGreaterThan(lastH2Idx)
      })

      it('fällt auf Short-Text-Format zurück wenn elaboratedSections leer sind', async () => {
        const spy = mockFetch({ id: TEST_PAGE_ID, url: TEST_PAGE_URL })
        await createPage(TEST_KEY, TEST_DB_ID, { ...baseParams, elaboratedSections: [] })
        const body = JSON.parse(spy.mock.calls[0][1]?.body as string)
        expect(body.children[0].type).toBe('paragraph')
        expect(body.children[0].paragraph.rich_text[0].text.content).toBe('Test Body')
      })

      it('fällt auf Short-Text-Format zurück wenn elaboratedSections nicht gesetzt sind', async () => {
        const spy = mockFetch({ id: TEST_PAGE_ID, url: TEST_PAGE_URL })
        await createPage(TEST_KEY, TEST_DB_ID, baseParams)
        const body = JSON.parse(spy.mock.calls[0][1]?.body as string)
        expect(body.children[0].type).toBe('paragraph')
      })

      it('splittet Content bei doppelten Zeilenumbrüchen in mehrere Paragraph-Blöcke', async () => {
        const multiParaSection: ElaboratedSection[] = [
          { heading: 'Abschnitt', content: 'Erster Absatz.\n\nZweiter Absatz.' },
        ]
        const spy = mockFetch({ id: TEST_PAGE_ID, url: TEST_PAGE_URL })
        await createPage(TEST_KEY, TEST_DB_ID, { ...baseParams, elaboratedSections: multiParaSection })
        const body = JSON.parse(spy.mock.calls[0][1]?.body as string)
        const paragraphs = body.children.filter((b: { type: string }) => b.type === 'paragraph')
        const paragraphTexts = paragraphs.map(
          (b: { paragraph: { rich_text: Array<{ text: { content: string } }> } }) =>
            b.paragraph.rich_text[0].text.content
        )
        expect(paragraphTexts).toContain('Erster Absatz.')
        expect(paragraphTexts).toContain('Zweiter Absatz.')
      })

      it('ruft PATCH /blocks/{id}/children auf wenn mehr als 100 Blöcke vorliegen', async () => {
        // 51 sections → 51 headings + 51 paragraphs = 102 blocks > 100
        const manySections: ElaboratedSection[] = Array.from({ length: 51 }, (_, i) => ({
          heading: `Abschnitt ${i + 1}`,
          content: `Inhalt ${i + 1}`,
        }))
        const spy = vi.spyOn(global, 'fetch')
          .mockResolvedValueOnce({
            ok: true, status: 200,
            json: () => Promise.resolve({ id: TEST_PAGE_ID, url: TEST_PAGE_URL }),
          } as Response)
          .mockResolvedValueOnce({
            ok: true, status: 200,
            json: () => Promise.resolve({ results: [] }),
          } as Response)

        await createPage(TEST_KEY, TEST_DB_ID, { ...baseParams, elaboratedSections: manySections })
        expect(spy).toHaveBeenCalledTimes(2)
        const patchCall = spy.mock.calls[1]
        expect(patchCall[1]?.method).toBe('PATCH')
        expect((patchCall[0] as string)).toContain(TEST_PAGE_ID)
      })
    })
  })
})
