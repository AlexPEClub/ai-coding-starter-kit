'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LogOut, Loader2 } from 'lucide-react'
import type { GroupMember, GroupRole } from '@/lib/group-types'
import { ROLE_LABELS } from '@/lib/group-types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'

interface LeaveGroupDialogProps {
  myRole: GroupRole
  isLastMember: boolean
  isLastAdmin: boolean
  members: GroupMember[]
  currentUserId: string
  onLeave: () => Promise<{ error: string | null }>
  onTransferAdminAndLeave: (newAdminId: string) => Promise<{ error: string | null }>
  onSuccess: () => void
}

export function LeaveGroupDialog({
  myRole,
  isLastMember,
  isLastAdmin,
  members,
  currentUserId,
  onLeave,
  onTransferAdminAndLeave,
  onSuccess,
}: LeaveGroupDialogProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [selectedNewAdmin, setSelectedNewAdmin] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const otherMembers = members.filter((m) => m.user_id !== currentUserId)

  function handleLeaveClick() {
    if (isLastMember) return

    if (myRole === 'admin' && isLastAdmin) {
      setTransferOpen(true)
    } else {
      setConfirmOpen(true)
    }
  }

  async function handleConfirmLeave() {
    setSubmitting(true)
    setError(null)
    const { error: err } = await onLeave()
    setSubmitting(false)
    if (err) {
      setError(err)
    } else {
      setConfirmOpen(false)
      onSuccess()
    }
  }

  async function handleTransferAndLeave() {
    if (!selectedNewAdmin) return
    setSubmitting(true)
    setError(null)
    const { error: err } = await onTransferAdminAndLeave(selectedNewAdmin)
    setSubmitting(false)
    if (err) {
      setError(err)
    } else {
      setTransferOpen(false)
      onSuccess()
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        onClick={handleLeaveClick}
        disabled={isLastMember}
        title={isLastMember ? 'Du bist das einzige Mitglied – lösche die Gruppe stattdessen.' : undefined}
        className="flex-1 h-10 text-[14px] font-semibold text-ink-2 border border-line rounded-md
                   hover:border-ink hover:text-ink gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <LogOut className="h-4 w-4" />
        Gruppe verlassen
      </Button>

      {/* Simple leave confirmation (non-admin or already another admin) */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-[18px] bg-surface border-line max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[18px] font-[800] text-ink">
              Gruppe verlassen?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[14px] text-ink-2">
              Du wirst aus der Gruppe entfernt und hast keinen Zugriff mehr auf Aktivitäten und Planungen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p className="text-[13px] text-error px-1">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-md border-line text-ink-2">
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmLeave}
              disabled={submitting}
              className="rounded-md bg-error hover:bg-error/90 text-white"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verlassen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Admin transfer dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="rounded-[18px] bg-surface border-line max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-[800] text-ink">
              Admin-Rechte übertragen
            </DialogTitle>
            <DialogDescription className="text-[14px] text-ink-2">
              Du bist der einzige Admin. Wähle ein Mitglied aus, das deine Admin-Rechte erhält.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-56">
            <div className="space-y-1 pr-1">
              {otherMembers.map((member) => {
                const initials = member.profile.display_name
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)

                return (
                  <button
                    key={member.user_id}
                    onClick={() => setSelectedNewAdmin(member.user_id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] transition-colors text-left
                      ${selectedNewAdmin === member.user_id
                        ? 'bg-primary-soft border border-primary'
                        : 'hover:bg-surface-2 border border-transparent'
                      }`}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-secondary text-white text-[11px] font-[800]">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-ink truncate">
                        {member.profile.display_name}
                      </p>
                      <p className="text-[12px] text-ink-3">{ROLE_LABELS[member.role]}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </ScrollArea>

          {error && <p className="text-[13px] text-error">{error}</p>}

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setTransferOpen(false)}
              className="rounded-md border border-line text-ink-2"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleTransferAndLeave}
              disabled={!selectedNewAdmin || submitting}
              className="rounded-md bg-primary hover:bg-primary-600 text-white border-primary-600"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Übertragen & verlassen'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
