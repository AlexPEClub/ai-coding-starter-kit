import type { createServiceRoleClient } from './supabase-server'
import { NORA_COMPANY_CONTEXT } from './nora-context'
import { fetchBizDevEntries, fetchPageContent, createLivingSpecPage, type BizDevEntry } from './notion'

const HISTORY_DAYS = 30
const HISTORY_LIMIT = 20
const NOTION_TIMEOUT_MS = 5000
const LIVING_SPEC_MAX_CHARS = 3000

type DbClient = ReturnType<typeof createServiceRoleClient>

export type { BizDevEntry }

export type HistoryEntry = {
  title: string
  category: string
  status: string
}

export type LiveContext = {
  supabaseHistory: HistoryEntry[]
  notionBizDevEntries: BizDevEntry[]
  livingSpecContent: string | null
}

function daysAgoUTC(days: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout nach ${ms}ms`)), ms)
    ),
  ])
}

async function fetchSupabaseHistory(db: DbClient): Promise<HistoryEntry[]> {
  const { data } = await db
    .from('suggestions')
    .select('title, category, status')
    .gte('report_date', daysAgoUTC(HISTORY_DAYS))
    .order('report_date', { ascending: false })
    .limit(HISTORY_LIMIT)
  return (data ?? []).map(r => ({
    title: r.title as string,
    category: r.category as string,
    status: r.status as string,
  }))
}

async function getOrCreateLivingSpecPageId(
  db: DbClient,
  apiKey: string,
  parentPageId: string
): Promise<string | null> {
  const { data: configRow } = await db
    .from('app_config')
    .select('value')
    .eq('key', 'notion_qualipilot_page_id')
    .maybeSingle()

  if (configRow?.value) return configRow.value as string

  const page = await createLivingSpecPage(apiKey, parentPageId, NORA_COMPANY_CONTEXT)
  await db.from('app_config').upsert(
    {
      key: 'notion_qualipilot_page_id',
      value: page.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  )
  return page.id
}

export async function fetchLiveContext(db: DbClient): Promise<LiveContext> {
  const supabaseHistory = await fetchSupabaseHistory(db).catch(() => [])

  const notionApiKey = process.env.NOTION_API_KEY
  const notionParentPageId = process.env.NOTION_PARENT_PAGE_ID

  if (!notionApiKey) {
    return { supabaseHistory, notionBizDevEntries: [], livingSpecContent: null }
  }

  const { data: dbConfigRow } = await db
    .from('app_config')
    .select('value')
    .eq('key', 'notion_database_id')
    .maybeSingle()
  const databaseId = dbConfigRow?.value as string | undefined

  const [bizDevResult, livingSpecResult] = await Promise.allSettled([
    databaseId
      ? withTimeout(fetchBizDevEntries(notionApiKey, databaseId, HISTORY_DAYS), NOTION_TIMEOUT_MS)
      : Promise.resolve([] as BizDevEntry[]),
    notionParentPageId
      ? withTimeout(
          getOrCreateLivingSpecPageId(db, notionApiKey, notionParentPageId).then(pageId =>
            pageId ? fetchPageContent(notionApiKey, pageId, LIVING_SPEC_MAX_CHARS) : null
          ),
          NOTION_TIMEOUT_MS
        )
      : Promise.resolve(null),
  ])

  return {
    supabaseHistory,
    notionBizDevEntries: bizDevResult.status === 'fulfilled' ? bizDevResult.value : [],
    livingSpecContent: livingSpecResult.status === 'fulfilled' ? livingSpecResult.value : null,
  }
}
