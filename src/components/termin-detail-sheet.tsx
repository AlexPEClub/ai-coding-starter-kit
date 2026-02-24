"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { MapPin, User, CalendarDays, Clock, FileText, ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { de } from "date-fns/locale"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

import type { Termin, TerminStatus } from "@/lib/types"
import { TERMIN_STATUS_CONFIG } from "@/lib/types"
import { updateTerminStatus, updateTermin } from "@/lib/actions/termine"

interface TerminDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  termin: Termin | null
}

const STATUS_TRANSITIONS: Record<TerminStatus, TerminStatus[]> = {
  geplant: ["fixiert", "abgesagt"],
  fixiert: ["durchgefuehrt", "abgesagt"],
  durchgefuehrt: ["abgesagt"], // Allow cancellation even if performed? Usually no, but for admin maybe. Let's stick to safe transitions.
  abgesagt: [], // Terminal state? Or allow reactivation? Let's keep it simple for now.
}

export function TerminDetailSheet({
  open,
  onOpenChange,
  termin,
}: TerminDetailSheetProps) {
  const [status, setStatus] = useState<TerminStatus>(termin?.status ?? "geplant")
  const [notes, setNotes] = useState(termin?.notiz ?? "")
  const [loading, setLoading] = useState(false)

  // Sync state when termin changes
  useEffect(() => {
    if (termin) {
      setStatus(termin.status)
      setNotes(termin.notiz ?? "")
    }
  }, [termin])

  if (!termin) return null

  // Safely access joined data (knowing it might be there from previous fetches)
  const apotheke = (termin as any).apotheke
  const trainer = (termin as any).trainer

  const statusConfig = TERMIN_STATUS_CONFIG[status]
  const possibleTransitions = STATUS_TRANSITIONS[status] || []

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true)
    const result = await updateTerminStatus(termin.id, newStatus as TerminStatus)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      setStatus(newStatus as TerminStatus)
      const newConfig = TERMIN_STATUS_CONFIG[newStatus as TerminStatus]
      toast.success(`Status geändert auf "${newConfig.label}".`)
    }
  }

  const handleNotesSave = async () => {
    setLoading(true)
    const result = await updateTermin(termin.id, { notiz: notes })
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Notiz gespeichert.")
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{apotheke?.name ?? "Termin"}</SheetTitle>
          <SheetDescription>
            {format(new Date(termin.datum), "EEEE, dd. MMMM yyyy", { locale: de })}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Status:</span>
              <Badge variant="secondary" className={statusConfig.color}>
                {statusConfig.label}
              </Badge>
            </div>
            {possibleTransitions.length > 0 && (
              <Select onValueChange={handleStatusChange} disabled={loading}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status ändern" />
                </SelectTrigger>
                <SelectContent>
                  {possibleTransitions.map((s) => {
                    const config = TERMIN_STATUS_CONFIG[s]
                    return (
                      <SelectItem key={s} value={s}>
                        {config.label}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            )}
          </div>

          <Separator />

          {/* Pharmacy info */}
          {apotheke && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Apotheke
              </div>
              <div className="ml-6 space-y-1">
                <p className="font-medium">{apotheke.name}</p>
                <p className="text-sm text-muted-foreground">
                  {apotheke.address && `${apotheke.address}, `}
                  {apotheke.plz} {apotheke.ort}
                </p>
                <Badge variant="outline" className="mt-1">{apotheke.region}</Badge>
              </div>
            </div>
          )}

          <Separator />

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                Datum
              </div>
              <p className="ml-6 text-sm">
                {format(new Date(termin.datum), "dd.MM.yyyy", { locale: de })}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Uhrzeit
              </div>
              <p className="ml-6 text-sm">
                {termin.zeit_start} - {termin.zeit_ende}
              </p>
            </div>
          </div>

          <Separator />

          {/* Trainer */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4 text-muted-foreground" />
              Trainer
            </div>
            <p className="ml-6 text-sm">{trainer?.full_name ?? "–"}</p>
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Notizen
            </div>
            <div className="ml-6 space-y-2">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notizen zum Termin..."
                rows={3}
              />
              <Button size="sm" variant="outline" onClick={handleNotesSave} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Notiz speichern
              </Button>
            </div>
          </div>

          {/* Cancel reason */}
          {status === "abgesagt" && termin.cancel_reason && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-sm font-medium text-destructive">
                  Absagegrund
                </Label>
                <p className="text-sm text-muted-foreground">
                  {termin.cancel_reason}
                </p>
              </div>
            </>
          )}

          {/* Durchgefuehrt prompt */}
          {status === "durchgefuehrt" && (
            <>
              <Separator />
              <div className="rounded-md border border-green-200 bg-green-50 p-4 space-y-2">
                <p className="text-sm font-medium text-green-800">
                  Dieser Termin wurde durchgeführt.
                </p>
                {(() => {
                  const berichte = (termin as any).berichte as { id: string; is_draft: boolean }[] | undefined
                  const bericht = berichte && berichte.length > 0 ? berichte[0] : null
                  if (!bericht) {
                    return (
                      <p className="text-sm text-green-700">
                        Kein Schulungsbericht vorhanden. Bitte erfassen.
                      </p>
                    )
                  }
                  if (bericht.is_draft) {
                    return (
                      <p className="text-sm text-amber-700 font-medium">
                        Bericht als Entwurf gespeichert.
                      </p>
                    )
                  }
                  return (
                    <p className="text-sm text-green-700 font-medium">
                      Schulungsbericht eingereicht ✓
                    </p>
                  )
                })()}
              </div>
            </>
          )}

          <Separator />

          {/* Link to full detail page */}
          <Button variant="outline" className="w-full" asChild>
            <Link href={`/termine/${termin.id}`}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Vollständige Detailseite öffnen
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
