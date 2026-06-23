'use client'

import { useEffect, useState } from 'react'
import { Heart, MoreHorizontal, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ActivityWithInitiator } from '@/lib/activity-types'
import { DURATION_CATEGORY_LABELS, PLACEHOLDER_IMAGE } from '@/lib/activity-types'

interface ProposalCardProps {
  proposal: ActivityWithInitiator
  hasVoted: boolean
  isPending: boolean
  currentUserId: string
  isAdmin: boolean
  onVote: (
    activityId: string,
    currentlyVoted: boolean,
    onOptimisticUpdate: (id: string, voted: boolean) => void
  ) => void
  onEdit: (proposal: ActivityWithInitiator) => void
  onDelete: (proposal: ActivityWithInitiator) => void
  onReset: (proposal: ActivityWithInitiator) => void
  onOpenDetail?: (proposal: ActivityWithInitiator) => void
}

export function ProposalCard({
  proposal,
  hasVoted,
  isPending,
  currentUserId,
  isAdmin,
  onVote,
  onEdit,
  onDelete,
  onReset,
  onOpenDetail,
}: ProposalCardProps) {
  const [displayVoted, setDisplayVoted] = useState(hasVoted)
  const [displayVotes, setDisplayVotes] = useState(proposal.current_votes)

  // Sync with server state after realtime refetch
  useEffect(() => {
    setDisplayVoted(hasVoted)
    setDisplayVotes(proposal.current_votes)
  }, [hasVoted, proposal.current_votes])

  const progress = Math.min(displayVotes / proposal.required_votes, 1)
  const isInitiator = proposal.initiator_id === currentUserId
  const canManage = isInitiator || isAdmin
  const coverSrc = proposal.og_image_url || PLACEHOLDER_IMAGE

  function handleVote() {
    if (isPending) return
    const baseVoted = displayVoted
    const baseVotes = displayVotes

    onVote(proposal.id, baseVoted, (_id, newVoted) => {
      setDisplayVoted(newVoted)
      if (newVoted && !baseVoted) setDisplayVotes(baseVotes + 1)
      else if (!newVoted && baseVoted) setDisplayVotes(baseVotes - 1)
      else setDisplayVotes(baseVotes)
    })
  }

  return (
    <div
      className="bg-surface border border-line rounded-[18px] overflow-hidden shadow-sm flex items-stretch gap-0 cursor-pointer active:scale-[0.99] transition-transform"
      onClick={() => onOpenDetail?.(proposal)}
    >
      {/* Cover image */}
      <div className="w-[72px] flex-shrink-0 relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverSrc}
          alt=""
          aria-hidden
          className="w-full h-full object-cover"
        />
        {/* gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0 px-3 py-3 flex flex-col justify-between gap-2">
        {/* Top row: name + actions */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-[14.5px] font-[700] text-ink leading-snug line-clamp-2 flex-1 min-w-0">
            {proposal.name}
          </p>

          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={e => e.stopPropagation()}
                  className="flex-shrink-0 h-7 w-7 rounded-[8px] flex items-center justify-center
                             text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
                  aria-label="Aktionen"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-surface border-line rounded-[12px]"
              >
                <DropdownMenuItem
                  onClick={() => onEdit(proposal)}
                  className="text-[14px] gap-2 cursor-pointer rounded-[8px]"
                >
                  <Pencil className="h-4 w-4 text-ink-2" />
                  Bearbeiten
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onReset(proposal)}
                  className="text-[14px] gap-2 cursor-pointer rounded-[8px]"
                >
                  <RotateCcw className="h-4 w-4 text-ink-2" />
                  Erneut zur Abstimmung
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-line" />
                <DropdownMenuItem
                  onClick={() => onDelete(proposal)}
                  className="text-[14px] gap-2 cursor-pointer rounded-[8px] text-error focus:text-error"
                >
                  <Trash2 className="h-4 w-4" />
                  Löschen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[12px] text-ink-2 truncate max-w-[100px]">
            {proposal.initiator.display_name}
          </span>
          <span className="text-ink-3 text-[11px]">·</span>
          <span
            className="text-[10.5px] font-[800] uppercase tracking-[0.06em] px-2 py-0.5 rounded-pill
                       bg-accent-soft text-accent"
          >
            {DURATION_CATEGORY_LABELS[proposal.duration_category]}
          </span>
        </div>

        {/* Vote progress */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-surface-2 rounded-pill overflow-hidden">
            <div
              className="h-full bg-primary rounded-pill transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <span className="text-[12.5px] font-[700] text-ink-2 tabular-nums flex-shrink-0">
            {displayVotes} / {proposal.required_votes}
          </span>

          {/* Vote button */}
          <button
            onClick={e => { e.stopPropagation(); handleVote() }}
            disabled={isPending}
            aria-label={displayVoted ? 'Vote entfernen' : 'Upvoten'}
            className={`flex-shrink-0 h-8 w-8 rounded-[10px] flex items-center justify-center transition-all
              ${displayVoted
                ? 'bg-primary-soft text-primary border-[1.5px] border-primary/30'
                : 'bg-surface-2 text-ink-3 border-[1.5px] border-line hover:border-primary/30 hover:text-primary/70'
              }
              ${isPending ? 'opacity-50 cursor-not-allowed' : 'active:scale-90'}`}
          >
            <Heart
              className="h-4 w-4 transition-all"
              fill={displayVoted ? 'currentColor' : 'none'}
            />
          </button>
        </div>
      </div>
    </div>
  )
}
