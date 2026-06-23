'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Trash2, Loader2 } from 'lucide-react'

interface DeleteGroupDialogProps {
  onDelete: () => Promise<{ error: string | null }>
  onSuccess: () => void
}

export function DeleteGroupDialog({ onDelete, onSuccess }: DeleteGroupDialogProps) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    const { error: err } = await onDelete()
    setDeleting(false)
    if (err) {
      setError(err)
    } else {
      onSuccess()
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          className="flex-1 h-10 text-[14px] font-semibold text-error border border-error/30 rounded-md
                     hover:bg-error/5 hover:border-error gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Gruppe löschen
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-[18px] bg-surface border-line max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[18px] font-[800] text-ink">
            Gruppe unwiderruflich löschen?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[14px] text-ink-2">
            Diese Gruppe und alle zugehörigen Daten werden dauerhaft gelöscht. Diese Aktion kann
            nicht rückgängig gemacht werden.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="text-[13px] text-error px-1">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-md border-line text-ink-2">
            Abbrechen
          </AlertDialogCancel>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-md bg-error hover:bg-error/90 text-white border-0"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Endgültig löschen'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
