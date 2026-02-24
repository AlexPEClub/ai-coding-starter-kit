"use client"

import { use, useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Pencil, X, StickyNote, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { getTour } from "@/lib/actions/touren"
import { TERMIN_STATUS_CONFIG } from "@/lib/types"
import { TourDialog } from "@/components/tour-dialog"
import { TerminDialog } from "@/components/termin-dialog"
import { TerminCancelDialog } from "@/components/termin-cancel-dialog"
import { TerminDetailSheet } from "@/components/termin-detail-sheet"
import type { Termin, Tour } from "@/lib/types"

export default function TourDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [tour, setTour] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  const [editTourOpen, setEditTourOpen] = useState(false)
  const [terminDialogOpen, setTerminDialogOpen] = useState(false)
  const [editTermin, setEditTermin] = useState<Termin | undefined>(undefined)
  const [cancelTermin, setCancelTermin] = useState<Termin | undefined>(undefined)
  const [sheetTermin, setSheetTermin] = useState<Termin | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getTour(id)
      setTour(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!tour) {
    return (
      <div className="space-y-4">
        <Link
          href="/touren"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Liste
        </Link>
        <p className="text-muted-foreground">Tour nicht gefunden.</p>
      </div>
    )
  }

  const trainer = tour.trainer
  const termine = (tour.termine as any[]) || []

  // Sort termine
  termine.sort((a, b) => a.datum.localeCompare(b.datum) || a.zeit_start.localeCompare(b.zeit_start))

  const doneCount = termine.filter((t) => t.status === "durchgefuehrt").length
  const cancelledCount = termine.filter((t) => t.status === "abgesagt").length

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/touren">Touren</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{tour.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Tour info card */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-xl">{tour.name}</CardTitle>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{tour.region}</Badge>
              <span className="text-sm text-muted-foreground">
                {trainer?.full_name ?? "–"}
              </span>
              <span className="text-sm text-muted-foreground">
                {format(new Date(tour.start_date), "dd.MM.", { locale: de })} –{" "}
                {format(new Date(tour.end_date), "dd.MM.yyyy", { locale: de })}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditTourOpen(true)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Bearbeiten
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Termine:</span>{" "}
              <span className="font-medium">{termine.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Durchgeführt:</span>{" "}
              <span className="font-medium text-green-700">{doneCount}</span>
            </div>
            {cancelledCount > 0 && (
              <div>
                <span className="text-muted-foreground">Abgesagt:</span>{" "}
                <span className="font-medium text-gray-500">{cancelledCount}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Appointments section */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Termine</h2>
        <Button
          size="sm"
          onClick={() => {
            setEditTermin(undefined)
            setTerminDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Termin hinzufügen
        </Button>
      </div>

      {termine.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">
              Noch keine Termine in dieser Tour.
            </p>
            <Button
              className="mt-4"
              size="sm"
              onClick={() => {
                setEditTermin(undefined)
                setTerminDialogOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Ersten Termin hinzufügen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Uhrzeit</TableHead>
                <TableHead>Apotheke</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notiz</TableHead>
                <TableHead className="w-[120px]">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {termine.map((termin) => {
                const apotheke = termin.apotheke
                const statusConfig = TERMIN_STATUS_CONFIG[termin.status as keyof typeof TERMIN_STATUS_CONFIG]

                return (
                  <TableRow
                    key={termin.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSheetTermin(termin)}
                  >
                    <TableCell>
                      {format(new Date(termin.datum), "EE, dd.MM.yyyy", {
                        locale: de,
                      })}
                    </TableCell>
                    <TableCell>
                      {termin.zeit_start}–{termin.zeit_ende}
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">
                          {apotheke?.name ?? "–"}
                        </span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          {apotheke?.ort ?? ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={statusConfig?.color}
                      >
                        {statusConfig?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {termin.notiz ? (
                        <StickyNote className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <span className="text-muted-foreground">–</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditTermin(termin)
                            setTerminDialogOpen(true)
                          }}
                          title="Bearbeiten"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {termin.status !== "abgesagt" &&
                          termin.status !== "durchgefuehrt" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setCancelTermin(termin)}
                              title="Absagen"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Tour Edit Dialog */}
      <TourDialog
        open={editTourOpen}
        onOpenChange={(open) => {
          setEditTourOpen(open)
          if (!open) load()
        }}
        tour={tour}
      />

      {/* Termin Add/Edit Dialog */}
      <TerminDialog
        open={terminDialogOpen}
        onOpenChange={(open) => {
          setTerminDialogOpen(open)
          if (!open) load()
        }}
        termin={editTermin}
        defaultTourId={tour.id}
        defaultTrainerId={tour.trainer_id}
      />

      {/* Termin Cancel Dialog */}
      <TerminCancelDialog
        open={!!cancelTermin}
        onOpenChange={(open) => {
          if (!open) { setCancelTermin(undefined); load() }
        }}
        termin={cancelTermin}
      />

      {/* Termin Detail Sheet */}
      <TerminDetailSheet
        open={!!sheetTermin}
        onOpenChange={(open) => {
          if (!open) { setSheetTermin(null); load() } // reloading might be overkill here but safer
        }}
        termin={sheetTermin}
      />
    </div>
  )
}
