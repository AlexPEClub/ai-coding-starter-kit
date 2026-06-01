# PROJ-3: Patienten-Verwaltung (CRUD)

## Status: Approved
**Created:** 2026-05-29
**Last Updated:** 2026-06-01 (QA Runde 2: alle Bugs behoben, Live-Smoke-Test + 2-Tenant-Isolation grün → Approved)

## Dependencies
- Requires: PROJ-2 (Therapeuten-Authentifizierung & Workspace) — eingeloggter Therapeut, Workspace-Kontext

## User Stories
- Als Therapeut möchte ich einen neuen Patienten (Tier) anlegen, damit ich die Rehabilitationsbetreuung beginnen kann.
- Als Therapeut möchte ich beim Anlegen eines Patienten einen bestehenden Besitzer auswählen oder direkt einen neuen erstellen, damit keine Duplikate entstehen.
- Als Therapeut möchte ich Patientendaten bearbeiten können, damit ich Änderungen (Gewicht, Diagnose, Besitzerdaten) aktuell halte.
- Als Therapeut möchte ich die Patientenliste nach Name durchsuchen und nach Status filtern, damit ich schnell den richtigen Patienten finde.
- Als Therapeut möchte ich einen Patienten archivieren, wenn die Behandlung abgeschlossen ist, damit die Liste übersichtlich bleibt.
- Als Therapeut möchte ich auf der Patientendetailseite alle relevanten Informationen auf einen Blick sehen.

## Out of Scope
- Separates Besitzer-Verzeichnis — deferred to PROJ-15 (Kundenverwaltung)
- Strukturierte medizinische Diagnose-Einträge mit Datum/Verlauf — P1, eigenes Feature
- Termine-Inhalt auf der Detailseite — deferred to PROJ-16 (Terminverwaltung)
- Trainingsplan-Inhalt auf der Detailseite — deferred to PROJ-5 (Trainingsplan-Builder)
- Kunden-Portal-Zugang für Tierbesitzer — deferred to PROJ-6
- Hartes Löschen von Patienten oder Besitzern
- Bulk-Aktionen (mehrere Patienten gleichzeitig archivieren)
- Patientenakte als PDF exportieren — deferred to PROJ-14 (Erweiterte Reports)
- Duplikat-Erkennung bei Tiernamen (Tiernamen sind nicht eindeutig)

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

### Patient anlegen
- [ ] Angenommen der Therapeut ist eingeloggt, wenn er auf "Neuer Patient" klickt und Tiername, Tierart und einen Besitzer ausfüllt und speichert, dann wird der Patient angelegt und die Detailseite geöffnet.
- [ ] Angenommen der Therapeut füllt das Formular aus, wenn er ein Pflichtfeld leer lässt, dann wird für jedes leere Pflichtfeld eine Validierungsfehlermeldung direkt am Feld angezeigt.
- [ ] Angenommen der Therapeut legt einen neuen Patienten an, wenn er "Neuen Besitzer anlegen" wählt, dann kann er Vorname, Nachname und mindestens E-Mail oder Telefon direkt im selben Formular eingeben.
- [ ] Angenommen der Therapeut legt einen neuen Patienten an, wenn er "Bestehenden Besitzer wählen" wählt, dann kann er einen Besitzer per Name suchen und aus einer Liste auswählen.
- [ ] Angenommen der Therapeut lädt ein Patientenfoto hoch, wenn die Datei kein Bild-Format (jpg/png/webp) ist oder größer als 5 MB ist, dann wird eine Fehlermeldung angezeigt.

### Patient bearbeiten
- [ ] Angenommen der Therapeut ist auf der Patientendetailseite, wenn er auf "Bearbeiten" klickt, dann öffnet sich ein Bearbeitungsformular mit allen aktuellen Werten vorausgefüllt.
- [ ] Angenommen der Therapeut bearbeitet einen Patienten, wenn er speichert, dann werden die Änderungen sofort auf der Detailseite angezeigt.
- [ ] Angenommen die Netzwerkverbindung schlägt beim Speichern fehl, dann wird eine Fehlermeldung angezeigt und die Eingaben bleiben erhalten.

### Patient archivieren & reaktivieren
- [ ] Angenommen der Therapeut ist auf der Detailseite eines aktiven Patienten, wenn er auf "Archivieren" klickt, dann erscheint ein Bestätigungsdialog.
- [ ] Angenommen der Therapeut bestätigt das Archivieren, dann wird der Patient aus der Standardliste entfernt und erscheint nur noch beim Filter "Archiviert".
- [ ] Angenommen ein Patient ist archiviert, wenn der Therapeut auf "Reaktivieren" klickt, dann wird der Patient sofort wieder als aktiv gesetzt.

### Patienten-Liste
- [ ] Angenommen der Therapeut öffnet die Patientenliste, dann werden standardmäßig alle aktiven Patienten angezeigt.
- [ ] Angenommen der Therapeut gibt einen Suchbegriff ein, dann werden nur Patienten angezeigt, deren Tiername oder Besitzername (Vor- oder Nachname) den Begriff enthält.
- [ ] Angenommen keine Patienten vorhanden sind, dann zeigt die leere Liste einen Call-to-Action "Ersten Patienten anlegen".
- [ ] Angenommen eine Suche ergibt keine Treffer, dann wird die Meldung "Kein Patient gefunden" angezeigt.
- [ ] Angenommen der Filter auf "Archiviert" gesetzt ist, dann werden nur archivierte Patienten angezeigt.

### Patientendetailseite
- [ ] Angenommen der Therapeut öffnet die Detailseite, dann sieht er: Tierdaten (alle Felder), Besitzerdaten (alle Felder), Anamnese/Notizen (Freitext), und Platzhalter-Sektionen für Termine und Trainingspläne.
- [ ] Angenommen der Therapeut bearbeitet das Anamnese/Notizen-Feld und speichert, dann wird der Text sofort aktualisiert.

### Tierbesitzer
- [ ] Angenommen ein Besitzer hat mehrere Tiere, wenn der Therapeut die Besitzerdaten auf einer Patientendetailseite aufruft, dann sieht er eine Liste aller verknüpften Tiere dieses Besitzers.
- [ ] Angenommen der Therapeut bearbeitet einen Besitzer, wenn er Vorname, Nachname und beide Kontaktfelder (E-Mail und Telefon) leer lässt, dann wird die Meldung "Mindestens E-Mail oder Telefon ist erforderlich" angezeigt.

## Edge Cases
- Zwei Patienten mit demselben Namen (z.B. zwei Hunde namens "Max") — erlaubt, kein Duplikat-Check
- Besitzer hat zwei Tiere, eines wird archiviert — der Besitzer und das zweite Tier bleiben aktiv
- Netzwerkfehler beim Speichern — Fehlermeldung, alle Eingaben bleiben im Formular erhalten
- Foto-Upload mit falschem Format oder > 5 MB — Fehlermeldung, kein Upload
- Suche ergibt keine Treffer — "Kein Patient gefunden" statt leerer Liste
- Zwei Therapeuten derselben Praxis bearbeiten gleichzeitig denselben Patienten — letztes Speichern gewinnt (kein Konflikthandling für MVP)
- Besitzer wird bei einem Patienten als "Neuer Besitzer" angelegt, obwohl er bereits existiert — kein automatischer Duplikat-Check für MVP; Therapeut muss selbst auf "Bestehenden Besitzer wählen" achten

## Technical Requirements (optional)
- Security: Patienten sind strikt Tenant-isoliert — kein Therapeut kann Patienten anderer Praxen sehen
- Performance: Patientenliste mit bis zu 200 Einträgen lädt ohne Pagination für MVP

## Open Questions
_Keine offenen Fragen._

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Patient = Tier (nicht Tierbesitzer) | Sauberere Datentrennung; Tierbesitzer als eigener Datensatz ermöglicht spätere Portal-Zugänge pro Besitzer (PROJ-6) | 2026-05-29 |
| Kein hartes Löschen | Daten bleiben für Dokumentation und spätere Auswertung erhalten; Archivieren reicht für Praxis-Workflow | 2026-05-29 |
| Besitzer einmal anlegen, mehrere Tiere verknüpfen | Vermeidet Datenduplikate; ein Besitzer mit zwei Hunden braucht nur einen Datensatz | 2026-05-29 |
| Kein Duplikat-Check bei Tiernamen | Tiernamen sind nicht eindeutig — viele Hunde heißen "Max"; Duplikate wären hier kein Problem | 2026-05-29 |
| Kein separates Besitzer-Verzeichnis im MVP | Besitzer werden im Kontext ihrer Tiere verwaltet; vollständiges Besitzer-Management kommt mit PROJ-15 | 2026-05-29 |
| Anamnese als Freitext | Strukturierte Diagnosefelder sind P1; für MVP reicht ein Freitext-Feld für klinische Notizen | 2026-05-29 |
| Patientenfoto max. 5 MB | Konsistent mit Profilbildern aus PROJ-2; sinnvoll für MVP-Storage-Budget | 2026-05-29 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| Zwei neue Tabellen: `owners` (Tierbesitzer) und `patients` (Tier), 1:n verknüpft | Setzt die Produkt-Entscheidung "Besitzer einmal anlegen, mehrere Tiere verknüpfen" technisch um; ermöglicht später Portal-Zugänge pro Besitzer (PROJ-6) | 2026-06-01 |
| Beide Tabellen tenant-isoliert via `tenant_id` + RLS mit `get_tenant_id()` | Wiederverwendung des bewährten Multi-Tenant-Musters aus PROJ-1; kein Therapeut sieht Daten fremder Praxen | 2026-06-01 |
| Tierart als Textfeld mit Dropdown-Vorgabe + "Andere" → Freitext | Konsistente Standard-Daten bei voller Flexibilität; ein einzelnes Textfeld bleibt schema-einfach | 2026-06-01 |
| Geschlecht als feste Auswahl (Check-Constraint), übrige Tier-Zusatzfelder optional | Geschlecht hat klare Kategorien; Rasse/Geburtsdatum/Gewicht sind frei und dürfen leer bleiben | 2026-06-01 |
| Besitzer ohne Zusatzfelder (nur Name + E-Mail/Telefon) | Schlankestes MVP gemäß Produktentscheidung; Adress-/Notizfelder bei Bedarf später nachrüstbar | 2026-06-01 |
| Constraint "mindestens E-Mail ODER Telefon" auf DB-Ebene (Check) + Zod | Doppelte Absicherung: Server-Validierung als zweite Verteidigungslinie hinter dem Formular | 2026-06-01 |
| Archivieren = `status`-Spalte (`active`/`archived`), kein Hard-Delete | Setzt Produkt-Entscheidung "Kein hartes Löschen" um; Standardliste filtert auf `active` | 2026-06-01 |
| Eigener Storage-Bucket `patient-photos` (public, 5 MB, jpg/png/webp) | Spiegelt das `profile-avatars`-Muster aus PROJ-2; trennt Patientenfotos sauber von Profil-/Logo-Assets | 2026-06-01 |
| REST-API-Routen unter `/api/patients` und `/api/owners` (Next.js Route Handler) | Konsistent mit den bestehenden Routen `/api/profile` und `/api/workspace`; Server-seitige Zod-Validierung + Auth-Check | 2026-06-01 |
| Patientenliste ohne Pagination (Limit 200) | Spec-Vorgabe; MVP-Praxen haben < 200 Patienten, clientseitige Suche/Filter genügt | 2026-06-01 |
| "Letztes Speichern gewinnt" — kein Optimistic-Locking | Spec-Edge-Case; zwei gleichzeitig editierende Therapeuten sind im MVP unwahrscheinlich, Konflikthandling wäre Overkill | 2026-06-01 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Überblick (für Nicht-Techniker)
Patienten-Verwaltung baut direkt auf der in PROJ-1/PROJ-2 fertiggestellten Multi-Tenant-Basis auf. Es kommen **zwei neue Datentöpfe** hinzu: **Tierbesitzer** und **Patienten (Tiere)**. Jeder Patient gehört genau einem Besitzer; ein Besitzer kann mehrere Tiere haben. Alles ist strikt pro Praxis getrennt — technisch über dieselbe Tenant-Isolierung wie bisher. Es wird sowohl Frontend (Listen, Formulare, Detailseite) als auch Backend (Datenbank-Tabellen, API, Foto-Speicher) benötigt.

### Brauchen wir ein Backend?
**Ja.** Daten müssen dauerhaft gespeichert, pro Praxis isoliert und für alle Therapeuten derselben Praxis sichtbar sein. localStorage scheidet aus. Wir nutzen die bestehende Supabase-Datenbank (PostgreSQL + Storage).

### A) Component Structure (Visual Tree)
```
Patienten-Liste  (/patients)
├── Kopfzeile
│   ├── Suchfeld (Tiername / Besitzername)
│   ├── Status-Filter (Aktiv / Archiviert)   ← Tabs oder Select
│   └── Button "Neuer Patient"
├── Patienten-Tabelle (shadcn Table)
│   ├── Zeile: Foto · Tiername · Tierart · Besitzer · Status
│   └── Klick auf Zeile → Detailseite
├── Empty State "Ersten Patienten anlegen"   (keine Patienten)
└── No-Results State "Kein Patient gefunden"  (Suche ohne Treffer)

Patient anlegen / bearbeiten  (Dialog oder /patients/new)
├── Tier-Sektion
│   ├── Tiername *            (Input)
│   ├── Tierart * + "Andere"  (Select + bedingtes Freitextfeld)
│   ├── Rasse                 (Input)
│   ├── Geburtsdatum          (Date-Picker → Alter wird angezeigt)
│   ├── Geschlecht            (Select)
│   ├── Gewicht (kg)          (Number-Input)
│   ├── Anamnese / Notizen    (Textarea)
│   └── Foto-Upload           (Bild ≤ 5 MB, jpg/png/webp)
└── Besitzer-Sektion  (Radio: bestehend wählen | neu anlegen)
    ├── [bestehend]  Besitzer-Suche  (Command/Combobox)
    └── [neu]        Vorname * · Nachname * · E-Mail · Telefon
                     (mind. E-Mail oder Telefon erforderlich)

Patienten-Detailseite  (/patients/[id])
├── Kopf: Foto · Tiername · Status-Badge · Buttons (Bearbeiten · Archivieren/Reaktivieren)
├── Card "Tierdaten"        (alle Felder)
├── Card "Besitzer"         (Daten + Liste aller Tiere dieses Besitzers, verlinkt)
├── Card "Anamnese/Notizen" (inline editierbar)
├── Card "Termine"          ← Platzhalter (PROJ-16)
└── Card "Trainingspläne"   ← Platzhalter (PROJ-5)

Bestätigungsdialog "Archivieren"  (shadcn AlertDialog)
```
Alle UI-Bausteine sind bereits als shadcn/ui-Komponenten installiert (Table, Dialog, AlertDialog, Form, Input, Select, Textarea, Command, Badge, Tabs, Avatar, Skeleton, Sonner-Toast). Keine neue UI-Bibliothek nötig.

### B) Data Model (Klartext)

**Tierbesitzer (`owners`)**
```
- Eindeutige ID
- Praxis-Zugehörigkeit (tenant_id)  ← sorgt für Mandanten-Trennung
- Vorname *  /  Nachname *
- E-Mail     (optional)
- Telefon    (optional)
- Erstellt am
Regel: Mindestens E-Mail ODER Telefon muss gefüllt sein.
```

**Patient / Tier (`patients`)**
```
- Eindeutige ID
- Praxis-Zugehörigkeit (tenant_id)
- Besitzer (owner_id → owners)
- Tiername *
- Tierart *        (z. B. Hund/Katze/Pferd, oder Freitext bei "Andere")
- Rasse            (optional)
- Geburtsdatum     (optional, daraus Alter berechnet)
- Geschlecht       (feste Auswahl: männlich / weiblich / männlich kastriert / weiblich kastriert / unbekannt)
- Gewicht in kg    (optional)
- Anamnese/Notizen (Freitext, optional)
- Foto-URL         (optional, zeigt auf Storage)
- Status           (aktiv / archiviert) — Standard: aktiv
- Erstellt am  /  Aktualisiert am
```

**Foto-Speicher:** neuer Supabase-Storage-Bucket `patient-photos` (öffentlich lesbar, max. 5 MB, nur jpg/png/webp). Ablage-Pfad pro Praxis: `{tenant_id}/{patient_id}.{ext}`.

**Speicherort:** Supabase PostgreSQL (Tabellen) + Supabase Storage (Fotos). Beide Tabellen mit Row Level Security: nur Mitglieder derselben Praxis dürfen lesen/schreiben (via `get_tenant_id()`), kein Hard-Delete erlaubt.

### C) Tech-Entscheidungen (das WARUM)
- **Zwei getrennte Tabellen statt Besitzerdaten im Patienten:** Ein Besitzer mit zwei Tieren wird nur einmal gespeichert — keine Duplikate, und die Detailseite kann alle Tiere eines Besitzers anzeigen. Legt die Basis für spätere Besitzer-Portalzugänge (PROJ-6).
- **Archivieren über ein Status-Feld statt Löschen:** Patientendaten bleiben für Dokumentation erhalten; die Standardliste blendet Archivierte einfach aus.
- **Tierart als Freitextspalte mit Dropdown-Vorauswahl:** Gibt einheitliche Standardwerte vor, lässt aber über "Andere" Sonderfälle (z. B. Kaninchen, Vogel) zu — ohne das Schema zu verkomplizieren.
- **Eigener Foto-Bucket nach dem Muster der Profilbilder (PROJ-2):** Bewährtes, einfaches Upload-Muster wird wiederverwendet; Validierung (Format/Größe) passiert sowohl im Bucket als auch im Formular.
- **REST-API wie bei PROJ-2:** Gleiche Struktur wie `/api/profile` und `/api/workspace` — Auth-Check + Zod-Validierung serverseitig, RLS als zweite Verteidigungslinie.
- **Keine Pagination:** Für < 200 Patienten lädt die Liste komplett; Suche und Filter laufen schnell genug clientseitig. Spart Komplexität im MVP.

### D) Dependencies (zu installieren)
**Keine neuen Pakete erforderlich.** Alles ist bereits vorhanden:
- `@supabase/supabase-js` / SSR-Client (PROJ-1/2)
- `zod` + `react-hook-form` (Validierung, bereits im Stack)
- `date-fns` *prüfen* — falls noch nicht installiert, für Alter-Berechnung & Datumsformatierung; sonst native `Intl`-API nutzen (keine neue Abhängigkeit).
- Alle benötigten shadcn/ui-Komponenten sind installiert.

### Neue Dateien (Ausblick für /frontend & /backend)
```
supabase/migrations/003_patients_owners.sql   (Tabellen, RLS, Bucket)
src/app/(app)/patients/page.tsx                (Liste)
src/app/(app)/patients/[id]/page.tsx           (Detailseite)
src/components/patient-form.tsx                (Anlegen/Bearbeiten)
src/components/owner-picker.tsx                (Besitzer suchen/neu)
src/app/api/patients/route.ts                  (GET Liste, POST)
src/app/api/patients/[id]/route.ts             (GET, PATCH, Archiv/Reaktiv)
src/app/api/owners/route.ts                    (GET Suche, POST)
src/app/api/owners/[id]/route.ts               (GET inkl. Tiere, PATCH)
src/lib/database.types.ts                      (owners + patients ergänzen)
```
Die Sidebar verlinkt bereits auf `/patients` — keine Navigationsänderung nötig.

## Frontend Implementation (Frontend Developer)
**Status:** Frontend abgeschlossen am 2026-06-01. `date-fns` ist **nicht** installiert — Alter/Datum werden über native `Date`/`Intl` formatiert (keine neue Abhängigkeit).

### Erstellte Dateien
- `src/lib/patient-options.ts` — Spezies-/Geschlecht-Optionen, `formatAge`, `formatDate`, `sexLabel`, `nameInitials`
- `src/lib/patient-options.test.ts` — Unit-Tests (9, grün) für die Helper
- `src/components/patient-form.tsx` — Anlegen/Bearbeiten als Dialog inkl. Foto-Upload, Zod-Validierung, Spezies-Dropdown + „Andere"
- `src/components/owner-picker.tsx` — Besitzer-Auswahl (Combobox-Suche bestehend / Felder neu) im Anlege-Dialog
- `src/components/owner-edit-dialog.tsx` — Besitzer bearbeiten von der Detailseite
- `src/app/(app)/patients/page.tsx` — Liste mit Suche, Status-Tabs (Aktiv/Archiviert), Empty-/No-Results-States
- `src/app/(app)/patients/[id]/page.tsx` — Detailseite: Header + Archivieren/Reaktivieren, Tierdaten, Besitzer (+ weitere Tiere), inline-Anamnese, Platzhalter Termine/Trainingspläne
- `src/lib/database.types.ts` — `owners` + `patients` Typen ergänzt (Backend finalisiert via Migration)

### UI-Entscheidungen / Abweichungen
- Anlegen & Bearbeiten als **Dialog** (statt eigener `/patients/new`-Route) — schneller Flow, weniger Navigation.
- Besitzer-Auswahl erscheint **nur im Anlegen-Dialog**; im Bearbeiten-Modus wird der Besitzer über die Detailseite (`OwnerEditDialog`) gepflegt, ein Besitzer-Wechsel ist im MVP nicht vorgesehen.
- Foto-Upload passiert **nach** dem Speichern (Patient-ID/Tenant-ID werden erst dann benötigt) → POST, dann Upload nach `patient-photos/{tenant_id}/{patient_id}.{ext}`, dann `PATCH { photo_url }` mit Cache-Buster.
- Status-Filter als **Tabs** (Aktiv/Archiviert) umgesetzt.

### ⚠️ API-Vertrag — vom `/backend`-Schritt zu implementieren
Das Frontend ruft diese Endpunkte; sie existieren **noch nicht** und sind QA-blockierend bis `/backend` läuft. Vertrag:

**`GET /api/patients?status=active|archived&search=`** → `PatientListItem[]`
`{ id, name, species, breed, photo_url, status, owner: { first_name, last_name } | null }`
Suche matcht Tiername **oder** Besitzer-Vor/Nachname (case-insensitive). `.limit(200)`.

**`POST /api/patients`** → erstellter `Patient` (Row, inkl. `id`, `tenant_id`)
Body entweder mit bestehendem Besitzer `{ ...tierfelder, owner_id }`
oder neuem Besitzer `{ ...tierfelder, new_owner: { first_name, last_name, email|null, phone|null } }`.
Tierfelder: `name, species, breed|null, birth_date|null, sex|null, weight_kg|null, anamnesis|null`.
Bei `new_owner`: Besitzer zuerst anlegen (gleicher `tenant_id`), dann Patient — atomar/serverseitig. `status` default `active`.

**`GET /api/patients/[id]`** → `Patient & { owner: Owner | null, ownerPatients: {id,name,species,status}[] }`
`ownerPatients` = alle Tiere desselben Besitzers (inkl. archivierte). 404 wenn nicht gefunden / fremder Tenant.

**`PATCH /api/patients/[id]`** → aktualisierter `Patient`
Akzeptiert Teilmengen: Tierfelder, `{ status }` (Archiv/Reaktiv), `{ anamnesis }`, `{ photo_url }`.

**`GET /api/owners?search=`** → `Owner[]` (Suche nach Vor/Nachname, `.limit(20)`)
**`POST /api/owners`** → erstellter `Owner`
**`GET /api/owners/[id]`** → `Owner & { patients: {...}[] }` (optional, aktuell nicht zwingend genutzt)
**`PATCH /api/owners/[id]`** → aktualisierter `Owner` (Validierung: mind. E-Mail oder Telefon)

Alle Endpunkte: Auth-Check + Zod + RLS-Tenant-Isolation, analog `/api/profile`.
Storage-Bucket `patient-photos` (public, 5 MB, jpg/png/webp) + RLS muss in der Migration angelegt werden.

## Backend Implementation (Backend Developer)
**Status:** Backend abgeschlossen am 2026-06-01. Build grün, TypeScript clean, **78 Unit-/Integrationstests** grün.

### Datenbank — `supabase/migrations/003_patients_owners.sql`
- **`owners`**: `id, tenant_id→tenants, first_name, last_name, email, phone, created_at` + Check `owners_contact_required` (mind. E-Mail oder Telefon, getrimmt).
- **`patients`**: `id, tenant_id→tenants, owner_id→owners (ON DELETE RESTRICT), name, species, breed, birth_date, sex (Check-Enum), weight_kg numeric(6,2) (>0, ≤2000), anamnesis, photo_url, status (active|archived, default active), created_at, updated_at`.
- **Indexe**: `tenant_id` (beide), `owner_id`, kombiniert `(tenant_id, status)` für die Standardliste.
- **`set_updated_at()`** BEFORE-UPDATE-Trigger auf `patients`.
- **RLS** (beide Tabellen): SELECT/INSERT/UPDATE strikt `tenant_id = get_tenant_id()`; **kein DELETE-Policy** → Hard-Delete unmöglich (nur Archivieren).
- **Storage-Bucket `patient-photos`** (public, 5 MB, jpg/png/webp). Write-Policies bewusst **simpel** (`authenticated`), keine pfadbasierten Folder-Checks — gemäß Projekt-Erfahrung ([[feedback_supabase_storage_rls]]); Tenant-Isolation läuft über die Row-RLS.

### API-Routen (alle: Auth-Check via `resolveTenant`, Zod-Validierung, RLS als 2. Verteidigungslinie)
- `src/lib/api-tenant.ts` — gemeinsamer Helper: löst `user` + `tenant_id` auf (401 ohne Auth, 404 ohne Workspace).
- `GET /api/patients` — Liste (status-gefiltert, `.limit(200)`, alphabetisch); Suche über Tier-/Besitzername wird serverseitig in JS über das eingebettete `owner` gefiltert (OR-Semantik, ≤200 Zeilen).
- `POST /api/patients` — `201`; legt bei `new_owner` zuerst den Besitzer (gleicher Tenant) an, dann den Patienten. `owner_id` **xor** `new_owner` per Refine erzwungen.
- `GET /api/patients/[id]` — Patient + eingebetteter `owner` + `ownerPatients` (alle Tiere desselben Besitzers); `404` bei fremdem/fehlendem Datensatz.
- `PATCH /api/patients/[id]` — Teilupdate (Tierfelder, `status`, `anamnesis`, `photo_url`); leerer Patch → `400`; kein Treffer → `404`.
- `GET /api/owners` — Namenssuche (`.or(ilike)`, PostgREST-Sonderzeichen escaped, `.limit(20)`).
- `POST /api/owners` — `201`; Refine „mind. E-Mail oder Telefon".
- `GET /api/owners/[id]` — Besitzer + dessen `patients`.
- `PATCH /api/owners/[id]` — prüft „mind. E-Mail oder Telefon" gegen den **gemergten** Stand (Patch kann einen Kanal leeren).

### Tests
- `route.test.ts` für alle vier Routen-Dateien (401/400/404/Happy-Path/Authz), Mock-Stil analog `profile/route.test.ts`.
- Unit-Tests `src/lib/patient-options.test.ts` (9).

### Hinweise / kleinere Anpassungen
- `vitest.config.ts`: `tests/**` (Playwright-E2E) aus dem Vitest-Lauf ausgeschlossen — war ein **vorbestehendes** Problem (E2E-Specs aus PROJ-2 ließen `npm test` rot werden), nicht durch PROJ-3 verursacht.
- `POST`-Validierung nutzt zod-4-Top-Level `z.email()` / `z.uuid()` (strenge RFC-4122-Variantenprüfung).
- **Offen für QA:** `new_owner`-Anlage ist nicht transaktional — schlägt der Patienten-Insert nach erfolgreicher Besitzer-Anlage fehl, bleibt ein verwaister Besitzer zurück (für MVP akzeptiert; kein Hard-Delete vorhanden). Manuelles Smoke-Test gegen echte Supabase-Instanz steht noch aus (Tests sind gemockt).

## QA Test Results

**Tested:** 2026-06-01
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)

### Verifikationsumfang (wichtig)
- ✅ **Unit-/Integrationstests:** `npm test` → **78/78 grün** (8 Dateien), inkl. der 4 neuen Routen-Testdateien (mocked Supabase).
- ✅ **E2E Route-Schutz (Laufzeit):** `npx playwright test -g "Route-Schutz"` → **7/7 grün** (PROJ-2-Regression + PROJ-3). `/patients` und `/patients/[id]` leiten unauthentifiziert auf `/login?next=…` um.
- ✅ **Build:** `npm run build` grün, alle Routen kompilieren.
- ⚠️ **Eingeloggte CRUD-Flows:** **nur per Code-Audit verifiziert**, NICHT live ausgeführt — es liegt kein Test-User / keine laufende Supabase-Instanz mit Seed-Daten vor. Die E2E-CRUD-Tests sind geschrieben, laufen aber erst mit `TEST_USER_EMAIL`/`TEST_USER_PASSWORD` (sonst `test.skip`).
- ⚠️ **RLS-Mandanten-Isolation & Migration 003:** **nicht zur Laufzeit verifiziert.** Die Tenant-Trennung der SELECTs hängt vollständig daran, dass Migration 003 angewandt und RLS aktiv ist — siehe offener Smoke-Test.

### Acceptance Criteria Status (Code-Audit, sofern nicht anders vermerkt)

#### Patient anlegen
- [x] Anlegen mit Tiername/Tierart/Besitzer → POST + Redirect auf Detailseite (Code-Audit)
- [x] Pflichtfeld-Validierung pro Feld (Zod + FormMessage)
- [x] „Neuen Besitzer anlegen" mit Vor-/Nachname + E-Mail **oder** Telefon (superRefine)
- [x] „Bestehenden Besitzer wählen" via Suche/Combobox
- [x] Foto-Format/Größe (jpg/png/webp, ≤5 MB) clientseitig geprüft → Toast bei Fehler

#### Patient bearbeiten
- [~] **BUG-1:** „Bearbeiten" füllt Werte vor, aber das Formular wird beim erneuten Öffnen **nicht zurückgesetzt** → veraltete/unbestätigte Werte können bestehen bleiben. (Medium)
- [x] Speichern aktualisiert Detailseite (Reload nach Save)
- [~] **BUG-2:** Bei echtem Netzwerkausfall (fetch rejectet) erscheint **keine** Fehlermeldung (nur HTTP-Fehler `!res.ok` werden getoastet). Eingaben bleiben erhalten. Widerspricht AC „Netzwerkfehler → Fehlermeldung". (Medium)

#### Patient archivieren & reaktivieren
- [x] Bestätigungsdialog (AlertDialog) vor Archivieren
- [x] Archivierter Patient verschwindet aus der aktiven Standardliste (Filter `status=active`)
- [x] Reaktivieren setzt sofort auf aktiv (PATCH status)

#### Patienten-Liste
- [x] Standardmäßig aktive Patienten, alphabetisch, Limit 200
- [x] Suche über Tier-/Besitzername (serverseitig JS-Filter über eingebettetes owner)
- [x] Empty State „Ersten Patienten anlegen" (CTA)
- [x] No-Results „Kein Patient gefunden"
- [x] Filter „Archiviert" zeigt nur archivierte

#### Patientendetailseite
- [x] Tierdaten, Besitzerdaten, Anamnese (Freitext), Platzhalter Termine/Trainingspläne
- [x] Anamnese inline editierbar + speichern (PATCH)
- [⚠] Anmerkung: Inline-Anamnese-Save lädt den Patienten nicht neu → trägt zu BUG-1 bei (Edit-Dialog danach evtl. veraltet).

#### Tierbesitzer
- [x] „Weitere Tiere dieses Besitzers" werden gelistet & verlinkt (inkl. archivierte, gekennzeichnet)
- [x] Besitzer-Bearbeiten-Validierung „mind. E-Mail oder Telefon" (Frontend superRefine + Backend gegen gemergten Stand)

### Edge Cases Status
- [x] Zwei Tiere gleichen Namens erlaubt (kein Unique-Constraint)
- [x] Besitzer mit zwei Tieren, eines archiviert → anderes bleibt aktiv
- [~] Netzwerkfehler beim Speichern → siehe BUG-2
- [x] Foto falsches Format / >5 MB → Toast, kein Upload
- [x] Suche ohne Treffer → „Kein Patient gefunden"
- [x] „Letztes Speichern gewinnt" (kein Optimistic-Locking) — wie spezifiziert
- [~] Doppelter Besitzer bei „Neuer Besitzer" → kein Duplikat-Check (wie spezifiziert), siehe auch BUG-3

### Security Audit Results (Red Team)
- [x] **Authentifizierung:** Alle 4 API-Routen rufen zuerst `resolveTenant` → **401** ohne Session. Proxy schützt zusätzlich die Seiten (`/patients*`). API-Pfade laufen durch den Proxy, werden aber auf Routen-Ebene + RLS abgesichert. (Code-Audit; 401-Pfad durch Integrationstests abgedeckt)
- [~] **Autorisierung / Tenant-Isolation:** SELECTs verlassen sich **vollständig auf RLS** (`get_tenant_id()`), kein zusätzlicher `tenant_id`-Filter im Query. Korrekt **sofern Migration 003 angewandt & RLS aktiv** — **zur Laufzeit nicht verifiziert** (kein 2. Tenant zum Gegentest).
- [x] **Cross-Tenant Update/Read über fremde ID:** PATCH/GET `[id]` → kein Treffer unter RLS → 404, kein Leak (Code-Audit).
- [~] **BUG-3:** `POST /api/patients` prüft **nicht**, ob `owner_id` zum eigenen Tenant gehört → ein Patient kann auf einen fremden `owner_id` zeigen (dangling). **Kein Datenleak** (owners-SELECT-RLS verhindert Lesen des fremden Besitzers; Detailseite zeigt dann keinen Besitzer). UUIDs nicht erratbar. (Medium)
- [x] **XSS:** Alle Ausgaben über React (auto-escaped), kein `dangerouslySetInnerHTML`. Freitext (Name/Anamnese/Spezies) sicher.
- [x] **Injection:** Supabase/PostgREST parametrisiert; Owner-Suche `.or(ilike)` escaped `% , ( )`.
- [~] **Storage (dokumentierter MVP-Tradeoff):** `patient-photos` Write-Policy = „beliebiger authentifizierter Nutzer"; Bucket public-read. Theoretisches Cross-Tenant-Überschreiben eines Fotos nur bei Kenntnis von tenant_id+patient_id (beide UUID). Bewusste Entscheidung ([[feedback_supabase_storage_rls]]). (Low)
- [x] **Secrets:** Keine Secrets im Client-Code; `.env.local` nicht eingelesen.

### Bugs Found

#### BUG-1: Edit-Dialoge werden beim erneuten Öffnen nicht zurückgesetzt
- **Severity:** Medium
- **Komponenten:** `src/components/patient-form.tsx` (Edit), `src/components/owner-edit-dialog.tsx`
- **Repro:** Patient-Detailseite → „Bearbeiten" → Feld ändern → „Abbrechen" → „Bearbeiten" erneut. **Erwartet:** ursprüngliche Werte. **Tatsächlich:** die zuvor (unbestätigt) geänderten Werte bleiben stehen, da `useForm` nur einmal beim Mount initialisiert wird und der Dialog dauerhaft gemountet ist (kein `reset` bei `open`).
- **Folge:** Risiko, versehentlich veraltete/unbestätigte Daten zu speichern.
- **Priority:** Vor Deployment fixen (z. B. `form.reset(buildDefaults(patient))` in einem `useEffect` auf `open`/`patient`).

#### BUG-2: Echter Netzwerkfehler beim Speichern ohne Fehlermeldung
- **Severity:** Medium (verletzt explizites AC „Netzwerkfehler → Fehlermeldung")
- **Komponenten:** `patient-form.tsx`, `owner-edit-dialog.tsx`, Detailseite `changeStatus`/`saveNotes`
- **Repro:** Offline gehen → Speichern. **Erwartet:** Fehler-Toast, Eingaben bleiben. **Tatsächlich:** `fetch` rejectet, kein `catch` → kein Toast (nur `!res.ok` wird behandelt). Eingaben bleiben (Dialog offen), aber keine Rückmeldung.
- **Priority:** Vor Deployment fixen (try/catch um `fetch` mit `toast.error`).

#### BUG-3: POST /api/patients validiert owner_id nicht gegen den Tenant
- **Severity:** Medium (Daten-Integrität / Defense-in-Depth; kein Leak)
- **Komponente:** `src/app/api/patients/route.ts`
- **Repro:** API-Aufruf mit fremdem `owner_id`. **Erwartet:** 400/403. **Tatsächlich:** Patient wird mit fremder owner_id angelegt (FK erfüllt), Besitzer aber nicht lesbar (RLS) → Detailseite ohne Besitzer.
- **Priority:** Vor Deployment fixen (vor Insert prüfen, dass owner_id im eigenen Tenant existiert).

#### BUG-4: Besitzer-Combobox — Anzeigename kann nach erneuter Suche verschwinden
- **Severity:** Low (UX; `owner_id` bleibt gesetzt)
- **Komponente:** `src/components/owner-picker.tsx`
- **Repro:** Besitzer wählen → Popover erneut öffnen → tippen. Der debounced Fetch ersetzt die Liste, der gewählte Besitzer fällt aus der Anzeige (Trigger zeigt wieder „Besitzer suchen…"), obwohl der Wert gesetzt bleibt.

#### BUG-5 (Sammel, Low)
- Owner-Suche escaped `_` nicht (LIKE-Einzelzeichen-Wildcard) → leicht zu weite Treffer.
- Kein Validieren gegen **zukünftiges** Geburtsdatum (wird als Alter „null" angezeigt, aber speicherbar).
- `photo_url` PATCH akzeptiert jede gültige URL (nicht auf Storage-Domain beschränkt) — kein XSS (img-src), aber externe URLs speicherbar.
- Listen-Zeile (`TableRow onClick`) ist **nicht tastatur-fokussierbar** (a11y) — Navigation nur per Maus.

### Summary
- **Acceptance Criteria:** Funktional alle abgedeckt; **2 mit Mängeln** (BUG-1 Bearbeiten-Reset, BUG-2 Netzwerkfehler).
- **Bugs Found:** 5 (0 Critical, 0 High, **3 Medium**, **2 Low-Sammelpunkte**).
- **Security:** Keine Critical/High. RLS-basiert korrekt, aber **Laufzeit-Isolation unverifiziert**; BUG-3 (owner_id-Tenant-Check) offen.
- **Production Ready:** **NO** — nicht wegen Critical/High (keine vorhanden), sondern wegen (a) der 3 Medium-Bugs und (b) der **fehlenden Live-Verifikation** von CRUD + RLS-Mandanten-Isolation gegen eine echte Supabase-Instanz.
- **Recommendation:** BUG-1/2/3 fixen (`/frontend` für BUG-1/2, `/backend` für BUG-3), dann **manuellen Smoke-Test gegen echte Supabase** durchführen (Migration 003 anwenden, mit 2 Tenants Isolation prüfen, Foto-Upload, voller CRUD-Zyklus) und die E2E-CRUD-Tests mit Test-User aktivieren. Danach erneut `/qa`.

### Bug Fixes — Runde 1 (Frontend, 2026-06-01)
- ✅ **BUG-1 behoben:** `patient-form.tsx` und `owner-edit-dialog.tsx` setzen das Formular jetzt per `useEffect` auf `open`/`patient` bzw. `open`/`owner` via `form.reset(...)` zurück (inkl. Foto-State + File-Input). Abgebrochene/unbestätigte Edits bleiben nicht mehr erhalten. Zusätzlich: Detailseite synchronisiert nach Inline-Anamnese-Save den lokalen `patient`-State (`setPatient`, ohne Refetch/Skeleton-Flash), damit der Edit-Dialog frische Notizen zeigt.
- ✅ **BUG-2 behoben:** `try/catch` um die `fetch`-Aufrufe in `patient-form.tsx`, `owner-edit-dialog.tsx` sowie `changeStatus`/`saveNotes` der Detailseite → echter Netzwerkausfall zeigt nun einen Fehler-Toast („Netzwerkfehler — bitte erneut versuchen…"), Eingaben bleiben erhalten. Erfüllt das AC „Netzwerkfehler → Fehlermeldung".
- ✅ **BUG-3 behoben (Backend):** `POST /api/patients` prüft jetzt bei bestehendem `owner_id`, ob der Besitzer für den Aufrufer sichtbar ist — ein RLS-gebundener `select … .eq('id', owner_id).maybeSingle()`. Fremder/unbekannter `owner_id` → kein Treffer → **404** „Besitzer nicht gefunden" (verhindert die dangling Cross-Tenant-Referenz, ohne fremde Existenz preiszugeben). Neuer Integrationstest deckt den 404-Fall ab.
- ⏳ **Offen:** BUG-4/BUG-5 (Low) sowie der Live-Smoke-Test gegen echte Supabase.
- **Verifikation:** `tsc --noEmit` clean, `npm test` **79/79** grün (10 in der Patienten-Routen-Datei), `npm run build` grün. (Die Reset-/Netzwerk-Pfade sind UI-Verhalten und werden durch die auth-gated E2E-Tests abgedeckt, sobald ein Test-User vorliegt.)

---

## QA Test Results — Runde 2 (2026-06-01)

**Fokus:** Re-Verifikation der Fixes aus Runde 1 (BUG-1/2/3) + Regression.

### Verifikation der Fixes (Code-Audit + automatisiert)
- ✅ **BUG-1 (Edit-Dialog-Reset):** `patient-form.tsx` (Z. 176–178) und `owner-edit-dialog.tsx` (Z. 73–74) setzen via `useEffect`/`form.reset` bei `open` zurück; Detailseite synchronisiert `setPatient` nach Inline-Anamnese-Save. Abgebrochene Edits bleiben nicht mehr erhalten.
- ✅ **BUG-2 (Netzwerkfehler-Toast):** `catch`-Zweige mit „Netzwerkfehler …"-Toast in `patient-form.tsx`, `owner-edit-dialog.tsx`, sowie `changeStatus` + `saveNotes` der Detailseite (4 Stellen verifiziert).
- ✅ **BUG-3 (owner_id-Tenant-Check):** `POST /api/patients` (Z. 132–148) prüft bei bestehendem `owner_id` per RLS-gebundenem `.eq('id', owner_id).maybeSingle()` → **404** bei fremdem/unbekanntem Besitzer. Neuer Integrationstest „returns 404 when owner_id is not in the caller tenant" grün.

### Automatisierte Tests
- ✅ `npm test` → **79/79 grün** (Patienten-Routen-Datei jetzt 10 Tests inkl. 404-Cross-Tenant-Fall).
- ✅ `npm run build` grün.
- ✅ `npx playwright test -g "Route-Schutz"` → **7/7 grün** (Regression: `/patients` + `/patients/[id]` Schutz weiterhin intakt nach Detailseiten-Änderungen).

### Status der offenen Punkte
- ✅ BUG-1, BUG-2, BUG-3 — **behoben & verifiziert**.
- ⏳ **BUG-4 / BUG-5 (Low):** nicht behoben (bewusst zurückgestellt — UX/a11y, kein Blocker).
- ⛔ **Live-Smoke-Test gegen echte Supabase: weiterhin AUSSTEHEND.** Voller CRUD-Zyklus, **2-Tenant-RLS-Isolation**, Foto-Upload wurden nicht zur Laufzeit gegen eine echte DB ausgeführt (kein Test-User / keine laufende Instanz im QA-Kontext verfügbar). Die auth-gated E2E-CRUD-Tests sind geschrieben, aber `test.skip` ohne Credentials.

### Live-Smoke-Test gegen echte Supabase (2026-06-01) ✅
Mit echtem Test-User (`.env.test.local`, von `playwright.config.ts` geladen) gegen die echte Supabase-Instanz ausgeführt:
- ✅ **Login** → `/dashboard` (echte Session).
- ✅ **Migration 003 ist angewandt** — bestätigt dadurch, dass Patienten-/Besitzer-Inserts live gelingen.
- ✅ **Patient anlegen mit neuem Besitzer** (Tierart-Combobox „Hund", neuer Besitzer) → Detailseite mit Tierdaten/Besitzer/Anamnese/Platzhaltern.
- ✅ **Lebenszyklus** Anlegen (Spezies „Katze", Besitzer mit Telefon) → **Archivieren mit Bestätigungsdialog** → verschwindet aus aktiver Liste (Suche „Kein Patient gefunden").
- ✅ **Besitzer-Bearbeiten-Validierung** „mind. E-Mail oder Telefon" live.
- ✅ **Patientenliste / Suche / Empty-States / Route-Schutz**.
- **Ergebnis:** `tests/PROJ-3-patienten-verwaltung.spec.ts` → **10/10 grün** (chromium).
- **Test-Infra-Fix:** `playwright.config.ts` lädt jetzt `.env.test.local` (zero-dep), wodurch die auth-gated Tests überhaupt laufen. Zwei zu lockere Selektoren in der PROJ-3-Spec korrigiert (Validierungs-Message via `exact`, Platzhalter-Karten auf `main` gescopt) — reine Testfehler, keine App-Bugs.

### Bugs gefunden (Runde 2)
- **Keine neuen App-Bugs.** Keine funktionalen Regressionen.
- **Vorbestehend (PROJ-2, nicht PROJ-3):** Der Logout-E2E-Test (`PROJ-2-auth-workspace.spec.ts:217`) nutzt `page.locator('aside')` — die shadcn-Sidebar rendert **kein** `<aside>` → Timeout. Lief bisher nie (war ohne Credentials `test.skip`). Logout-**Funktion** ist im Code korrekt; nur der Test-Selektor ist veraltet. Empfehlung: in einem PROJ-2-Follow-up fixen.

### 2-Tenant-Isolation — LIVE VERIFIZIERT ✅ (2026-06-01)
Mit zweitem Account (anderer Praxis/Tenant) gegen echte Supabase ausgeführt — neuer Test „PROJ-3 Mandanten-Isolation":
- ✅ Tenant A legt Patient an; Tenant B (separater Browser-Kontext): `GET /api/patients/:id` → **404**.
- ✅ Tenant B: `PATCH` (archivieren) → **404** (kein Cross-Tenant-Write).
- ✅ Tenant B: Detailseite → „Patient nicht gefunden".
- ✅ Gegenprobe: Tenant A → `GET` → **200**.
- **Ergebnis:** Isolationstest **grün**. Erfolgskriterium „Multi-Tenant-Isolation funktioniert" ist damit zur Laufzeit belegt.
- **Hinweis Test-Daten:** Die Lifecycle-/Isolations-Tests legen pro Lauf echte (timestamp-benannte) Patienten/Besitzer an — kein Auto-Cleanup. Für CI einen dedizierten Test-Tenant + Cleanup vorsehen (Low, kein Blocker).

### Summary (Runde 2 — final)
- **Bugs:** 0 Critical, 0 High, 0 Medium offen (3 Medium behoben), 2 Low (BUG-4/5) zurückgestellt.
- **Automatisierung:** `npm test` 79/79, `npm run build` grün, **PROJ-3 E2E 11/11 live grün** (10 CRUD/Validierung/Route-Schutz + 1 Mandanten-Isolation).
- **Security:** Authentifizierung (401), Mandanten-Isolation (live 404 cross-tenant), XSS/Injection, owner_id-Tenant-Check — alle bestätigt.
- **Production Ready:** **YES** — keine Critical/High/Medium offen; voller CRUD + RLS-Isolation live gegen echte Supabase verifiziert.
- **Verbleibend (nicht blockierend):** BUG-4/BUG-5 (Low UX/a11y), CI-Test-Daten-Cleanup.

## Deployment
_To be added by /deploy_
