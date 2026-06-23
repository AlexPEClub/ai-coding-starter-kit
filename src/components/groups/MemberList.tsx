'use client'

import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { MemberRow } from './MemberRow'
import type { GroupMember, GroupRole } from '@/lib/group-types'

interface MemberListProps {
  members: GroupMember[]
  currentUserId: string
  isCurrentUserAdmin: boolean
  loading: boolean
  onChangeRole: (userId: string, role: GroupRole) => Promise<{ error: string | null }>
  onRemove: (userId: string) => Promise<{ error: string | null }>
}

const ROLE_ORDER: GroupRole[] = ['admin', 'editor', 'observer']

export function MemberList({
  members,
  currentUserId,
  isCurrentUserAdmin,
  loading,
  onChangeRole,
  onRemove,
}: MemberListProps) {
  const sorted = [...members].sort(
    (a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role)
  )

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 py-2.5 px-1">
            <Skeleton className="h-9 w-9 rounded-full bg-surface-2" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32 bg-surface-2" />
              <Skeleton className="h-3.5 w-16 bg-surface-2 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (members.length === 0) {
    return (
      <p className="text-[14px] text-ink-3 text-center py-6">Keine Mitglieder gefunden.</p>
    )
  }

  return (
    <div>
      <span className="text-[11px] font-[800] uppercase tracking-[0.1em] text-ink-3 block mb-1 px-1">
        Mitglieder ({members.length})
      </span>
      <div>
        {sorted.map((member, i) => (
          <div key={member.user_id}>
            <MemberRow
              member={member}
              isCurrentUser={member.user_id === currentUserId}
              isAdmin={member.role === 'admin'}
              isCurrentUserAdmin={isCurrentUserAdmin}
              onChangeRole={onChangeRole}
              onRemove={onRemove}
            />
            {i < sorted.length - 1 && <Separator className="bg-line/60 mx-1" />}
          </div>
        ))}
      </div>
    </div>
  )
}
