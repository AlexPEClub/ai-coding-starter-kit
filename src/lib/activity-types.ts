import type { Json } from './database.types'

export type DurationCategory = 'spontan' | 'wochenende' | 'laengerer_zeitraum'
export type ActivityStatus =
  | 'vorschlag'
  | 'zu_planen'
  | 'geplant'
  | 'in_planung'
  | 'planung_abgeschlossen'
  | 'abgeschlossen'

export const KANBAN_STATUSES = [
  'zu_planen',
  'in_planung',
  'planung_abgeschlossen',
  'abgeschlossen',
] as const satisfies ActivityStatus[]

export type KanbanStatus = (typeof KANBAN_STATUSES)[number]

export const KANBAN_COLUMN_LABELS: Record<KanbanStatus, string> = {
  zu_planen: 'Zu Planen',
  in_planung: 'In Planung',
  planung_abgeschlossen: 'Planung abgeschlossen',
  abgeschlossen: 'Abgeschlossen',
}

export interface Activity {
  id: string
  group_id: string
  initiator_id: string
  name: string
  duration_category: DurationCategory
  required_votes: number
  current_votes: number
  url: string | null
  description: string | null
  og_image_url: string | null
  location: string | null
  status: ActivityStatus
  start_date: string | null
  end_date: string | null
  created_at: string
}

export interface ActivityWithInitiator extends Activity {
  initiator: {
    id: string
    display_name: string
    avatar_url: string | null
  }
}

export interface CreateActivityInput {
  name: string
  duration_category: DurationCategory
  required_votes: number
  url?: string
  description?: string
  og_image_url?: string
}

export interface UpdateActivityInput {
  name?: string
  duration_category?: DurationCategory
  required_votes?: number
  url?: string | null
  description?: string | null
  og_image_url?: string | null
  location?: string | null
}

// PROJ-6: Activity Detail types

export interface ActivityComment {
  id: string
  activity_id: string
  user_id: string
  content: Json // Tiptap JSON
  mentioned_user_ids: string[]
  created_at: string
  author: {
    id: string
    display_name: string
    avatar_url: string | null
  }
}

export interface ActivityResponsibility {
  id: string
  activity_id: string
  label: string
  assigned_user_id: string
  created_by: string
  created_at: string
  assigned_user: {
    id: string
    display_name: string
    avatar_url: string | null
  }
}

export interface ActivityPhoto {
  id: string
  activity_id: string
  user_id: string
  storage_path: string
  created_at: string
}

export interface CreateCommentInput {
  activity_id: string
  content: Json
  mentioned_user_ids: string[]
}

export interface CreateResponsibilityInput {
  activity_id: string
  label: string
  assigned_user_id: string
}

export interface UpdateActivityDetailInput {
  name: string
  description?: string | null
  location?: string | null
  url?: string | null
}

export const DURATION_CATEGORY_LABELS: Record<DurationCategory, string> = {
  spontan: 'Spontan',
  wochenende: 'Wochenende',
  laengerer_zeitraum: 'Längerer Zeitraum',
}

export const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=640&q=80'
