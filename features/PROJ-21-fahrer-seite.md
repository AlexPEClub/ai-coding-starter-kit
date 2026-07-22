# PROJ-21 — Fahrer-Seite

**Status:** ✅ Deployed  
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
| `partners.latitude` | `tms.partners` | Breitengrad (für Karte) |
| `partners.longitude` | `tms.partners` | Längengrad (für Karte) |

> **Hinweis:** `latitude` und `longitude` müssen ggf. in `partners` ergänzt werden, falls noch nicht vorhanden.

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

---

**Deploy erfolgreich am 2026-07-06. Docker-Container läuft auf Port 3000.**
