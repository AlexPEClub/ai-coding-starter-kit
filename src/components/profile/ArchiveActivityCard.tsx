'use client'

import { Badge } from '@/components/ui/badge'
import { MapPin } from 'lucide-react'
import type { ArchiveActivity } from '@/hooks/useArchive'
import { PLACEHOLDER_IMAGE } from '@/lib/activity-types'

interface ArchiveActivityCardProps {
  activity: ArchiveActivity
  onClick: () => void
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

function formatDateRange(start: string | null, end: string | null): string | null {
  if (!start && !end) return null
  const fmt = (d: string) => formatDate(d)
  if (start && end && start !== end) return `${fmt(start)} – ${fmt(end)}`
  if (start) return fmt(start)
  return null
}

export function ArchiveActivityCard({ activity, onClick }: ArchiveActivityCardProps) {
  const dateRange = formatDateRange(activity.start_date, activity.end_date)
  const archivedAt = formatDate(activity.created_at)

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-surface border border-line rounded-[18px] overflow-hidden hover:border-primary/30 transition-colors active:scale-[0.99]"
    >
      {/* Cover image */}
      <div className="relative h-[110px] w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activity.og_image_url ?? PLACEHOLDER_IMAGE}
          alt=""
          aria-hidden
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute top-2.5 left-2.5">
          <Badge className="bg-black/50 text-white text-[10px] font-[700] border-0 px-2 py-0.5 rounded-pill backdrop-blur-sm">
            {activity.group_name}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="px-3.5 py-3">
        <p className="text-[14.5px] font-[800] text-ink leading-snug line-clamp-1">
          {activity.name}
        </p>
        <div className="mt-1 flex items-center gap-3 flex-wrap">
          {dateRange ? (
            <span className="text-[12px] text-secondary font-[600]">{dateRange}</span>
          ) : (
            <span className="text-[12px] text-ink-3">{archivedAt}</span>
          )}
          {activity.location && (
            <span className="flex items-center gap-1 text-[11.5px] text-ink-3">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate max-w-[140px]">{activity.location}</span>
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
