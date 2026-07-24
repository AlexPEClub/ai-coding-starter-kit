// Rollenmodell TMS 2.0 — siehe features/PROJ-1-auth-rollen.md
// Mehrere Rollen pro Nutzer möglich. Werte werden in profiles.roles (Array) gespeichert.

export const USER_ROLES = [
  "admin",
  "arbeitsvorbereitung",
  "wareneingang",
  "werker",
  "qs",
  "warenausgang",
  "fahrer",
  "redaktion",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** Anzeige-Labels (Deutsch) für UI-Ausgaben. */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin / Verwaltung",
  arbeitsvorbereitung: "Arbeitsvorbereitung",
  wareneingang: "Wareneingang",
  werker: "Werker / Maschine",
  qs: "Qualitätssicherung",
  warenausgang: "Warenausgang",
  fahrer: "Fahrer",
  redaktion: "Redaktion",
};

/** Startseite je Rolle nach dem Login. */
export const ROLE_HOME: Record<UserRole, string> = {
  admin: "/dashboard",
  arbeitsvorbereitung: "/dashboard",
  wareneingang: "/dashboard",
  werker: "/dashboard",
  qs: "/dashboard",
  warenausgang: "/dashboard",
  fahrer: "/dashboard",
  redaktion: "/verwaltung/wissensbasis",
};

export function roleLabel(role: UserRole): string {
  return ROLE_LABELS[role] ?? role;
}

/** Mehrere Rollen als lesbare Liste, z.B. "Fahrer, Wareneingang". */
export function rolesLabel(roles: UserRole[]): string {
  return roles.map(roleLabel).join(", ");
}

/** Hat der Nutzer (mindestens) die Admin-Rolle? */
export function isAdmin(roles: UserRole[] | null | undefined): boolean {
  return !!roles?.includes("admin");
}

/** Hat der Nutzer (mindestens) die Redaktion-Rolle? */
export function isRedaktion(roles: UserRole[] | null | undefined): boolean {
  return !!roles?.includes("redaktion");
}

/** Kontostatus eines Nutzers. */
export type UserStatus = "aktiv" | "deaktiviert";
