import type { PatientSex } from '@/lib/database.types'

/**
 * Shared option lists and formatting helpers for the Patienten-Verwaltung
 * feature (PROJ-3). Kept framework-agnostic so they can be unit-tested.
 */

/** Common species shown in the dropdown. "__other__" reveals a free-text field. */
export const SPECIES_PRESETS = [
  'Hund',
  'Katze',
  'Pferd',
  'Kaninchen',
  'Meerschweinchen',
  'Vogel',
] as const

/** Sentinel value used by the species <Select> to switch to free-text input. */
export const SPECIES_OTHER = '__other__'

export const SEX_OPTIONS: { value: PatientSex; label: string }[] = [
  { value: 'male', label: 'Männlich' },
  { value: 'female', label: 'Weiblich' },
  { value: 'male_neutered', label: 'Männlich (kastriert)' },
  { value: 'female_spayed', label: 'Weiblich (kastriert)' },
  { value: 'unknown', label: 'Unbekannt' },
]

export function sexLabel(sex: PatientSex | null | undefined): string {
  if (!sex) return '—'
  return SEX_OPTIONS.find((o) => o.value === sex)?.label ?? '—'
}

/**
 * Returns a human-readable age from a birth date (ISO `YYYY-MM-DD`), e.g.
 * "3 Jahre", "5 Monate", "11 Tage". Returns null for empty/invalid/future dates.
 */
export function formatAge(birthDate: string | null | undefined, now: Date = new Date()): string | null {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  if (Number.isNaN(birth.getTime()) || birth > now) return null

  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()
  let days = now.getDate() - birth.getDate()

  if (days < 0) months -= 1
  if (months < 0) {
    years -= 1
    months += 12
  }

  if (years >= 1) return `${years} ${years === 1 ? 'Jahr' : 'Jahre'}`
  if (months >= 1) return `${months} ${months === 1 ? 'Monat' : 'Monate'}`

  const dayDiff = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24))
  return `${dayDiff} ${dayDiff === 1 ? 'Tag' : 'Tage'}`
}

/** Formats an ISO date as a German short date (e.g. "5. Juni 2026"). */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** Initials for a patient/owner avatar fallback. */
export function nameInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase() || '?'
  )
}
