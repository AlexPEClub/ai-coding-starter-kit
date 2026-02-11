'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LucideIcon } from '@/components/icon-picker'
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'

interface StuetzpunktService {
  service_typ_id: string
  service_typen?: { id: string; name: string; icon: string }
}

interface Stuetzpunkt {
  id: string
  name: string
  plz: string
  ort: string
  status: 'aktiv' | 'temporaer_geschlossen'
  latitude: number | null
  stuetzpunkt_services: StuetzpunktService[]
  created_at: string
}

export default function StuetzpunktePage() {
  const [stuetzpunkte, setStuetzpunkte] = useState<Stuetzpunkt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const limit = 20

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Stuetzpunkt | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    const params = new URLSearchParams({
      search,
      sortBy,
      sortDir,
      page: String(page),
      limit: String(limit),
    })

    const response = await fetch(`/api/stuetzpunkte?${params}`)
    if (response.ok) {
      const data = await response.json()
      setStuetzpunkte(data.stuetzpunkte)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } else {
      setError('Fehler beim Laden der Stützpunkte')
    }
    setIsLoading(false)
  }, [search, sortBy, sortDir, page])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Debounced search
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(column)
      setSortDir('asc')
    }
    setPage(1)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    setError(null)

    const response = await fetch(`/api/stuetzpunkte/${deleteTarget.id}`, {
      method: 'DELETE',
    })

    if (response.ok) {
      setDeleteOpen(false)
      setSuccess('Stützpunkt erfolgreich gelöscht')
      loadData()
    } else {
      const data = await response.json()
      setError(data.error)
      setDeleteOpen(false)
    }
    setIsDeleting(false)
  }

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [success])

  const SortButton = ({ column, children }: { column: string; children: React.ReactNode }) => (
    <button
      type="button"
      className="flex items-center gap-1 hover:text-foreground"
      onClick={() => handleSort(column)}
    >
      {children}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Stützpunkte</h2>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Standorte und Filialen
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/stuetzpunkte/neu">
            <Plus className="mr-2 h-4 w-4" />
            Neuer Stützpunkt
          </Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Stützpunkte
          </CardTitle>
          <CardDescription>{total} Stützpunkt{total !== 1 ? 'e' : ''} gesamt</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Nach Name, PLZ oder Ort suchen..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : stuetzpunkte.length === 0 ? (
            <div className="py-8 text-center">
              <MapPin className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                {search ? 'Keine Stützpunkte gefunden.' : 'Noch keine Stützpunkte vorhanden.'}
              </p>
              {!search && (
                <Button asChild className="mt-4" variant="outline">
                  <Link href="/admin/stuetzpunkte/neu">Ersten Stützpunkt erstellen</Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <SortButton column="name">Name</SortButton>
                    </TableHead>
                    <TableHead>
                      <SortButton column="plz">PLZ</SortButton>
                    </TableHead>
                    <TableHead>
                      <SortButton column="ort">Ort</SortButton>
                    </TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead>
                      <SortButton column="status">Status</SortButton>
                    </TableHead>
                    <TableHead>Geo</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stuetzpunkte.map((sp) => (
                    <TableRow key={sp.id}>
                      <TableCell className="font-medium">{sp.name}</TableCell>
                      <TableCell>{sp.plz}</TableCell>
                      <TableCell>{sp.ort}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {sp.stuetzpunkt_services?.slice(0, 4).map((ss) =>
                            ss.service_typen ? (
                              <span
                                key={ss.service_typ_id}
                                title={ss.service_typen.name}
                                className="flex h-6 w-6 items-center justify-center rounded bg-muted"
                              >
                                <LucideIcon name={ss.service_typen.icon} className="h-3.5 w-3.5" />
                              </span>
                            ) : null
                          )}
                          {(sp.stuetzpunkt_services?.length ?? 0) > 4 && (
                            <span className="flex h-6 items-center px-1 text-xs text-muted-foreground">
                              +{sp.stuetzpunkt_services.length - 4}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {sp.status === 'aktiv' ? (
                          <Badge variant="default">Aktiv</Badge>
                        ) : (
                          <Badge variant="secondary">Geschlossen</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {sp.latitude ? (
                          <MapPin className="h-4 w-4 text-green-600" />
                        ) : (
                          <MapPin className="h-4 w-4 text-muted-foreground/30" />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild title="Bearbeiten">
                            <Link href={`/admin/stuetzpunkte/${sp.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Löschen"
                            onClick={() => {
                              setDeleteTarget(sp)
                              setDeleteOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Seite {page} von {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Zurück
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Weiter
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stützpunkt löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie den Stützpunkt &quot;{deleteTarget?.name}&quot; wirklich löschen?
              Dies kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
