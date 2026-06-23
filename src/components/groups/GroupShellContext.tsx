'use client'

import { createContext, useContext } from 'react'
import type { Group, GroupRole } from '@/lib/group-types'

export interface GroupShell {
  groupId: string
  group: Group | null
  myRole: GroupRole | null
  isAdmin: boolean
  canCreate: boolean
  memberCount: number
  loading: boolean
  /** Open the shared activity detail sheet (rendered once in the group layout). */
  openActivityDetail: (activityId: string) => void
  /** Re-fetch the group + member data held by the layout. */
  refetchGroup: () => void
}

const GroupShellCtx = createContext<GroupShell | null>(null)

export const GroupShellProvider = GroupShellCtx.Provider

export function useGroupShell(): GroupShell {
  const value = useContext(GroupShellCtx)
  if (!value) {
    throw new Error('useGroupShell must be used within a group layout')
  }
  return value
}
