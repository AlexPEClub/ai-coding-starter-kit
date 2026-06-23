export type GroupRole = 'admin' | 'editor' | 'observer'

// 6-char alphanumeric, excluding O/0/I/1 to avoid visual confusion
const INVITE_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateInviteCode(): string {
  return Array.from({ length: 6 }, () =>
    INVITE_CODE_CHARS[Math.floor(Math.random() * INVITE_CODE_CHARS.length)]
  ).join('')
}

export const ROLE_LABELS: Record<GroupRole, string> = {
  admin: 'Admin',
  editor: 'Redakteur',
  observer: 'Beobachter',
}

export interface Group {
  id: string
  name: string
  invite_code: string | null
  created_by: string
  created_at: string
}

export interface GroupMember {
  group_id: string
  user_id: string
  role: GroupRole
  joined_at: string
  profile: {
    id: string
    display_name: string
    avatar_url: string | null
  }
}

export interface GroupWithMeta extends Group {
  member_count: number
  my_role: GroupRole
}
