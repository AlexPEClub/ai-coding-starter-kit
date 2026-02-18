"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Plus, Search, Pencil, Trash2 } from "lucide-react"

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

import { mockApotheken } from "@/lib/mock-data"
import { REGIONS, PRIORITIES } from "@/lib/types"
import type { Region, Priority } from "@/lib/types"
import { ApothekeDialog } from "@/components/apotheke-dialog"
import { ApothekeDeleteDialog } from "@/components/apotheke-delete-dialog"

const PAGE_SIZE = 25

export default function ApothekenPage() {
  const [search, setSearch] = useState("")
  const [regionFilter, setRegionFilter] = useState<Region | "alle">("alle")
  const [priorityFilter, setPriorityFilter] = useState<Priority | "alle">("alle")
  const [page, setPage] = useState(0)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return mockApotheken
      .filter((a) => a.deleted_at === null)
      .filter((a) => {
        if (regionFilter !== "alle" && a.region !== regionFilter) return false
        if (priorityFilter !== "alle" && a.priority !== priorityFilter) return false
        if (search) {
          const q = search.toLowerCase()
          return (
            a.name.toLowerCase().includes(q) ||
            a.ort.toLowerCase().includes(q) ||
            a.plz.includes(q)
          )
        }
        return true
      })
  }, [search, regionFilter, priorityFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const editApotheke = editId
    ? mockApotheken.find((a) => a.id === editId)
    : undefined

  const deleteApotheke = deleteId
    ? mockApotheken.find((a) => a.id === deleteId)
    : undefined

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Apotheken</h1>
        <Button onClick={() => { setEditId(null); setDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Neue Apotheke
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Name, Ort oder PLZ suchen..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            className="pl-9"
          />
        </div>

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

        <Select
          value={priorityFilter}
          onValueChange={(v) => { setPriorityFilter(v as Priority | "alle"); setPage(0) }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Priorität" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Prioritäten</SelectItem>
            {PRIORITIES.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(search || regionFilter !== "alle" || priorityFilter !== "alle") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSearch(""); setRegionFilter("alle"); setPriorityFilter("alle"); setPage(0) }}
          >
            Filter zurücksetzen
          </Button>
        )}
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "Apotheke" : "Apotheken"} gefunden
      </p>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>PLZ</TableHead>
              <TableHead>Ort</TableHead>
              <TableHead>Priorität</TableHead>
              <TableHead className="text-right">Termine</TableHead>
              <TableHead className="w-[100px]">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Keine Apotheken gefunden.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((apotheke) => (
                <TableRow key={apotheke.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Link
                      href={`/apotheken/${apotheke.id}`}
                      className="font-medium hover:underline"
                    >
                      {apotheke.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{apotheke.region}</Badge>
                  </TableCell>
                  <TableCell>{apotheke.plz}</TableCell>
                  <TableCell>{apotheke.ort}</TableCell>
                  <TableCell>
                    {apotheke.priority === "top_kunde" ? (
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                        Top-Kunde
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Normal</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {apotheke.termin_count ?? 0}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => { e.stopPropagation(); setEditId(apotheke.id); setDialogOpen(true) }}
                        title="Bearbeiten"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setDeleteId(apotheke.id) }}
                        title="Löschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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

      {/* Add/Edit Dialog */}
      <ApothekeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        apotheke={editApotheke}
      />

      {/* Delete Confirmation Dialog */}
      <ApothekeDeleteDialog
        open={!!deleteId}
        onOpenChange={(open) => { if (!open) setDeleteId(null) }}
        apotheke={deleteApotheke}
      />
    </div>
  )
}
