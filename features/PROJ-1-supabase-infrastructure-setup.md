# PROJ-1: Supabase Infrastructure Setup

## Status: Planned
**Created:** 2026-06-06
**Last Updated:** 2026-06-06

## Dependencies
- None (Basis für alle anderen Features)

## User Stories
- Als Stefan möchte ich mich mit E-Mail und Passwort einloggen, damit NORAs Dashboard vor unberechtigtem Zugriff geschützt ist.
- Als Stefan möchte ich, dass alle NORAs Vorschläge dauerhaft gespeichert werden, damit ich den Verlauf jederzeit einsehen kann.
- Als Entwickler möchte ich eine sauber konfigurierte Supabase-Instanz mit klarem Schema, damit PROJ-2 und PROJ-3 darauf aufbauen können.
- Als Stefan möchte ich eingeloggt bleiben, damit ich das Dashboard nicht täglich neu öffnen muss.
- Als Stefan möchte ich mich ausloggen können, damit der Zugriff auf fremden Geräten geschützt ist.

## Out of Scope
- Registrierung neuer Nutzer — nur Stefan nutzt die App, kein öffentlicher Sign-up
- Passwort-Reset per E-Mail — kann in PROJ-6 nachgerüstet werden
- OAuth / Social Login (Google, GitHub) — nicht notwendig für Single-User-App
- Row Level Security Policies — Single User, kein Multi-Tenant-Bedarf im MVP
- Supabase Storage (Datei-Uploads) — kein Datei-Upload im MVP vorgesehen
- Supabase Realtime — kein Live-Update-Bedarf im MVP
- Mehrere Umgebungen (Staging/Production) — MVP nutzt eine Supabase-Instanz

## Acceptance Criteria

- [ ] Angenommen die App ist gestartet, wenn Stefan die URL öffnet und nicht eingeloggt ist, dann wird er automatisch zur Login-Seite weitergeleitet
- [ ] Angenommen Stefan ist auf der Login-Seite, wenn er E-Mail und Passwort eingibt und abschickt, dann wird er ins Dashboard weitergeleitet
- [ ] Angenommen Stefan gibt falsche Zugangsdaten ein, wenn er das Formular abschickt, dann erscheint eine klare Fehlermeldung ohne technischen Stack-Trace
- [ ] Angenommen Stefan ist eingeloggt, wenn er den Browser schließt und wieder öffnet, dann ist er noch eingeloggt (Session-Persistenz)
- [ ] Angenommen Stefan ist eingeloggt, wenn er auf „Abmelden" klickt, dann wird die Session beendet und er landet auf der Login-Seite
- [ ] Angenommen die Supabase-Verbindung schlägt fehl, wenn ein API-Call gemacht wird, dann wird ein nutzerfreundlicher Fehler angezeigt (kein weißer Screen)
- [ ] Angenommen das Datenbankschema ist deployed, wenn ein neuer Vorschlag gespeichert wird, dann ist er in der `suggestions`-Tabelle mit allen Pflichtfeldern abrufbar
- [ ] Angenommen das Schema ist deployed, wenn ein Implementation-Eintrag angelegt wird, dann ist die Verbindung zur zugehörigen `suggestions`-Zeile über `suggestion_id` intakt
- [ ] Angenommen Umgebungsvariablen fehlen, wenn die App startet, dann gibt es eine klare Fehlermeldung beim Build/Start (fail fast)

## Datenbankschema

### Tabelle: `suggestions`
| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| `id` | uuid, PK | Eindeutige ID |
| `created_at` | timestamptz | Erstellungszeitpunkt |
| `report_date` | date | Datum des Reports (z.B. 2026-06-07) |
| `category` | text | `marketing` / `product` / `operations` |
| `title` | text | Kurztitel des Vorschlags |
| `body` | text | Vollständiger Vorschlagstext |
| `insight` | text | NORAs Begründung / Insight |
| `source` | text | Datenquelle (z.B. „Google Drive → QualiPilot/README.md") |
| `status` | text | `pending` / `approved` / `rejected` |
| `reviewed_at` | timestamptz | Zeitpunkt der Bestätigung/Ablehnung |

### Tabelle: `implementations`
| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| `id` | uuid, PK | Eindeutige ID |
| `created_at` | timestamptz | Erstellungszeitpunkt |
| `suggestion_id` | uuid, FK → suggestions.id | Zugehöriger Vorschlag |
| `monday_task_id` | text, nullable | ID des angelegten Monday.com Tasks |
| `monday_task_url` | text, nullable | URL des Monday.com Tasks |
| `notion_page_id` | text, nullable | ID des angelegten Notion-Dokuments |
| `notion_page_url` | text, nullable | URL des Notion-Dokuments |
| `status` | text | `pending` / `done` / `failed` |
| `error_message` | text, nullable | Fehlermeldung bei fehlgeschlagener Umsetzung |

### Tabelle: `daily_reports`
| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| `id` | uuid, PK | Eindeutige ID |
| `created_at` | timestamptz | Erstellungszeitpunkt |
| `report_date` | date, unique | Datum des Reports |
| `suggestions_count` | int | Anzahl generierter Vorschläge |
| `email_sent_at` | timestamptz, nullable | Zeitpunkt des E-Mail-Versands |
| `email_status` | text | `pending` / `sent` / `failed` |

## Edge Cases
- **Leeres Login-Formular:** Beide Felder sind required — Submit-Button bleibt deaktiviert bis beide ausgefüllt sind
- **Netzwerkfehler beim Login:** Toast-Fehlermeldung, Formular bleibt ausgefüllt, kein Datenverlust
- **Supabase Down:** App zeigt Maintenance-Banner, kein White Screen
- **Doppelter Report für dasselbe Datum:** `report_date` in `daily_reports` ist UNIQUE — verhindert doppelte Reports per DB-Constraint
- **Fehlende Umgebungsvariablen:** Expliziter Check beim App-Start mit klarer Fehlermeldung welche Variable fehlt
- **Abgelaufene Session:** Automatische Weiterleitung zur Login-Seite, kein stiller Fehler

## Technical Requirements
- **Auth:** Supabase Auth mit Email/Password
- **Session:** Persistente Session via localStorage (Supabase Standard)
- **Umgebungsvariablen:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (für Server-side)
- **Client:** `@supabase/supabase-js` + `@supabase/ssr` für Next.js App Router
- **Middleware:** Next.js Middleware für Route Protection (alle Seiten außer `/login` erfordern Auth)

## Open Questions
- [ ] Soll die initiale Supabase-Instanz auf dem EU-Server gehostet werden (DSGVO-Konformität für Nexora AI)?
- [ ] Wird ein Service Role Key für Server-side Actions benötigt (für PROJ-2 Suggestion Engine)?

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Email/Password Auth (kein OAuth) | Single-User-App, kein öffentlicher Sign-up nötig, einfachste Lösung | 2026-06-06 |
| 3 Tabellen für MVP | suggestions + implementations + daily_reports decken PROJ-2, PROJ-3 und PROJ-6 vollständig ab | 2026-06-06 |
| Kein Multi-Tenant / RLS | Stefan ist einziger Nutzer — RLS würde Komplexität ohne Mehrwert hinzufügen | 2026-06-06 |
| Kein Passwort-Reset im MVP | Stefan kennt sein Passwort; Feature kann in PROJ-6 nachgerüstet werden | 2026-06-06 |

### Technical Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| `@supabase/ssr` statt `@supabase/auth-helpers-nextjs` | Offiziell empfohlen für Next.js App Router; verwaltet Sessions korrekt über Cookies (SSR + Middleware kompatibel) | 2026-06-06 |
| Cookies statt localStorage für Sessions | `@supabase/ssr` verwendet Cookies — funktioniert in Middleware und Server Components; localStorage wäre nur clientseitig verfügbar | 2026-06-06 |
| Next.js Middleware für Route-Schutz | Läuft auf dem Edge vor jedem Render — kein clientseitiges Flackern, kein kurzes Aufleuchten geschützter Seiten | 2026-06-06 |
| EU-Region Frankfurt für Supabase | Nexora AI bedient Pharma/Healthcare im DACH-Raum — DSGVO erfordert EU-Hosting | 2026-06-06 |
| RLS mit „nur Auth-Nutzer" Policy | Backend-Regeln fordern immer RLS. Policy erlaubt alle Operationen für eingeloggte Nutzer — schützt DB ohne Multi-Tenant-Komplexität | 2026-06-06 |
| Service Role Key serverseitig | Für PROJ-2 Suggestion Engine nötig — schreibt ohne User-Context in die DB | 2026-06-06 |
| Nutzer manuell im Supabase Dashboard anlegen | Single-User-App, kein Sign-up in der App. Stefan wird einmalig in der Supabase-Konsole angelegt | 2026-06-06 |

---

## Tech Design (Solution Architect)

### Komponenten-Struktur

```
App (Next.js App Router)
│
├── middleware.ts                      ← NEU: läuft vor jedem Request auf dem Edge
│   └── Session prüfen → fehlt? → Redirect zu /login
│
├── /login                             ← Öffentliche Route (kein Auth nötig)
│   └── LoginPage
│       ├── Branding (NEXORA AI Logo + NORA-Status-Badge)
│       └── LoginForm
│           ├── Input — E-Mail         (shadcn/ui — bereits installiert)
│           ├── Input — Passwort       (shadcn/ui — bereits installiert)
│           ├── Button — Anmelden      (shadcn/ui — bereits installiert)
│           └── Alert — Fehlermeldung  (shadcn/ui — bereits installiert)
│
└── /dashboard, /history, /settings   ← Geschützte Routen (PROJ-3 baut hier auf)
    └── [Middleware leitet zu /login wenn keine Session]
```

### Datenebene

```
Supabase Projekt (EU-Region — Frankfurt, DSGVO-konform)
│
├── Auth — Email + Passwort
│   └── 1 Nutzer: billichstefan@gmail.com
│       (einmalig manuell im Supabase Dashboard anlegen — kein App-Sign-up)
│
├── Tabelle: suggestions
│   └── RLS Policy: nur eingeloggte Nutzer dürfen lesen / schreiben
│
├── Tabelle: implementations
│   └── RLS Policy: nur eingeloggte Nutzer dürfen lesen / schreiben
│
└── Tabelle: daily_reports
    └── RLS Policy: nur eingeloggte Nutzer dürfen lesen / schreiben
```

### Neue / geänderte Dateien

```
src/
├── lib/
│   ├── supabase.ts           ← ÄNDERN: Browser-Client aktivieren (war Platzhalter)
│   └── supabase-server.ts    ← NEU: Server-Client für SSR + Server Actions
├── middleware.ts              ← NEU: Route-Schutz für alle Seiten außer /login
└── app/
    └── login/
        └── page.tsx           ← NEU: Login-Seite (Dark Premium Design)
```

### Pakete

| Paket | Zweck | Status |
|-------|-------|--------|
| `@supabase/supabase-js` | Supabase-Client | ✅ installiert (v2.39.3) |
| `@supabase/ssr` | Cookie-Sessions für Next.js App Router + Middleware | ❌ noch installieren |

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
