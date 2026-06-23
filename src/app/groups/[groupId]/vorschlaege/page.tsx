'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ProposalCard } from '@/components/groups/ProposalCard'
import { ProposalFormSheet } from '@/components/groups/ProposalFormSheet'
import { DeleteProposalDialog } from '@/components/groups/DeleteProposalDialog'
import { ResetVotesDialog } from '@/components/groups/ResetVotesDialog'
import { useActivityProposals } from '@/hooks/useActivityProposals'
import { useVote } from '@/hooks/useVote'
import { useDeleteProposal } from '@/hooks/useDeleteProposal'
import { useResetVotes } from '@/hooks/useResetVotes'
import { useAuth } from '@/contexts/AuthContext'
import { useGroupShell } from '@/components/groups/GroupShellContext'
import type { ActivityWithInitiator, DurationCategory } from '@/lib/activity-types'
import { DURATION_CATEGORY_LABELS } from '@/lib/activity-types'

type FilterValue = DurationCategory | null

const FILTER_CHIPS: { label: string; value: FilterValue }[] = [
  { label: 'Alle', value: null },
  { label: DURATION_CATEGORY_LABELS.spontan, value: 'spontan' },
  { label: DURATION_CATEGORY_LABELS.wochenende, value: 'wochenende' },
  { label: DURATION_CATEGORY_LABELS.laengerer_zeitraum, value: 'laengerer_zeitraum' },
]

export default function VorschlaegePage() {
  const { user } = useAuth()
  const { groupId, isAdmin, canCreate, memberCount, openActivityDetail } = useGroupShell()

  const [activeFilter, setActiveFilter] = useState<FilterValue>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editProposal, setEditProposal] = useState<ActivityWithInitiator | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ActivityWithInitiator | null>(null)
  const [resetTarget, setResetTarget] = useState<ActivityWithInitiator | null>(null)

  const { proposals, myVotedIds, loading, error, filterByCategory, refetch } =
    useActivityProposals(groupId)
  const { toggleVote, pending: votePending } = useVote({ onError: (msg) => toast.error(msg) })
  const { deleteProposal } = useDeleteProposal()
  const { resetVotes } = useResetVotes()

  const displayed = filterByCategory(activeFilter)

  async function handleDelete() {
    if (!deleteTarget) return
    const { error: err } = await deleteProposal(deleteTarget.id)
    if (err) toast.error('Löschen fehlgeschlagen')
    else { toast.success('Vorschlag gelöscht'); refetch() }
    setDeleteTarget(null)
  }

  async function handleReset() {
    if (!resetTarget) return
    const { error: err } = await resetVotes(resetTarget.id)
    if (err) toast.error('Zurücksetzen fehlgeschlagen')
    else { toast.success('Votes zurückgesetzt'); refetch() }
    setResetTarget(null)
  }

  return (
    <div className="relative flex-1 min-h-0 flex flex-col">
      {/* Filter chips */}
      <div className="flex-shrink-0 border-b border-line">
        <div className="max-w-5xl mx-auto w-full px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
          {FILTER_CHIPS.map((chip) => {
            const active = activeFilter === chip.value
            return (
              <button
                key={chip.value ?? 'all'}
                onClick={() => setActiveFilter(chip.value)}
                className={`flex-shrink-0 text-[12.5px] font-[700] px-3.5 py-1.5 rounded-pill border-[1.5px] transition-all
                  ${active
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface text-ink-2 border-line hover:border-primary/40'
                  }`}
              >
                {chip.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Proposal list */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto w-full px-4 pb-28 pt-3">
          {error && <p className="mt-6 text-center text-[13px] text-error">{error}</p>}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[88px] w-full rounded-[18px] bg-surface" />
              ))}
            </div>
          ) : displayed.length === 0 ? (
            <EmptyProposalState hasFilter={activeFilter !== null} />
          ) : (
            <div className="space-y-3">
              {displayed.map((p) => (
                <ProposalCard
                  key={p.id}
                  proposal={p}
                  hasVoted={myVotedIds.has(p.id)}
                  isPending={votePending.has(p.id)}
                  currentUserId={user?.id ?? ''}
                  isAdmin={isAdmin}
                  onVote={toggleVote}
                  onEdit={setEditProposal}
                  onDelete={setDeleteTarget}
                  onReset={setResetTarget}
                  onOpenDetail={(p) => openActivityDetail(p.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FAB — Create Proposal (no cap: unlimited backlog) */}
      {canCreate && (
        <div className="absolute bottom-6 right-5 z-10">
          <Button
            onClick={() => setCreateOpen(true)}
            className="h-12 px-5 bg-primary hover:bg-primary-600 text-white font-[700] text-[14px]
                       rounded-pill border border-primary-600 shadow-lg gap-2"
          >
            <Plus className="h-4 w-4" />
            Vorschlag
          </Button>
        </div>
      )}

      <ProposalFormSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        mode="create"
        groupId={groupId}
        memberCount={memberCount}
        onSuccess={() => { toast.success('Vorschlag erstellt'); refetch() }}
      />

      <ProposalFormSheet
        open={!!editProposal}
        onClose={() => setEditProposal(null)}
        mode="edit"
        groupId={groupId}
        memberCount={memberCount}
        proposal={editProposal ?? undefined}
        onSuccess={() => { toast.success('Vorschlag aktualisiert'); refetch(); setEditProposal(null) }}
      />

      <DeleteProposalDialog
        open={!!deleteTarget}
        proposalName={deleteTarget?.name ?? ''}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <ResetVotesDialog
        open={!!resetTarget}
        proposalName={resetTarget?.name ?? ''}
        onCancel={() => setResetTarget(null)}
        onConfirm={handleReset}
      />
    </div>
  )
}

function EmptyProposalState({ hasFilter }: { hasFilter: boolean }) {
  if (hasFilter) {
    return (
      <div className="flex flex-col items-center justify-center pt-16 gap-2 text-center px-6">
        <p className="text-[28px]">🔍</p>
        <p className="text-[15px] font-[700] text-ink">Keine Vorschläge in dieser Kategorie</p>
        <p className="text-[13px] text-ink-3">Probiere einen anderen Filter.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center pt-16 gap-3 text-center px-6">
      <p className="text-[36px]">💡</p>
      <p className="text-[16px] font-[800] text-ink">Noch keine Vorschläge</p>
      <p className="text-[13px] text-ink-3 max-w-[240px] leading-relaxed">
        Schlag der Gruppe eine Aktivität vor und stimmt gemeinsam ab.
      </p>
    </div>
  )
}
