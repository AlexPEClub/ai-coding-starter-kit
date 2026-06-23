# PROJ-2: Authentifizierung & User Accounts

## Status: Deployed
**Created:** 2026-06-21
**Last Updated:** 2026-06-22 — Deployed to production: https://qt-voting-app.vercel.app

## Dependencies
- PROJ-1 (Supabase Infrastructure Setup) — typisierter Supabase-Client, `profiles`-Tabelle mit RLS

## User Stories
- Als neuer Nutzer möchte ich mich mit E-Mail, Passwort und Anzeigename registrieren, damit ich einen persönlichen Account erstelle.
- Als neuer Nutzer möchte ich nach der Registrierung eine Bestätigungs-Mail erhalten und meinen Account per Link aktivieren, damit nur echte E-Mail-Adressen genutzt werden.
- Als bestehender Nutzer möchte ich mich mit E-Mail und Passwort einloggen, damit ich auf meine Gruppen und Aktivitäten zugreife.
- Als Nutzer möchte ich mein vergessenes Passwort per E-Mail zurücksetzen, damit ich meinen Account wiederherstellen kann.
- Als eingeloggter Nutzer möchte ich mich ausloggen können, damit mein Account auf dem Gerät gesichert ist.
- Als nicht-eingeloggter Nutzer, der eine geschützte Seite aufruft, möchte ich automatisch zur Login-Seite weitergeleitet werden.

> **Platzhalter (deferred):** Google-, Apple- und Facebook-Login sind auf der Login-Seite als deaktivierte Buttons sichtbar ("Demnächst verfügbar") — werden in einem späteren Feature aktiviert, sobald die App veröffentlicht wird.

## Out of Scope
- **Account löschen** — deferred to PROJ-8 (Nutzerprofil & Archiv), da Bereinigung von Gruppen/Aktivitäten komplexe Abhängigkeiten zu PROJ-3–7 hat
- **Google OAuth** — deferred; Setup als Privatperson erfordert Google Cloud Console + Testnutzer-Verwaltung; wird aktiviert vor App-Store-Release (PROJ-9)
- **Apple OAuth** — deferred; erfordert Apple Developer Account (99 $/Jahr) + verifizierte Domain; wird aktiviert vor App-Store-Release (PROJ-9, Pflicht für iOS)
- **Facebook OAuth** — deferred; erfordert Facebook Developer App + Datenschutzerklärung-URL + ggf. Business Verification; wird aktiviert vor App-Store-Release
- **Profilbild beim Signup** — deferred to PROJ-8; `avatar_url` bleibt beim Signup `null`
- **Profilbearbeitung (Display-Name ändern, Avatar hochladen)** — deferred to PROJ-8
- **E-Mail-Adresse oder Passwort ändern** — deferred to PROJ-8
- **Benachrichtigungs-Einstellungen** — deferred to PROJ-8
- **Kalender-Verbindung** — deferred to PROJ-7
- **Push-Benachrichtigungen** — deferred to PROJ-10
- **„Redirect back to original URL" nach Login** — zu komplex für Static Export MVP; immer zur Home-Seite
- **Rate-Limiting eigener Implementierung** — Supabase Auth übernimmt das nativ
- **Magic Link (passwortlos)** — nicht im Konzept vorgesehen; E-Mail/Passwort + OAuth ist der definierte Ansatz

## Acceptance Criteria

### Registrierung (E-Mail/Passwort)
- [ ] Angenommen der Nutzer ist nicht eingeloggt, wenn er `/signup` aufruft, dann sieht er ein Formular mit den Pflichtfeldern E-Mail, Passwort, Anzeigename sowie einer AGB/Datenschutz-Checkbox
- [ ] Angenommen der Nutzer füllt das Formular korrekt aus und klickt „Registrieren", dann wird in Supabase Auth ein neuer User angelegt, ein `profiles`-Eintrag mit `status = 'pending'` und dem eingegebenen `display_name` erstellt, und der Nutzer wird zum Hinweis-Screen weitergeleitet
- [ ] Angenommen der Hinweis-Screen wird angezeigt, dann sieht der Nutzer die Info „Bestätigungs-Mail an [E-Mail] gesendet" sowie die Optionen „Mail erneut senden" und „Andere E-Mail-Adresse verwenden"
- [ ] Angenommen der Nutzer klickt „Mail erneut senden", dann wird die Bestätigungs-Mail erneut versendet und ein kurzes Feedback („Mail wurde erneut gesendet") angezeigt
- [ ] Angenommen die Bestätigungs-Mail wurde empfangen und der Nutzer klickt den Verifizierungs-Link, dann wird der Account-Status in `profiles` auf `active` gesetzt, der Nutzer wird automatisch eingeloggt und zur Home-Seite weitergeleitet
- [ ] Angenommen der Nutzer versucht sich mit einer bereits registrierten E-Mail-Adresse zu registrieren, dann wird die Fehlermeldung „Diese E-Mail-Adresse ist bereits registriert" angezeigt

### Login (E-Mail/Passwort)
- [ ] Angenommen der Nutzer ist nicht eingeloggt, wenn er `/login` aufruft, dann sieht er ein Formular mit E-Mail und Passwort sowie deaktivierte Platzhalter-Buttons für Google-, Apple- und Facebook-Login mit dem Label „Demnächst verfügbar"
- [ ] Angenommen der Nutzer gibt korrekte Zugangsdaten eines `active`-Accounts ein, wenn er „Einloggen" klickt, dann wird eine Supabase-Session erstellt und der Nutzer zur Home-Seite weitergeleitet
- [ ] Angenommen der Nutzer gibt falsche Zugangsdaten ein, dann wird die Fehlermeldung „E-Mail oder Passwort falsch" angezeigt (kein Hinweis welches Feld falsch ist)
- [ ] Angenommen der Nutzer hat einen `pending`-Account (E-Mail noch nicht bestätigt) und versucht sich einzuloggen, dann sieht er den Hinweis „Bitte bestätige zuerst deine E-Mail-Adresse" mit der Option „Mail erneut senden"

### OAuth — Google / Apple / Facebook (Platzhalter)
> Deaktivierte UI-Buttons auf der Login-Seite — keine Funktion in diesem Feature. Werden in einem späteren Feature aktiviert (vor App-Store-Release / PROJ-9).

### Passwort zurücksetzen
- [ ] Angenommen der Nutzer klickt auf der Login-Seite „Passwort vergessen", dann wird er zu einem Formular mit einem E-Mail-Feld weitergeleitet
- [ ] Angenommen der Nutzer gibt eine registrierte E-Mail-Adresse ein und klickt „Reset-Link senden", dann erhält er eine E-Mail mit einem Passwort-Reset-Link und sieht die Bestätigung „Falls diese Adresse registriert ist, wurde eine Mail gesendet" (kein Unterschied bei unregistrierter Adresse — verhindert User-Enumeration)
- [ ] Angenommen der Nutzer klickt den Reset-Link in der Mail, dann wird er zu einem Formular weitergeleitet, in dem er ein neues Passwort eingeben kann
- [ ] Angenommen der Nutzer gibt ein gültiges neues Passwort ein und bestätigt es, dann wird das Passwort aktualisiert, der Nutzer eingeloggt und zur Home-Seite weitergeleitet

### Ausloggen
- [ ] Angenommen der Nutzer ist eingeloggt, wenn er auf „Ausloggen" klickt (erreichbar über das Profil-Menü), dann wird die Supabase-Session beendet und der Nutzer zur Login-Seite weitergeleitet

### Geschützte Routen (Auth Guard)
- [ ] Angenommen ein nicht-eingeloggter Nutzer ruft eine geschützte Route auf (alle Routen außer `/login`, `/signup`, `/auth/*`), dann wird er automatisch zu `/login` weitergeleitet
- [ ] Angenommen ein eingeloggter Nutzer ruft `/login` oder `/signup` auf, dann wird er automatisch zur Home-Seite weitergeleitet (kein erneutes Einloggen nötig)

### Validierung
- [ ] Angenommen das Signup-Formular wird abgeschickt, wenn das E-Mail-Feld keine gültige E-Mail-Adresse enthält, dann wird „Bitte gib eine gültige E-Mail-Adresse ein" angezeigt
- [ ] Angenommen das Signup-Formular wird abgeschickt, wenn das Passwort kürzer als 8 Zeichen ist, dann wird „Passwort muss mindestens 8 Zeichen lang sein" angezeigt
- [ ] Angenommen das Signup-Formular wird abgeschickt, wenn der Anzeigename leer ist, dann wird „Anzeigename ist erforderlich" angezeigt
- [ ] Angenommen das Signup-Formular wird abgeschickt, wenn die AGB-Checkbox nicht angehakt ist, dann wird „Bitte akzeptiere die AGB und Datenschutzerklärung" angezeigt

## Edge Cases
- **Bestätigungs-Link abgelaufen:** Supabase invalidiert Links nach 24 Stunden. Der Nutzer sieht eine Fehlermeldung mit dem Hinweis „Link abgelaufen — neuen anfordern" und einem Button zurück zum Hinweis-Screen.
- **Link bereits genutzt (bereits bestätigt):** Supabase erkennt doppelte Token-Nutzung. Der Nutzer sieht den Hinweis „Account bereits bestätigt" und wird zum Login weitergeleitet.
- **Netzwerkfehler beim Login/Signup:** Falls Supabase nicht erreichbar ist, wird eine generische Fehlermeldung angezeigt: „Verbindungsfehler — bitte versuche es erneut." Formulardaten bleiben erhalten.
- **Session abgelaufen während der Nutzung:** Wenn die Supabase-Session während einer aktiven Sitzung abläuft, wird der Nutzer beim nächsten API-Call zur Login-Seite weitergeleitet.

## Technical Requirements
- Alle Auth-Seiten sind öffentlich zugänglich (kein Auth Guard auf `/login`, `/signup`, `/auth/*`)
- Auth-State wird über den Supabase-Client client-seitig verwaltet (`onAuthStateChange`)
- Session-Persistenz: Supabase-Standard (JWT in `localStorage`, automatisches Refresh)
- `profiles`-Tabelle braucht eine neue Spalte `status` (text, NOT NULL, default `'pending'`, check constraint: `'pending' | 'active'`) — Migration in PROJ-2
- Profile-Erstellung beim Signup: direkt nach Auth-User-Anlage per Client-Call (kein DB-Trigger) mit `status = 'pending'`; nach E-Mail-Bestätigung Update auf `status = 'active'` im `/auth/callback`-Handler
- E-Mail-Bestätigungs-Callback-URL: `/auth/callback` — verarbeitet den Supabase-Redirect und leitet zur Home-Seite weiter
- Alle Auth-Seiten nutzen react-hook-form + Zod-Validierung
- OAuth-Buttons (Google, Apple, Facebook) werden als deaktivierte UI-Elemente gerendert — kein Supabase OAuth Setup nötig

## Open Questions
- [x] Soll die AGB-Seite und Datenschutzerklärung als eigene statische Seiten in PROJ-2 existieren, oder reichen externe Links? → **Externe Links mit Platzhalter-URLs für MVP**
- [x] Wie lang soll der Reset-Link gültig sein? → **1 Stunde (Supabase-Standard) ist ausreichend**
- [x] Soll nach Signup der `pending`-Nutzer die Home-Seite sehen oder den Hinweis-Screen? → **Hinweis-Screen bis zur Bestätigung — kein Zugriff auf die App**

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| E-Mail/Passwort + Google + Apple (kein Facebook) | Facebook in Zielgruppe (18–35 Freundesgruppen) kaum noch dominant; Apple Pflicht für App Store wenn anderer OAuth-Provider vorhanden; Facebook erhöht Setup-Aufwand ohne klaren Nutzen | 2026-06-21 |
| Display-Name als Pflichtfeld beim Signup | Name wird sofort in Gruppenfeatures (PROJ-3+) für andere Mitglieder sichtbar; Auto-Fallback (E-Mail-Präfix) wirkt unprofessionell | 2026-06-21 |
| Passwort zurücksetzen in PROJ-2 | Ohne Reset-Flow sind E-Mail/Passwort-Nutzer dauerhaft ausgesperrt; Supabase unterstützt es nativ mit minimalem Aufwand | 2026-06-21 |
| Account-Löschung auf PROJ-8 verschoben | Bereinigung von Gruppen/Aktivitäten/Votes erfordert Kenntniss von PROJ-3–7; zu komplex für PROJ-2 | 2026-06-21 |
| Nach Login immer zur Home-Seite (kein „Redirect back") | Static Export hat keine serverseitige Redirect-Logik; Client-seitiges Merken der ursprünglichen URL erhöht Komplexität unverhältnismäßig | 2026-06-21 |
| Kein Magic Link | Nicht im Konzept vorgesehen; E-Mail/Passwort + OAuth deckt alle Nutzungsfälle ab | 2026-06-21 |
| Google / Apple / Facebook OAuth als deaktivierte Platzhalter im MVP | Privattest-Phase erfordert kein OAuth; Setup (Google Cloud Console, Apple Developer Account, Facebook Developer App) ist zu aufwändig ohne Veröffentlichungsabsicht; OAuth wird vor App-Store-Release (PROJ-9) aktiviert | 2026-06-21 |
| Fehlermeldung „E-Mail oder Passwort falsch" (nicht differenziert) | Verhindert User-Enumeration (Angreifer kann nicht herausfinden welche E-Mails registriert sind) | 2026-06-21 |
| Reset-Bestätigung ohne Unterschied bei registrierter/unregistrierter E-Mail | Verhindert User-Enumeration beim Passwort-Reset-Flow | 2026-06-21 |
| AGB/Datenschutz als externe Links mit Platzhalter-URLs | Eigene statische Seiten sind für MVP unnötig; externe Links (z.B. Notion) reichen; Platzhalter werden vor Launch ersetzt | 2026-06-21 |
| Reset-Link-Gültigkeit: 1 Stunde (Supabase-Standard) | Ausreichend für den Nutzungskontext; kürzere Fenster erhöhen Support-Aufwand ohne Sicherheitsgewinn | 2026-06-21 |
| `pending`-Nutzer bleibt auf Hinweis-Screen bis zur E-Mail-Bestätigung | Kein teilweiser Zugriff auf die App mit unbestätigtem Account — klare UX, keine Sonderfälle in der Auth-Guard-Logik | 2026-06-21 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| `AuthProvider` in `layout.tsx` statt Middleware | Static Export hat keine Server-Middleware; Supabase-Session-Listener client-seitig ist der einzige kompatible Ansatz | 2026-06-21 |
| Einheitlicher `/auth/callback` für OAuth + E-Mail-Verify + Password-Reset | Supabase erwartet eine einzige Redirect-URL; alle Token-Typen werden im gleichen Handler unterschieden (URL-Parameter `type`) | 2026-06-21 |
| `profiles.status` per Client-Call (kein DB-Trigger) | Static Export = kein Server-Side-Code; Client setzt `status = 'active'` direkt nach erfolgreicher Token-Verifikation im `/auth/callback` | 2026-06-21 |
| Kein `@supabase/auth-helpers-nextjs` / `@supabase/ssr` | Beide Pakete setzen SSR oder Middleware voraus — inkompatibel mit `output: 'export'`; `supabase-js` direkt reicht aus | 2026-06-21 |
| `@hookform/resolvers` als einzige neue Abhängigkeit | Verbindet Zod-Schemas mit react-hook-form; ohne dieses Paket ist Zod-Validierung in Formularen nicht möglich | 2026-06-21 |
| OAuth-Provider-Credentials nur im Supabase Dashboard (nicht im Code) | Google + Apple Client Secrets dürfen nie ins Repository; Supabase verwaltet den OAuth-Handshake serverseitig | 2026-06-21 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

> Genehmigt: _ausstehend_

### Überblick

PROJ-2 baut vollständig auf dem Supabase Auth Service auf. Keine eigene Session-Logik, keine Server-Komponenten (Static Export). Alle Seiten sind Client-Components. Eine zentrale `AuthProvider`-Komponente lauscht auf Session-Änderungen und stellt den Auth-State der gesamten App bereit.

---

### Komponenten-Struktur (visueller Baum)

```
App Layout (src/app/layout.tsx)
└── AuthProvider                        (React Context — verwaltet Session global)
    │
    ├── Öffentliche Routen (kein Guard)
    │   │
    │   ├── /login                      Login-Seite
    │   │   ├── LoginForm
    │   │   │   ├── EmailInput          (shadcn/ui Input)
    │   │   │   ├── PasswordInput       (shadcn/ui Input)
    │   │   │   ├── Fehler-Alert        (shadcn/ui Alert)
    │   │   │   ├── SubmitButton        (shadcn/ui Button)
    │   │   │   ├── OAuthButton         "Mit Google einloggen"   ← deaktiviert, Platzhalter
    │   │   │   ├── OAuthButton         "Mit Apple einloggen"    ← deaktiviert, Platzhalter
    │   │   │   └── OAuthButton         "Mit Facebook einloggen" ← deaktiviert, Platzhalter
    │   │   └── Links: "Passwort vergessen" / "Registrieren"
    │   │
    │   ├── /signup                     Registrierungs-Seite
    │   │   ├── SignupForm
    │   │   │   ├── EmailInput
    │   │   │   ├── PasswordInput       (mit Stärke-Hinweis: min. 8 Zeichen)
    │   │   │   ├── DisplayNameInput
    │   │   │   ├── AGBCheckbox         (shadcn/ui Checkbox)
    │   │   │   ├── Fehler-Alert
    │   │   │   └── SubmitButton
    │   │   └── Link: "Bereits registriert? Einloggen"
    │   │
    │   ├── /signup/pending             E-Mail-Bestätigungs-Hinweis-Screen
    │   │   └── EmailPendingScreen
    │   │       ├── Hinweis-Text        ("Bestätigungs-Mail an [E-Mail] gesendet")
    │   │       ├── Button              "Mail erneut senden"
    │   │       └── Link                "Andere E-Mail-Adresse verwenden"
    │   │
    │   ├── /forgot-password            Passwort-Reset-Anfrage
    │   │   └── ForgotPasswordForm
    │   │       ├── EmailInput
    │   │       ├── Erfolgs-Meldung     ("Falls diese Adresse registriert ist…")
    │   │       └── SubmitButton
    │   │
    │   ├── /reset-password             Neues Passwort setzen
    │   │   └── ResetPasswordForm
    │   │       ├── NewPasswordInput
    │   │       ├── ConfirmPasswordInput
    │   │       ├── Fehler-Alert
    │   │       └── SubmitButton
    │   │
    │   └── /auth/callback              OAuth + E-Mail-Verifikation + Passwort-Reset Handler
    │       └── CallbackHandler         (kein sichtbares UI — nur Spinner)
    │                                   Liest Token aus URL → tauscht gegen Session →
    │                                   leitet weiter (Home oder /reset-password)
    │
    └── Geschützte Routen (AuthGuard-Layout)
        └── /                           Home-Seite (Platzhalter für PROJ-3+)
```

---

### Datenschicht

#### Erweiterung der `profiles`-Tabelle (Migration in PROJ-2)

Die bestehende `profiles`-Tabelle aus PROJ-1 erhält eine neue Spalte:

| Spalte | Typ | Pflicht | Standard | Erlaubte Werte | Beschreibung |
|--------|-----|---------|----------|----------------|-------------|
| `status` | Text | Ja | `pending` | `pending`, `active` | E-Mail nicht bestätigt vs. bestätigt |

#### Auth-Zustand (Context)

Der globale Auth-State, der in der gesamten App zur Verfügung steht:

| Feld | Beschreibung |
|------|-------------|
| `user` | Supabase User-Objekt oder `null` (nicht eingeloggt) |
| `session` | Supabase Session (JWT) oder `null` |
| `profile` | Profil-Eintrag aus der `profiles`-Tabelle oder `null` |
| `loading` | `true` während die Session beim App-Start geladen wird |

Gespeichert in: **Browser `localStorage`** (Supabase Standard — automatisch, kein eigener Code nötig)

---

### Auth-Flüsse (Schritt für Schritt)

#### E-Mail-Registrierung
1. Nutzer füllt `/signup`-Formular aus → Client ruft Supabase Auth auf
2. Supabase legt Auth-User an + sendet Bestätigungs-Mail
3. App legt sofort einen `profiles`-Eintrag mit `status = 'pending'` an
4. Nutzer wird zu `/signup/pending` weitergeleitet
5. Nutzer klickt Link in der Mail → landet auf `/auth/callback`
6. Callback-Handler: tauscht Token gegen Session → aktualisiert `profiles.status` auf `'active'` → leitet zur Home-Seite weiter

#### Passwort zurücksetzen
1. Nutzer gibt E-Mail auf `/forgot-password` ein → Supabase sendet Reset-Mail
2. Nutzer klickt Link → landet auf `/auth/callback?type=recovery`
3. Callback-Handler erkennt `type=recovery` → tauscht Token → leitet zu `/reset-password` weiter
4. Nutzer setzt neues Passwort → wird eingeloggt → Home-Seite

#### Auth Guard
- `AuthGuard`-Layout prüft beim Rendern: `loading` → Lade-Spinner; `user === null` → `/login`; `profile.status === 'pending'` → `/signup/pending`; sonst → Seite anzeigen
- Eingeloggter Nutzer auf `/login` oder `/signup` → automatisch zur Home-Seite

---

### Neue Dateien (erstellt von /frontend + /backend)

```
src/
  app/
    login/                  page.tsx
    signup/
      page.tsx
      pending/              page.tsx
    forgot-password/        page.tsx
    reset-password/         page.tsx
    auth/
      callback/             page.tsx
  components/
    auth/
      LoginForm.tsx
      SignupForm.tsx
      EmailPendingScreen.tsx
      ForgotPasswordForm.tsx
      ResetPasswordForm.tsx
      OAuthButton.tsx
      AuthGuard.tsx          (Layout-Wrapper für geschützte Routen)
  contexts/
    AuthContext.tsx          (Provider + useAuth Hook)
```

---

### Technische Entscheidungen

| Entscheidung | Begründung |
|---|---|
| `AuthProvider` in `layout.tsx` statt Middleware | Static Export hat keine Server-Middleware; client-seitige Session-Verwaltung ist der einzige Weg |
| `/auth/callback` nur für E-Mail-Verify + Passwort-Reset (kein OAuth) | OAuth ist deferred; Handler vereinfacht sich auf zwei Token-Typen: `email` und `recovery` |
| `profiles.status` per Client-Call setzen (kein DB-Trigger) | Kein Server-Side-Code verfügbar (Static Export); Client ruft `supabase.from('profiles').update()` direkt auf |
| OAuth-Buttons als deaktivierte Platzhalter (kein Supabase-Setup) | Privattest-Phase erfordert kein OAuth; Provider-Setup erfolgt erst vor App-Store-Release (PROJ-9) |
| Kein separates `@supabase/auth-helpers-nextjs` | Die Bibliothek setzt SSR voraus; Static Export ist inkompatibel — `@supabase/supabase-js` direkt reicht aus |

---

### Abhängigkeiten

| Paket | Zweck | Status |
|-------|-------|--------|
| `@supabase/supabase-js` | Auth-Calls, Session-Management, Datenbankzugriff | Bereits installiert |
| `react-hook-form` | Formular-State + Submission-Handling | Bereits installiert |
| `zod` | Schema-Validierung für Formulare | Bereits installiert |
| `@hookform/resolvers` | Verbindet Zod-Schemas mit react-hook-form | **Neu — muss installiert werden** |

---

### Supabase-Konfiguration (manuell im Dashboard)

Folgende Einstellungen müssen im Supabase-Projekt vorgenommen werden (einmalig, nicht im Code):

| Einstellung | Wert |
|---|---|
| Email Confirmations | ON (Standard) |
| Site URL | `http://localhost:3000` (lokal) / Production-URL (vor Launch) |
| Redirect URL Allowlist | `http://localhost:3000/auth/callback` |

> Google, Apple und Facebook OAuth werden erst konfiguriert, wenn die App veröffentlicht wird.

## Implementation Notes (Frontend)

**Erstellt von /frontend — 2026-06-21**

### Neue Dateien
- `src/contexts/AuthContext.tsx` — `AuthProvider` + `useAuth` Hook; lauscht auf `onAuthStateChange`, lädt `profiles`-Eintrag nach Login
- `src/components/auth/AuthLayout.tsx` — geteiltes Layout-Wrapper für alle Auth-Seiten (zentrierte Card, ZUSAMMEN Wordmark)
- `src/components/auth/AuthGuard.tsx` — schützt `/` und zukünftige Routen; leitet auf `/login` bzw. `/signup/pending` weiter
- `src/components/auth/OAuthButton.tsx` — deaktivierte Platzhalter-Buttons für Google / Apple / Facebook
- `src/components/auth/LoginForm.tsx` — E-Mail + Passwort Login; behandelt „Email not confirmed"-Fall mit Resend-Option
- `src/components/auth/SignupForm.tsx` — Registrierung mit Anzeigename, E-Mail, Passwort, AGB-Checkbox; legt `profiles`-Eintrag an
- `src/components/auth/EmailPendingScreen.tsx` — Hinweis-Screen nach Signup mit Resend-Button
- `src/components/auth/ForgotPasswordForm.tsx` — sendet Reset-Link; zeigt Erfolgs-Meldung ohne User-Enumeration
- `src/components/auth/ResetPasswordForm.tsx` — setzt neues Passwort nach Redirect vom Reset-Link
- `src/app/login/page.tsx`, `src/app/signup/page.tsx`, `src/app/signup/pending/page.tsx`
- `src/app/forgot-password/page.tsx`, `src/app/reset-password/page.tsx`, `src/app/auth/callback/page.tsx`

### Geänderte Dateien
- `src/app/page.tsx` — Home-Seite jetzt mit `AuthGuard` + Begrüßung mit `profile.display_name`
- `src/app/layout.tsx` — Archivo-Font via `next/font/google`, `AuthProvider` als Wrapper, `lang="de"`
- `src/app/globals.css` — vollständige ZUSAMMEN Design-Tokens (Terracotta, Navy, Gold, Warm Cream) + shadcn-Mapping
- `tailwind.config.ts` — ZUSAMMEN Farb-Tokens (`bg-bg`, `text-ink`, `border-line` etc.), Archivo-Font, erweiterte Border-Radius

### Abweichungen vom Spec
- `profiles.status`-Spalte existiert in der DB noch nicht — `AuthContext.Profile` typisiert `status` als optional; `auth/callback` sendet das Update trotzdem ab (wird wirksam nach der Backend-Migration in PROJ-2)
- `database.types.ts` enthält `status` noch nicht — TypeScript-Cast in `auth/callback/page.tsx` überbrückt das bis zur Migration

### Nächster Schritt
`/qa` ausführen, um das Feature gegen die Acceptance Criteria zu testen.

## Implementation Notes (Backend)

**Erstellt von /backend — 2026-06-21**

### Datenbank-Migration
- Migration `add_profiles_status` auf Supabase angewendet: `profiles.status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active'))`
- Bestehende RLS-Policies aus PROJ-1 unverändert — alle drei Policies (`profiles_insert_own`, `profiles_select_authenticated`, `profiles_update_own`) funktionieren korrekt für den Auth-Flow

### TypeScript-Updates
- `src/lib/database.types.ts` — `status: 'pending' | 'active'` in Row / Insert / Update ergänzt (aus `generate_typescript_types` generiert, Typ auf Union-Type narrowed)
- `src/contexts/AuthContext.tsx` — `status` in lokalem `Profile`-Typ von optional (`status?`) auf required (`status`) geändert; `as Profile | null`-Cast entfernt
- `src/app/auth/callback/page.tsx` — `as Record<string, unknown>`-Cast bei `.update({ status: 'active' })` entfernt

### Build-Verifikation
- `npm run build` erfolgreich — keine TypeScript-Fehler, alle 9 Routen statisch generiert

## QA Test Results

**QA durchgeführt:** 2026-06-21
**Tester:** /qa (automatisiert + Code Review)

### Testergebnisse — Acceptance Criteria

| # | Kriterium | Status | Anmerkung |
|---|-----------|--------|-----------|
| REG-1 | `/signup` zeigt alle Pflichtfelder (E-Mail, Passwort, Anzeigename, AGB-Checkbox) | ✅ PASS | E2E: AC-SIGNUP-1 |
| REG-2 | Registrierung legt Auth-User + `profiles`-Eintrag (`status='pending'`) an, leitet zum Hinweis-Screen weiter | ✅ PASS | Code Review (status kommt aus DB-Default) |
| REG-3 | Hinweis-Screen zeigt E-Mail-Adresse, Resend- und "Andere E-Mail"-Option | ✅ PASS | E2E: AC-PENDING-1 |
| REG-4 | "Mail erneut senden" sendet Bestätigungs-Mail und zeigt Feedback | ✅ PASS | Code Review (`resend()` + `sent` state) |
| REG-5 | Bestätigungs-Link → `status='active'`, eingeloggt, Home-Seite | ✅ PASS | Code Review (`/auth/callback`) — E2E nicht automatisiert (E-Mail-Flow) |
| REG-6 | Doppelte E-Mail → "Diese E-Mail-Adresse ist bereits registriert" | ✅ PASS | Code Review (Error-Matching in SignupForm) |
| LOGIN-1 | `/login` zeigt E-Mail + Passwort + deaktivierte OAuth-Buttons | ✅ PASS | E2E: AC-LOGIN-1 |
| LOGIN-2 | Korrekte Zugangsdaten → Session + Redirect Home | ✅ PASS | Code Review (`signInWithPassword` + `window.location.href = '/'`) |
| LOGIN-3 | Falsche Zugangsdaten → "E-Mail oder Passwort falsch" | ✅ PASS | E2E: AC-LOGIN-2 |
| LOGIN-4 | `pending`-Account → "Bitte bestätige zuerst deine E-Mail-Adresse" + Resend | ✅ PASS | Code Review (LoginForm `pendingEmail` state) |
| RESET-1 | "Passwort vergessen" → `/forgot-password` | ✅ PASS | E2E: AC-LOGIN-3 |
| RESET-2 | Forgot-Password → "Falls diese Adresse registriert ist..." (kein User Enumeration) | ✅ PASS | E2E: AC-FORGOT-3 |
| RESET-3 | Reset-Link → `/auth/callback?type=recovery` → `/reset-password` | ✅ PASS | Code Review (`PASSWORD_RECOVERY` Event) |
| RESET-4 | Neues Passwort setzen → Passwort aktualisiert, eingeloggt, Home | ✅ PASS | Code Review (`updateUser`) |
| LOGOUT-1 | Eingeloggter Nutzer kann sich ausloggen (Profil-Menü) | ❌ FAIL | **Kein Logout-Button implementiert** — kein Profil-Menü, kein `signOut` in `AuthContext` |
| GUARD-1 | Nicht-eingeloggter Nutzer → Redirect zu `/login` | ✅ PASS | E2E: AC-GUARD-1 |
| GUARD-2 | Eingeloggter Nutzer auf `/login` oder `/signup` → Redirect Home | ✅ PASS | Code Review (LoginPage + SignupPage `useEffect`) |
| VAL-1 | Ungültige E-Mail → Fehlermeldung | ✅ PASS | Unit + E2E: AC-SIGNUP-VAL-2 |
| VAL-2 | Passwort < 8 Zeichen → Fehlermeldung | ✅ PASS | Unit + E2E: AC-SIGNUP-VAL-3 |
| VAL-3 | Leerer Anzeigename → Fehlermeldung | ✅ PASS | Unit + E2E: AC-SIGNUP-VAL-1 |
| VAL-4 | AGB nicht angehakt → Fehlermeldung | ✅ PASS | Unit + E2E: AC-SIGNUP-VAL-4 |

**Ergebnis: 20/21 bestanden, 1 fehlgeschlagen**

---

### Gefundene Bugs

#### BUG-01 — HIGH: Logout nicht implementiert ✅ BEHOBEN
- **Fix:** `signOut()` in `AuthContext.tsx` ergänzt; Home-Seite (`src/app/page.tsx`) erhält Header mit `DropdownMenu` + Avatar-Button; Dropdown enthält „Ausloggen" → ruft `signOut()` auf → Redirect zu `/login`

#### BUG-02 — HIGH: Abgelaufene/bereits genutzte Bestätigungs-Links zeigen endlosen Spinner ✅ BEHOBEN
- **Fix:** `src/app/auth/callback/page.tsx` prüft jetzt beim Mount URL-Hash und Query-Params auf Supabase-Fehler (`error`, `error_code`). Abgelaufene Links (`otp_expired`) → „Link abgelaufen" + „Neuen Link anfordern"-Button. Bereits genutzt (`access_denied`) → „Account bereits bestätigt" + „Zum Login"-Button. 10-Sekunden-Timeout als Fallback für alle anderen Fälle.

#### BUG-03 — MEDIUM: Netzwerkfehler beim Profile-Status-Update hinterlässt Nutzer im Pending-Zustand ✅ BEHOBEN
- **Fix:** Fehler aus `supabase.from('profiles').update()` wird jetzt ausgewertet. Bei Fehler → `errorKind = 'network'` + Fehlermeldung „Verbindungsfehler" mit „Zum Login"-Button statt stiller Weiterleitung.

#### BUG-04 — LOW: `pending`-Nutzer auf `/signup` erhält Double-Redirect ✅ BEHOBEN
- **Fix:** `src/app/signup/page.tsx` prüft `profile?.status` direkt — `pending` → `/signup/pending`, sonst → `/`; kein Umweg über Home + AuthGuard mehr.

---

### Security Audit (Red Team)

| Prüfung | Ergebnis |
|---------|----------|
| User Enumeration (Login) | ✅ Sicher — generische Fehlermeldung "E-Mail oder Passwort falsch" |
| User Enumeration (Reset) | ✅ Sicher — "Falls diese Adresse registriert ist..." |
| Auth Bypass über direkte URL | ✅ Sicher — `AuthGuard` prüft Client-seitig; RLS schützt DB-Ebene |
| XSS in Formularfeldern | ✅ Sicher — React escaped Ausgaben automatisch; keine `dangerouslySetInnerHTML` |
| Secrets im Code | ✅ OK — Supabase URL/Key aus `NEXT_PUBLIC_*` Env-Vars (öffentlich by design) |
| Unbegrenzte Login-Versuche | ✅ Supabase Auth übernimmt Rate Limiting nativ |
| `profiles.status` manuell setzen | ✅ Sicher — RLS Policy `profiles_update_own` lässt nur Owner Updates zu |
| OAuth-Buttons (Platzhalter) | ✅ Korrekt disabled — kein Provider-Setup, kein Risiko |

---

### Automatisierte Tests

| Suite | Ergebnis |
|-------|----------|
| Unit Tests (Vitest) — Zod-Validierungsschemas | ✅ 15/15 bestanden |
| E2E Tests (Playwright/Chromium) | ✅ 21/21 bestanden |

**Testdateien:**
- `src/components/auth/auth-validation.test.ts` — Unit Tests für alle Zod-Schemas
- `tests/PROJ-2-authentifizierung.spec.ts` — E2E Tests für alle automatisierbaren Acceptance Criteria

---

### Responsiveness

| Breakpoint | Status |
|------------|--------|
| 375px (Mobile) | ✅ PASS — E2E verifiziert |
| 768px (Tablet) | ✅ PASS — Code Review (Tailwind responsive classes) |
| 1440px (Desktop) | ✅ PASS — E2E verifiziert |

---

### Produktionsbereitschaft

**✅ BEREIT** — Alle High-Bugs behoben (2026-06-21):
- BUG-01: ✅ Logout implementiert (Profil-Dropdown mit Avatar, `signOut()` in AuthContext)
- BUG-02: ✅ Callback-Fehlerhandling für abgelaufene/genutzte Links + 10s-Timeout
- BUG-03: ✅ Netzwerkfehler beim Profile-Update wird angezeigt statt silent redirect
- BUG-04: ✅ Double-Redirect für `pending`-Nutzer auf `/signup` behoben

## Deployment

**Deployed:** 2026-06-22
**Production URL:** https://qt-voting-app.vercel.app
**Vercel Project:** ja-wi/qt-voting-app
**Git Tag:** v1.0.0-PROJ-2

### Deployment Notes
- Vercel Projekt via Dashboard mit GitHub-Repo `jawi-lab/ai-coding-starter-kit` (branch: main) verknüpft
- Env vars `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel gesetzt (Production + Preview + Development)
- Supabase Auth URL Configuration: `https://qt-voting-app.vercel.app/auth/callback` zur Redirect-Allowlist hinzufügen (manuell im Supabase Dashboard)
- Alle 9 Routen statisch generiert (`output: 'export'` kompatibel)

### Post-Deployment Checklist
- [x] Production URL lädt korrekt (Login-Screen sichtbar)
- [x] Alle Env Vars gesetzt
- [ ] Supabase Redirect URL für Production gesetzt (manuell)
- [ ] Auth-Flow in Production getestet (Signup, Login, Logout)

### Hotfix 2026-06-23 — Logout & Email-Bestätigung

**1. „Ausloggen"-Button reagierte nicht.**
- *Ursache:* `signOut()` wartete ausschließlich auf das `SIGNED_OUT`-Event für die Navigation. Ohne Fehler-Handling/Fallback und mit dem Default-Scope `'global'` (Netzwerk-Call) konnte das Event ausbleiben → Button schien wirkungslos.
- *Fix:* `supabase.auth.signOut({ scope: 'local' })` in `try/catch` mit garantiertem Redirect (`window.location.href = '/login'`) im `finally` ([AuthContext.tsx](../src/contexts/AuthContext.tsx)).

**2. Email-Bestätigungslink zeigte „Bestätigung fehlgeschlagen", obwohl die Bestätigung server-seitig erfolgreich war** (`email_confirmed_at` + `last_sign_in_at` gesetzt).
- *Ursache:* Die Callback-Seite wartete nur auf das `SIGNED_IN`-Event. `detectSessionInUrl` etabliert die Session aber oft, bevor der React-Listener hängt → Event verpasst → 10s-Timeout → generischer Fehler.
- *Fix:* [auth/callback](../src/app/auth/callback/page.tsx) löst die Session jetzt **aktiv** per `getSession()` auf (plus PKCE-`code`-Exchange als Fallback), statt nur passiv auf das Event zu warten. Recovery-Links werden über den vorab gelesenen `type`-Parameter weiterhin korrekt nach `/reset-password` geleitet.

**3. `pending`→`active`-Status server-seitig sauber gezogen.**
- *Vorher:* `handle_new_user` legte Profile direkt mit `status = 'active'` an → die Email-Bestätigung gated nie über den Profilstatus, die `/signup/pending`-/AuthGuard-Logik war wirkungslos.
- *Fix (Migration `profile_status_follows_email_confirmation`):*
  - `handle_new_user` setzt beim Signup `status = 'pending'` (bzw. `active`, falls bereits bestätigt — z. B. wenn Email-Confirmation deaktiviert ist).
  - Neuer Trigger `on_auth_user_confirmed` (AFTER UPDATE OF `email_confirmed_at` ON `auth.users`) flippt das Profil automatisch auf `active`, sobald die Email bestätigt wird — vollständig server-seitig, synchron zur echten Bestätigung.
  - Backfill bringt bestehende Profile in Einklang mit ihrem Bestätigungsstatus.
- Die Callback-Seite muss den Status dadurch nicht mehr selbst setzen; der `profiles`-`upsert` (inkl. `'network'`-Fehlerzweig) wurde entfernt — die Seite löst nur noch die Session auf und leitet weiter.

---

## Post-Deployment Fixes (2026-06-23)

- **Signup "Verbindungsfehler" entschärft** (`SignupForm.tsx`): Die generische Fehlermeldung verdeckte den wahren Grund. Auth-Logs zeigten `429 over_email_send_rate_limit` — das eingebaute Supabase-Mailing limitiert auf wenige Mails/Stunde. Fehler-Mapping ergänzt: spezifische Meldung bei Rate-Limit (429 / `over_email_send_rate_limit`), Passwort-Hinweis, sonst die echte Fehlermeldung statt "Verbindungsfehler".
- **Offene Aufgabe (Ops, kein Code):** Custom-SMTP-Provider (z. B. Resend) in Supabase Auth → SMTP hinterlegen, um das Rate-Limit dauerhaft zu beheben.
