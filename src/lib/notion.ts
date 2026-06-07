const NOTION_API_URL = 'https://api.notion.com/v1'
const DB_NAME = 'NORA BizDev'

export const CATEGORY_TO_NOTION: Record<string, string> = {
  marketing: 'Marketing',
  product: 'Produkt',
  operations: 'Operations',
}

/**
 * Normalisiert eine Notion-Page-/Database-ID. Akzeptiert:
 * - rohe 32-stellige Hex-ID (`32a3c7c0...`)
 * - gestrichelte UUID (`32a3c7c0-25d9-...`)
 * - volle Notion-URL (`https://www.notion.so/Titel-32a3c7c0...?v=...`)
 * Gibt die als UUID formatierte ID zurück (8-4-4-4-12).
 * Bei unerwartetem Format wird der Originalwert zurückgegeben (Notion validiert dann).
 */
export function normalizeNotionId(input: string): string {
  const withoutQuery = input.split(/[?#]/)[0]
  const lastSegment = withoutQuery.split('/').pop() ?? ''
  // Notion trennt Slug und ID mit einem Bindestrich; die ID sind die letzten 32 Hex-Zeichen.
  const raw = lastSegment.replace(/-/g, '').slice(-32)
  if (!/^[0-9a-fA-F]{32}$/.test(raw)) return input
  return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}-${raw.slice(16, 20)}-${raw.slice(20)}`
}

function notionHeaders(apiKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
    'Notion-Version': '2022-06-28',
  }
}

async function handleError(res: Response): Promise<never> {
  if (res.status === 429) throw new Error('Monday-Task erstellt — Notion kurz überlastet.')
  if (res.status === 403) throw new Error('Notion Zugriff verweigert — Integration zur Parent-Seite hinzufügen.')
  const json = await res.json().catch(() => ({})) as { message?: string }
  throw new Error(`Notion: ${json.message ?? `HTTP ${res.status}`}`)
}

async function notionPost<T>(apiKey: string, path: string, body: unknown): Promise<T> {
  const res = await fetch(`${NOTION_API_URL}${path}`, {
    method: 'POST',
    headers: notionHeaders(apiKey),
    body: JSON.stringify(body),
  })
  if (!res.ok) await handleError(res)
  return res.json() as Promise<T>
}

export async function fetchDatabase(
  apiKey: string,
  databaseId: string
): Promise<{ id: string } | null> {
  const res = await fetch(`${NOTION_API_URL}/databases/${databaseId}`, {
    headers: notionHeaders(apiKey),
  })
  if (res.status === 404) return null
  if (!res.ok) await handleError(res)
  const data = await res.json() as { id: string; object: string }
  return data.object === 'database' ? { id: data.id } : null
}

export async function createNoraBizDevDatabase(
  apiKey: string,
  parentPageId: string
): Promise<{ id: string }> {
  const data = await notionPost<{ id: string }>(apiKey, '/databases', {
    parent: { type: 'page_id', page_id: normalizeNotionId(parentPageId) },
    title: [{ type: 'text', text: { content: DB_NAME } }],
    properties: {
      Name: { title: {} },
      Kategorie: {
        select: {
          options: [
            { name: 'Marketing', color: 'blue' },
            { name: 'Produkt', color: 'green' },
            { name: 'Operations', color: 'orange' },
          ],
        },
      },
      Datum: { date: {} },
      'Monday-Task-Link': { url: {} },
    },
  })
  return { id: data.id }
}

export type ElaboratedSection = {
  heading: string
  content: string
}

export type CreatePageParams = {
  title: string
  category: string
  mondayUrl: string | null
  body: string
  insight: string | null
  source: string | null
  elaboratedSections?: ElaboratedSection[]
}

function richText(content: string) {
  return [{ type: 'text', text: { content } }]
}

function paragraphBlock(content: string) {
  return { object: 'block', type: 'paragraph', paragraph: { rich_text: richText(content) } }
}

function heading2Block(content: string) {
  return { object: 'block', type: 'heading_2', heading_2: { rich_text: richText(content) } }
}

function heading3Block(content: string) {
  return { object: 'block', type: 'heading_3', heading_3: { rich_text: richText(content) } }
}

// Split content into paragraph blocks; chunks long text to stay within Notion's 2000-char limit.
function contentToBlocks(content: string): unknown[] {
  const paragraphs = content.split(/\n\n+/).map(p => p.trim()).filter(Boolean)
  if (paragraphs.length === 0) return [paragraphBlock(content.slice(0, 2000))]
  return paragraphs.flatMap(p => {
    if (p.length <= 2000) return [paragraphBlock(p)]
    const chunks: unknown[] = []
    for (let i = 0; i < p.length; i += 2000) chunks.push(paragraphBlock(p.slice(i, i + 2000)))
    return chunks
  })
}

function elaboratedSectionsToBlocks(sections: ElaboratedSection[]): unknown[] {
  return sections.flatMap(s => [
    heading2Block(s.heading.slice(0, 2000)),
    ...contentToBlocks(s.content),
  ])
}

async function notionPatch<T>(apiKey: string, path: string, body: unknown): Promise<T> {
  const res = await fetch(`${NOTION_API_URL}${path}`, {
    method: 'PATCH',
    headers: notionHeaders(apiKey),
    body: JSON.stringify(body),
  })
  if (!res.ok) await handleError(res)
  return res.json() as Promise<T>
}

// Appends blocks to an existing page in batches (Notion limit: 100 per request).
async function appendBlocksToPage(apiKey: string, pageId: string, blocks: unknown[]): Promise<void> {
  for (let i = 0; i < blocks.length; i += 100) {
    await notionPatch(apiKey, `/blocks/${pageId}/children`, { children: blocks.slice(i, i + 100) })
  }
}

export async function createPage(
  apiKey: string,
  databaseId: string,
  { title, category, mondayUrl, body, insight, source, elaboratedSections }: CreatePageParams
): Promise<{ id: string; url: string }> {
  const today = new Date().toISOString().split('T')[0]
  const categoryName = CATEGORY_TO_NOTION[category] ?? category

  const properties: Record<string, unknown> = {
    Name: { title: richText(title.slice(0, 2000)) },
    Kategorie: { select: { name: categoryName } },
    Datum: { date: { start: today } },
  }
  if (mondayUrl) {
    properties['Monday-Task-Link'] = { url: mondayUrl }
  }

  let allBlocks: unknown[]
  if (elaboratedSections && elaboratedSections.length > 0) {
    const richBlocks = elaboratedSectionsToBlocks(elaboratedSections)
    const referenceBlocks: unknown[] = []
    if (insight) {
      referenceBlocks.push(heading3Block('💡 Insight'))
      referenceBlocks.push(paragraphBlock(insight))
    }
    if (source) {
      referenceBlocks.push(heading3Block('📎 Quelle'))
      referenceBlocks.push(paragraphBlock(source))
    }
    allBlocks = [...richBlocks, ...referenceBlocks]
  } else {
    allBlocks = [paragraphBlock(body)]
    if (insight) {
      allBlocks.push(heading3Block('💡 Insight'))
      allBlocks.push(paragraphBlock(insight))
    }
    if (source) {
      allBlocks.push(heading3Block('📎 Quelle'))
      allBlocks.push(paragraphBlock(source))
    }
  }

  const data = await notionPost<{ id: string; url: string }>(apiKey, '/pages', {
    parent: { type: 'database_id', database_id: databaseId },
    properties,
    children: allBlocks.slice(0, 100),
  })

  if (allBlocks.length > 100) {
    await appendBlocksToPage(apiKey, data.id, allBlocks.slice(100))
  }

  return { id: data.id, url: data.url }
}
