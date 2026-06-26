import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  fetchBoard,
  createNoraBizDevBoard,
  ensureGroup,
  createTask,
  addUpdate,
  CATEGORY_TO_GROUP,
  type MondayGroup,
} from './monday'

const TEST_KEY = 'test-api-key'
const TEST_BOARD_ID = '123456789'
const TEST_GROUP_ID = 'group_abc'
const TEST_ITEM_ID = '987654321'
const TEST_ITEM_URL = 'https://kordixai.monday.com/boards/123456789/pulses/987654321'

function mockFetch(response: unknown, status = 200) {
  return vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(response),
  } as Response)
}

describe('monday.ts — API Client', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => vi.restoreAllMocks())

  describe('gql error handling', () => {
    it('wirft bei HTTP 429 die Überlastungs-Fehlermeldung', async () => {
      mockFetch({}, 429)
      await expect(fetchBoard(TEST_KEY, TEST_BOARD_ID)).rejects.toThrow('kurz überlastet')
    })

    it('wirft bei HTTP 5xx eine generische Fehlermeldung', async () => {
      mockFetch({}, 503)
      await expect(fetchBoard(TEST_KEY, TEST_BOARD_ID)).rejects.toThrow('HTTP 503')
    })

    it('wirft bei GraphQL-Fehlern die Fehlermeldung aus der Antwort', async () => {
      mockFetch({ data: null, errors: [{ message: 'Not authorized' }] })
      await expect(fetchBoard(TEST_KEY, TEST_BOARD_ID)).rejects.toThrow('Not authorized')
    })

    it('sendet Authorization-Header ohne Bearer-Prefix', async () => {
      const spy = mockFetch({ data: { boards: [] } })
      await fetchBoard(TEST_KEY, TEST_BOARD_ID)
      const callArgs = spy.mock.calls[0]
      const headers = callArgs[1]?.headers as Record<string, string>
      expect(headers['Authorization']).toBe(TEST_KEY)
      expect(headers['Authorization']).not.toContain('Bearer')
    })

    it('sendet API-Version-Header', async () => {
      const spy = mockFetch({ data: { boards: [] } })
      await fetchBoard(TEST_KEY, TEST_BOARD_ID)
      const headers = spy.mock.calls[0][1]?.headers as Record<string, string>
      expect(headers['API-Version']).toBeDefined()
    })
  })

  describe('fetchBoard', () => {
    it('gibt das Board zurück wenn es existiert', async () => {
      const groups: MondayGroup[] = [{ id: TEST_GROUP_ID, title: 'Marketing' }]
      mockFetch({ data: { boards: [{ id: TEST_BOARD_ID, groups }] } })
      const result = await fetchBoard(TEST_KEY, TEST_BOARD_ID)
      expect(result).toEqual({ id: TEST_BOARD_ID, groups })
    })

    it('gibt null zurück wenn das Board nicht existiert (gelöscht)', async () => {
      mockFetch({ data: { boards: [] } })
      const result = await fetchBoard(TEST_KEY, TEST_BOARD_ID)
      expect(result).toBeNull()
    })

    it('übergibt Board-ID als GraphQL-Variable', async () => {
      const spy = mockFetch({ data: { boards: [] } })
      await fetchBoard(TEST_KEY, TEST_BOARD_ID)
      const body = JSON.parse(spy.mock.calls[0][1]?.body as string)
      expect(body.variables).toEqual({ ids: [TEST_BOARD_ID] })
    })
  })

  describe('createNoraBizDevBoard', () => {
    it('erstellt Board und alle drei Gruppen', async () => {
      const spy = vi.spyOn(global, 'fetch')
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ data: { create_board: { id: TEST_BOARD_ID } } }) } as Response)
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ data: { create_group: { id: 'g1', title: 'Marketing' } } }) } as Response)
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ data: { create_group: { id: 'g2', title: 'Produkt' } } }) } as Response)
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ data: { create_group: { id: 'g3', title: 'Operations' } } }) } as Response)

      const result = await createNoraBizDevBoard(TEST_KEY)
      expect(result.id).toBe(TEST_BOARD_ID)
      expect(result.groups).toHaveLength(3)
      expect(result.groups.map(g => g.title)).toEqual(['Marketing', 'Produkt', 'Operations'])
      // 1 board creation + 3 group creations = 4 API calls
      expect(spy).toHaveBeenCalledTimes(4)
    })
  })

  describe('ensureGroup', () => {
    const existingGroups: MondayGroup[] = [
      { id: 'g1', title: 'Marketing' },
      { id: 'g2', title: 'Produkt' },
    ]

    it('gibt die ID der vorhandenen Gruppe zurück ohne API-Aufruf', async () => {
      const spy = vi.spyOn(global, 'fetch')
      const result = await ensureGroup(TEST_KEY, TEST_BOARD_ID, existingGroups, 'marketing')
      expect(result).toBe('g1')
      expect(spy).not.toHaveBeenCalled()
    })

    it('ist case-insensitiv beim Gruppenvergleich', async () => {
      const spy = vi.spyOn(global, 'fetch')
      const result = await ensureGroup(TEST_KEY, TEST_BOARD_ID, [{ id: 'g1', title: 'MARKETING' }], 'marketing')
      expect(result).toBe('g1')
      expect(spy).not.toHaveBeenCalled()
    })

    it('erstellt fehlende Gruppe per API', async () => {
      mockFetch({ data: { create_group: { id: 'g3' } } })
      const result = await ensureGroup(TEST_KEY, TEST_BOARD_ID, existingGroups, 'operations')
      expect(result).toBe('g3')
    })

    it('verwendet den deutschen Gruppennamen aus CATEGORY_TO_GROUP', async () => {
      const spy = mockFetch({ data: { create_group: { id: 'g3' } } })
      await ensureGroup(TEST_KEY, TEST_BOARD_ID, [], 'operations')
      const body = JSON.parse(spy.mock.calls[0][1]?.body as string)
      expect(body.variables.name).toBe('Operations')
    })

    it('kennt alle drei Kategorien aus CATEGORY_TO_GROUP', () => {
      expect(CATEGORY_TO_GROUP['marketing']).toBe('Marketing')
      expect(CATEGORY_TO_GROUP['product']).toBe('Produkt')
      expect(CATEGORY_TO_GROUP['operations']).toBe('Operations')
    })
  })

  describe('createTask', () => {
    it('gibt Item-ID und URL zurück', async () => {
      mockFetch({ data: { create_item: { id: TEST_ITEM_ID, url: TEST_ITEM_URL } } })
      const result = await createTask(TEST_KEY, TEST_BOARD_ID, TEST_GROUP_ID, 'Testtitel')
      expect(result).toEqual({ id: TEST_ITEM_ID, url: TEST_ITEM_URL })
    })

    it('kürzt Titel auf 255 Zeichen', async () => {
      const spy = mockFetch({ data: { create_item: { id: TEST_ITEM_ID, url: TEST_ITEM_URL } } })
      const longTitle = 'A'.repeat(300)
      await createTask(TEST_KEY, TEST_BOARD_ID, TEST_GROUP_ID, longTitle)
      const body = JSON.parse(spy.mock.calls[0][1]?.body as string)
      expect(body.variables.name.length).toBe(255)
    })

    it('übergibt boardId, groupId und name als Variablen', async () => {
      const spy = mockFetch({ data: { create_item: { id: TEST_ITEM_ID, url: TEST_ITEM_URL } } })
      await createTask(TEST_KEY, TEST_BOARD_ID, TEST_GROUP_ID, 'Titel')
      const body = JSON.parse(spy.mock.calls[0][1]?.body as string)
      expect(body.variables).toMatchObject({
        boardId: TEST_BOARD_ID,
        groupId: TEST_GROUP_ID,
        name: 'Titel',
      })
    })
  })

  describe('addUpdate', () => {
    it('formatiert Body + Insight + Quelle korrekt', async () => {
      const spy = mockFetch({ data: { create_update: { id: 'upd1' } } })
      await addUpdate(TEST_KEY, TEST_ITEM_ID, 'Der Body', 'Der Insight', 'Die Quelle')
      const body = JSON.parse(spy.mock.calls[0][1]?.body as string)
      expect(body.variables.body).toContain('Der Body')
      expect(body.variables.body).toContain('💡 Insight:')
      expect(body.variables.body).toContain('Der Insight')
      expect(body.variables.body).toContain('📎 Quelle:')
      expect(body.variables.body).toContain('Die Quelle')
    })

    it('lässt Insight-Abschnitt weg wenn null', async () => {
      const spy = mockFetch({ data: { create_update: { id: 'upd1' } } })
      await addUpdate(TEST_KEY, TEST_ITEM_ID, 'Der Body', null, 'Die Quelle')
      const body = JSON.parse(spy.mock.calls[0][1]?.body as string)
      expect(body.variables.body).not.toContain('💡')
      expect(body.variables.body).toContain('📎 Quelle:')
    })

    it('lässt Quellen-Abschnitt weg wenn null', async () => {
      const spy = mockFetch({ data: { create_update: { id: 'upd1' } } })
      await addUpdate(TEST_KEY, TEST_ITEM_ID, 'Der Body', 'Der Insight', null)
      const body = JSON.parse(spy.mock.calls[0][1]?.body as string)
      expect(body.variables.body).toContain('💡 Insight:')
      expect(body.variables.body).not.toContain('📎')
    })

    it('enthält nur Body wenn Insight und Quelle null sind', async () => {
      const spy = mockFetch({ data: { create_update: { id: 'upd1' } } })
      await addUpdate(TEST_KEY, TEST_ITEM_ID, 'Nur Body', null, null)
      const body = JSON.parse(spy.mock.calls[0][1]?.body as string)
      expect(body.variables.body).toBe('Nur Body')
    })
  })
})
