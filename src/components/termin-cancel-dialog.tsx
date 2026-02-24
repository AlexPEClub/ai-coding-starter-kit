"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import type { Termin } from "@/lib/types"
import { updateTerminStatus } from "@/lib/actions/termine"

interface TerminCancelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  termin?: Termin
}

export function TerminCancelDialog({
  open,
  onOpenChange,
  termin,
}: TerminCancelDialogProps) {
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const apotheke = termin?.apotheke

  const handleCancel = async () => {
    if (!reason.trim()) {
      setError("Bitte geben Sie einen Grund für die Absage an.")
      return
    }

    if (!termin) return

    setLoading(true)
    const result = await updateTerminStatus(termin.id, "abgesagt", reason)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(
        `Termin bei "${apotheke?.name ?? "Apotheke"}" wurde als abgesagt markiert.`
      )
      setReason("")
      setError("")
      onOpenChange(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setReason("")
      setError("")
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Termin absagen</DialogTitle>
          <DialogDescription>
            {apotheke
              ? `Möchten Sie den Termin bei "${apotheke.name}" wirklich absagen? Der Termin wird als abgesagt markiert, aber nicht gelöscht.`
              : "Möchten Sie diesen Termin wirklich absagen?"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="cancel-reason">Grund der Absage *</Label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
              if (error) setError("")
            }}
            placeholder="z.B. Apotheke kurzfristig geschlossen..."
            rows={3}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Zurück
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleCancel}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Abgesagt markieren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
