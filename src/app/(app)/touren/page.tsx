"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Plus, Search, Route, Loader2 } from "lucide-react"
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

import { getTouren } from "@/lib/actions/touren"
import { getUsers } from "@/lib/actions/users"
import { REGIONS } from "@/lib/types"
import type { Region } from "@/lib/types"
import { TourDialog } from "@/components/tour-dialog"

export default function TourenPage() {
  const [touren, setTouren] = useState<any[]>([])
  const [trainers, setTrainers] = useState<{ id: string; full_name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [regionFilter, setRegionFilter] = useState<Region | "alle">("alle")
  const [trainerFilter, setTrainerFilter] = useState<string>("alle")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTourId, setEditTourId] = useState<string | null>(null)

  // Load trainers for filter dropdown
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
    const data = await getTouren({
      trainerId: trainerFilter !== "alle" ? trainerFilter : undefined,
      region: regionFilter !== "alle" ? regionFilter : undefined,
    })
    // Client-side search filter
    const filtered = search
      ? data.filter((tour: any) => {
        const q = search.toLowerCase()
        return (
          tour.name.toLowerCase().includes(q) ||
          (tour.trainer as any)?.full_name?.toLowerCase().includes(q)
        )
      })
      : data
    setTouren(filtered)
    setLoading(false)
  }, [search, regionFilter, trainerFilter])

  useEffect(() => { load() }, [load])

  const editTour = editTourId ? touren.find((t) => t.id === editTourId) : undefined

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Touren</h1>
        <Button onClick={() => { setEditTourId(null); setDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Neue Tour
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tour oder Trainer suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={trainerFilter}
          onValueChange={(v) => setTrainerFilter(v)}
        >
          <SelectTrigger className="w-[180px]">
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
          onValueChange={(v) => setRegionFilter(v as Region | "alle")}
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

        {(search || regionFilter !== "alle" || trainerFilter !== "alle") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("")
              setRegionFilter("alle")
              setTrainerFilter("alle")
            }}
          >
            Filter zurücksetzen
          </Button>
        )}
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {loading ? "Laden…" : `${touren.length} ${touren.length === 1 ? "Tour" : "Touren"} gefunden`}
      </p>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : touren.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Route className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">
              Keine Touren gefunden
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Erstellen Sie Ihre erste Tour, um Termine zu gruppieren.
            </p>
            <Button
              className="mt-4"
              onClick={() => { setEditTourId(null); setDialogOpen(true) }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Erste Tour erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Trainer</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Zeitraum</TableHead>
                <TableHead className="text-right">Termine</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {touren.map((tour: any) => {
                const termineCount = (tour.termine as any)?.[0]?.count ?? 0

                return (
                  <TableRow key={tour.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <Link
                        href={`/touren/${tour.id}`}
                        className="font-medium hover:underline"
                      >
                        {tour.name}
                      </Link>
                    </TableCell>
                    <TableCell>{(tour.trainer as any)?.full_name ?? "–"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{tour.region}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(tour.start_date), "dd.MM.", { locale: de })} –{" "}
                      {format(new Date(tour.end_date), "dd.MM.yyyy", { locale: de })}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {termineCount}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Tour Dialog */}
      <TourDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) { setEditTourId(null); load() }
        }}
        tour={editTour}
      />
    </div>
  )
}
