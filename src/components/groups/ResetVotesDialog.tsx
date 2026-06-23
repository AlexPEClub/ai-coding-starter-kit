'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-react'

interface ResetVotesDialogProps {
  open: boolean
  proposalName: string
  onCancel: () => void
  onConfirm: () => Promise<void>
}

export function ResetVotesDialog({
  open,
  proposalName,
  onCancel,
  onConfirm,
}: ResetVotesDialogProps) {
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    await onConfirm()
    setLoading(false)
  }

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="bg-surface border-line rounded-[18px] max-w-sm mx-4">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[18px] font-[800] text-ink">
            Erneut zur Abstimmung?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[14px] text-ink-2">
            Alle Votes für „{proposalName}" werden zurückgesetzt. Die Abstimmung beginnt von vorne.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onCancel}
            className="rounded-[12px] border-[1.5px] border-line text-ink font-semibold hover:bg-surface-2"
          >
            Abbrechen
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className="rounded-[12px] bg-secondary text-white font-semibold border-[1.5px] border-secondary hover:opacity-90 disabled:opacity-40"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
            Votes zurücksetzen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
