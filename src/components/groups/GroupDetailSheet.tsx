'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Pencil, Check, X, Loader2 } from 'lucide-react'
import { InviteCodeCard } from './InviteCodeCard'
import { MemberList } from './MemberList'
import { LeaveGroupDialog } from './LeaveGroupDialog'
import { DeleteGroupDialog } from './DeleteGroupDialog'
import { useGroupDetail } from '@/hooks/useGroupDetail'
import { useAuth } from '@/contexts/AuthContext'

interface GroupDetailSheetProps {
  groupId: string | null
  onClose: () => void
  onGroupLeft: () => void
  onGroupDeleted: () => void
}

export function GroupDetailSheet({
  groupId,
  onClose,
  onGroupLeft,
  onGroupDeleted,
}: GroupDetailSheetProps) {
  const { user } = useAuth()
  const {
    group,
    members,
    myRole,
    isAdmin,
    isLastAdmin,
    isLastMember,
    loading,
    updateGroupName,
    regenerateInviteCode,
    changeMemberRole,
    removeMember,
    transferAdminAndLeave,
    leaveGroup,
    deleteGroup,
  } = useGroupDetail(groupId)

  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (group) setNameInput(group.name)
  }, [group])

  useEffect(() => {
    if (editingName) nameInputRef.current?.focus()
  }, [editingName])

  function startEditName() {
    setNameInput(group?.name ?? '')
    setNameError(null)
    setEditingName(true)
  }

  function cancelEditName() {
    setEditingName(false)
    setNameError(null)
  }

  async function saveName() {
    if (!nameInput.trim()) {
      setNameError('Gruppenname ist erforderlich')
      return
    }
    if (nameInput.trim().length > 50) {
      setNameError('Gruppenname darf maximal 50 Zeichen lang sein')
      return
    }
    setNameSaving(true)
    const { error } = await updateGroupName(nameInput.trim())
    setNameSaving(false)
    if (error) {
      setNameError(error)
    } else {
      setEditingName(false)
    }
  }

  function handleNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') saveName()
    if (e.key === 'Escape') cancelEditName()
  }

  return (
    <Sheet open={!!groupId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-bg border-l border-line p-0 flex flex-col"
      >
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-line flex-shrink-0">
          <div className="flex items-center gap-3 pr-8">
            {loading && !group ? (
              <Skeleton className="h-7 w-48 bg-surface-2" />
            ) : editingName && isAdmin ? (
              <div className="flex-1 flex items-center gap-2">
                <Input
                  ref={nameInputRef}
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value)
                    if (nameError) setNameError(null)
                  }}
                  onKeyDown={handleNameKeyDown}
                  maxLength={50}
                  className="h-9 text-[17px] font-[800] border-[1.5px] border-secondary bg-surface rounded-md
                             focus-visible:ring-0 focus-visible:shadow-[0_0_0_3px_var(--secondary-soft)]"
                  aria-invalid={!!nameError}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={saveName}
                  disabled={nameSaving}
                  className="h-8 w-8 text-success hover:bg-success-soft flex-shrink-0"
                  aria-label="Speichern"
                >
                  {nameSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={cancelEditName}
                  className="h-8 w-8 text-ink-2 hover:bg-surface-2 flex-shrink-0"
                  aria-label="Abbrechen"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <SheetTitle className="text-[20px] font-[800] text-ink truncate leading-tight">
                  {group?.name ?? ''}
                </SheetTitle>
                {isAdmin && (
                  <button
                    onClick={startEditName}
                    className="flex-shrink-0 h-7 w-7 rounded-md flex items-center justify-center
                               text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
                    aria-label="Gruppenname bearbeiten"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
          {nameError && (
            <p className="text-[12px] text-error mt-1">{nameError}</p>
          )}
        </SheetHeader>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* Invite Code */}
          <InviteCodeCard
            code={group?.invite_code ?? null}
            isAdmin={isAdmin}
            onRegenerate={regenerateInviteCode}
          />

          <Separator className="bg-line" />

          {/* Member List */}
          <MemberList
            members={members}
            currentUserId={user?.id ?? ''}
            isCurrentUserAdmin={isAdmin}
            loading={loading && members.length === 0}
            onChangeRole={changeMemberRole}
            onRemove={removeMember}
          />
        </div>

        {/* Footer actions */}
        {myRole && (
          <div className="px-5 py-4 border-t border-line flex gap-2 flex-shrink-0 bg-bg">
            <LeaveGroupDialog
              myRole={myRole}
              isLastMember={isLastMember}
              isLastAdmin={isLastAdmin}
              members={members}
              currentUserId={user?.id ?? ''}
              onLeave={leaveGroup}
              onTransferAdminAndLeave={transferAdminAndLeave}
              onSuccess={() => {
                onClose()
                onGroupLeft()
              }}
            />
            {isLastMember && (
              <DeleteGroupDialog
                onDelete={deleteGroup}
                onSuccess={() => {
                  onClose()
                  onGroupDeleted()
                }}
              />
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
