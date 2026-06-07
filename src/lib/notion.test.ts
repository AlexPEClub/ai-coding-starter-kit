import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  fetchDatabase,
  createNoraBizDevDatabase,
  createPage,
  CATEGORY_TO_NOTION,
} from './notion'

const TEST_KEY = 'secret_testkey123'
const TEST_DB_ID = 'db-aabbccdd-1234-5678-90ab-cdef01234567'
const TEST_PAGE_ID = 'page-aabbccdd-1234-5678-90ab-cdef01234567'
const TEST_PAGE_URL = 'https://www.notion.so/Test-Seite-aabbccdd'
const TEST_PARENT_ID = 'parent-aabbccdd-1234-5678-90ab-cdef01234567'

function mockFetch(response: unknown, status = 200) {
  return vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(response),
  } as Response)
}

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

    it('setzt parent auf die übergebene Parent-Page-ID', async () => {
      const spy = mockFetch({ id: TEST_DB_ID })
      await createNoraBizDevDatabase(TEST_KEY, TEST_PARENT_ID)
      const body = JSON.parse(spy.mock.calls[0][1]?.body as string)
      expect(body.parent).toEqual({ type: 'page_id', page_id: TEST_PARENT_ID })
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
      mondayUrl: 'https://nexoraai.monday.com/boards/1/pulses/123',
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
  })
})
