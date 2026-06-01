'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Archive,
  ArchiveRestore,
  Calendar,
  ClipboardList,
  Pencil,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  formatAge,
  formatDate,
  nameInitials,
  sexLabel,
} from '@/lib/patient-options'
import type { Owner, Patient, PatientStatus } from '@/lib/database.types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { PatientForm } from '@/components/patient-form'
import { OwnerEditDialog } from '@/components/owner-edit-dialog'

type OwnerPatient = { id: string; name: string; species: string; status: PatientStatus }
type PatientDetail = Patient & {
  owner: Owner | null
  ownerPatients: OwnerPatient[]
}

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params.id

  const [patient, setPatient] = useState<PatientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [ownerEditOpen, setOwnerEditOpen] = useState(false)
  const [statusBusy, setStatusBusy] = useState(false)

  // Anamnesis inline editing
  const [anamnesis, setAnamnesis] = useState('')
  const [anamnesisDirty, setAnamnesisDirty] = useState(false)
  const [savingNotes, setSavingNotes] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/patients/${id}`)
      .then((r) => {
        if (r.status === 404) {
          setNotFound(true)
          return null
        }
        return r.ok ? r.json() : null
      })
      .then((data: PatientDetail | null) => {
        if (data) {
          setPatient(data)
          setAnamnesis(data.anamnesis ?? '')
          setAnamnesisDirty(false)
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function changeStatus(next: PatientStatus) {
    setStatusBusy(true)
    try {
      const res = await fetch(`/api/patients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(`Aktion fehlgeschlagen: ${body.error ?? res.status}`)
        return
      }
      toast.success(next === 'archived' ? 'Patient archiviert' : 'Patient reaktiviert')
      load()
    } catch (err) {
      console.error('[patient] status network error:', err)
      toast.error('Netzwerkfehler — bitte erneut versuchen.')
    } finally {
      setStatusBusy(false)
    }
  }

  async function saveNotes() {
    setSavingNotes(true)
    try {
      const res = await fetch(`/api/patients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anamnesis: anamnesis.trim() || null }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(`Speichern fehlgeschlagen: ${body.error ?? res.status}`)
        return
      }
      const next = anamnesis.trim() || null
      toast.success('Notizen gespeichert')
      setAnamnesisDirty(false)
      // Sync local patient state (no refetch → no skeleton flash) so the edit
      // dialog also reflects the saved notes.
      setPatient((prev) => (prev ? { ...prev, anamnesis: next } : prev))
    } catch (err) {
      console.error('[patient] notes network error:', err)
      toast.error('Netzwerkfehler — bitte erneut versuchen. Deine Eingaben bleiben erhalten.')
    } finally {
      setSavingNotes(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (notFound || !patient) {
    return (
      <div className="max-w-4xl space-y-4">
        <Link
          href="/patients"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Zurück zur Liste
        </Link>
        <Card>
          <CardContent className="py-16 text-center">
            <p className="font-medium">Patient nicht gefunden</p>
            <p className="text-sm text-muted-foreground">
              Dieser Patient existiert nicht oder gehört nicht zu deiner Praxis.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isArchived = patient.status === 'archived'
  const age = formatAge(patient.birth_date)

  return (
    <div className="max-w-4xl space-y-6">
      <Link
        href="/patients"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Zurück zur Liste
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 rounded-lg">
            <AvatarImage src={patient.photo_url ?? undefined} className="object-cover" />
            <AvatarFallback className="rounded-lg bg-primary/20 text-primary text-lg">
              {nameInitials(patient.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight font-[var(--font-outfit)]">
                {patient.name}
              </h1>
              <Badge variant={isArchived ? 'secondary' : 'default'}>
                {isArchived ? 'Archiviert' : 'Aktiv'}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {patient.species}
              {patient.breed ? ` · ${patient.breed}` : ''}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Bearbeiten
          </Button>
          {isArchived ? (
            <Button variant="outline" disabled={statusBusy} onClick={() => changeStatus('active')}>
              <ArchiveRestore className="mr-2 h-4 w-4" /> Reaktivieren
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={statusBusy}>
                  <Archive className="mr-2 h-4 w-4" /> Archivieren
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Patient archivieren?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {patient.name} wird aus der Standardliste entfernt und erscheint nur noch unter
                    dem Filter „Archiviert“. Du kannst den Patienten jederzeit reaktivieren.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction onClick={() => changeStatus('archived')}>
                    Archivieren
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Tierdaten */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tierdaten</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="Tierart" value={patient.species} />
            <Field label="Rasse" value={patient.breed ?? '—'} />
            <Field
              label="Geburtsdatum"
              value={
                patient.birth_date
                  ? `${formatDate(patient.birth_date)}${age ? ` (${age})` : ''}`
                  : '—'
              }
            />
            <Field label="Geschlecht" value={sexLabel(patient.sex)} />
            <Field
              label="Gewicht"
              value={patient.weight_kg != null ? `${patient.weight_kg} kg` : '—'}
            />
            <Field label="Angelegt am" value={formatDate(patient.created_at)} />
          </dl>
        </CardContent>
      </Card>

      {/* Besitzer */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Besitzer</CardTitle>
          {patient.owner && (
            <Button variant="ghost" size="sm" onClick={() => setOwnerEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" /> Bearbeiten
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {patient.owner ? (
            <>
              <dl className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Name"
                  value={`${patient.owner.first_name} ${patient.owner.last_name}`}
                />
                <Field label="E-Mail" value={patient.owner.email ?? '—'} />
                <Field label="Telefon" value={patient.owner.phone ?? '—'} />
              </dl>

              {patient.ownerPatients.length > 1 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-muted-foreground">
                    Weitere Tiere dieses Besitzers
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {patient.ownerPatients
                      .filter((op) => op.id !== patient.id)
                      .map((op) => (
                        <Link key={op.id} href={`/patients/${op.id}`}>
                          <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                            {op.name} · {op.species}
                            {op.status === 'archived' ? ' (archiviert)' : ''}
                          </Badge>
                        </Link>
                      ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Kein Besitzer verknüpft.</p>
          )}
        </CardContent>
      </Card>

      {/* Anamnese / Notizen */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Anamnese / Notizen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            rows={5}
            placeholder="Klinische Notizen, Vorgeschichte…"
            value={anamnesis}
            onChange={(e) => {
              setAnamnesis(e.target.value)
              setAnamnesisDirty(true)
            }}
          />
          <div className="flex justify-end">
            <Button size="sm" disabled={!anamnesisDirty || savingNotes} onClick={saveNotes}>
              {savingNotes ? 'Speichern…' : 'Notizen speichern'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder sections */}
      <div className="grid gap-6 sm:grid-cols-2">
        <PlaceholderCard
          icon={<Calendar className="h-4 w-4" />}
          title="Termine"
          hint="Terminverwaltung folgt (PROJ-16)."
        />
        <PlaceholderCard
          icon={<ClipboardList className="h-4 w-4" />}
          title="Trainingspläne"
          hint="Trainingsplan-Builder folgt (PROJ-5)."
        />
      </div>

      {/* Dialogs */}
      <PatientForm
        open={editOpen}
        onOpenChange={setEditOpen}
        patient={patient}
        onSaved={() => load()}
      />
      {patient.owner && (
        <OwnerEditDialog
          open={ownerEditOpen}
          onOpenChange={setOwnerEditOpen}
          owner={patient.owner}
          onSaved={() => load()}
        />
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  )
}

function PlaceholderCard({
  icon,
  title,
  hint,
}: {
  icon: React.ReactNode
  title: string
  hint: string
}) {
  return (
    <Card className="border-dashed">
      <CardHeader className="flex flex-row items-center gap-2 space-y-0">
        <span className="text-muted-foreground">{icon}</span>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  )
}
