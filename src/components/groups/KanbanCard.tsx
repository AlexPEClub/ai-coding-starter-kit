'use client'

import { MoreHorizontal, ArrowRight, CheckCircle, CheckCheck } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ActivityWithInitiator } from '@/lib/activity-types'
import { PLACEHOLDER_IMAGE } from '@/lib/activity-types'

interface KanbanCardProps {
  activity: ActivityWithInitiator
  currentUserId: string
  isAdmin: boolean
  onMoveToPlanning: (activity: ActivityWithInitiator) => void
  onConfirmFinishPlanning: (activity: ActivityWithInitiator) => void
  onConfirmComplete: (activity: ActivityWithInitiator) => void
  onOpenDetail?: (activity: ActivityWithInitiator) => void
  /** Drag-and-drop (desktop only). When provided and the card is manageable,
   *  the card becomes draggable to advance it to the next column. */
  onDragStartActivity?: (activity: ActivityWithInitiator) => void
  onDragEndActivity?: () => void
  isDragging?: boolean
}

function formatDateRange(start: string | null, end: string | null): string | null {
  if (!start && !end) return null
  const fmt = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
  if (start && end) return `${fmt(start)} – ${fmt(end)}`
  if (start) return `Ab ${fmt(start)}`
  return null
}

export function KanbanCard({
  activity,
  currentUserId,
  isAdmin,
  onMoveToPlanning,
  onConfirmFinishPlanning,
  onConfirmComplete,
  onOpenDetail,
  onDragStartActivity,
  onDragEndActivity,
  isDragging = false,
}: KanbanCardProps) {
  const canManage = activity.status !== 'abgeschlossen' && (isAdmin || activity.initiator_id === currentUserId)
  const coverSrc = activity.og_image_url || PLACEHOLDER_IMAGE
  const dateRange = formatDateRange(activity.start_date, activity.end_date)
  const draggable = canManage && !!onDragStartActivity

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', activity.id)
        onDragStartActivity?.(activity)
      }}
      onDragEnd={() => onDragEndActivity?.()}
      className={`bg-surface border border-line rounded-[18px] overflow-hidden shadow-sm cursor-pointer active:scale-[0.99] transition-transform
        ${draggable ? 'md:cursor-grab md:active:cursor-grabbing' : ''}
        ${isDragging ? 'opacity-40' : ''}`}
      onClick={() => onOpenDetail?.(activity)}
    >
      {/* Cover image */}
      <div className="relative w-full h-[100px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverSrc}
          alt=""
          aria-hidden
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Action menu — top right corner over image */}
        {canManage && (
          <div className="absolute top-2 right-2" onClick={e => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="h-7 w-7 rounded-[8px] flex items-center justify-center
                             bg-black/40 text-white hover:bg-black/60 transition-colors backdrop-blur-sm"
                  aria-label="Aktionen"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-52 bg-surface border-line rounded-[12px]"
              >
                {activity.status === 'zu_planen' && (
                  <DropdownMenuItem
                    onClick={() => onMoveToPlanning(activity)}
                    className="text-[14px] gap-2 cursor-pointer rounded-[8px]"
                  >
                    <ArrowRight className="h-4 w-4 text-ink-2" />
                    Termin finden
                  </DropdownMenuItem>
                )}
                {activity.status === 'in_planung' && (
                  <DropdownMenuItem
                    onClick={() => onConfirmFinishPlanning(activity)}
                    className="text-[14px] gap-2 cursor-pointer rounded-[8px]"
                  >
                    <CheckCircle className="h-4 w-4 text-ink-2" />
                    Planung abschließen
                  </DropdownMenuItem>
                )}
                {activity.status === 'planung_abgeschlossen' && (
                  <DropdownMenuItem
                    onClick={() => onConfirmComplete(activity)}
                    className="text-[14px] gap-2 cursor-pointer rounded-[8px]"
                  >
                    <CheckCheck className="h-4 w-4 text-ink-2" />
                    Als abgeschlossen markieren
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-3 py-2.5 flex flex-col gap-1">
        <p className="text-[14px] font-[700] text-ink leading-snug line-clamp-2">
          {activity.name}
        </p>
        <p className="text-[12px] text-ink-3 truncate">
          {activity.initiator.display_name}
        </p>
        {dateRange && (
          <p className="text-[11.5px] font-[600] text-secondary truncate">
            {dateRange}
          </p>
        )}
      </div>
    </div>
  )
}
