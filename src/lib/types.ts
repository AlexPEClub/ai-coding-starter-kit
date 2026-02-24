// Shared types for the Apo-Schulungs-Manager

export type UserRole = "admin" | "trainer" | "management"

export type Region = "OÖ" | "Salzburg" | "Tirol" | "Vorarlberg"

export type Priority = "normal" | "top_kunde"

export type TerminStatus = "geplant" | "fixiert" | "durchgefuehrt" | "abgesagt"

export interface UserProfile {
  id: string
  full_name: string
  email: string
  role: UserRole
  is_active: boolean
  created_at: string
  calendar_token: string
}

export interface Apotheke {
  id: string
  name: string
  address: string
  plz: string
  ort: string
  region: Region
  priority: Priority
  notes: string
  deleted_at: string | null
  created_at: string
  created_by: string
  // computed/joined
  termin_count?: number
}

export interface Tour {
  id: string
  name: string
  trainer_id: string
  region: Region
  start_date: string
  end_date: string
  created_at: string
}

export interface Termin {
  id: string
  tour_id: string | null
  apotheke_id: string
  trainer_id: string
  datum: string
  zeit_start: string
  zeit_ende: string
  status: TerminStatus
  notiz: string
  cancel_reason: string | null
  created_by: string
  created_at: string
  // joined data
  apotheke?: Apotheke
  trainer?: UserProfile
}

export interface Bericht {
  id: string
  termin_id: string
  teilnehmer_anzahl: number
  dauer_stunden: number
  rating_verstaendlichkeit: number
  rating_nutzbarkeit: number
  rating_kompetenz: number
  themen: string
  interne_notiz: string
  is_draft: boolean
  submitted_at: string | null
  submitted_by: string
}

// Constants
export const REGIONS: Region[] = ["OÖ", "Salzburg", "Tirol", "Vorarlberg"]

export const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "top_kunde", label: "Top-Kunde" },
]

export const TERMIN_STATUS_CONFIG: Record<TerminStatus, { label: string; color: string }> = {
  geplant: { label: "Geplant", color: "bg-blue-100 text-blue-800" },
  fixiert: { label: "Fixiert", color: "bg-amber-100 text-amber-800" },
  durchgefuehrt: { label: "Durchgeführt", color: "bg-green-100 text-green-800" },
  abgesagt: { label: "Abgesagt", color: "bg-gray-100 text-gray-500" },
}
