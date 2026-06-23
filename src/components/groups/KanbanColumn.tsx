'use client'

import { useState } from 'react'
import { KanbanCard } from './KanbanCard'
import type { ActivityWithInitiator } from '@/lib/activity-types'
import type { KanbanStatus } from '@/lib/activity-types'
import { KANBAN_STATUSES, KANBAN_COLUMN_LABELS } from '@/lib/activity-types'

interface KanbanColumnProps {
  status: KanbanStatus
  activities: ActivityWithInitiator[]
  currentUserId: string
  isAdmin: boolean
  onMoveToPlanning: (activity: ActivityWithInitiator) => void
  onConfirmFinishPlanning: (activity: ActivityWithInitiator) => void
  onConfirmComplete: (activity: ActivityWithInitiator) => void
  onOpenDetail?: (activity: ActivityWithInitiator) => void
  /** Drag-and-drop wiring (desktop). When omitted, the column is static. */
  onDropActivity?: (targetStatus: KanbanStatus) => void
  onDragStartActivity?: (activity: ActivityWithInitiator) => void
  onDragEndActivity?: () => void
  draggingId?: string | null
  draggingStatus?: KanbanStatus | null
}

export function KanbanColumn({
  status,
  activities,
  currentUserId,
  isAdmin,
  onMoveToPlanning,
  onConfirmFinishPlanning,
  onConfirmComplete,
  onOpenDetail,
  onDropActivity,
  onDragStartActivity,
  onDragEndActivity,
  draggingId,
  draggingStatus,
}: KanbanColumnProps) {
  const [isOver, setIsOver] = useState(false)

  // A drop is valid only as a single forward step (mirrors the action buttons).
  const canDrop =
    !!onDropActivity &&
    draggingStatus != null &&
    KANBAN_STATUSES.indexOf(status) === KANBAN_STATUSES.indexOf(draggingStatus) + 1

  return (
    <div
      className={`flex flex-col min-h-0 rounded-[14px] transition-colors
        ${canDrop && isOver ? 'bg-primary-soft ring-2 ring-primary/40' : ''}`}
      onDragOver={(e) => {
        if (!onDropActivity || !draggingStatus) return
        e.preventDefault()
        e.dataTransfer.dropEffect = canDrop ? 'move' : 'none'
        if (canDrop) setIsOver(true)
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        if (!onDropActivity) return
        e.preventDefault()
        setIsOver(false)
        onDropActivity(status)
      }}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 flex-shrink-0 px-1 pt-1">
        <h3 className="text-[13px] font-[800] text-ink uppercase tracking-[0.06em]">
          {KANBAN_COLUMN_LABELS[status]}
        </h3>
        <span className="text-[12px] font-[700] text-ink-3 tabular-nums">
          {activities.length}
        </span>
      </div>

      {/* Cards or empty state */}
      {activities.length === 0 ? (
        <div className="flex-1 rounded-[14px] border border-dashed border-line bg-surface-2 flex items-center justify-center py-8 px-4">
          <p className="text-[13px] text-ink-3 text-center leading-snug">
            {canDrop ? 'Hier ablegen' : 'Noch keine Aktivitäten hier'}
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 px-1 pb-1">
          {activities.map((activity) => (
            <KanbanCard
              key={activity.id}
              activity={activity}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onMoveToPlanning={onMoveToPlanning}
              onConfirmFinishPlanning={onConfirmFinishPlanning}
              onConfirmComplete={onConfirmComplete}
              onOpenDetail={onOpenDetail}
              onDragStartActivity={onDragStartActivity}
              onDragEndActivity={onDragEndActivity}
              isDragging={draggingId === activity.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
