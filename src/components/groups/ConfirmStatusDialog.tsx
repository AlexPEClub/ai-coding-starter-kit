'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ConfirmStatusDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  loading: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmStatusDialog({
  open,
  title,
  description,
  confirmLabel,
  loading,
  onCancel,
  onConfirm,
}: ConfirmStatusDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="bg-surface border-line rounded-[18px] sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle className="text-[17px] font-[800] text-ink text-left">
            {title}
          </DialogTitle>
          <DialogDescription className="text-[13px] text-ink-2 leading-snug text-left">
            {description}
          </DialogDescription>
        </DialogHeader>

        <p className="text-[12.5px] text-ink-3 -mt-1">
          Diese Aktion kann nicht rückgängig gemacht werden.
        </p>

        <DialogFooter className="flex gap-2 flex-row justify-end">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="border-line text-ink-2 rounded-[12px] hover:bg-surface-2"
          >
            Abbrechen
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="bg-primary hover:bg-primary-600 text-white font-[700] rounded-[12px] border border-primary-600"
          >
            {loading ? 'Wird gespeichert…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
