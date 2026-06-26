const MONDAY_API_URL = 'https://api.monday.com/v2'
const BOARD_NAME = 'NORA BizDev'

export const CATEGORY_TO_GROUP: Record<string, string> = {
  marketing: 'Marketing',
  product: 'Produkt',
  operations: 'Operations',
}

export type MondayGroup = { id: string; title: string }

type GqlResponse<T> = { data?: T; errors?: Array<{ message: string }> }

async function gql<T>(
  apiKey: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(MONDAY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: apiKey,
      'API-Version': '2024-01',
    },
    body: JSON.stringify({ query, variables }),
  })

  if (res.status === 429) {
    throw new Error('Monday.com kurz überlastet — bitte in einer Minute erneut versuchen.')
  }
  if (!res.ok) {
    throw new Error(`Monday.com nicht erreichbar (HTTP ${res.status}).`)
  }

  const json = (await res.json()) as GqlResponse<T>
  if (json.errors?.length) {
    throw new Error(`Monday.com: ${json.errors[0].message}`)
  }
  return json.data as T
}

export async function fetchBoard(
  apiKey: string,
  boardId: string
): Promise<{ id: string; groups: MondayGroup[] } | null> {
  const data = await gql<{ boards: Array<{ id: string; groups: MondayGroup[] }> }>(
    apiKey,
    `query ($ids: [ID!]!) {
      boards(ids: $ids) {
        id
        groups { id title }
      }
    }`,
    { ids: [boardId] }
  )
  return data.boards[0] ?? null
}

export async function createNoraBizDevBoard(
  apiKey: string
): Promise<{ id: string; groups: MondayGroup[] }> {
  const boardData = await gql<{ create_board: { id: string } }>(
    apiKey,
    `mutation ($name: String!) {
      create_board(board_name: $name, board_kind: private) {
        id
      }
    }`,
    { name: BOARD_NAME }
  )
  const boardId = boardData.create_board.id

  const groups: MondayGroup[] = []
  for (const groupName of Object.values(CATEGORY_TO_GROUP)) {
    const groupData = await gql<{ create_group: MondayGroup }>(
      apiKey,
      `mutation ($boardId: ID!, $name: String!) {
        create_group(board_id: $boardId, group_name: $name) {
          id
          title
        }
      }`,
      { boardId, name: groupName }
    )
    groups.push(groupData.create_group)
  }

  return { id: boardId, groups }
}

export async function ensureGroup(
  apiKey: string,
  boardId: string,
  existingGroups: MondayGroup[],
  category: string
): Promise<string> {
  const targetTitle = CATEGORY_TO_GROUP[category] ?? category
  const found = existingGroups.find(g => g.title.toLowerCase() === targetTitle.toLowerCase())
  if (found) return found.id

  const data = await gql<{ create_group: { id: string } }>(
    apiKey,
    `mutation ($boardId: ID!, $name: String!) {
      create_group(board_id: $boardId, group_name: $name) {
        id
      }
    }`,
    { boardId, name: targetTitle }
  )
  return data.create_group.id
}

export async function createTask(
  apiKey: string,
  boardId: string,
  groupId: string,
  title: string
): Promise<{ id: string; url: string }> {
  const data = await gql<{ create_item: { id: string; url: string } }>(
    apiKey,
    `mutation ($boardId: ID!, $groupId: String!, $name: String!) {
      create_item(board_id: $boardId, group_id: $groupId, item_name: $name) {
        id
        url
      }
    }`,
    { boardId, groupId, name: title.slice(0, 255) }
  )
  return data.create_item
}

export async function addUpdate(
  apiKey: string,
  itemId: string,
  body: string,
  insight: string | null,
  source: string | null
): Promise<void> {
  const parts = [body]
  if (insight) parts.push(`\n💡 Insight:\n${insight}`)
  if (source) parts.push(`\n📎 Quelle:\n${source}`)

  await gql(
    apiKey,
    `mutation ($itemId: ID!, $body: String!) {
      create_update(item_id: $itemId, body: $body) {
        id
      }
    }`,
    { itemId, body: parts.join('\n') }
  )
}
