'use client'

import { KanbanBoard } from '@/components/groups/KanbanBoard'
import { useAuth } from '@/contexts/AuthContext'
import { useGroupShell } from '@/components/groups/GroupShellContext'

export default function PlanungPage() {
  const { user } = useAuth()
  const { groupId, isAdmin, openActivityDetail } = useGroupShell()

  return (
    <div className="flex-1 min-h-0">
      <div className="max-w-5xl mx-auto w-full h-full px-4 py-4">
        <KanbanBoard
          groupId={groupId}
          currentUserId={user?.id ?? ''}
          isAdmin={isAdmin}
          onOpenDetail={(a) => openActivityDetail(a.id)}
        />
      </div>
    </div>
  )
}
