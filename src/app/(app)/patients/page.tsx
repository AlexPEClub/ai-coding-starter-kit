'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Users } from 'lucide-react'
import { nameInitials } from '@/lib/patient-options'
import type { PatientStatus } from '@/lib/database.types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PatientForm } from '@/components/patient-form'

type PatientListItem = {
  id: string
  name: string
  species: string
  breed: string | null
  photo_url: string | null
  status: PatientStatus
  owner: { first_name: string; last_name: string } | null
}

export default function PatientsPage() {
  const router = useRouter()
  const [patients, setPatients] = useState<PatientListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<PatientStatus>('active')
  const [formOpen, setFormOpen] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ status })
    if (search.trim()) params.set('search', search.trim())
    fetch(`/api/patients?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: PatientListItem[]) => setPatients(Array.isArray(data) ? data : []))
      .catch(() => setPatients([]))
      .finally(() => setLoading(false))
  }, [search, status])

  // Debounce search; reload on status change.
  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  const hasSearch = search.trim().length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-[var(--font-outfit)]">Patienten</h1>
          <p className="text-muted-foreground">Verwalte die Tiere deiner Praxis.</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Neuer Patient
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Nach Tier- oder Besitzername suchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={status} onValueChange={(v) => setStatus(v as PatientStatus)}>
          <TabsList>
            <TabsTrigger value="active">Aktiv</TabsTrigger>
            <TabsTrigger value="archived">Archiviert</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : patients.length === 0 ? (
        <EmptyState hasSearch={hasSearch} status={status} onCreate={() => setFormOpen(true)} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tier</TableHead>
                  <TableHead>Tierart</TableHead>
                  <TableHead>Besitzer</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((p) => (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/patients/${p.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 rounded-md">
                          <AvatarImage src={p.photo_url ?? undefined} className="object-cover" />
                          <AvatarFallback className="rounded-md bg-primary/20 text-primary text-xs">
                            {nameInitials(p.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{p.name}</p>
                          {p.breed && (
                            <p className="text-xs text-muted-foreground">{p.breed}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{p.species}</TableCell>
                    <TableCell>
                      {p.owner ? `${p.owner.first_name} ${p.owner.last_name}` : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>
                        {p.status === 'active' ? 'Aktiv' : 'Archiviert'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <PatientForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={(id) => router.push(`/patients/${id}`)}
      />
    </div>
  )
}

function EmptyState({
  hasSearch,
  status,
  onCreate,
}: {
  hasSearch: boolean
  status: PatientStatus
  onCreate: () => void
}) {
  // Search returned nothing
  if (hasSearch) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <Search className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium">Kein Patient gefunden</p>
          <p className="text-sm text-muted-foreground">
            Versuche einen anderen Suchbegriff.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Archived filter, but nothing archived
  if (status === 'archived') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <Users className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium">Keine archivierten Patienten</p>
        </CardContent>
      </Card>
    )
  }

  // No patients at all → primary call to action
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <Users className="h-8 w-8 text-muted-foreground" />
        <div>
          <p className="font-medium">Noch keine Patienten</p>
          <p className="text-sm text-muted-foreground">
            Lege deinen ersten Patienten an, um loszulegen.
          </p>
        </div>
        <Button onClick={onCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Ersten Patienten anlegen
        </Button>
      </CardContent>
    </Card>
  )
}
