# PROJ-1: Supabase Infrastructure Setup

## Status: Approved
**Created:** 2026-06-21
**Last Updated:** 2026-06-21

## Dependencies
- None

## User Stories
- Als Entwickler möchte ich einen typisierten Supabase-Client importieren können, damit ich in jedem Feature sofort mit Datenbankabfragen starten kann.
- Als Entwickler möchte ich beim Starten der App eine klare Fehlermeldung sehen, wenn Umgebungsvariablen fehlen, damit ich Konfigurationsfehler sofort erkenne.
- Als Entwickler möchte ich eine `.env.local.example`-Datei im Repo finden, damit ich beim Clonen weiß, welche Variablen ich setzen muss.
- Als Entwickler möchte ich automatisch generierte TypeScript-Typen für das Datenbankschema nutzen, damit ich typsicher auf Daten zugreifen kann.
- Als Entwickler möchte ich eine `profiles`-Tabelle mit RLS als Fundament für alle Auth-abhängigen Features, damit PROJ-2 direkt darauf aufbauen kann.
- Als Entwickler möchte ich einen `avatars`-Storage-Bucket mit definierten Zugriffsrichtlinien, damit PROJ-8 Profilbilder speichern kann ohne eigene Infrastruktur anzulegen.

## Out of Scope
- Tabellen für Gruppen, Aktivitäten, Votes, Kanban, Termine — diese werden jeweils in PROJ-3 bis PROJ-7 definiert
- Auth-Flows (Login, Signup, Session-Handling) — das ist PROJ-2
- Profilbearbeitungs-UI — das ist PROJ-8
- Edge Functions — werden bei Bedarf in den jeweiligen Feature-Specs definiert
- Supabase Realtime Subscriptions — wird bei Bedarf in Feature-Specs ergänzt
- Mehrere Storage-Buckets (nur `avatars` in diesem Feature)
- Produktions-Deployment-Konfiguration für Supabase — das ist PROJ-1 nur für die Entwicklungsumgebung; Prod-Setup gehört zu `/deploy`

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

### Client Setup
- [ ] Angenommen `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY` sind in `.env.local` gesetzt, wenn `src/lib/supabase.ts` importiert wird, dann ist ein voll typisierter `SupabaseClient<Database>` verfügbar
- [ ] Angenommen eine der beiden Umgebungsvariablen fehlt, wenn die App gestartet wird, dann wirft der Client beim Import einen Fehler mit der Nachricht `Missing env var: NEXT_PUBLIC_SUPABASE_URL` bzw. `Missing env var: NEXT_PUBLIC_SUPABASE_ANON_KEY` — die App startet nicht lautlos
- [ ] Angenommen das Repo wurde frisch geclont, wenn der Entwickler das Verzeichnis öffnet, dann findet er eine `.env.local.example`-Datei mit allen benötigten Variablen und einem Hinweis wo die Werte zu finden sind

### TypeScript-Typen
- [ ] Angenommen das Datenbankschema ist in Supabase angelegt, wenn `supabase gen types typescript` ausgeführt wird, dann wird eine valide `src/lib/database.types.ts` generiert, die der Client als generischen Typ nutzt
- [ ] Angenommen `database.types.ts` existiert, wenn ein Entwickler `supabase.from('profiles').select()` schreibt, dann liefert TypeScript vollständige Autovervollständigung und Typfehler bei falschen Spalten-Namen

### profiles-Tabelle
- [ ] Angenommen die Migration wurde angewendet, wenn die `profiles`-Tabelle abgefragt wird, dann enthält sie die Spalten: `id` (uuid, PK, FK → auth.users), `display_name` (text, not null), `avatar_url` (text, nullable), `created_at` (timestamptz), `updated_at` (timestamptz)
- [ ] Angenommen Row Level Security ist aktiviert, wenn ein nicht-authentifizierter Nutzer die `profiles`-Tabelle abfragt, dann erhält er keine Daten (SELECT-Policy greift nur für `auth.uid() IS NOT NULL`)
- [ ] Angenommen ein Nutzer ist eingeloggt, wenn er sein eigenes Profil liest, dann erhält er seine Daten; wenn er ein fremdes Profil liest, dann erhält er ebenfalls die Daten (Profile sind innerhalb der App lesbar für alle eingeloggten Nutzer — nötig für Gruppenfeatures)
- [ ] Angenommen ein Nutzer ist eingeloggt, wenn er versucht ein anderes Profil zu aktualisieren, dann wird die Anfrage von RLS abgelehnt (UPDATE nur auf eigenes Profil)

### avatars-Bucket
- [ ] Angenommen der `avatars`-Bucket existiert, wenn ein nicht-authentifizierter Nutzer eine Datei lesen will, dann kann er sie öffentlich herunterladen (Bucket ist public)
- [ ] Angenommen der `avatars`-Bucket existiert, wenn ein authentifizierter Nutzer eine Datei hochlädt, dann darf er nur in den Pfad `{user_id}/avatar.*` schreiben (Storage Policy per RLS)
- [ ] Angenommen ein Nutzer versucht in den Pfad eines anderen Nutzers zu schreiben, dann wird der Upload von der Storage Policy abgelehnt

## Edge Cases
- **Fehlende env vars:** Hard fail beim Import von `supabase.ts` mit eindeutiger Fehlermeldung — kein Silent Null-Export wie bisher
- **Veraltete Typen:** Wenn das Schema sich ändert, aber `database.types.ts` nicht neu generiert wurde, zeigt TypeScript Compilerfehler — das ist gewollt, kein Problem
- **Auth-User ohne Profil:** Ein User kann sich in Auth registrieren, ohne dass ein Profil-Eintrag existiert. PROJ-2 muss beim Signup einen `profiles`-Eintrag anlegen (per Trigger oder im Auth-Flow) — das ist eine Abhängigkeit, die in PROJ-2 spezifiziert wird
- **profiles-Tabelle zu restriktiv:** Wenn zukünftige Features Gruppenfeatures brauchen, die andere Profile lesen, reicht die aktuelle SELECT-Policy (alle eingeloggten Nutzer können alle Profile lesen) — keine Nacharbeit nötig
- **Storage-Bucket-Name Konflikt:** Bucket-Name `avatars` wird hier festgelegt — kein anderes Feature darf einen Bucket gleichen Namens anlegen

## Technical Requirements
- Migration-Datei als SQL (via Supabase MCP `apply_migration` oder Supabase CLI)
- `src/lib/supabase.ts` — aktiviert (kein commented-out Code mehr)
- `src/lib/database.types.ts` — generiert via CLI
- `.env.local.example` im Root-Verzeichnis
- RLS auf `profiles`-Tabelle aktiviert mit 3 Policies: SELECT (alle auth), UPDATE (own), INSERT (own — für PROJ-2)

## Open Questions
- [ ] Soll ein Datenbank-Trigger `on auth.users insert → profiles insert` angelegt werden, oder übernimmt PROJ-2 das im Auth-Flow? (Empfehlung: Trigger in PROJ-2 spezifizieren, da er Auth-Logik ist)

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Nur Fundament in PROJ-1 (kein Vollschema) | Jedes Feature-Spec definiert sein eigenes Schema; PROJ-1 bleibt scharf und unabhängig testbar | 2026-06-21 |
| `profiles`-Tabelle in PROJ-1, nicht in PROJ-2 | Profile sind eine geteilte Abhängigkeit aller Auth-Features — gehört zur Infrastruktur | 2026-06-21 |
| `avatars`-Bucket in PROJ-1 | Bucket-Namen und Storage-Policies sind Infrastruktur-Entscheidungen; PROJ-8 soll nicht nachträglich Infrastruktur anlegen müssen | 2026-06-21 |
| Hard fail bei fehlenden env vars | Lautloses `null`-Export maskiert Konfigurationsfehler; Entwickler müssen sofort Feedback bekommen | 2026-06-21 |
| TypeScript-Typen via Supabase CLI | Bleibt automatisch mit dem Schema synchron — kein manuelles Interface-Pflegen | 2026-06-21 |
| SELECT-Policy: alle eingeloggten Nutzer können alle Profile lesen | Gruppenfeatures (PROJ-3+) brauchen Zugriff auf andere Mitgliederprofile | 2026-06-21 |

### Technical Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| `@supabase/supabase-js` nicht updaten (bleibt bei `^2.39.3`) | Version unterstützt Generic Types vollständig — kein Update-Risiko | 2026-06-21 |
| Hard fail bei fehlenden Env-Vars statt `null`-Export | Stilles Versagen zur Laufzeit maskiert Konfigurationsfehler — Fehler muss sofort beim Import sichtbar sein | 2026-06-21 |
| `database.types.ts` auto-generiert via Supabase CLI | Bleibt automatisch synchron mit Schema — kein manuelles Interface-Pflegen | 2026-06-21 |
| `profiles.id` = FK auf `auth.users.id` (kein eigener Auto-Increment) | 1:1-Beziehung zwischen Auth-User und Profil — verhindert Orphan-Profile | 2026-06-21 |
| `avatars`-Bucket public (öffentlich lesbar) | Avatar-URLs werden direkt in `<img>`-Tags verwendet — kein Auth-Token pro Bild-Request nötig | 2026-06-21 |
| Storage Upload-Policy erzwingt `{user_id}/`-Pfadstruktur | Verhindert, dass Nutzer Avatare anderer Nutzer überschreiben | 2026-06-21 |
| Migration-Datei statt direkter SQL-Editor-Eingabe | Reproduzierbar, versioniert, wiederholbar auf jedem Entwickler-Rechner | 2026-06-21 |

---

## Tech Design (Solution Architect)

> Genehmigt: 2026-06-21

### Kein UI — reine Infrastruktur

PROJ-1 hat keine UI-Komponenten. Alle Dateien liegen im `src/lib/`-Verzeichnis und in der Datenbankschicht.

### Modul-Struktur

```
Infrastruktur-Schicht
+-- Konfiguration
|   +-- .env.local.example          (neu — Vorlage für Entwickler)
|   +-- .env.local                  (lokal, nicht im Git)
|
+-- src/lib/
|   +-- supabase.ts                 (aktivieren — typisierter Client)
|   +-- database.types.ts           (neu — auto-generiert von Supabase CLI)
|
+-- Datenbank (Supabase Migration)
|   +-- profiles-Tabelle
|       +-- RLS Policy: SELECT       (alle eingeloggten Nutzer)
|       +-- RLS Policy: INSERT       (nur eigenes Profil)
|       +-- RLS Policy: UPDATE       (nur eigenes Profil)
|
+-- Storage (Supabase)
    +-- avatars-Bucket (public)
        +-- Storage Policy: UPLOAD   (nur in eigenen Pfad schreiben)
        +-- Storage Policy: READ     (öffentlich lesbar)
```

### Datenmodell — profiles-Tabelle

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `id` | UUID | Ja | Primärschlüssel, FK → auth.users (1:1) |
| `display_name` | Text | Ja | Anzeigename im UI |
| `avatar_url` | Text | Nein | Pfad im `avatars`-Bucket |
| `created_at` | Zeitstempel | Ja | Automatisch gesetzt |
| `updated_at` | Zeitstempel | Ja | Automatisch aktualisiert |

### Abhängigkeiten

| Paket | Zweck | Status |
|---|---|---|
| `@supabase/supabase-js` | Supabase Client für alle DB-Operationen | Bereits installiert (`^2.39.3`) |
| `supabase` (CLI) | Typen generieren via `supabase gen types` | Muss global installiert sein |

### Umsetzungsreihenfolge (/backend)

1. `supabase.ts` aktivieren (Env-Var-Validierung + typisierter Client)
2. `.env.local.example` erstellen
3. Migration für `profiles`-Tabelle + RLS anlegen und anwenden
4. `avatars`-Bucket + Storage Policies anlegen
5. TypeScript-Typen generieren → `database.types.ts`

## Implementation Notes (2026-06-21)

**What was built:**
- `src/lib/supabase.ts` — activated with hard-fail env-var validation + `createClient<Database>()` typed client
- `src/lib/database.types.ts` — auto-generated via Supabase MCP (`generate_typescript_types`)
- `.env.local.example` — **must be created manually** (blocked by `.env*` deny pattern in `.claude/settings.json`); content: two lines, `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` pointing to Supabase project Settings → API
- Migration `create_profiles_table` applied to project `fogldssdmqgeffpuhvxd` (eu-central-1)
- `avatars` storage bucket created (public, 5 MB limit, image MIME types only) with four Storage RLS policies (public read, own-folder upload/update/delete)

**Deviations from spec:**
- None

**TypeScript compilation:** Clean (`tsc --noEmit` passes with zero errors)

## QA Test Results

**QA Date:** 2026-06-21
**QA Engineer:** /qa skill
**Status:** In Review — NOT READY (2 High bugs must be fixed)

### Acceptance Criteria Results

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| 1 | Typed `SupabaseClient<Database>` available when env vars set | ✅ PASS | `createClient<Database>()` confirmed in source |
| 2 | Throws `Missing env var: NEXT_PUBLIC_SUPABASE_URL` when URL missing | ✅ PASS | Verified by unit test + source review |
| 3 | Throws `Missing env var: NEXT_PUBLIC_SUPABASE_ANON_KEY` when key missing | ✅ PASS | Verified by unit test + source review |
| 4 | `.env.local.example` present with all variables + hint where to find values | ⚠️ PARTIAL | File exists in HEAD but (a) deleted from working tree, (b) generic content — says "Optional", no Supabase Settings link |
| 5 | `supabase gen types typescript` generates valid `database.types.ts` | ✅ PASS | File generated via Supabase MCP; correct TypeScript |
| 6 | TypeScript autocomplete on `supabase.from('profiles').select()` | ✅ PASS | `tsc --noEmit` passes with zero errors |
| 7 | `profiles` table columns: id, display_name, avatar_url, created_at, updated_at | ✅ PASS | Verified via Supabase MCP `list_tables` — all columns + types correct |
| 8 | Unauthenticated users get no data from `profiles` | ✅ PASS | SELECT policy: `(auth.uid() IS NOT NULL)` confirmed |
| 9 | Authenticated users can read their own + other profiles | ✅ PASS | SELECT policy applies to all `auth.uid() IS NOT NULL` |
| 10 | UPDATE on another user's profile is rejected by RLS | ✅ PASS | UPDATE policy: `qual=(auth.uid()=id)` + `with_check=(auth.uid()=id)` |
| 11 | Unauthenticated users can read avatars (public bucket) | ✅ PASS | Bucket `public: true`; `avatars_public_read` SELECT policy |
| 12 | Authenticated user can upload only to `{user_id}/` path | ✅ PASS | `avatars_user_upload` enforces `(storage.foldername(name))[1] = (auth.uid())::text` |
| 13 | Upload to another user's path is rejected | ✅ PASS | Same policy, own-folder check rejects cross-user writes |

**Result: 12/13 PASS, 1 PARTIAL**

### Bugs Found

#### BUG-1 — HIGH: `src/lib/supabase.ts` implementation not committed to git

**Description:** The working-tree version of `supabase.ts` (hard-fail validation + typed client) differs from HEAD. HEAD still contains the old template with a commented-out client and `export const supabase = null`.

**Steps to reproduce:**
1. Clone the repo fresh
2. Open `src/lib/supabase.ts`
3. Observe: file still has `null` export with commented-out code — no hard-fail validation

**Impact:** A fresh clone of the project gets a broken `supabase.ts` that exports `null` instead of a typed client.

**Fix:** `git add src/lib/supabase.ts && git commit`

---

#### BUG-2 — HIGH: `src/lib/database.types.ts` not tracked in git

**Description:** `database.types.ts` is an untracked file (`??` in git status). It exists locally but is absent from HEAD. `supabase.ts` imports from `./database.types` — a fresh clone fails TypeScript compilation with a module-not-found error.

**Steps to reproduce:**
1. Clone the repo fresh
2. Run `npm run build` or `npx tsc --noEmit`
3. Observe: `Cannot find module './database.types'` error

**Fix:** `git add src/lib/database.types.ts && git commit`

---

#### BUG-3 — LOW: `.env.local.example` content is generic template

**Description:** The file in HEAD still has the starter-kit placeholder content: comments say "Optional — remove if not using backend", and values say `your_supabase_url_here` with no pointer to the Supabase dashboard. Includes unrelated commented vars (STRIPE, SMTP).

**Expected content per spec:** Two variables with a note pointing to "Supabase project Settings → API".

**Fix:** Update `.env.local.example` with ZUSAMMEN-specific content (must be done manually due to `.env*` permission restriction in `.claude/settings.json`):
```
# ZUSAMMEN — Environment Variables
# Get values from: Supabase Dashboard → Project Settings → API

NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-public-key>
```

**Note:** File is also deleted from the current working tree (` D` git status) — needs to be both restored/updated AND committed.

---

### Security Audit

**Verdict: CLEAN — no security issues found**

| Check | Result | Notes |
|-------|--------|-------|
| RLS enabled on `profiles` | ✅ | `rowsecurity: true` confirmed via pg_tables |
| Unauthenticated SELECT blocked | ✅ | `(auth.uid() IS NOT NULL)` policy |
| INSERT restricted to own row | ✅ | `with_check: (auth.uid() = id)` |
| UPDATE restricted to own row (both qual + with_check) | ✅ | Prevents privilege escalation via id change |
| No secrets hardcoded in source | ✅ | Only `process.env.*` references |
| `NEXT_PUBLIC_` prefix correct | ✅ | Anon key is safe to expose client-side |
| Storage upload restricted to own folder | ✅ | `(storage.foldername(name))[1] = (auth.uid())::text` |
| Cross-user storage writes blocked | ✅ | Own-folder policy enforced on INSERT + UPDATE + DELETE |
| Avatar bucket intentionally public | ✅ | Documented decision; avatars are used in `<img>` tags |
| FK to `auth.users.id` prevents orphan profiles | ✅ | `profiles_id_fkey` constraint confirmed |

### Automated Tests

**Unit Tests (Vitest):** `src/lib/supabase.test.ts` — 3/3 PASS
- `throws with correct message when NEXT_PUBLIC_SUPABASE_URL is missing` ✅
- `throws with correct message when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing` ✅
- `exports a typed supabase client when both env vars are set` ✅

**E2E Tests (Playwright):** N/A — PROJ-1 is pure infrastructure with no UI. No browser flows to test.

### Production-Ready Decision

**APPROVED** — No Critical or High bugs remaining.
- BUG-1 ✅ Fixed: `supabase.ts` committed (commit 6406065)
- BUG-2 ✅ Fixed: `database.types.ts` committed (commit 6406065)
- BUG-3 ⚠️ Open (LOW): `.env.local.example` still has generic content; manually update with ZUSAMMEN-specific placeholders pointing to Supabase Settings → API

## Deployment
_To be added by /deploy_
