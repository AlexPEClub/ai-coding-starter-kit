'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { MoreHorizontal, Shield, Edit2, Eye, UserMinus } from 'lucide-react'
import type { GroupMember, GroupRole } from '@/lib/group-types'
import { ROLE_LABELS } from '@/lib/group-types'

interface MemberRowProps {
  member: GroupMember
  isCurrentUser: boolean
  isAdmin: boolean
  isCurrentUserAdmin: boolean
  onChangeRole: (userId: string, role: GroupRole) => Promise<{ error: string | null }>
  onRemove: (userId: string) => Promise<{ error: string | null }>
}

const ROLE_ICONS: Record<GroupRole, React.ReactNode> = {
  admin: <Shield className="h-3.5 w-3.5" />,
  editor: <Edit2 className="h-3.5 w-3.5" />,
  observer: <Eye className="h-3.5 w-3.5" />,
}

export function MemberRow({
  member,
  isCurrentUser,
  isAdmin,
  isCurrentUserAdmin,
  onChangeRole,
  onRemove,
}: MemberRowProps) {
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [removing, setRemoving] = useState(false)

  const initials = member.profile.display_name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const avatarColor =
    member.role === 'admin' ? 'bg-primary' : member.role === 'editor' ? 'bg-secondary' : 'bg-accent'

  async function handleRemove() {
    setRemoving(true)
    await onRemove(member.user_id)
    setRemoving(false)
    setRemoveDialogOpen(false)
  }

  return (
    <>
      <div className="flex items-center gap-3 py-2.5 px-1">
        <Avatar className="h-9 w-9 flex-shrink-0">
          <AvatarFallback className={`${avatarColor} text-white text-[11px] font-[800]`}>
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold text-ink truncate">
              {member.profile.display_name}
            </span>
            {isCurrentUser && (
              <span className="text-[11px] text-ink-3">(Du)</span>
            )}
          </div>
          <span
            className={`inline-flex items-center gap-1 text-[10.5px] font-[800] uppercase tracking-[0.06em]
              px-2 py-0.5 rounded-pill mt-0.5
              ${member.role === 'admin' ? 'bg-primary-soft text-primary' : ''}
              ${member.role === 'editor' ? 'bg-secondary-soft text-secondary' : ''}
              ${member.role === 'observer' ? 'bg-accent-soft text-accent' : ''}
            `}
          >
            {ROLE_ICONS[member.role]}
            {ROLE_LABELS[member.role]}
          </span>
        </div>

        {/* Admin actions dropdown — only shown when current user is admin and this is not themselves */}
        {isCurrentUserAdmin && !isCurrentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="h-8 w-8 rounded-md flex items-center justify-center text-ink-3
                           hover:bg-surface-2 hover:text-ink transition-colors flex-shrink-0"
                aria-label="Aktionen"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-[12px] bg-surface border-line">
              <DropdownMenuLabel className="text-[11px] text-ink-3 font-semibold uppercase tracking-wide">
                Rolle ändern
              </DropdownMenuLabel>
              {(['admin', 'editor', 'observer'] as GroupRole[])
                .filter((r) => r !== member.role)
                .map((role) => (
                  <DropdownMenuItem
                    key={role}
                    onClick={() => onChangeRole(member.user_id, role)}
                    className="text-[14px] text-ink cursor-pointer"
                  >
                    <span
                      className={`mr-2 inline-flex items-center gap-1 text-[10px] font-[800] uppercase
                        px-1.5 py-0.5 rounded-pill
                        ${role === 'admin' ? 'bg-primary-soft text-primary' : ''}
                        ${role === 'editor' ? 'bg-secondary-soft text-secondary' : ''}
                        ${role === 'observer' ? 'bg-accent-soft text-accent' : ''}
                      `}
                    >
                      {ROLE_LABELS[role]}
                    </span>
                  </DropdownMenuItem>
                ))}
              <DropdownMenuSeparator className="bg-line" />
              <DropdownMenuItem
                onClick={() => setRemoveDialogOpen(true)}
                className="text-[14px] text-error cursor-pointer focus:text-error"
              >
                <UserMinus className="mr-2 h-4 w-4" />
                Entfernen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent className="rounded-[18px] bg-surface border-line max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[18px] font-[800] text-ink">
              {member.profile.display_name} entfernen?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[14px] text-ink-2">
              {member.profile.display_name} wird aus der Gruppe entfernt und kann nicht mehr auf
              Aktivitäten und Planungen zugreifen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-md border-line text-ink-2">
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={removing}
              className="rounded-md bg-error hover:bg-error/90 text-white"
            >
              Entfernen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
