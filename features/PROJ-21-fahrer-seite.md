# PROJ-21 — Fahrer-Seite

**Status:** 🟠 In Review — Basis-Seite live; Erweiterung „Navi-Start + Erledigt-Bestätigung" QA-geprüft; Critical-Bug BUG-1 (Debug-Endpunkte) am 2026-07-25 als Hotfix behoben; die drei bekannten Alt-Bugs (Tippfehler, Status-Inkonsistenz, fehlende Kartenpins) am 2026-07-26 geklärt (siehe „Bugfix-Runde" unten); Deploy steht noch aus  
**Erstellt:** 2026-07-06  
**Zielversion:** MVP  
**Unteraufgaben:** Mehrere (Spec → Architektur → Frontend → Backend → QA → Deploy)

---

## Zusammenfassung

Neue Fahrer-Seite in TMS 2.0. Ein Fahrer sieht seine geplanten Abholungen für heute als Liste und auf einer Karte. Die Seite dient als mobile-first Arbeitsunterlage für den Fahrer unterwegs — ähnlich wie ein Lieferschein (Papier), nur digital.

---

## Nutzer-Stories

**Als** Fahrer  
**möchte ich** eine Übersicht meiner heutigen Abholungen sehen  
**damit ich** weiß, bei welchen Kunden ich heute vorbeikommen muss und in welcher Reihenfolge.

**Als** Fahrer  
**möchte ich** die Kundenadressen auf einer Karte sehen  
**damit ich** die optimale Route planen kann.

---

## Akzeptanzkriterien

### Teil 1: Fahrer-Seite — Übersicht

1. **Neuer Menüpunkt** "Fahrer" im globalen Header (neben Dashboard, Home, Kunden, Werkzeuge, Service, Verwaltung, Einstellungen)
2. **Seite erreichbar** unter `/fahrer`
3. **Sichtbar für alle eingeloggten User** — Keine Rollen-Einschränkung (später ggf. erweitern)

### Teil 2: Listenansicht (oben)

1. **Titel:** "Meine Abholungen — [Heutiges Datum]" (z.B. "Montag, 6. Juli 2026")
2. **Filter automatisch:**
   - `fahrer_id` = ID des eingeloggten Users (User matched)
   - `geplantes_abholdatum` = heute (aktuelles Datum)
   - `status` = `geplant` (nur offene Abholungen — also Status "Offen")
3. **Liste zeigt pro Eintrag:**
   - Kunden-Name (`partners.company_name`)
   - Lieferadresse (Straße, PLZ, Ort aus `partners`)
   - Status-Badge: "Offen" (alle in dieser Liste sind offen)
   - Action-Button: "Abgeholt" (Status auf `abgeholt` setzen)
   - Klick auf Eintrag → Kunden-Detailseite öffnen (oder Expand mit mehr Infos)
4. **Leer-Zustand:** Wenn keine Abholungen heute → "Heute keine Abholungen geplant" + fröhliches Icon

### Teil 3: Kartenansicht (unten)

1. **Karte** zeigt alle heutigen Abhol-Standorte als Pins/Marker
2. **Klick auf Pin** zeigt Popup mit Kunden-Name und Adresse
3. **Karten-Zentrum** automatisch auf den ersten (oder mittleren) Standort
4. **Keine Adresse** → Pin wird nicht angezeigt (nur in Liste)

### Teil 4: Status-Änderung

1. **"Abgeholt"-Button** in der Liste setzt den Status der Tour auf `abgeholt`
2. **Nach Status-Änderung** verschwindet der Eintrag aus der Liste (weil Filter auf `geplant` ist)
3. **Optional:** Bestätigungs-Toast "Abholung bei [Kunde] markiert"

---

## Datenquellen

| Feld | Quelle | Beschreibung |
|------|--------|--------------|
| `tours.id` | `tms.tours` | Tour-ID |
| `tours.partner_id` | `tms.tours` | Verknüpfung zu Kunden |
| `tours.geplantes_abholdatum` | `tms.tours` | Geplantes Abholdatum |
| `tours.status` | `tms.tours` | Aktueller Status (`geplant`, `abgeholt`, etc.) |
| `tours.fahrer_id` | `tms.tours` | Zugewiesener Fahrer |
| `partners.company_name` | `tms.partners` | Kunden-Name |
| `partners.street` | `tms.partners` | Straße |
| `partners.zip` | `tms.partners` | PLZ |
| `partners.city` | `tms.partners` | Ort |
| `partner_addresses.geoapify_lat` | `tms.partner_addresses` | Breitengrad (für Karte) |
| `partner_addresses.geoapify_lon` | `tms.partner_addresses` | Längengrad (für Karte) |

> **Update 2026-07-26:** Keine neue Spalte nötig — `tms.partner_addresses` hat bereits
> `geoapify_lat`/`geoapify_lon` aus einer bestehenden, produktiv befüllten
> Adress-Validierungs-Pipeline (nicht Teil des `src/`-Codes, vermutlich Easybill-Import-
> Enrichment). Alle 2588 `shipping`-Adressen haben Koordinaten. Die Karte liest diese
> Spalten direkt, siehe „Bugfix-Runde" unten.

---

## UI/UX

### Layout

```
┌─────────────────────────────────────┐
│  🚚 Meine Abholungen — 6. Juli 2026 │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Firma Müller GmbH          │    │
│  │ Musterstraße 12, 12345 Berlin│    │
│  │ [Abgeholt]                  │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Schmidt & Co KG              │    │
│  │ Hauptstraße 45, 54321 Hamburg │    │
│  │ [Abgeholt]                  │    │
│  └─────────────────────────────┘    │
│                                     │
├─────────────────────────────────────┤
│  [🗺️ Karte mit Pins]               │
│                                     │
└─────────────────────────────────────┘
```

### Mobile-Optimierung

- Seite ist primär für mobile Nutzung gedacht (Fahrer hat Handy im Auto)
- Liste scrollbar, Karte darunter
- Große Touch-Targets für Buttons (mindestens 44x44px)
- Adresse ist klickbar → öffnet Google Maps / Apple Maps für Navigation

---

## Technische Hinweise

### Neue Route
- `/fahrer` oder `/driver` (je nach bestehender Konvention)

### API/Actions
- **Neue Action:** `get-driver-tours.ts` — Lädt Touren für eingeloggten Fahrer + heute
- **Neue Action:** `update-tour-status.ts` — Setzt Status auf `abgeholt`

### Abhängigkeiten
- **PROJ-20** (Logistik & Abholung) ist ein anderes Feature — verwandt, aber unabhängig
- **PROJ-19** (Tourenverwaltung) muss deployed sein — ist ✅
- **PROJ-18** (Globaler Header) muss deployed sein — ist ✅

### Karten-Provider
- Vorschlag: **Leaflet** (OpenStreetMap, kostenlos) oder **Google Maps** (API-Key nötig)
- Entscheidung: Technische Entscheidung durch Klausi

---

## Erweiterung 2026-07-22 — Navi-Start + Erledigt-Bestätigung (Status: 🟠 In Review, wartet auf „approved")

**Ziel:** Der Fahrer arbeitet pro Kunden-Stopp mit zwei Aktionen; die Verwaltung sieht
in Echtzeit, ob ein Fahrer unterwegs oder fertig ist, inkl. Zeit (und Standort, wenn möglich).

### Ablauf pro Tour-Karte (`DriverTourCard`)

1. **„Navi"-Button**
   - Öffnet die Google-Maps-Navigation zum Kunden (`https://www.google.com/maps/dir/?api=1&destination=...`
     bzw. Koordinaten, sonst Adresse).
   - Setzt beim Tippen den Status der Tour auf **`unterwegs`** und speichert:
     - `tour_startzeit = now()`
     - `tour_start_lat` / `tour_start_lon` = aktueller Gerätestandort (**best-effort**, per Browser-Geolocation)
   - Kein Standort erlaubt/verfügbar → nur Zeit + Status; kein Abbruch der Aktion.

2. **„Erledigt"-Button**
   - Öffnet ein **Bestätigungs-Modal „Wirklich erledigt?"** mit **Ja / Abbrechen** (shadcn `AlertDialog`).
   - Bei **Ja**: Status → **`erledigt`** und speichern:
     - `abgeschlossen_am = now()`
     - `tatsaechliches_abholdatum = heute`
     - Fahrer ergibt sich aus `fahrer_id` (bereits gesetzt)
     - Abschluss-Standort (**best-effort**) → **neue Spalten** `abschluss_lat` / `abschluss_lon`
   - Bei **Abbrechen**: keine Änderung.

3. **Status-Badge** liest künftig den echten `status` (statt fest „Offen"):
   `geplant → Offen`, `unterwegs → Unterwegs`, `erledigt → Erledigt`.

### Datenmodell — Nachtrag (kleine, additive Migration)

- `tms.tours.abschluss_lat NUMERIC` (nullable) — Abschluss-Standort Breitengrad
- `tms.tours.abschluss_lon NUMERIC` (nullable) — Abschluss-Standort Längengrad
- Bereits vorhanden/genutzt: `tour_startzeit`, `tour_start_lat/lon`, `abgeschlossen_am`, `fahrer_id`.
- Enum `public.order_status`: genutzt werden `geplant`, `unterwegs`, `erledigt`.
  `angekommen` und `problem` bleiben (bewusst) ungenutzt — Enum-Werte lassen sich in
  PostgreSQL nicht sauber entfernen; ein Neuaufbau wäre nur bei ausdrücklichem Wunsch sinnvoll.

### Backend

- `driver-tours.ts`: neue Action `markTourEnRoute(tourId, {lat?, lon?})` → Status `unterwegs` + Zeit/Ort.
- `markTourAsCollected` erweitern: `abgeschlossen_am`, optional `abschluss_lat/lon` mitschreiben
  (schreibt weiterhin Status `erledigt`).
- Filter der Heute-/5-Tage-Listen: Touren mit `unterwegs` weiterhin in der Liste anzeigen
  (nicht nur `geplant`), damit ein bereits gestarteter Stopp nicht verschwindet.

### Bewusst NICHT Teil dieser Erweiterung

- Kein `problem`-Ablauf, kein `angekommen`-Schritt.
- Die im Code gefundenen Alt-Themen (`"geplan"`-Tippfehler in `pickup-tours.ts`;
  Statistik zählt `abgeholt`/`archiviert`, Fahrer schreibt `erledigt`) sind **separate Bugs**
  und nicht Bestandteil dieser Erweiterung — bei Bedarf eigener Fix.

## Tech Design (Solution Architect) — Erweiterung 2026-07-22

### A) Komponenten-Struktur (was auf der Fahrer-Seite passiert)

```
Fahrer-Seite (/fahrer)
+-- Tour-Karte (DriverTourCard)   ← wird erweitert
|   +-- Status-Badge              ← liest künftig echten Status (Offen / Unterwegs / Erledigt)
|   +-- "Navi"-Button             ← öffnet Google-Maps-Navigation + meldet "unterwegs"
|   +-- "Erledigt"-Button         ← öffnet Bestätigungs-Fenster
|       +-- Bestätigungs-Modal    ← "Wirklich erledigt?"  [Ja] [Abbrechen]
+-- (Liste/Kalender/Karte bleiben unverändert)
```

Wiederverwendete, bereits vorhandene Bausteine (nichts Neues nachbauen):
`ui/alert-dialog` (Bestätigungs-Modal), `ui/badge`, `ui/button`, `use-toast`/`sonner` (kurze Rückmeldung).

### B) Datenmodell (in Alltagssprache)

Jede Tour (= ein Kunden-Stopp) merkt sich zusätzlich:
- **Wann losgefahren** (Zeitpunkt) + **wo losgefahren** (Standort, falls erlaubt) — bereits vorhandene Felder.
- **Wann erledigt** (Zeitpunkt) — bereits vorhandenes Feld `abgeschlossen_am`.
- **Wo erledigt** (Standort, falls erlaubt) — **zwei neue Felder** nötig.
- **Welcher Fahrer** — schon vorhanden.
- **Aktueller Stand:** Offen → Unterwegs → Erledigt.

Gespeichert in: Supabase (`tms.tours`), damit die Verwaltung es in Echtzeit sieht.

### C) Tech-Entscheidungen (in Alltagssprache, warum so)

- **Bestätigungs-Fenster über den vorhandenen shadcn-Dialog:** kein Neubau, sofort touch-tauglich.
- **Standort über die eingebaute Handy-/Browser-Funktion, nicht über einen fremden Dienst:**
  keine zusätzliche Software, keine Kosten, Datenschutz bleibt im Haus. Fragt das Gerät einmal um Erlaubnis.
- **Standort ist „best-effort":** Sagt der Fahrer „nein" oder ist er in einer Halle ohne Empfang,
  wird trotzdem Zeit + Fahrer gespeichert — die Aktion schlägt nie fehl. (Deckt deinen Wunsch
  „wenn der Ort zu kompliziert ist, dann nur die Zeit" ab.)
- **„Unterwegs" bleibt in der Arbeitsliste sichtbar:** Ein bereits gestarteter Stopp verschwindet
  nicht, sonst wüsste der Fahrer nicht mehr, wo er hin wollte.
- **Kein neues Paket, keine neue Route:** Wir erweitern die bestehende Fahrer-Seite und ihre Server-Aktionen.

### D) Abhängigkeiten / Installationen

- Keine. (Alle UI-Bausteine vorhanden; Standort ist Browser-Standard.)

### E) Nötige DB-Änderung (klein, additiv — wie gehabt sicher)

- Zwei neue Spalten `abschluss_lat` / `abschluss_lon` in `tms.tours` (Abschluss-Standort).
- Wird als eigene Migration angelegt, dir vorab gezeigt und wieder über `exec_sql` angewendet.

### Decision Log — Technical Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Browser-Geolocation statt externem Geo-Dienst | Keine Zusatzsoftware/Kosten, Daten bleiben in-house, DSGVO-freundlich | 2026-07-22 |
| Standort „best-effort" (Aktion nie blockierend) | Werkstatt/Halle ohne GPS-Empfang darf Erledigt-Meldung nicht verhindern | 2026-07-22 |
| shadcn `AlertDialog` für Bestätigung wiederverwenden | shadcn-first-Regel; touch-tauglich; kein Eigenbau | 2026-07-22 |
| `unterwegs`/`erledigt` aus vorhandenem Enum `public.order_status` | Kein Enum-Neuaufbau; `angekommen`/`problem` bleiben ungenutzt liegen | 2026-07-22 |
| Neue Spalten `abschluss_lat/lon` statt eine Tour-Historie-Tabelle | Ein Kunden-Stopp = eine Tour-Zeile; ausreichend, minimaler Eingriff | 2026-07-22 |
| `unterwegs`-Touren bleiben in Arbeitsliste | Gestarteter Stopp darf nicht aus der Sicht des Fahrers verschwinden | 2026-07-22 |

### Open Questions

- [x] Anzeige der erfassten Zeiten/Orte? → **Geklärt (2026-07-22):** Vorerst **nur Erfassen**.
      Die Auswertung kommt **später als eigenes Dashboard** — zeigt alle Fahrten/Logs **pro
      Mitarbeiter und pro Tag** zur Auswertung. Eigenes Folge-Feature, **nicht** Teil dieser Erweiterung.

### Zukünftiges Folge-Feature (vorgemerkt, noch keine Spec)

- **Fahrten-/Logistik-Auswertungs-Dashboard:** Übersicht aller erfassten Touren-Logs
  (Losfahrt-/Erledigt-Zeiten, Fahrer, Standorte) pro Mitarbeiter und pro Tag, für Auswertungen.
  → Wird bei Bedarf über `/write-spec` als eigenes PROJ angelegt (nutzt die hier erfassten Daten).

## Änderungsverlauf

| Datum | Autor | Änderung |
|-------|-------|----------|
| 2026-07-06 | Klausi | Initiale Spec erstellt |
| 2026-07-06 | Klausi | Architektur + Frontend + Backend implementiert |
| 2026-07-06 | Klausi | Docker-Build + Deploy erfolgreich |
| 2026-07-06 | Klausi | Bugfix: Adressen aus partner_addresses laden statt partners |
| 2026-07-06 | Klausi | Feature: Nächste 5 Tage Tab + Kalender-Ansicht hinzugefügt |
| 2026-07-06 | Jan Bernd | Final approved — funktioniert einwandfrei |
| 2026-07-22 | Jan Bernd | DB-Erweiterung Driver-Tour-Lifecycle: neue Status `unterwegs`, `angekommen`, `problem` (Enum `public.order_status`) + Spalte `tms.tours.abgeschlossen_am` (TIMESTAMPTZ). Migration `20260722120000_PROJ-21_driver_tour_lifecycle.sql`, live via `exec_sql` angewendet & verifiziert. |
| 2026-07-22 | Jan Bernd | Spec-Erweiterung „Navi-Start + Erledigt-Bestätigung" geschrieben (🟠 In Review). Scope reduziert: kein `problem`/`angekommen`-Ablauf; Navi→`unterwegs`+Zeit/Ort, Erledigt→Modal→`erledigt`+`abgeschlossen_am`/Fahrer/Ort. Spec approved. |
| 2026-07-22 | Jan Bernd | Tech-Design (Architektur) ergänzt: shadcn `AlertDialog`, Browser-Geolocation (best-effort), keine neuen Pakete, +2 Spalten `abschluss_lat/lon`. Architektur approved. Anzeige-Frage geklärt: vorerst nur Erfassen, Auswertungs-Dashboard als späteres Folge-Feature. |
| 2026-07-22 | Klausi | Umgesetzt: Migration `20260722140000_PROJ-21_abschluss_geo.sql` (abschluss_lat/lon) live angewendet. Backend `driver-tours.ts`: neue Action `markTourEnRoute` (Status `unterwegs`, Startzeit/Ort), `markTourAsCollected` um `abgeschlossen_am`+Abschluss-Ort erweitert, Besitz-Prüfung (nur zugewiesener Fahrer), Listen-Filter zeigen nun `geplant`+`unterwegs`. Frontend `driver-tour-card.tsx`: „Navi"-Button meldet unterwegs, „Erledigt" mit Bestätigungs-Modal, echtes Status-Badge. Lint + Build grün. Noch nicht deployed. |
| 2026-07-26 | Claude | **Bugfix-Runde** (vor dem ausstehenden Deploy): (1) `"geplan"`-Tippfehler in `pickup-tours.ts` behoben — per Live-DB-Check bestätigt, dass `'geplan'` kein gültiger Wert des Enums `public.order_status` ist, d.h. `createPickupTour`/`autoCreateNextPickup` sind bisher immer mit hartem DB-Fehler fehlgeschlagen (kein Backfill nötig, da nie erfolgreich falsch gespeichert). (2) Status-Inkonsistenz `abgeholt`/`archiviert` vs. `erledigt` geprüft — bereits gelöst, kein Code-Bezug mehr vorhanden, kein Handlungsbedarf. (3) Kartenpins: `DriverMap` rendert jetzt echte Pins (Leaflet `circleMarker`, grün bei `erledigt`, sonst Markenfarbe, Popup mit Firma/Adresse, `fitBounds`) — dafür genügt es, die bereits vorhandenen, produktiv befüllten Spalten `partner_addresses.geoapify_lat/geoapify_lon` zu lesen; keine neue Geokodierung/Migration/Infrastruktur nötig. `npm run lint`/`npm run build` grün. |

---

## QA Test Results — Erweiterung „Navi-Start + Erledigt-Bestätigung"

**Tested:** 2026-07-25
**App URL:** http://localhost:3000 (lokaler Dev-Server in dieser Session nicht startbar — `.env.local` unvollständig, siehe Testing-Hinweis unten)
**Tester:** QA Engineer (AI)

### Testing-Hinweis (Einschränkung dieser QA-Runde)

In dieser Session konnte **kein Live-Browser-/E2E-Test** gefahren werden: `.env.local` enthält
nicht die vollständigen Supabase-Zugangsdaten, der Dev-Server bricht beim Start mit
„Your project's URL and Key are required to create a Supabase client!" ab (`middleware.ts`).
Playwright-Testerkennung funktioniert (48 Tests in 5 Dateien gefunden, keine Vermischung mit
`.claude/worktrees/**`), aber `npx playwright test` gegen `localhost` schlägt am WebServer-Start fehl.
Stattdessen wurde geprüft:
- **Code-Review** von `driver-tours.ts` und `driver-tour-card.tsx` gegen jedes Akzeptanzkriterium
- **Live-Schema-Check** der Datenbank (read-only SQL) — Spalten `tour_startzeit`, `tour_start_lat/lon`,
  `abschluss_lat/lon`, `abgeschlossen_am` sowie Enum-Werte `unterwegs`/`erledigt`/`angekommen`/`problem`
  existieren tatsächlich in `tms.tours` bzw. `public.order_status` (waren nur per `exec_sql` ohne
  zugehörige Migration-Historie nachvollziehbar — s. BUG-3)
- **RLS-Policy-Check** auf `tms.tours` (siehe Security-Audit)
- `npm run lint` und `npm run build` (beide grün)
- **Empfehlung:** Vor dem nächsten Feature auf `/fahrer` einmal echten Browser-Test nachholen,
  sobald eine Session mit vollständiger `.env.local` verfügbar ist.

### Acceptance Criteria Status

#### AC-1: „Navi"-Button setzt Status `unterwegs` + Zeit/Ort (best-effort)
- [x] Button ist ein `<a href={mapsUrl}>` mit `target="_blank"` → öffnet Google-Maps-Navigation, blockiert die App-Seite nicht
- [x] `onClick` ruft `markTourEnRoute(tourId, coords)` auf → setzt `status: "unterwegs"`, `tour_startzeit: now()`
- [x] Standort wird nur gesetzt, wenn `coords` vorhanden ist (`if (coords) { ... }`) — kein Fehler/Abbruch bei fehlender Erlaubnis (`getCoordsBestEffort()` resolved bei Ablehnung/Timeout auf `undefined`, wirft nie)
- [x] Geolocation-Timeout ist mit 8s begrenzt, `maximumAge: 60000` — Button hängt nicht endlos

#### AC-2: „Erledigt"-Button mit Bestätigungs-Modal
- [x] Klick öffnet `AlertDialog` „Wirklich erledigt?" mit Ja/Abbrechen (shadcn-Komponente, kein Eigenbau)
- [x] „Abbrechen" (`AlertDialogCancel`) hat keinen `onClick` → keine Statusänderung
- [x] „Ja, erledigt" ruft `markTourAsCollected(tourId, coords)` auf → setzt `status: "erledigt"`, `abgeschlossen_am`, `tatsaechliches_abholdatum`, optional `abschluss_lat/lon`

#### AC-3: Status-Badge zeigt echten Status
- [x] `STATUS_BADGE`-Map deckt `geplant→Offen`, `unterwegs→Unterwegs`, `erledigt→Erledigt` ab; unbekannter Status fällt auf neutralen Badge mit Rohwert zurück (kein Crash)

#### AC-4: Arbeitslisten zeigen `unterwegs` weiterhin an
- [x] `getDriverToursForToday` und `getDriverToursForDateRange` filtern auf `.in("status", ["geplant", "unterwegs"])` — ein gestarteter Stopp verschwindet nicht aus der Liste

### Edge Cases Status

#### EC-1: Standort verweigert/nicht verfügbar
- [x] `getCoordsBestEffort()` löst in jedem Fehlerfall (kein `navigator.geolocation`, Ablehnung, Timeout) mit `undefined` auf — Aktion schlägt nie fehl, es wird nur Zeit+Status gespeichert (deckt Spec-Vorgabe „Halle ohne Empfang" ab)

#### EC-2: Doppelklick / Race Conditions
- [x] `isRouting`/`isCollecting`-State verhindert Doppel-Submit während eine Aktion läuft (Button-Disable bzw. früher Return in `handleNavi`)

#### EC-3: Tour gehört einem anderen Fahrer
- [x] `assertTourOwnedByCurrentUser` prüft `tour.fahrer_id !== user.id` server-seitig vor jedem Update — clientseitig manipulierte Tour-ID eines fremden Fahrers wird mit „Diese Tour ist dir nicht zugewiesen." abgelehnt

### Security Audit Results (Red-Team)
- [x] Authentifizierung: `markTourEnRoute`/`markTourAsCollected`/`getDriverTours*` prüfen `supabase.auth.getUser()` zuerst, geben bei fehlendem User einen Error zurück statt zu crashen
- [x] Autorisierung (IDOR): Ownership-Check verhindert, dass Fahrer A die Tour von Fahrer B abschließt — auch wenn der Service-Role-Client (`createAdminClient`) die RLS-Policies der Tabelle umgeht, wird die Berechtigung explizit in der Server Action geprüft
- [x] Kein Rollen-Bypass nötig, da laut Spec bewusst rollenoffen („keine Rollen-Einschränkung") — aber Fremdzugriff auf Touren ist trotzdem durch `fahrer_id`-Check blockiert
- [x] **BUG-1 (Critical, aber außerhalb dieser Erweiterung):** behoben — siehe unten (Hotfix 2026-07-25)

### Regression-Test
- `npm run lint` → grün (1 vorbestehende, nicht zugehörige Warnung in `revenue-chart.tsx`)
- `npm run build` → grün, `/fahrer` wird als dynamische Route korrekt gebaut
- `npm test` (Vitest) → **schlägt komplett fehl** (0 Tests ausgeführt, 64 Errors) — siehe BUG-2
- Bekannte Alt-Bugs aus dieser QA-Runde — **Status nach Bugfix-Runde 2026-07-26:**
  - `"geplan"`-Tippfehler in `pickup-tours.ts:186,246` → **behoben**
  - Statistik zählt `abgeholt`/`archiviert`, Fahrer schreibt `erledigt` (Inkonsistenz) → **geprüft, war bereits gelöst, kein Code-Bezug mehr vorhanden**
  - `DriverMap` zeigte keine echten Pins → **behoben**, nutzt jetzt vorhandene `geoapify_lat/lon`

### Bugs Found

#### BUG-1: Unauthentifizierte Debug-API-Routen leaken Touren-/Partnerdaten in Produktion
- **Severity:** Critical
- **Steps to Reproduce:**
  1. Ohne Login (kein Cookie/Session) `GET /api/debug/pickup-test` auf der Live-Domain aufrufen
  2. Erwartet: 401/404 oder gar keine Route
  3. Tatsächlich: Route existiert (bestätigt im Production-Build als `ƒ /api/debug/pickup-test`), nutzt `createAdminClient` (Service-Role, umgeht RLS) und gibt Kundennamen, Touren-Status/-Termine und Rabatt-Defaults eines konkreten Kunden ("Büsken") als JSON zurück — ganz ohne Auth-Check
  4. Gleiches Muster bei `GET /api/debug/drivers` und `GET /api/test-drivers` (leaken die volle Fahrer-Liste)
- **Priority:** Fix before deployment (unabhängig von dieser Erweiterung — bereits jetzt live in Produktion, sollte als eigener Hotfix behandelt werden)
- **Status: Behoben (Hotfix 2026-07-25).** Alle drei Routen (`src/app/api/debug/pickup-test/route.ts`,
  `src/app/api/debug/drivers/route.ts`, `src/app/api/test-drivers/route.ts`) waren reine Debug-/Test-
  Leftover ohne echten Verwendungszweck (keine andere Codestelle referenzierte sie) — komplett
  gelöscht statt nur mit Auth-Check versehen, da sie ohnehin keine legitime Produktionsfunktion
  hatten. `npm run lint` und `npm run build` weiterhin grün nach der Entfernung. **Deploy steht noch
  aus** (siehe INDEX.md).

#### BUG-2: `npm test` komplett blockiert durch fremde Worktrees
- **Severity:** Medium (Infrastruktur/Testfähigkeit, kein Produktionsrisiko)
- **Steps to Reproduce:**
  1. `npm test` im Hauptverzeichnis ausführen
  2. Erwartet: reguläre Vitest-Suite läuft
  3. Tatsächlich: Vitest versucht auch `src/lib/roles.test.ts` in `.claude/worktrees/bridge-cse_*/` zu starten (fremde, isolierte Session-Worktrees) und läuft dort in Worker-Timeouts → 64 Errors, „no tests" insgesamt
  4. Ursache: `vitest.config.ts` hat (anders als `eslint.config.js`, dort am 2026-07-24 für PROJ-11 bereits gefixt) kein `.claude/worktrees/**`-Exclude
- **Priority:** Fix in next sprint (analog zum bereits gefixten eslint-Ignore-Bug)

### Summary
- **Acceptance Criteria (Erweiterung Navi/Erledigt):** 4/4 per Code-Review bestanden (kein Live-Browser-Test möglich, s. Testing-Hinweis)
- **Edge Cases:** 3/3 per Code-Review bestanden
- **Bugs Found:** 2 total (1 Critical — außerhalb des Erweiterungs-Codes, 1 Medium — Infrastruktur)
- **Security:** Erweiterungs-Code selbst sauber (Ownership-Check korrekt); aber Critical-Fund im Umfeld (Debug-Endpunkte)
- **Production Ready (nur Navi/Erledigt-Erweiterung):** Code-seitig JA, aber **kein Live-Test durchgeführt**
- **Production Ready (Gesamtsystem):** JA, sobald Hotfix (BUG-1) deployed ist — Fix ist im Code, aber noch nicht live
- **Recommendation:** Navi/Erledigt-Erweiterung + BUG-1-Hotfix zusammen deployen (`/deploy PROJ-21`).

---

**Deploy erfolgreich am 2026-07-06. Docker-Container läuft auf Port 3000.**
