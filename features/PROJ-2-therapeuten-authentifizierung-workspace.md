# PROJ-2: Therapeuten-Authentifizierung & Workspace

## Status: In Progress
**Created:** 2026-05-29
**Last Updated:** 2026-05-31

## Dependencies
- Requires: PROJ-1 (Supabase Multi-Tenant Infrastructure) — für Tenant-Isolation, Auth-Provider und Storage

## User Stories
- Als Therapeut möchte ich mich mit E-Mail + Passwort registrieren und gleichzeitig meine Praxis anlegen, damit ich sofort mit der Arbeit beginnen kann.
- Als Therapeut möchte ich mich mit meinen Zugangsdaten einloggen, damit ich auf meinen Workspace zugreifen kann.
- Als Therapeut möchte ich mein Passwort zurücksetzen können, falls ich es vergessen habe, damit ich wieder Zugang bekomme.
- Als Therapeut möchte ich mein Profil (Name, E-Mail, Telefon, Profilbild) bearbeiten können, damit meine Daten aktuell sind.
- Als Praxis-Admin möchte ich den Praxisnamen und das Logo anpassen können, damit mein Workspace meine Praxis repräsentiert.
- Als Therapeut möchte ich nach dem Login ein übersichtliches Dashboard mit Navigation sehen, damit ich schnell zu meinen Arbeitsbereichen gelange.

## Out of Scope
- Weitere Therapeuten zur selben Praxis hinzufügen — deferred to PROJ-11 (Rollen & Berechtigungen)
- Social Login / OAuth (Google, Apple etc.) — nicht im MVP
- Dashboard-Widgets, Statistiken oder KPIs — deferred to PROJ-9 (Fortschritts-Analytics)
- Praxisadresse und Kontaktdaten im Workspace — nicht notwendig für MVP
- 2-Faktor-Authentifizierung — nicht im MVP
- Einladungslinks für neue Therapeuten — deferred to PROJ-11

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

### Registrierung
- [ ] Angenommen der Therapeut ist nicht registriert, wenn er Praxisname, Vorname, Nachname, gültige E-Mail und Passwort (min. 8 Zeichen) eingibt und abschickt, dann wird sein Konto und der Workspace angelegt und er wird zum Dashboard weitergeleitet.
- [ ] Angenommen der Therapeut füllt das Registrierungsformular aus, wenn er ein Pflichtfeld leer lässt, dann wird für jedes leere Pflichtfeld eine Validierungsfehlermeldung direkt am Feld angezeigt.
- [ ] Angenommen der Therapeut versucht sich zu registrieren, wenn er eine bereits verwendete E-Mail-Adresse eingibt, dann wird die Fehlermeldung "Diese E-Mail ist bereits registriert" angezeigt.
- [ ] Angenommen der Therapeut gibt ein Passwort ein, wenn es kürzer als 8 Zeichen ist, dann wird eine Fehlermeldung "Passwort muss mindestens 8 Zeichen haben" angezeigt.
- [ ] Angenommen die Registrierung erfolgreich war, dann wird der erste Therapeut automatisch als Admin des neu erstellten Workspaces gesetzt.

### Login
- [ ] Angenommen der Therapeut ist nicht eingeloggt, wenn er korrekte E-Mail und Passwort eingibt, dann wird er zum Dashboard weitergeleitet.
- [ ] Angenommen der Therapeut gibt falsche Zugangsdaten ein, dann wird die generische Fehlermeldung "E-Mail oder Passwort ist falsch" angezeigt (kein Hinweis, welches falsch ist).
- [ ] Angenommen der Therapeut ist bereits eingeloggt, wenn er die Login-Seite aufruft, dann wird er direkt zum Dashboard weitergeleitet.

### Passwort zurücksetzen
- [ ] Angenommen der Therapeut hat sein Passwort vergessen, wenn er seine E-Mail eingibt und auf "Passwort zurücksetzen" klickt, dann erhält er eine E-Mail mit einem Reset-Link (gültig für 24 Stunden).
- [ ] Angenommen der Therapeut klickt auf einen gültigen Reset-Link und gibt ein neues Passwort ein, dann wird das Passwort geändert und er wird zur Login-Seite weitergeleitet.
- [ ] Angenommen der Therapeut klickt auf einen abgelaufenen oder bereits verwendeten Reset-Link, dann wird die Fehlermeldung "Dieser Link ist nicht mehr gültig. Bitte fordere einen neuen an." angezeigt.

### Therapeuten-Profil
- [ ] Angenommen der Therapeut ist eingeloggt, wenn er im Profil Vorname, Nachname oder Telefonnummer ändert und speichert, dann werden die Änderungen sofort gespeichert und angezeigt.
- [ ] Angenommen der Therapeut möchte seine E-Mail ändern, wenn er eine neue E-Mail eingibt und speichert, dann erhält er eine Bestätigungsmail an die neue Adresse; die alte E-Mail bleibt bis zur Bestätigung aktiv.
- [ ] Angenommen der Therapeut lädt ein Profilbild hoch, wenn die Datei größer als 5 MB ist oder kein Bild-Format (jpg/png/webp) ist, dann wird eine Fehlermeldung angezeigt und das alte Bild bleibt erhalten.
- [ ] Angenommen der Therapeut lädt ein gültiges Profilbild hoch, dann wird es gespeichert und sofort in der Sidebar/Navigation angezeigt.

### Workspace-Einstellungen
- [ ] Angenommen der Admin ist eingeloggt, wenn er den Praxisnamen ändert und speichert, dann wird der neue Name sofort in der App-Shell und auf dem Dashboard angezeigt.
- [ ] Angenommen der Admin lädt ein gültiges Logo-Bild hoch (max. 5 MB, jpg/png/webp), dann erscheint es in der Sidebar-Navigation anstelle des Platzhalters.

### Session & Logout
- [ ] Angenommen die Session läuft im Hintergrund ab, wenn Supabase ein neues Token ausstellt, dann wird die Session still erneuert ohne Unterbrechung für den Nutzer.
- [ ] Angenommen das Token ist abgelaufen und kann nicht erneuert werden, wenn der Therapeut eine Aktion ausführt, dann wird er zur Login-Seite weitergeleitet mit der Meldung "Deine Session ist abgelaufen. Bitte melde dich erneut an."
- [ ] Angenommen der Therapeut ist eingeloggt, wenn er auf "Abmelden" klickt, dann wird die Session beendet und er wird zur Login-Seite weitergeleitet.

### App-Shell & Navigation
- [ ] Angenommen der Therapeut ist eingeloggt, dann sieht er eine Sidebar mit folgenden Navigationspunkten: Dashboard, Patienten, Termine, Übungen, Trainingspläne, Einstellungen.
- [ ] Angenommen der Therapeut ist eingeloggt, dann zeigt das Dashboard den Praxisnamen und eine Willkommensnachricht mit dem Vornamen des Therapeuten.
- [ ] Angenommen ein nicht-eingeloggter Nutzer versucht eine geschützte Seite aufzurufen, dann wird er zur Login-Seite weitergeleitet.

## Edge Cases
- Registrierung mit bereits verwendeter E-Mail (generische Fehlermeldung, kein Account-Enumeration)
- Passwort-Reset-Link abgelaufen (nach 24h) oder bereits verwendet
- E-Mail-Änderung: Bestätigungsmail kommt nie an — alter Account bleibt weiter aktiv; Therapeut kann Änderung erneut anfordern
- Profilbild-Upload schlägt fehl (Netzwerkfehler) — altes Bild bleibt erhalten, Fehlermeldung erscheint
- Praxisname leer lassen in den Einstellungen — Validierungsfehler, Pflichtfeld
- Mehrere Browser-Tabs gleichzeitig offen — Session-Ablauf in einem Tab wirkt sich auf alle aus (redirect)
- Direktaufruf einer geschützten URL ohne Session — Redirect zur Login-Seite, nach Login Weiterleitung zur ursprünglichen URL

## Technical Requirements (optional)
- Security: Passwörter werden nie im Klartext gespeichert (Supabase Auth)
- Security: Kein Account-Enumeration bei Login/Passwort-Reset (generische Fehlermeldungen)
- Performance: Login-Redirect < 500ms nach erfolgreicher Authentifizierung
- Storage: Profilbilder und Logos in Supabase Storage, Bucket per Tenant isoliert

## Open Questions
- [x] ~~Soll nach der Registrierung eine E-Mail-Verifizierung erzwungen werden?~~ → Entschieden: Nein, für Beta deaktiviert.

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| E-Mail ist änderbar (mit Bestätigungsmail) | E-Mails können sich durch Heirat oder andere Namenswechsel ändern; Bestätigung verhindert Lockout | 2026-05-29 |
| Erster Therapeut = automatisch Workspace-Admin | Eindeutiger Ownership beim Anlegen der Praxis; weitere Therapeuten via PROJ-11 | 2026-05-29 |
| Praxisname muss nicht global eindeutig sein | Jede Praxis ist durch Tenant-ID isoliert; Namenskollisionen sind kein Problem | 2026-05-29 |
| Weitere Therapeuten hinzufügen → PROJ-11 | Zu komplex für MVP-Auth-Feature; Rollen & Berechtigungen sind ein eigenes System | 2026-05-29 |
| Generische Fehlermeldungen bei Login/Reset | Verhindert Account-Enumeration (Angreifer kann nicht herausfinden, ob eine E-Mail existiert) | 2026-05-29 |
| App-Shell mit Navigations-Platzhaltern in PROJ-2 | Gibt sofort eine funktionierende Grundstruktur; Inhalte füllen PROJ-3, PROJ-16 etc. | 2026-05-29 |
| Maximale Dateigröße für Bilder: 5 MB | Sinnvoller Kompromiss zwischen Qualität und Storage-Kosten für MVP | 2026-05-29 |
| Keine E-Mail-Verifizierung nach Registrierung (Beta) | Reduziert Onboarding-Hürden für Beta-Therapeuten; kann nach Beta aktiviert werden | 2026-05-29 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| _To be added by /architecture_ | | |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Architecture decisions (decided during /backend)

| Decision | Rationale | Date |
|----------|-----------|------|
| Auth flows are client-side only (no API routes) | Supabase Auth JS SDK handles signUp/signIn/resetPassword natively; server route adds boilerplate without benefit | 2026-05-31 |
| Image uploads direct to Supabase Storage from browser | No server bandwidth cost; size/type validated by storage bucket config (5 MB, jpg/png/webp) | 2026-05-31 |
| `full_name` kept as derived field alongside `first_name` / `last_name` | Zero data loss; backward compatibility for any future queries using `full_name` | 2026-05-31 |
| `/api/workspace` PUT checks `role = 'owner'` in application layer | RLS also enforces this via `tenants_update_owner_only` policy — two-layer defense | 2026-05-31 |

### Implementation Notes

**Migration 002 adds:**
- `profiles`: `first_name`, `last_name`, `phone`, `avatar_url`
- `tenants`: `logo_url`
- RLS policy `tenants_update_owner_only` (owners only)
- Storage buckets `profile-avatars` and `workspace-logos` with RLS
- Updated `handle_new_user()` trigger to populate `first_name`/`last_name`

**API Routes created:**
- `GET/PUT /api/profile` — read/update own profile
- `GET/PUT /api/workspace` — read/update workspace (owner-only writes)
- `GET /api/auth/callback` — PKCE code exchange for password-reset emails

**Proxy (`src/proxy.ts`)** — Next.js 16 uses `proxy.ts` instead of `middleware.ts`:
- Protects `/dashboard`, `/patients`, `/appointments`, `/exercises`, `/training-plans`, `/settings`
- Redirects unauthenticated users to `/login?next=<path>`
- Redirects authenticated users away from auth pages to `/dashboard`

**Storage path conventions:**
- Profile avatars: `profile-avatars/{tenant_id}/{user_id}/avatar.{ext}`
- Workspace logos: `workspace-logos/{tenant_id}/logo.{ext}`

**Frontend pages built (2026-05-31):**
- `/login` — Email + password login with generic error messages (no account enumeration)
- `/register` — Practice name, first/last name, email, password → Supabase signUp with user_metadata
- `/forgot-password` — Email form → Supabase resetPasswordForEmail; always shows success (no enumeration)
- `/reset-password` — New password form → supabase.auth.updateUser; handles expired link errors
- `/(app)/dashboard` — Server-rendered welcome page with practice name + placeholder metric cards
- `/(app)/settings/profile` — Edit first/last name, phone; avatar upload direct to Supabase Storage
- `/(app)/settings/workspace` — Edit practice name; logo upload direct to Supabase Storage (owners only)
- `AppSidebar` component — Dark sage sidebar with navigation, user avatar dropdown, logout button
- Root `/` — Server-side redirect to `/dashboard` or `/login` based on session

**Design system applied:**
- TierPhysio sage green (`hsl(154 26% 35%)`) as primary color
- Inter + Outfit fonts loaded via `next/font/google`
- Dark sidebar with `hsl(154 30% 14%)` background
- ThemeProvider from `next-themes` for future dark mode toggle

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
