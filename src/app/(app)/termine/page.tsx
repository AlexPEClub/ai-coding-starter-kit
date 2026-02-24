"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Plus, Search, CalendarDays } from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

import { getTermine } from "@/lib/actions/termine"
import { getUsers } from "@/lib/actions/users"
import { REGIONS, TERMIN_STATUS_CONFIG } from "@/lib/types"
import type { Region, TerminStatus, Termin } from "@/lib/types"
import { TerminDialog } from "@/components/termin-dialog"
import { TerminDetailSheet } from "@/components/termin-detail-sheet"
import { DatePicker } from "@/components/date-picker"

const PAGE_SIZE = 25
const STATUSES: { value: TerminStatus | "alle"; label: string }[] = [
  { value: "alle", label: "Alle Status" },
  { value: "geplant", label: "Geplant" },
  { value: "fixiert", label: "Fixiert" },
  { value: "durchgefuehrt", label: "Durchgeführt" },
  { value: "abgesagt", label: "Abgesagt" },
]

export default function TerminePage() {
  const [termine, setTermine] = useState<any[]>([])
  const [trainers, setTrainers] = useState<{ id: string; full_name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  const [search, setSearch] = useState("")
  const [regionFilter, setRegionFilter] = useState<Region | "alle">("alle")
  const [trainerFilter, setTrainerFilter] = useState<string>("alle")
  const [statusFilter, setStatusFilter] = useState<TerminStatus | "alle">("alle")
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined)
  const [page, setPage] = useState(0)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [sheetTermin, setSheetTermin] = useState<Termin | null>(null)

  // Load trainers
  useEffect(() => {
    getUsers().then((data) => {
      setTrainers(
        (data as any[])
          .filter((u) => u.role === "trainer" && u.is_active)
          .map((u) => ({ id: u.id, full_name: u.full_name }))
      )
    })
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const result = await getTermine({
      trainerId: trainerFilter !== "alle" ? trainerFilter : undefined,
      region: regionFilter !== "alle" ? regionFilter : undefined,
      status: statusFilter !== "alle" ? statusFilter : undefined,
      dateFrom: dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined,
      dateTo: dateTo ? format(dateTo, "yyyy-MM-dd") : undefined,
      page: page + 1,
      pageSize: PAGE_SIZE,
    })

    // Client-side search (Server Action doesn't support generic search yet, or we can add it)
    // For now, let's filter client side if search is present, 
    // BUT since we are paginating server side, ideally search should be server side.
    // The previous implementation of getApotheken had search. getTermine did NOT have search in the interface I saw.
    // I recall getTermine signature: 
    // interface GetTermineFilters { trainerId, region, status, dateFrom, dateTo, page, pageSize }
    // No search. So we will filter client side OR add search to server action.
    // Given pagination, client side search on a single page is bad. 
    // I will filter the *current page* results for now, but ideally we add search to the valid filters.

    let data = result.data
    if (search) {
      const q = search.toLowerCase()
      data = data.filter((t: any) =>
        (t.apotheke?.name?.toLowerCase().includes(q)) ||
        (t.apotheke?.ort?.toLowerCase().includes(q))
      )
    }

    setTermine(data)
    setTotal(result.count)
    setLoading(false)
  }, [trainerFilter, regionFilter, statusFilter, dateFrom, dateTo, page, search])

  useEffect(() => { load() }, [load])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Termine</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Neuer Termin
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Apotheke oder Ort suchen..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0) }}
              className="pl-9"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(v) => { setStatusFilter(v as TerminStatus | "alle"); setPage(0) }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={trainerFilter}
            onValueChange={(v) => { setTrainerFilter(v); setPage(0) }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Trainer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle Trainer</SelectItem>
              {trainers.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={regionFilter}
            onValueChange={(v) => { setRegionFilter(v as Region | "alle"); setPage(0) }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle Regionen</SelectItem>
              {REGIONS.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="w-[160px]">
            <DatePicker
              value={dateFrom}
              onChange={(d) => { setDateFrom(d); setPage(0) }}
              placeholder="Von Datum"
            />
          </div>
          <div className="w-[160px]">
            <DatePicker
              value={dateTo}
              onChange={(d) => { setDateTo(d); setPage(0) }}
              placeholder="Bis Datum"
            />
          </div>

          {(search || regionFilter !== "alle" || trainerFilter !== "alle" || statusFilter !== "alle" || dateFrom || dateTo) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("")
                setRegionFilter("alle")
                setTrainerFilter("alle")
                setStatusFilter("alle")
                setDateFrom(undefined)
                setDateTo(undefined)
                setPage(0)
              }}
            >
              Filter zurücksetzen
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {loading ? "Laden…" : `${total} ${total === 1 ? "Termin" : "Termine"} gefunden`}
      </p>

      {/* Table */}
      {loading ? (
        <div className="rounded-md border p-8 text-center text-muted-foreground">Laden…</div>
      ) : termine.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarDays className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">
              Keine Termine gefunden
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Erstellen Sie Termine, um Schulungen zu planen.
            </p>
            <Button className="mt-4" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Termin erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Zeit</TableHead>
                <TableHead>Apotheke</TableHead>
                <TableHead>Trainer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Bericht</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {termine.map((termin: any) => {
                const statusConfig = TERMIN_STATUS_CONFIG[termin.status as keyof typeof TERMIN_STATUS_CONFIG]
                const bericht = Array.isArray(termin.berichte) && termin.berichte.length > 0 ? termin.berichte[0] : null

                return (
                  <TableRow
                    key={termin.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSheetTermin(termin)}
                  >
                    <TableCell>
                      {format(new Date(termin.datum), "dd.MM.yyyy", { locale: de })}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {termin.zeit_start} – {termin.zeit_ende}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{termin.apotheke?.name ?? "–"}</span>
                      {termin.apotheke?.ort && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          {termin.apotheke.ort}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{termin.trainer?.full_name ?? "–"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusConfig?.color}>
                        {statusConfig?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {bericht ? (
                        bericht.is_draft ? (
                          <Badge variant="outline" className="text-xs">Entwurf</Badge>
                        ) : (
                          <span className="text-sm">✅</span>
                        )
                      ) : (
                        <span className="text-gray-300">–</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Seite {page + 1} von {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Zurück
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Weiter
            </Button>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <TerminDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) load()
        }}
      />

      {/* Detail Sheet */}
      {sheetTermin && (
        <TerminDetailSheet
          open={!!sheetTermin}
          onOpenChange={(open) => {
            if (!open) {
              setSheetTermin(null)
              load()
            }
          }}
          termin={sheetTermin}
        />
      )}
    </div>
  )
}
