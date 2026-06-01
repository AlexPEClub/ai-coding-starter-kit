'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ImagePlus } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import {
  SPECIES_PRESETS,
  SPECIES_OTHER,
  SEX_OPTIONS,
  nameInitials,
} from '@/lib/patient-options'
import type { Patient } from '@/lib/database.types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { OwnerPicker } from '@/components/owner-picker'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB

export const PatientFormSchema = z
  .object({
    name: z.string().min(1, 'Tiername ist erforderlich').max(120),
    speciesSelect: z.string().min(1, 'Tierart ist erforderlich'),
    speciesOther: z.string().max(80).optional().or(z.literal('')),
    breed: z.string().max(120).optional().or(z.literal('')),
    birth_date: z.string().optional().or(z.literal('')),
    sex: z
      .enum(['male', 'female', 'male_neutered', 'female_spayed', 'unknown'])
      .optional(),
    weight_kg: z.string().optional().or(z.literal('')),
    anamnesis: z.string().max(5000).optional().or(z.literal('')),
    // Owner selection (validated in superRefine)
    ownerMode: z.enum(['existing', 'new']),
    owner_id: z.string().optional().or(z.literal('')),
    newOwnerFirstName: z.string().max(100).optional().or(z.literal('')),
    newOwnerLastName: z.string().max(100).optional().or(z.literal('')),
    newOwnerEmail: z.string().max(200).optional().or(z.literal('')),
    newOwnerPhone: z.string().max(30).optional().or(z.literal('')),
  })
  .superRefine((val, ctx) => {
    if (val.speciesSelect === SPECIES_OTHER && !val.speciesOther?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['speciesOther'],
        message: 'Bitte Tierart angeben',
      })
    }
    if (val.weight_kg && val.weight_kg.trim()) {
      const n = Number(val.weight_kg.replace(',', '.'))
      if (Number.isNaN(n) || n <= 0 || n > 2000) {
        ctx.addIssue({
          code: 'custom',
          path: ['weight_kg'],
          message: 'Ungültiges Gewicht',
        })
      }
    }
    if (val.ownerMode === 'existing') {
      if (!val.owner_id) {
        ctx.addIssue({
          code: 'custom',
          path: ['owner_id'],
          message: 'Bitte einen Besitzer wählen',
        })
      }
    } else {
      if (!val.newOwnerFirstName?.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['newOwnerFirstName'],
          message: 'Vorname ist erforderlich',
        })
      }
      if (!val.newOwnerLastName?.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['newOwnerLastName'],
          message: 'Nachname ist erforderlich',
        })
      }
      if (!val.newOwnerEmail?.trim() && !val.newOwnerPhone?.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['newOwnerEmail'],
          message: 'Mindestens E-Mail oder Telefon ist erforderlich',
        })
      }
      if (val.newOwnerEmail?.trim() && !z.email().safeParse(val.newOwnerEmail).success) {
        ctx.addIssue({
          code: 'custom',
          path: ['newOwnerEmail'],
          message: 'Ungültige E-Mail-Adresse',
        })
      }
    }
  })

export type PatientFormValues = z.infer<typeof PatientFormSchema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Existing patient → edit mode. Omit for create mode. */
  patient?: Patient | null
  /** Called with the patient id after a successful save. */
  onSaved: (patientId: string) => void
}

function buildDefaults(patient?: Patient | null): PatientFormValues {
  const isPreset = patient ? SPECIES_PRESETS.includes(patient.species as (typeof SPECIES_PRESETS)[number]) : false
  return {
    name: patient?.name ?? '',
    speciesSelect: patient ? (isPreset ? patient.species : SPECIES_OTHER) : '',
    speciesOther: patient && !isPreset ? patient.species : '',
    breed: patient?.breed ?? '',
    birth_date: patient?.birth_date ?? '',
    sex: patient?.sex ?? undefined,
    weight_kg: patient?.weight_kg != null ? String(patient.weight_kg) : '',
    anamnesis: patient?.anamnesis ?? '',
    ownerMode: 'existing',
    owner_id: patient?.owner_id ?? '',
    newOwnerFirstName: '',
    newOwnerLastName: '',
    newOwnerEmail: '',
    newOwnerPhone: '',
  }
}

export function PatientForm({ open, onOpenChange, patient, onSaved }: Props) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(patient?.photo_url ?? null)
  const [saving, setSaving] = useState(false)

  const isEdit = Boolean(patient)

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(PatientFormSchema),
    defaultValues: buildDefaults(patient),
  })

  // The dialog stays mounted between opens, so re-sync form + photo state to the
  // current source of truth whenever it opens (or the patient prop changes).
  // Without this, cancelled/uncommitted edits would persist into the next open.
  useEffect(() => {
    if (!open) return
    form.reset(buildDefaults(patient))
    setPhotoFile(null)
    setPhotoPreview(patient?.photo_url ?? null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [open, patient, form])

  const speciesSelect = form.watch('speciesSelect')

  function handlePhotoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Nur JPG, PNG und WebP sind erlaubt')
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('Datei darf maximal 5 MB groß sein')
      return
    }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function uploadPhoto(tenantId: string, patientId: string): Promise<string | null> {
    if (!photoFile) return null
    const ext = photoFile.name.split('.').pop()
    const path = `${tenantId}/${patientId}.${ext}`
    const { error } = await supabase.storage
      .from('patient-photos')
      .upload(path, photoFile, { upsert: true })
    if (error) {
      console.error('[patient-photo] upload error:', error)
      toast.error(`Foto-Upload fehlgeschlagen: ${error.message}`)
      return null
    }
    const { data } = supabase.storage.from('patient-photos').getPublicUrl(path)
    // Cache-bust so an updated photo refreshes immediately.
    return `${data.publicUrl}?v=${Date.now()}`
  }

  function resolvePayload(values: PatientFormValues) {
    const species =
      values.speciesSelect === SPECIES_OTHER
        ? values.speciesOther!.trim()
        : values.speciesSelect
    const base = {
      name: values.name.trim(),
      species,
      breed: values.breed?.trim() || null,
      birth_date: values.birth_date || null,
      sex: values.sex ?? null,
      weight_kg: values.weight_kg?.trim() ? Number(values.weight_kg.replace(',', '.')) : null,
      anamnesis: values.anamnesis?.trim() || null,
    }
    if (values.ownerMode === 'existing') {
      return { ...base, owner_id: values.owner_id }
    }
    return {
      ...base,
      new_owner: {
        first_name: values.newOwnerFirstName!.trim(),
        last_name: values.newOwnerLastName!.trim(),
        email: values.newOwnerEmail?.trim() || null,
        phone: values.newOwnerPhone?.trim() || null,
      },
    }
  }

  async function onSubmit(values: PatientFormValues) {
    setSaving(true)
    try {
      const payload = resolvePayload(values)
      const url = isEdit ? `/api/patients/${patient!.id}` : '/api/patients'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        console.error(`[patient] ${method} error:`, body)
        toast.error(`Speichern fehlgeschlagen: ${body.error ?? res.status}`)
        return // keep dialog + inputs intact on failure
      }
      const saved = (await res.json()) as Patient

      // Photo upload requires the patient id (and tenant) → do it after save.
      if (photoFile) {
        const photoUrl = await uploadPhoto(saved.tenant_id, saved.id)
        if (photoUrl) {
          await fetch(`/api/patients/${saved.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photo_url: photoUrl }),
          })
        }
      }

      toast.success(isEdit ? 'Patient gespeichert' : 'Patient angelegt')
      onSaved(saved.id)
      onOpenChange(false)
    } catch (err) {
      // True network failure (offline, DNS, aborted) — fetch rejects here.
      // Keep the dialog + inputs intact and surface a friendly error.
      console.error('[patient] save network error:', err)
      toast.error('Netzwerkfehler — bitte erneut versuchen. Deine Eingaben bleiben erhalten.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Patient bearbeiten' : 'Neuer Patient'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Aktualisiere die Tier- und Besitzerdaten.'
              : 'Lege ein neues Tier an und verknüpfe einen Besitzer.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Photo */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 rounded-lg">
                <AvatarImage src={photoPreview ?? undefined} className="object-cover" />
                <AvatarFallback className="rounded-lg bg-primary/20 text-primary">
                  {nameInitials(form.watch('name') || '?')}
                </AvatarFallback>
              </Avatar>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoPick}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="mr-2 h-4 w-4" />
                  {photoPreview ? 'Foto ändern' : 'Foto hinzufügen'}
                </Button>
                <p className="mt-1 text-xs text-muted-foreground">Max. 5 MB — JPG, PNG, WebP</p>
              </div>
            </div>

            {/* Animal data */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Tierdaten</h3>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiername</FormLabel>
                    <FormControl>
                      <Input placeholder="z. B. Max" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="speciesSelect"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tierart</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Bitte wählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SPECIES_PRESETS.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                          <SelectItem value={SPECIES_OTHER}>Andere…</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {speciesSelect === SPECIES_OTHER && (
                  <FormField
                    control={form.control}
                    name="speciesOther"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tierart (Freitext)</FormLabel>
                        <FormControl>
                          <Input placeholder="z. B. Schildkröte" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="breed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rasse (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="z. B. Labrador" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birth_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Geburtsdatum (optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="sex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Geschlecht (optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Bitte wählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SEX_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weight_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gewicht in kg (optional)</FormLabel>
                      <FormControl>
                        <Input inputMode="decimal" placeholder="z. B. 24.5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="anamnesis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anamnese / Notizen (optional)</FormLabel>
                    <FormControl>
                      <Textarea rows={4} placeholder="Klinische Notizen, Vorgeschichte…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Owner — hidden when editing (owner edited on detail page) */}
            {!isEdit && <OwnerPicker />}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Speichern…' : isEdit ? 'Änderungen speichern' : 'Patient anlegen'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
