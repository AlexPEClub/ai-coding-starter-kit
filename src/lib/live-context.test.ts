import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockFetchBizDevEntries = vi.hoisted(() => vi.fn())
const mockFetchPageContent = vi.hoisted(() => vi.fn())
const mockCreateLivingSpecPage = vi.hoisted(() => vi.fn())

vi.mock('./notion', () => ({
  fetchBizDevEntries: mockFetchBizDevEntries,
  fetchPageContent: mockFetchPageContent,
  createLivingSpecPage: mockCreateLivingSpecPage,
}))

vi.mock('./nora-context', () => ({
  NORA_COMPANY_CONTEXT: 'MOCK_COMPANY_CONTEXT',
}))

import { fetchLiveContext } from './live-context'

const HISTORY_ENTRY = { title: 'T1', category: 'marketing', status: 'approved' }
const BIZDEV_ENTRY = { title: 'B1', category: 'Marketing', date: '2026-06-01' }

function buildDb(overrides: Record<string, unknown> = {}) {
  return {
    from(table: string) {
      const builder: Record<string, unknown> = {
        select: () => builder,
        eq: () => builder,
        gte: () => builder,
        order: () => builder,
        limit: () => Promise.resolve(overrides[`${table}.list`] ?? { data: [] }),
        maybeSingle: () => Promise.resolve(overrides[`${table}.single`] ?? { data: null }),
        upsert: () => Promise.resolve({ error: null }),
      }
      return builder
    },
  }
}

describe('fetchLiveContext', () => {
  const ORIGINAL_ENV = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchBizDevEntries.mockResolvedValue([BIZDEV_ENTRY])
    mockFetchPageContent.mockResolvedValue('QualiPilot Living Spec Inhalt')
    mockCreateLivingSpecPage.mockResolvedValue({ id: 'new-page-id', url: 'https://notion.so/new' })
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it('gibt leere Notion-Daten zurück wenn NOTION_API_KEY fehlt', async () => {
    delete process.env.NOTION_API_KEY
    const db = buildDb({ 'suggestions.list': { data: [HISTORY_ENTRY] } }) as ReturnType<typeof buildDb>
    const result = await fetchLiveContext(db as never)
    expect(result.supabaseHistory).toHaveLength(1)
    expect(result.notionBizDevEntries).toHaveLength(0)
    expect(result.livingSpecContent).toBeNull()
    expect(mockFetchBizDevEntries).not.toHaveBeenCalled()
  })

  it('liest Supabase-Historie auch ohne Notion', async () => {
    delete process.env.NOTION_API_KEY
    const db = buildDb({
      'suggestions.list': { data: [{ title: 'T', category: 'marketing', status: 'rejected' }] },
    }) as ReturnType<typeof buildDb>
    const result = await fetchLiveContext(db as never)
    expect(result.supabaseHistory).toEqual([{ title: 'T', category: 'marketing', status: 'rejected' }])
  })

  it('liest BizDev-Einträge wenn notion_database_id in app_config', async () => {
    process.env.NOTION_API_KEY = 'test-key'
    const db = buildDb({
      'app_config.single': { data: { value: 'db-id-123' } },
    }) as ReturnType<typeof buildDb>
    const result = await fetchLiveContext(db as never)
    expect(mockFetchBizDevEntries).toHaveBeenCalledWith('test-key', 'db-id-123', 30)
    expect(result.notionBizDevEntries).toEqual([BIZDEV_ENTRY])
  })

  it('überspringt BizDev-Einträge wenn keine notion_database_id', async () => {
    process.env.NOTION_API_KEY = 'test-key'
    const db = buildDb() as ReturnType<typeof buildDb>
    const result = await fetchLiveContext(db as never)
    expect(mockFetchBizDevEntries).not.toHaveBeenCalled()
    expect(result.notionBizDevEntries).toHaveLength(0)
  })

  it('liest Living Spec wenn notion_qualipilot_page_id in app_config', async () => {
    process.env.NOTION_API_KEY = 'test-key'
    process.env.NOTION_PARENT_PAGE_ID = 'parent-id'

    let callCount = 0
    const db = {
      from() {
        return {
          select: () => this.from(),
          eq: () => this.from(),
          gte: () => this.from(),
          order: () => this.from(),
          limit: () => Promise.resolve({ data: [] }),
          maybeSingle: () => {
            callCount++
            // Call order: 1=notion_database_id (null), 2=notion_qualipilot_page_id (page-id-abc)
            if (callCount === 2) return Promise.resolve({ data: { value: 'page-id-abc' } })
            return Promise.resolve({ data: null })
          },
          upsert: () => Promise.resolve({ error: null }),
        }
      },
    }
    const result = await fetchLiveContext(db as never)
    expect(mockFetchPageContent).toHaveBeenCalledWith('test-key', 'page-id-abc', 3000)
    expect(result.livingSpecContent).toBe('QualiPilot Living Spec Inhalt')
  })

  it('erstellt Living Spec automatisch wenn noch nicht in app_config', async () => {
    process.env.NOTION_API_KEY = 'test-key'
    process.env.NOTION_PARENT_PAGE_ID = 'parent-id'
    const db = buildDb() as ReturnType<typeof buildDb>
    await fetchLiveContext(db as never)
    expect(mockCreateLivingSpecPage).toHaveBeenCalledWith('test-key', 'parent-id', 'MOCK_COMPANY_CONTEXT')
  })

  it('fällt still zurück wenn fetchBizDevEntries wirft', async () => {
    process.env.NOTION_API_KEY = 'test-key'
    mockFetchBizDevEntries.mockRejectedValue(new Error('Notion down'))
    const db = buildDb({
      'app_config.single': { data: { value: 'db-id-123' } },
    }) as ReturnType<typeof buildDb>
    const result = await fetchLiveContext(db as never)
    expect(result.notionBizDevEntries).toHaveLength(0)
  })

  it('gibt leeres supabaseHistory zurück wenn Supabase wirft', async () => {
    delete process.env.NOTION_API_KEY
    const db = {
      from() {
        return {
          select: () => this.from(),
          eq: () => this.from(),
          gte: () => this.from(),
          order: () => this.from(),
          limit: () => Promise.reject(new Error('DB down')),
          maybeSingle: () => Promise.resolve({ data: null }),
          upsert: () => Promise.resolve({ error: null }),
        }
      },
    }
    const result = await fetchLiveContext(db as never)
    expect(result.supabaseHistory).toHaveLength(0)
  })
})
