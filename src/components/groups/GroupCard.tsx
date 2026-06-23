'use client'

import { Users, ChevronRight } from 'lucide-react'
import type { GroupWithMeta } from '@/lib/group-types'
import { ROLE_LABELS } from '@/lib/group-types'

interface GroupCardProps {
  group: GroupWithMeta
  onClick: () => void
}

export function GroupCard({ group, onClick }: GroupCardProps) {
  const initials = group.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <button
      onClick={onClick}
      className="w-full bg-surface border border-line rounded-[18px] px-4 py-4
                 flex items-center gap-4 hover:border-primary/40 hover:shadow-md
                 transition-all duration-150 active:scale-[0.99] text-left"
    >
      {/* Avatar */}
      <span className="flex-shrink-0 w-11 h-11 rounded-pill bg-secondary flex items-center justify-center">
        <span className="text-[12px] font-[800] text-white">{initials}</span>
      </span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[16px] font-bold text-ink truncate">{group.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <Users className="h-3.5 w-3.5 text-ink-3" />
          <span className="text-[13px] text-ink-2">
            {group.member_count} {group.member_count === 1 ? 'Mitglied' : 'Mitglieder'}
          </span>
          <span className="text-ink-3">·</span>
          <span
            className={`text-[11px] font-[800] uppercase tracking-[0.06em] px-2 py-0.5 rounded-pill
              ${group.my_role === 'admin' ? 'bg-primary-soft text-primary' : ''}
              ${group.my_role === 'editor' ? 'bg-secondary-soft text-secondary' : ''}
              ${group.my_role === 'observer' ? 'bg-accent-soft text-accent' : ''}
            `}
          >
            {ROLE_LABELS[group.my_role]}
          </span>
        </div>
      </div>

      <ChevronRight className="h-4 w-4 text-ink-3 flex-shrink-0" />
    </button>
  )
}
