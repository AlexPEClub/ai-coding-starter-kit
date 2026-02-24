"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"

import type { Apotheke } from "@/lib/types"
import { deleteApotheke } from "@/lib/actions/apotheken"
import { format } from "date-fns"
import { de } from "date-fns/locale"

interface ApothekeDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  apotheke?: Apotheke
}

export function ApothekeDeleteDialog({
  open,
  onOpenChange,
  apotheke,
}: ApothekeDeleteDialogProps) {
  const [loading, setLoading] = useState(false)
  const [blockingTermine, setBlockingTermine] = useState<any[]>([])

  if (!apotheke) return null

  const handleDelete = async () => {
    setLoading(true)
    const result = await deleteApotheke(apotheke.id)
    setLoading(false)

    if (result.error) {
      if (result.futureTermine) {
        setBlockingTermine(result.futureTermine)
        toast.error("Apotheke kann nicht gelöscht werden: Offene Termine.")
      } else {
        toast.error(result.error)
      }
    } else {
      toast.success(`"${apotheke.name}" wurde gelöscht.`)
      onOpenChange(false)
    }
  }

  // Reset state when dialog opens/closes
  const handleOpenChange = (open: boolean) => {
    if (!open) setBlockingTermine([])
    onOpenChange(open)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Apotheke löschen</AlertDialogTitle>
          <AlertDialogDescription>
            Möchten Sie die Apotheke &quot;{apotheke.name}&quot; in {apotheke.ort} wirklich löschen?
            Diese Aktion kann nicht rückgängig gemacht werden.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {blockingTermine.length > 0 && (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
            <p className="mb-2 text-sm font-medium text-destructive">
              Diese Apotheke hat {blockingTermine.length} bevorstehende {blockingTermine.length === 1 ? "Termin" : "Termine"}.
              Bitte sagen Sie diese zuerst ab.
            </p>
            <ul className="space-y-1">
              {blockingTermine.slice(0, 5).map((t) => (
                <li key={t.id} className="flex items-center gap-2 text-sm">
                  <span>{format(new Date(t.datum), "dd.MM.yyyy", { locale: de })}</span>
                  <Badge variant="outline" className="text-xs">
                    {t.status === "geplant" ? "Geplant" : "Fixiert"}
                  </Badge>
                </li>
              ))}
              {blockingTermine.length > 5 && (
                <li className="text-sm text-muted-foreground">
                  ... und {blockingTermine.length - 5} weitere
                </li>
              )}
            </ul>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Abbrechen</AlertDialogCancel>
          {blockingTermine.length === 0 ? (
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Löschen
            </AlertDialogAction>
          ) : (
            <Button disabled variant="destructive">Löschen nicht möglich</Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
