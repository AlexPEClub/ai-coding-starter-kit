# Konzept – Freundes-Planungs-App

Mobile-First App, in der Freundesgruppen Unternehmungen demokratisch auswählen (Voting), über ein Kanban-Board planen, mit Kalender-Sync terminieren und nach Abschluss als persönliche Erinnerung archivieren.

---

## 1. Zielbild & Kernidee

- Gruppen organisieren gemeinsame Aktivitäten von der Idee bis zum Abschluss.
- Demokratische Auswahl per Upvote-Voting mit individuell festgelegter Schwelle.
- Strukturierte Umsetzung über ein Kanban-Board.
- Kalender-Synchronisierung für Terminfindung und Kalender-Export.
- Persönliches Archiv abgeschlossener Aktivitäten je User.

### 1.1 Plattformen & Verfügbarkeit

Die App soll auf folgenden Plattformen nutzbar sein:

- **Android** (Smartphone, native App)
- **iOS** (Smartphone, native App)
- **Web-App** (Desktop, responsive)

Konsequenzen für Konzept/Prototyp: plattformübergreifend konsistente UI, responsives Layout (Mobile-First, Desktop-Erweiterung), Account- und Daten-Sync über alle Geräte, geräteübergreifende Kalender-Synchronisierung.

---

## 2. Rollen & Berechtigungen

Jedes Projekt hat einen oder mehrere Admins, die Berechtigungen verteilen.

| Rolle | Rechte |
|---|---|
| **Admin** | Berechtigungen vergeben, Aktivitäten erstellen, alles verwalten |
| **Redakteur** | Aktivitäten erstellen, an Planung mitwirken |
| **Beobachter** | Ansicht und Voting |

---

## 3. Account & Authentifizierung

Jeder User benötigt einen eigenen Account mit Profil und Benachrichtigungs-Einstellungen.

- **Login-Optionen:** E-Mail (mit Double-Opt-In) sowie SSO via Google, Apple, Facebook.
- **Kalender:** synchronisierbar pro User.

### 3.1 Registrierungs-Flow mit Double-Opt-In (E-Mail)

1. **Registrierung:** E-Mail, Passwort, optional Name, Checkbox AGB/Datenschutz.
2. **Hinweis-Screen:** „Bestätigungs-Mail an [Adresse] gesendet.“ Account-Status `pending`. Optionen: Mail erneut senden, Adresse ändern.
3. **Bestätigungs-Mail:** enthält Verifizierungs-Link mit zeitlich begrenztem Token.
4. **Verifizierung:** Link-Klick → Status wechselt auf `active` → Weiterleitung/Auto-Login.
5. **Erstanmeldung:** Projekt erstellen oder beitreten.

**Statusmodell:** `pending` → `active`. Nur `active`-Accounts können Projekten beitreten oder voten.

**Edge Cases:** Link abgelaufen → neuen anfordern; bereits bestätigt → direkt zum Login; Mail nicht erhalten → erneut senden (mit Rate-Limit).

### 3.2 SSO-Abgrenzung

Bei Login via Google/Apple/Facebook entfällt Double-Opt-In (E-Mail durch Provider verifiziert). Diese Accounts starten direkt als `active`.

---

## 4. Projekt & Gruppe

Beim Start entscheidet der User: **Projekt erstellen** („Name der Freundesgruppe“) oder einer bestehenden **Gruppe beitreten** (per Code/Einladung).

---

## 5. Voting & Upvote-Schwelle

- Admin/Redakteur erstellen Aktivitäts-Vorschläge.
- Mitglieder voten per Upvote.
- Beim Erstellen legt der Initiator die **benötigte Upvote-Anzahl** fest (Feld „Benötigte Upvotes für Planungsstart“).
- Eine Aktivität wandert erst von „Zu Planen“ in „In Planung“, sobald diese Schwelle erreicht ist.
- Kartenanzeige zeigt Fortschritt (z. B. „3/5“).

---

## 6. Kanban-Board (Workflow)

Vier Spalten:

1. **Zu Planen** – Aktivität hat die Upvote-Schwelle erreicht; Initiator legt über Kalender-Sync einen Zeitraum fest.
2. **In Planung** – Unteraufgaben, Verantwortlichkeiten und Details werden bearbeitet.
3. **Planung abgeschlossen** – Termin steht; beteiligte User können die Aktivität zu ihrem Kalender hinzufügen.
4. **Abgeschlossen** – Aktivität fand statt; Bilder-Upload und Archivierung im Profil.

Karten zeigen: Titelbild, Name, Initiator, Zeitraum.

### 6.1 Terminfindung (Übergang in „Zu Planen“)

Kalender-Ansicht mit als geblockt angezeigten Slots der Gruppenmitglieder (Sync). Initiator wählt den Zeitraum.

### 6.2 Kalender-Export (bei „Planung abgeschlossen“)

- Button „Zu meinem Kalender hinzufügen“ in der Detailansicht, für jeden beteiligten User.
- Übernimmt Name, Zeitraum und ggf. Ort in den synchronisierten Kalender.
- **States:** nicht hinzugefügt → Button; hinzugefügt → „Im Kalender“ (Häkchen); kein Kalender verbunden → Weiterleitung zur Kalender-Verbindung.

---

## 7. Aufbau einer Aktivität

Eine Aktivität enthält:

- **Name**
- **Titelbild** (Link oder Upload)
- **Initiator**
- **Zeitraum** der Durchführung
- **Benötigte Upvotes** (Planungsschwelle)
- **Unteraufgaben** mit Deadlines
- **Verantwortlichkeiten** (Zuweisung an User)
- **Kommentar-Funktion**
- **Bild-Upload** (insb. nach Abschluss)
- **Dauer-Kategorie:** spontan (ein Tag) / Wochenende / längerer Zeitraum

---

## 8. Profil

- Account- und Benachrichtigungs-Einstellungen (Push, Mail).
- Kalender-Verbindung verwalten.
- **Archiv:** Galerie aller abgeschlossenen Aktivitäten mit eigener Beteiligung, inkl. hochgeladener Bilder.

---

## 9. Screen-Übersicht (für Prototyp)

1. Onboarding / Auth (Login + Registrierung mit Double-Opt-In)
2. Projekt erstellen / beitreten
3. Projekt-Übersicht (Vorschläge + Voting, Filter nach Dauer)
4. Aktivität erstellen (inkl. Upvote-Schwelle)
5. Kanban-Board (4 Spalten)
6. Aktivitäts-Detail (Unteraufgaben, Verantwortlichkeiten, Kommentare, Bilder, Kalender-Export)
7. Terminfindung (Kalender-Modal)
8. Profil (Einstellungen + Archiv)

---

## 10. Backlog (spätere Ausbaustufen)

- Reminder per Push, Mail und WhatsApp.
- Aktivitäts-Vorlagen basierend auf Standort.

---

# Teil B – Technische Umsetzung (Build-Vorgaben)

Dieser Teil ist die verbindliche Bauanleitung für den umsetzenden AI-Agenten. Gewählter Ansatz: **Variante A – Next.js Static Export + Capacitor + Supabase.**

## 11. Tech-Stack

- **Framework:** Next.js 16 + TypeScript, App Router.
- **Styling:** Tailwind CSS + shadcn/ui (bereits installiert).
- **Formulare/Validierung:** react-hook-form + Zod.
- **Backend:** Supabase – Postgres, Auth, Storage, Realtime, Edge Functions (MCP-Server bereits via `.mcp.json` verbunden).
- **Native Verpackung:** Capacitor (iOS + Android).
- **Tests:** Vitest (Unit), Playwright (E2E).
- **Web-Deploy:** Vercel.
- **OTA-Updates (nativ):** Capgo (Open Source) oder Appflow.

## 12. Architektur – Variante A (verbindlich)

- Next.js mit **`output: 'export'`** (statischer Export). Die App wird als statische Assets gebaut und in die nativen Capacitor-Container gebündelt.
- **Keine** Server Components, SSR, Server Actions oder API-Routes als Pflichtpfad. Datenlogik läuft **client-seitig** gegen Supabase.
- Eine Codebasis bedient Web (Vercel) und native Apps (Capacitor) identisch.
- Supabase-Zugriffe (Auth, DB, Storage, Realtime) erfolgen über den Supabase-Client direkt aus dem Frontend; sensible Operationen über RLS-Policies und Edge Functions absichern.

### 12.1 Konsequenzen für die Implementierung

- Alle Seiten als Client-Komponenten oder statisch generierbar konzipieren.
- Datenabruf via Supabase-Client + React-Hooks (kein `getServerSideProps`).
- Board-Updates in Echtzeit über Supabase Realtime.

## 13. Datenmodell (Supabase, Grundgerüst)

Mindestens folgende Tabellen mit Beziehungen modellieren:

- `profiles` – User-Profil, Benachrichtigungs-Einstellungen, Kalender-Verbindung, Account-Status (`pending` / `active`).
- `projects` – Freundesgruppe.
- `project_members` – User ↔ Projekt mit Rolle (`admin` / `editor` / `observer`).
- `activities` – Aktivität inkl. Name, Titelbild, Initiator, Zeitraum, Dauer-Kategorie, benötigte Upvotes, Board-Status (`zu_planen` / `in_planung` / `planung_abgeschlossen` / `abgeschlossen`).
- `votes` – Upvotes je Aktivität und User (eindeutig pro User/Aktivität).
- `subtasks` – Unteraufgaben mit Deadline und Verantwortlichem.
- `comments` – Kommentare je Aktivität.
- `activity_images` – hochgeladene Bilder (Supabase Storage-Referenz).

**Logik-Regeln:**
- Aktivität wechselt von `zu_planen` → `in_planung`, sobald `votes`-Anzahl ≥ benötigte Upvotes.
- Nur `active`-Accounts dürfen Projekten beitreten oder voten.
- Rollenrechte über Row-Level-Security-Policies durchsetzen.

## 14. Authentifizierung

- **Supabase Auth.**
- E-Mail-Registrierung mit **Double-Opt-In** (Bestätigungs-Link, Status `pending` → `active`).
- OAuth-Provider: Google, Apple, Facebook (SSO-Accounts direkt `active`).
- **Pflicht:** Wird Google- oder Facebook-Login angeboten, muss laut Apple auch **Sign in with Apple** verfügbar sein.

## 15. Native Features & Plattform-Weichen

- **Push:** `@capacitor/push-notifications` + FCM (Android) / APNs (iOS). Nur in nativen Builds aktiv.
- **Kalender:** Capacitor-Kalender-Plugin (z. B. `@ebarooni/capacitor-calendar`) für Geräte-Kalender-Export. Echter Zwei-Wege-Sync mit Google-/Apple-Kalendern zusätzlich über die jeweiligen Cloud-APIs.
- **Weichen:** Native-only-Funktionen über `Capacitor.isNativePlatform()` kapseln; in der Web-App entfallen sie oder erhalten Web-Fallbacks (optional Web-Push).

## 16. Deployment & Release

- **Web:** statischer Export → Vercel.
- **Nativ:** Capacitor-Builds für iOS (App Store) und Android (Play Store).
- **Simultane Updates:**
  - JS-/UI-/Logik-Änderungen → Web sofort via Vercel + nativ via OTA (Capgo/Appflow), nahezu gleichzeitig ohne Store-Review.
  - Native-Code-Änderungen (neue Plugins, Berechtigungen, SDK-Upgrades) → neue Store-Builds mit Review-Verzögerung.
- **Grundsatz:** Native Anteile klein und stabil halten, damit der Großteil der Releases simultan ausgespielt werden kann.

## 17. Build-Reihenfolge (für den AI-Agenten)

1. **Web-App vollständig zuerst** – kompletter Kernflow (Voting → Board → Terminfindung → Abschluss → Archiv) als statisch exportierbare Next.js-App gegen Supabase.
2. Auth inkl. Double-Opt-In und OAuth.
3. Supabase-Schema + RLS-Policies anlegen.
4. Tests (Vitest/Playwright) für Kernflows.
5. **Erst danach Capacitor ergänzen** – `output: 'export'` konfigurieren, iOS/Android-Plattformen hinzufügen, Push- und Kalender-Plugins integrieren.
6. OTA-Pipeline (Capgo) und Vercel-Deploy an gemeinsamen Release-Trigger koppeln.

**Wichtig:** Web-App und Capacitor nicht parallel starten – Capacitor ist der letzte Schritt.
