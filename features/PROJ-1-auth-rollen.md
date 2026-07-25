# PROJ-1: Auth & Rollen

**Status:** 🟡 In Progress (Frontend + Backend gebaut, bereit für /qa)
**Created:** 2026-06-29
**Last Updated:** 2026-06-29
**Priorität:** P0 (MVP) — Fundament für alle weiteren Features

> Authentifizierung und rollenbasierte Zugriffssteuerung für TMS 2.0.
> Supabase Auth, E-Mail/Passwort für alle (auch Terminals), **Invite-only** (Admin legt Konten mit Start-Passwort an — kein SMTP/E-Mail-Versand nötig), 7 Rollen mit RLS.

---

## 1. User Stories

- **Als** nicht angemeldeter Mitarbeiter **möchte ich** mich mit E-Mail und Passwort einloggen, **um** Zugriff auf die für meine Rolle relevanten Bereiche zu bekommen.
- **Als** Admin **möchte ich** neue Mitarbeiter per E-Mail einladen und ihnen eine Rolle zuweisen, **um** den Zugang kontrolliert zu vergeben (keine offene Registrierung).
- **Als** eingeladener Mitarbeiter **möchte ich** über einen Einladungslink mein Passwort setzen, **um** mein Konto zu aktivieren.
- **Als** angemeldeter Nutzer **möchte ich** mich abmelden, **um** das geteilte Stations-Terminal für den nächsten Kollegen freizugeben.
- **Als** Nutzer **möchte ich** mein Passwort zurücksetzen können, **um** bei Verlust wieder Zugang zu erhalten.
- **Als** Admin **möchte ich** die Rolle eines Mitarbeiters ändern oder das Konto deaktivieren, **um** auf Personalwechsel zu reagieren.
- **Als** System **möchte ich** Inhalte und Aktionen je nach Rolle einschränken, **um** dass jede Station nur das sieht/tut, was sie darf.

## 2. Rollenmodell

| Rolle (DB-Wert) | Beschreibung | Standard-Startseite |
|-----------------|--------------|---------------------|
| `admin`            | Verwaltung: Vollzugriff, Nutzer- & Stammdatenverwaltung | Dashboard |
| `arbeitsvorbereitung` | Legt Pfad/Auftrag fest | Arbeitsvorbereitung |
| `wareneingang`     | Erfasst eingehende Werkzeuge | Wareneingang-Liste |
| `werker`           | Bedient Maschinen-Terminal | Maschinen-Arbeitsliste |
| `qs`               | Qualitätssicherung, Freigabe/Rückläufer | QS-Liste |
| `warenausgang`     | Bucht fertige Werkzeuge aus | Warenausgang-Liste |
| `fahrer`           | Transporte zu/von Fremdbearbeitung | Transport-Liste |

> Eine Rolle pro Nutzer im MVP. Mehrfachrollen sind ein späteres Erweiterungsthema (Non-Goal hier).

> **Erweiterung durch PROJ-29 (2026-07-23):** eine 8. Rolle **`redaktion`** (Content-Team,
> getrennt von den 7 Werkstatt-Rollen oben) wurde als weiterer Wert in `src/lib/roles.ts`
> ergänzt. Details/Berechtigungen siehe `features/PROJ-29-wissensbasis.md`.

## 3. Acceptance Criteria

### Login / Logout
- [ ] AC-1: Nutzer kann sich mit gültiger E-Mail + Passwort anmelden und landet auf der rollenspezifischen Startseite.
- [ ] AC-2: Falsche Zugangsdaten zeigen eine klare deutsche Fehlermeldung, ohne zu verraten, ob die E-Mail existiert.
- [ ] AC-3: Angemeldeter Nutzer kann sich über das Header-Menü abmelden; danach ist kein geschützter Bereich mehr erreichbar.
- [ ] AC-4: Session bleibt über Seiten-Reloads und Server-Navigation erhalten (Supabase SSR + Middleware).

### Konto-Anlage (Invite-only, Admin-gesteuert, ohne E-Mail)
- [ ] AC-5: Es gibt **keine** öffentliche Registrierungsseite.
- [ ] AC-6: Admin kann auf einer Nutzerverwaltungsseite E-Mail + Name + Rolle erfassen und ein **Start-Passwort** (≥ 8 Zeichen) setzen; das Konto ist sofort aktiv.
- [ ] AC-7: Der neue Mitarbeiter meldet sich mit E-Mail + Start-Passwort an und wird beim **ersten Login** aufgefordert, ein eigenes Passwort zu setzen (`must_change_password`).
- [ ] AC-8: Solange das Passwort nicht geändert wurde, ist nur die Passwort-Ändern-Seite erreichbar; danach Weiterleitung zur rollenspezifischen Startseite.

### Passwort zurücksetzen
- [ ] AC-9: Admin kann für einen Nutzer ein neues Start-Passwort setzen (erneut mit `must_change_password`).
- [ ] AC-9b: **Self-Service per E-Mail** — auf der Login-Seite „Passwort vergessen?" → E-Mail eingeben → Supabase verschickt einen Recovery-Link (SMTP). Der Link führt über `/auth/confirm` zur Passwort-Ändern-Seite. Keine Auskunft, ob die E-Mail existiert (keine Enumeration).

### Rollen & Berechtigungen
- [ ] AC-10: Jeder Nutzer hat genau eine Rolle, gespeichert in `profiles.role`.
- [ ] AC-11: Routen sind serverseitig geschützt: nicht angemeldet → Redirect zu `/login`; angemeldet aber unberechtigte Rolle → 403/Hinweis.
- [ ] AC-12: RLS-Policies auf allen Tabellen erzwingen Rollen-/Eigentümer-Zugriff (kein Client-only-Check).
- [ ] AC-13: Nur `admin` darf Nutzer einladen, Rollen ändern und Konten deaktivieren.

### Admin-Nutzerverwaltung
- [ ] AC-14: Admin sieht eine Liste aller Nutzer mit E-Mail, Rolle, Status (aktiv/eingeladen/deaktiviert).
- [ ] AC-15: Admin kann die Rolle eines bestehenden Nutzers ändern.
- [ ] AC-16: Admin kann ein Konto deaktivieren; deaktivierte Nutzer können sich nicht mehr anmelden. Deaktivierte bleiben in der Liste **graumarkiert sichtbar** (nicht ausgeblendet).
- [ ] AC-20: Der **letzte aktive Admin** kann nicht deaktiviert und nicht herabgestuft werden — eine Prüfung verhindert das mit klarer Meldung (mind. 1 aktiver Admin bleibt).

### Design / UX
- [ ] AC-17: Login-Screen nutzt das Logo (`public/logo.svg`) auf Korallen-Fläche (`#FF6B6D`), gemäß Design-System.
- [ ] AC-18: Header zeigt Logo + Rollen-/Nutzerhinweis + Logout; Touch-Targets ≥ 48px (terminaltauglich).
- [ ] AC-19: Alle Texte auf Deutsch, mobile-first, lesbar in heller Werkstattumgebung.

## 4. Edge Cases

- **Konto-Anlage mit bereits existierender E-Mail:** klare Meldung, kein Duplikat anlegen.
- **Mitarbeiter kennt sein Start-Passwort nicht mehr:** Admin setzt ein neues Start-Passwort (kein E-Mail-Reset im MVP).
- **Deaktivierter Nutzer mit gültiger Session:** wird beim nächsten Request abgewiesen (Middleware/RLS prüft Status, nicht nur Login).
- **Nutzer ohne `profiles`-Eintrag** (z. B. Auth-User ohne Profil): Zugriff verweigern, nicht crashen.
- **Letzter Admin:** darf sich nicht selbst die Admin-Rolle entziehen / sich deaktivieren (mind. 1 aktiver Admin bleibt erhalten).
- **Geteiltes Terminal:** vorheriger Nutzer vergisst Logout → idle/Reload erzwingt keine Datenpreisgabe (Session an Account gebunden, klarer Nutzer-Hinweis im Header).
- **Netzwerkfehler beim Login:** Lade-/Fehlerzustand, kein „hängender" Button.
- **Direkter URL-Aufruf einer fremden Rollen-Route:** serverseitiger Guard greift (kein reiner Client-Redirect).

## 5. Tech Design (vom Solution Architect)

> Status: **entworfen am 2026-06-29**, wartet auf Freigabe. PM-lesbar, ohne Code.

### A) Seiten- & Komponenten-Struktur

```
App (Root-Layout)
│
├── /login                         ← öffentlich, einzige Seite ohne Anmeldung
│     └─ Login-Karte: Logo auf Korallen-Fläche, E-Mail + Passwort, Fehlerhinweis, „Anmelden"
│
├── /passwort-aendern              ← nur eingeloggt; Pflicht beim ersten Login
│     └─ Formular: neues Passwort + Wiederholung (≥ 8 Zeichen)
│
├── (geschützter Bereich)          ← alles dahinter erfordert Anmeldung
│     ├─ Header: Logo · aktueller Nutzer + Rolle · Logout-Menü   (Touch ≥ 48px)
│     ├─ /  (Start)                ← leitet je nach Rolle zur passenden Startseite
│     └─ /verwaltung/nutzer        ← NUR Rolle „admin"
│            ├─ Nutzer-Tabelle: E-Mail · Name · Rolle · Status
│            ├─ Dialog „Nutzer anlegen": E-Mail, Name, Rolle, Start-Passwort
│            ├─ Aktion „Rolle ändern"
│            ├─ Aktion „Neues Start-Passwort setzen"
│            └─ Schalter „aktiv / deaktiviert"
│
└── Middleware (serverseitiger „Türsteher")
      prüft bei JEDER Anfrage: angemeldet? · Passwortwechsel offen? · Rolle für diese Route erlaubt?
```

Alle UI-Bausteine kommen aus dem vorhandenen shadcn/ui-Satz (Card, Input, Label, Form, Button, Table, Dialog, DropdownMenu, Select, Switch, Badge, Sonner-Toast) — **keine neuen Eigenbau-Komponenten** nötig.

### B) Datenmodell (in Klartext)

Die Login-Daten selbst (E-Mail, Passwort, Sitzungen) verwaltet **Supabase Auth** — die speichern wir nicht selbst. Daran hängen wir eine Profil-Tabelle:

```
Profil (eine Zeile pro Mitarbeiter):
- ID                     → verweist auf den Supabase-Auth-Nutzer
- E-Mail
- Name
- Rolle                  → genau eine von 7: admin · arbeitsvorbereitung · wareneingang ·
                                              werker · qs · warenausgang · fahrer
- Status                 → aktiv / deaktiviert
- Passwortwechsel nötig  → ja / nein  (steuert die Pflicht-Umleitung beim ersten Login)
- erstellt am
```

**Zugriffsschutz auf Datenbankebene (RLS):** Jeder Mitarbeiter darf nur sein **eigenes** Profil lesen. Nur „admin" darf **alle** Profile lesen und ändern (Rolle, Status, Passwort). Diese Regel liegt in der Datenbank, nicht nur im Bildschirm — das ist die eigentliche Sicherheitsgrenze.

### C) Technische Entscheidungen (das WARUM)

- **Server-Sessions statt nur Browser-Login (`@supabase/ssr`):** Next.js rendert Seiten auf dem Server. Damit wir Seiten schon serverseitig schützen können (und nicht erst im Browser „nachträglich verstecken"), brauchen wir den Server-fähigen Supabase-Client. Sicherer und ohne Aufblitzen geschützter Inhalte.
- **Ein zentraler „Türsteher" (Middleware):** Eine Stelle prüft jede Anfrage, statt die Prüfung in jede Seite einzeln zu kopieren. Weniger Fehlerquellen.
- **Mächtiger Admin-Schlüssel bleibt auf dem Server:** Das Anlegen von Nutzern und Setzen von Passwörtern braucht einen privilegierten Supabase-Schlüssel (Service-Role). Der läuft ausschließlich serverseitig und gelangt nie in den Browser.
- **Rolle in der Datenbank + RLS, nicht nur im UI:** Menüpunkte ausblenden ist Komfort; die Datenbank-Regel ist die echte Absicherung. So kann auch ein manipulierter Browser keine fremden Daten sehen.
- **Start-Passwort statt E-Mail-Einladung (Kundenentscheidung):** Das self-hosted Supabase braucht für Mails konfiguriertes SMTP. Um das fürs MVP zu vermeiden, legt der Admin Konten mit Start-Passwort an; der Mitarbeiter ändert es beim ersten Login.

### D) Zu installierende Pakete

| Paket | Zweck |
|-------|-------|
| `@supabase/ssr` | Server- & Browser-Supabase-Client + Session-Handling für den App Router |

Alles Weitere (`zod`, `react-hook-form`, `@hookform/resolvers`, shadcn/ui) ist bereits installiert.

### E) Voraussetzungen vor dem Bau (für DevOps/Admin)

- **`SUPABASE_SERVICE_ROLE_KEY`** muss in `.env.local` ergänzt werden (für die Admin-Aktionen, nur serverseitig).
- Ein **erster Admin-Nutzer** muss einmalig direkt in Supabase angelegt werden (Henne-Ei-Problem — der erste Admin kann sich nicht selbst einladen).
- Die **Design-Farben** (`#FF6B6D` …) werden im `/frontend`-Schritt in `globals.css` verdrahtet (aktuell noch graue shadcn-Defaults).

---

## Decision Log

### Technische Entscheidungen
| Entscheidung | Begründung | Datum |
|--------------|------------|-------|
| `@supabase/ssr` + zentrale Middleware | Serverseitiger Routenschutz im App Router; ein Prüfpunkt statt pro Seite | 2026-06-29 |
| Separate `profiles`-Tabelle an `auth.users` | Supabase verwaltet Login; Rolle/Status/Name hängen wir an (Standard-Muster) | 2026-06-29 |
| Rolle + Status in DB mit RLS abgesichert | UI-Verstecken ist nur Komfort; RLS ist die echte Sicherheitsgrenze | 2026-06-29 |
| Admin-Aktionen über Service-Role nur serverseitig | Privilegierter Schlüssel darf nie in den Browser | 2026-06-29 |
| Start-Passwort + Pflichtwechsel statt E-Mail-Invite | Kein SMTP nötig fürs Onboarding; schneller fürs MVP (Kundenentscheidung) | 2026-06-29 |
| Self-Service-Passwort-Reset per E-Mail ergänzt | Auf Kundenwunsch; SMTP (IONOS) ist auf dem self-hosted Supabase konfiguriert | 2026-06-29 |
| Eine Rolle pro Nutzer (keine Mehrfachrollen) | MVP-Vereinfachung; Mehrfachrollen später nachrüstbar | 2026-06-29 |
| Deaktivierte Nutzer graumarkiert statt ausgeblendet | Admin muss bestehende Konten sehen, sonst Duplikat-Gefahr | 2026-06-29 |
| Passwort nur Mindestlänge (8–12), keine Komplexitätsregel | MVP-Schlankheit; Komplexität später per Supabase-Auth-Policy ohne Code | 2026-06-29 |
| „Letzter aktiver Admin"-Schutz schon im MVP | Geringer Aufwand, hoher Schaden bei Aussperrung | 2026-06-29 |

### Open Questions (geklärt 2026-06-29)
- [x] Deaktivierte Nutzer: **graumarkiert anzeigen**, nicht ausblenden — Admin muss sehen, was existiert (sonst Duplikate).
- [x] Passwortregeln: **nur Mindestlänge (8–12 Zeichen)** im MVP; Komplexität später per Supabase-Auth-Policy ohne Code-Änderung nachrüstbar.
- [x] „Letzter Admin"-Schutz: **im MVP umsetzen** — geringer Aufwand (eine Prüfung vor Rollen-Downgrade/Deaktivierung), hoher Schaden bei Vergessen.

---

## Implementierung — Frontend (2026-06-29)

Gebaut im `/frontend`-Schritt. Build grün (Next 16, keine TS-Fehler). UI auf Mock-Daten — Auth-Logik folgt im `/backend`-Schritt (überall als `TODO(/backend)` markiert).

**Design-Fundament**
- `src/app/globals.css` — Design-System-Tokens verdrahtet (Brand `#FF6B6D`, Türkis, Stationsfarben als CSS-Variablen, Radius `1rem`).
- `tailwind.config.ts` — Inter als `font-sans`.
- `src/app/layout.tsx` — Inter-Schrift, `lang="de"`, Logo als Favicon, `<Toaster>` (Sonner), Metadata „TMS 2.0".

**Geteilte Bausteine**
- `src/lib/roles.ts` — `USER_ROLES` (7), `ROLE_LABELS`, `ROLE_HOME`, Typen `UserRole`/`UserStatus`.
- `src/lib/validations/auth.ts` — Zod-Schemas: Login, Passwort-Ändern, Nutzer-Anlegen (Mindestlänge 8).
- `src/lib/mock-data.ts` — Platzhalter aktueller Nutzer + Nutzerliste (ersetzt Backend später).

**Seiten & Komponenten**
- `/login` (`src/app/login/page.tsx` + `components/auth/login-form.tsx`) — Logo auf Korallen-Fläche, validiertes Formular.
- `/passwort-aendern` (+ `components/auth/change-password-form.tsx`) — neues Passwort + Wiederholung.
- `(app)`-Gruppe mit `layout.tsx` + `components/app-header.tsx` — Header (Logo-Chip, Nutzer/Rolle, Logout-Menü, Touch ≥ 48px).
- `/dashboard` — rollenbasierte Begrüßung, Admin-Kachel zur Nutzerverwaltung (Workflow-Kacheln als Platzhalter).
- `/verwaltung/nutzer` (+ `components/users/user-management.tsx`, `create-user-dialog.tsx`) — Tabelle, Anlegen-Dialog, Inline-Rollenwechsel, Status-Schalter; deaktivierte graumarkiert (AC-16); **„letzter aktiver Admin"-Schutz clientseitig umgesetzt** (AC-20).
- `src/app/page.tsx` — Root leitet zu `/login` (Default-Next.js-Seite entfernt).

**Bewusst offen (Backend-Schritt):** echtes Login/Logout, Session, `@supabase/ssr`, Middleware-Routenschutz, `profiles`-Tabelle + RLS, Admin-Aktionen via Service-Role. Reine Frontend-Komponenten sind shadcn/ui-Kompositionen — keine Eigenbau-Primitives.

## Implementierung — Backend (2026-06-29)

Gebaut im `/backend`-Schritt. Build grün, 13 Unit-Tests grün, Live-Smoke-Test (Auth + RLS) grün.

**Datenbank** (`supabase/migrations/0001_auth_profiles.sql`, auf self-hosted Supabase angewandt)
- `user_role`-Enum (7 Rollen), `profiles`-Tabelle (id→auth.users, email, full_name, role, status, must_change_password, created_at), Indizes auf role/status.
- **RLS aktiv:** SELECT = eigenes Profil oder Admin; INSERT/UPDATE = nur aktive Admins. Helper `is_active_admin()` (SECURITY DEFINER → keine RLS-Rekursion).
- Trigger `on_auth_user_created` → legt Profil aus `user_metadata` an.

**Clients** (`src/lib/supabase/`)
- `client.ts` (Browser), `server.ts` (Cookies-Session + `getCurrentProfile()`), `admin.ts` (Service-Role, `server-only`).
- `middleware.ts` Helper + `src/proxy.ts` (Next-16-Konvention): Session-Refresh + Routenschutz (nicht angemeldet→/login, deaktiviert→Logout, Passwortwechsel offen→/passwort-aendern, /verwaltung nur Admin).

**Server-Actions**
- `actions/auth.ts`: `signInAction` (mit Deaktiviert-Check, neutrale Fehlermeldung AC-2), `signOutAction`, `changePasswordAction` (Passwort + `must_change_password=false`).
- `actions/users.ts`: `createUserAction`, `updateRoleAction`, `toggleStatusAction`, `resetPasswordAction` — alle mit `requireAdmin()`-Check; **„letzter aktiver Admin"-Schutz serverseitig** (AC-20) bei Downgrade/Deaktivierung.

**Frontend angebunden:** Login/Passwort/Logout/Header an echte Actions; Dashboard + Verwaltung laden echte Profildaten (RLS); Reset zeigt das neue Start-Passwort einmalig im Dialog. Mock-Daten entfernt.

**Erster Admin:** Jan Bernd Gudel (`j.gudel@gudel-werkzeuge.de`) via `scripts/seed-admin.mjs` angelegt; Start-Passwort in `FIRST_ADMIN_PASSWORD.txt` (gitignored), `must_change_password=true`.

**Tests:** `src/lib/validations/auth.test.ts`, `src/lib/roles.test.ts` (Vitest). `scripts/smoke-auth.mjs` für Live-Verifikation.

**Hinweis/Tech-Schuld:** 2 alte Test-Auth-Accounts (`test@tms.local`, `playwright-test@…`) haben kein Profil → werden von der Middleware abgewiesen (kein Zugang). Bei Bedarf in Supabase entfernen.

### Nachtrag — Self-Service-Passwort-Reset per E-Mail (2026-06-29)
- `requestPasswordResetAction` (`actions/auth.ts`) → `resetPasswordForEmail` mit `redirectTo=<origin>/auth/confirm?next=/passwort-aendern`, keine Nutzer-Enumeration.
- Seite `/passwort-vergessen` + `components/auth/forgot-password-form.tsx`; Link „Passwort vergessen?" auf `/login`.
- Route-Handler `src/app/auth/confirm/route.ts` tauscht `code`/`token_hash` gegen eine Session und leitet zu `/passwort-aendern`.
- Middleware: `/passwort-vergessen` und `/auth` sind öffentlich.
- **SMTP** auf dem self-hosted Supabase (IONOS) ist konfiguriert → Mails werden zugestellt.
- ⚠️ **Dev-Test:** `GOTRUE_URI_ALLOW_LIST` erlaubt nur `tms.gudel-werkzeuge.de`/`tms-staging…`. Für lokales E-Mail-Testen müsste `http://localhost:3000/**` zur Allow-List ergänzt und `supabase-auth` neu gestartet werden; in Produktion funktioniert es ohne Änderung.

### Hotfix — Reset-Link zeigte auf `0.0.0.0:3000` (2026-06-30)
**Bug:** In Produktion führte der Recovery-Link auf `0.0.0.0:3000/...` (ERR_ADDRESS_INVALID).
**Ursachen:** (1) `/auth/confirm` nutzte `new URL(request.url).origin` → hinter Traefik die container-interne Adresse (`HOSTNAME=0.0.0.0`); (2) `NEXT_PUBLIC_SITE_URL` wird zur Build-Zeit eingebacken, war aber kein Build-Arg → zur Laufzeit leer.
**Fix:** Neuer Helper `src/lib/app-url.ts` (`getAppOrigin()`): `APP_URL` (server-seitige Laufzeit-Var) → Traefik `x-forwarded-*` → Host. Genutzt in `requestPasswordResetAction` und `/auth/confirm`. `APP_URL=https://tms.gudel-werkzeuge.de` in `.env.production`. Image neu gebaut + deployed; verifiziert: `APP_URL` in Container-Env, Login live 200.

---

## QA Test Results

**Status:** ✅ Approved — bereit für Deploy
**Testprotokoll:** [PROJ-1-qa-results.md](PROJ-1-qa-results.md)
**Durchgeführt:** 2026-06-29

| Kategorie | Ergebnis |
|-----------|----------|
| Unit Tests | 13/13 ✅ |
| Build | ✅ Grün |
| Smoke Test (Auth + RLS) | ✅ Grün |
| Sicherheits-Audit | ✅ Bestanden |
| Code-Review aller 20 ACs | ✅ Alle erfüllt |
| E2E Tests | ⚠️ Nicht geschrieben — nachrüstbar |
| Manuelle Tests | ⚠️ Empfohlen nach Deploy |

**Empfehlung:** Deploy-fähig. E2E-Tests und manueller Smoke-Test können nachgeliefert werden.

---

## Deployment

**Status:** ✅ Deployed
**Datum:** 2026-06-29
**URL:** https://tms.gudel-werkzeuge.de
**Container:** `tms` (Docker Compose)
**Reverse Proxy:** Traefik (SSL via Let's Encrypt)

### Deploy-Schritte
1. `Dockerfile` erstellt (Multi-stage, Node 24 Alpine, standalone output)
2. `docker-compose.yml` erstellt (Traefik-Labels, `.env.production`)
3. `next.config.ts` auf `output: 'standalone'` gesetzt
4. Build mit Build-Args (`NEXT_PUBLIC_*`)
5. Container gestartet, Traefik-Labels aktiv
6. Health-Check: HTTP 200 auf `/login`, deutsche Login-Seite korrekt gerendert

### Env-Variablen (`.env.production`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Nächste Schritte
- DNS `tms.gudel-werkzeuge.de` → Server-IP muss ggf. geprüft werden
- Erster Admin-Login mit `FIRST_ADMIN_PASSWORD.txt` empfohlen
- E2E-Tests nachrüsten
- PROJ-2 (Werkzeug-Stammdaten) starten
