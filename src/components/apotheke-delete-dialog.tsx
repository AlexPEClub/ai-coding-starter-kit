"use client"

import { toast } from "sonner"

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
import { mockTermine } from "@/lib/mock-data"

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
  if (!apotheke) return null

  // Check for upcoming appointments
  const upcomingTermine = mockTermine.filter(
    (t) =>
      t.apotheke_id === apotheke.id &&
      t.status !== "abgesagt" &&
      t.datum >= new Date().toISOString().split("T")[0]
  )

  const handleDelete = () => {
    // TODO: Replace with Server Action (soft delete)
    toast.success(`"${apotheke.name}" wurde gelöscht.`)
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Apotheke löschen</AlertDialogTitle>
          <AlertDialogDescription>
            Möchten Sie die Apotheke &quot;{apotheke.name}&quot; in {apotheke.ort} wirklich löschen?
            Diese Aktion kann nicht rückgängig gemacht werden.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {upcomingTermine.length > 0 && (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
            <p className="mb-2 text-sm font-medium text-destructive">
              Diese Apotheke hat {upcomingTermine.length} bevorstehende{" "}
              {upcomingTermine.length === 1 ? "Termin" : "Termine"}:
            </p>
            <ul className="space-y-1">
              {upcomingTermine.slice(0, 5).map((t) => (
                <li key={t.id} className="flex items-center gap-2 text-sm">
                  <span>{t.datum}</span>
                  <span>{t.zeit_start}–{t.zeit_ende}</span>
                  <Badge variant="outline" className="text-xs">
                    {t.status === "geplant" ? "Geplant" : "Fixiert"}
                  </Badge>
                </li>
              ))}
              {upcomingTermine.length > 5 && (
                <li className="text-sm text-muted-foreground">
                  ... und {upcomingTermine.length - 5} weitere
                </li>
              )}
            </ul>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {upcomingTermine.length > 0 ? "Trotzdem löschen" : "Löschen"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
