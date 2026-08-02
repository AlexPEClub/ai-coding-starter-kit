# PROJ-42: Routenberechnung für Touren (Geoapify)

## Status: ✅ Deployed
**Created:** 2026-08-02
**Last Updated:** 2026-08-02

> Folge-Baustein zu PROJ-21 (Fahrer — Tourenliste) und PROJ-41 (Fahrt
> bearbeiten). Echte Routenberechnung war von Anfang an bewusst als
> späterer, eigener Baustein vorgesehen (siehe PROJ-21 Out of Scope). Die
> Datenbank hat dafür bereits vorbereitete, aber bisher komplett ungenutzte
> Felder (`route_order`, `route_calculated_at`, `route_distance_meters`,
> `route_duration_seconds`, `berechnete_ankunftszeit`).

## Dependencies
- **PROJ-21 (Fahrer — Tourenliste)** — die Touren-Liste (`/fahrer`) zeigt das
  Ergebnis der Berechnung an.
- **PROJ-41 (Fahrt bearbeiten)** — `bearbeiteFahrt()` ist einer von zwei
  Auslösern für die automatische Neuberechnung.
- **Bestehende Kundendetailseite** (`src/lib/actions/pickup-tours.ts`,
  `createPickupTour()`/`updatePickupTour()`) — zweiter Auslöser für die
  automatische Neuberechnung.
- **Geoapify** (externer Dienst) — bereits im Projekt fürs Geocoding der
  Kundenadressen im Einsatz, wird hier zusätzlich für die eigentliche
  Routenberechnung (Reihenfolge + Fahrzeit) genutzt.

## User Stories
- Als Fahrer/Admin möchte ich, dass die Stopps einer Tour in der sinnvollsten
  Reihenfolge angezeigt werden, damit ich nicht selbst überlegen muss, in
  welcher Reihenfolge ich fahre.
- Als Fahrer/Admin möchte ich die geschätzte Gesamtfahrzeit einer Tour sehen,
  damit ich meinen Tag besser einschätzen kann.
- Als Admin möchte ich, dass sich die Route automatisch neu berechnet, sobald
  sich Fahrer oder Datum eines Stopps ändern, damit die angezeigte
  Reihenfolge nie veraltet ist — egal wo die Änderung vorgenommen wurde.
- Als Admin möchte ich, dass eine einzelne fehlerhafte Tour (z. B. ungültige
  Kundenadresse) nicht die Berechnung aller anderen Touren blockiert.

## Out of Scope
- **Manuelles Überschreiben der berechneten Reihenfolge** — `route_manual_override`
  ist in der Datenbank vorbereitet, wird hier aber nicht genutzt; eigener,
  späterer Baustein.
- **Ein wiederverwendbarer „Alle Touren neu berechnen"-Button** — für den
  initialen Rollout gibt es nur ein einmaliges Backfill-Skript; danach hält
  die ereignisbasierte automatische Neuberechnung alles aktuell.
- **Rückfahrt zum Depot** in Distanz-/Fahrzeit-Berechnung — Route endet beim
  letzten Stopp.
- **Echtzeit-Verkehrsdaten, mehrere Depots, mehrere Fahrzeugtypen** — ein
  fester Depot-Ort, eine feste Start-Uhrzeit (09:00), Standard-Fahrzeug.
- **Neuberechnung durch Statuswechsel** (z. B. „erledigt") — es gibt aktuell
  keinen Code-Pfad, der den Status einer Fahrt setzt (kommt erst mit
  PROJ-36/37/38); sobald einer existiert, ist das ein eigenes Anschluss-Thema.
- **Zeitplan-basierte automatische Neuberechnung** (Cronjob) — nur
  ereignisbasiert (bei Fahrer-/Datum-Änderung einer Fahrt), kein
  Hintergrund-Zeitplan.
- **Kartendarstellung der Route** — eigenständiges, späteres Thema.

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

### Depot & Grundlage
- [ ] Angenommen die Depot-Adresse (Gudel Werkzeuge GmbH & Co. KG, Zur
  Reithalle 86, Dorsten) ist hinterlegt, wenn eine Routenberechnung für
  irgendeine Tour ausgeführt wird, dann wird immer von diesem festen Ort als
  Startpunkt gerechnet — nie vom Standort eines Fahrers.
- [ ] Angenommen die Depot-Adresse kann nicht geocodiert werden, wenn eine
  Berechnung (Backfill oder automatisch) versucht wird, dann schlägt sie mit
  einer klaren Fehlermeldung fehl, ohne dass unnötig Kundenadressen
  angefragt werden.

### Initiale Berechnung (Backfill)
- [ ] Angenommen es gibt aktuell offene Touren ohne berechnete Route, wenn
  das Backfill-Skript einmalig ausgeführt wird, dann wird für jede offene
  Tour eine Route berechnet und gespeichert (Reihenfolge, Gesamtstrecke,
  Gesamtfahrzeit, Ankunftszeit je Stopp).
- [ ] Angenommen eine Tour hat mindestens einen Stopp ohne gültige
  Koordinaten, wenn das Backfill-Skript läuft, dann wird für genau diese
  Tour nichts gespeichert (kein Teil-/Rateergebnis) — andere Touren werden
  unabhängig davon trotzdem berechnet.
- [ ] Angenommen Geoapify ist während des Backfills bei einer einzelnen
  Anfrage nicht erreichbar, wenn das passiert, dann wird nur die betroffene
  Tour übersprungen, der Lauf für die übrigen Touren wird fortgesetzt.
- [ ] Angenommen das Skript wurde bereits einmal für eine Tour ausgeführt,
  wenn es erneut gestartet wird, dann wird die Tour einfach erneut berechnet
  (bestehende Werte werden überschrieben, kein Duplikat-Schutz nötig).

### Automatische Neuberechnung
- [ ] Angenommen ein Stopp bekommt über den Bearbeiten-Dialog (PROJ-41)
  einen neuen Fahrer oder ein neues Datum, wenn die Änderung erfolgreich
  gespeichert wird, dann werden sowohl die alte als auch die neue
  Tourengruppe (Fahrer+Datum) automatisch neu berechnet.
- [ ] Angenommen ein Stopp bekommt über die Kundendetailseite (Abholung
  anlegen/ändern) einen neuen Fahrer oder ein neues Datum, wenn die Änderung
  erfolgreich gespeichert wird, dann wird ebenfalls automatisch neu
  berechnet — gleiches Verhalten wie über PROJ-41.
- [ ] Angenommen nur die Notiz eines Stopps wird geändert (Fahrer/Datum
  bleiben gleich), wenn gespeichert wird, dann wird **keine** Neuberechnung
  ausgelöst.
- [ ] Angenommen die automatische Neuberechnung einer Tour schlägt fehl (z. B.
  ungültige Adresse, Geoapify nicht erreichbar), wenn das passiert, dann
  schlägt das eigentliche Speichern von Fahrer/Datum/Notiz **trotzdem
  erfolgreich** durch (die Fahrt-Änderung selbst ist unabhängig von der
  Routenberechnung) — nur die Routenberechnung im Hintergrund bleibt aus,
  eine vorherige Berechnung (falls vorhanden) bleibt unverändert stehen.

### Anzeige in der Touren-Liste
- [ ] Angenommen eine Tour hat eine erfolgreich berechnete Route, wenn sie in
  der Touren-Liste (`/fahrer`) angezeigt wird, dann erscheinen die Stopps in
  der berechneten Reihenfolge, und Gesamtstrecke sowie Gesamtfahrzeit werden
  am Tourkopf angezeigt.
- [ ] Angenommen eine Tour hat eine erfolgreich berechnete Route, wenn ein
  Stopp angezeigt wird, dann erscheint zusätzlich die berechnete Ankunftszeit
  für diesen Stopp (ausgehend von 09:00 Uhr Start am Depot).
- [ ] Angenommen eine Tour hat noch keine (oder eine zuletzt fehlgeschlagene)
  Routenberechnung, wenn sie angezeigt wird, dann werden die Stopps wie
  bisher nach Datum/Anlage-Reihenfolge angezeigt, ohne Gesamtstrecke-/
  Fahrzeit- oder Ankunftszeit-Anzeige.

## Edge Cases
- **Tour mit nur einem Stopp:** Route besteht nur aus Depot → dieser eine
  Stopp; Reihenfolge ist trivial (immer Position 1), Distanz/Fahrzeit werden
  trotzdem berechnet und angezeigt.
- **Tour ohne gültige Adresse bei einem Stopp:** siehe Acceptance Criteria
  „Initiale Berechnung" — die ganze Tour wird übersprungen, nicht nur der
  eine Stopp (keine Teil-Reihenfolge mit einem fehlenden Stopp).
- **Geoapify komplett nicht erreichbar während des gesamten Backfills:** Alle
  Touren schlagen fehl, nichts wird gespeichert, aber das Skript läuft ohne
  Absturz durch und meldet, wie viele Touren erfolgreich/fehlgeschlagen
  waren — kann später einfach erneut gestartet werden (kein Sonderfall
  nötig, ergibt sich aus der Pro-Tour-Fehlerbehandlung).
- **Depot-Adresse selbst nicht geocodierbar:** Härterer Fehlerfall als eine
  einzelne Kundenadresse — blockiert die Berechnung für **alle** Touren
  (ohne Depot-Koordinaten kann grundsätzlich nichts berechnet werden), sollte
  früh und deutlich fehlschlagen, bevor überhaupt einzelne Touren
  durchgegangen werden.
- **Reihenfolge einer Tour, die nie erfolgreich berechnet wurde:** Fällt auf
  die bisherige Sortierung nach Datum/Anlage-Reihenfolge zurück (Verhalten
  aus PROJ-21 bleibt der Fallback).

## Technical Requirements (optional)
- **Security:** Zugriff auf Backfill-Skript und Neuberechnungs-Logik nur
  serverseitig (Admin-Client), kein neuer öffentlicher Endpunkt.
- **Externe Abhängigkeit:** Geoapify Route-Planner-API (Zugang laut User
  bereits vorhanden, inkl. Routing-Berechtigung).
- **Datenmodell:** Nutzt ausschließlich bereits in der Live-Datenbank
  vorhandene, aber bisher nicht per Migration erfasste Spalten auf
  `tms.tours` (`route_order`, `route_calculated_at`, `route_distance_meters`,
  `route_duration_seconds`, `berechnete_ankunftszeit`) — genaue Form der
  Migration (formale Übernahme dieser Spalten) sowie der Depot-Adress-
  Speicherung wird in `/architecture` entschieden.

## Open Questions
_Keine offenen Fragen mehr — alle im Spec-Review geklärt._

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Fester Depot-Ort „Gudel Werkzeuge GmbH & Co. KG, Zur Reithalle 86, Dorsten" als Start jeder Tour | Es gab bisher keinen festen Ausgangspunkt in der Datenbank (nur GPS-Logging beim Fahrer); ohne festen Start kann keine Route im Voraus berechnet werden | 2026-08-02 |
| Feste Start-Uhrzeit 09:00 Uhr für alle Touren | Einfache, realistische Grundannahme für Ankunftszeit-Berechnung, ohne pro Fahrer/Tour konfigurierbar zu sein (MVP) | 2026-08-02 |
| Optimierungsziel: kürzeste Fahrzeit, nicht kürzeste Strecke | Realistischer für den Fahrer (berücksichtigt Straßentyp), die meisten Routing-Dienste liefern das direkt | 2026-08-02 |
| Keine Rückfahrt zum Depot in der Berechnung | Route endet beim letzten Kunden; einfacher, entspricht der expliziten User-Entscheidung | 2026-08-02 |
| Anbieter: Geoapify | Bereits im Projekt fürs Geocoding im Einsatz (100 % der Lieferadressen bereits geocodiert), ein Anbieter/eine Rechnung, User hat bereits Zugang mit Routing-Berechtigung | 2026-08-02 |
| Ergebnis sofort in der bestehenden Touren-Liste sichtbar (Reihenfolge + Gesamtstrecke/-fahrzeit am Tourkopf) | Ohne sichtbare Auswirkung hätte die Berechnung keinen praktischen Nutzen | 2026-08-02 |
| Manuelles Überschreiben der Reihenfolge bewusst nicht Teil dieses Bausteins | Konsistent mit der Entscheidung, dass automatische Vollzeitplan-Neuberechnung ebenfalls später kommt — erst die Berechnung selbst liefern | 2026-08-02 |
| Automatische Neuberechnung bei JEDER Fahrer/Datum-Änderung einer Fahrt, an beiden bestehenden Code-Stellen (PROJ-41-Dialog UND Kundendetailseite) | User-Entscheidung: sonst gäbe es einen blinden Fleck (Änderungen über die Kundendetailseite würden die Route veralten lassen) | 2026-08-02 |
| Notiz-Änderungen lösen keine Neuberechnung aus | Notiz beeinflusst nicht, welcher Fahrer/welches Datum die Tour bildet — unnötige Berechnung würde nur Kosten/Zeit verschwenden | 2026-08-02 |
| Kein wiederverwendbarer „Alle neu berechnen"-Button — nur einmaliges Backfill-Skript für den Rollout | User-Entscheidung: nach dem einmaligen Lauf hält die ereignisbasierte Neuberechnung alles aktuell, ein globaler Mechanismus wäre doppelt gebaut | 2026-08-02 |
| Fehlerbehandlung pro Tour isoliert, kein globales Alles-oder-Nichts über alle Touren | Bei ~7 % ungültigen Adressen und 108 offenen Touren hätte ein globales Alles-oder-Nichts die Erst-Berechnung höchstwahrscheinlich komplett blockiert; User hat das nach Rückfrage mit den konkreten Zahlen bestätigt | 2026-08-02 |
| Fehlschlagende Routenberechnung blockiert NICHT das eigentliche Speichern von Fahrer/Datum/Notiz | Die Fahrt-Bearbeitung (PROJ-41) soll unabhängig von einem externen Dienst zuverlässig funktionieren — Routenberechnung ist ein nachgelagerter, optionaler Zusatzschritt | 2026-08-02 |
| Berechnete Ankunftszeit wird zusätzlich zur Gesamtstrecke/-fahrzeit auch je Stopp angezeigt | Ohne sichtbare Anzeige hätte die eigens für diesen Zweck festgelegte Start-Uhrzeit (09:00) keinen praktischen Nutzen | 2026-08-02 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| Depot-Koordinaten als feste Env-Konstante (`GEOAPIFY_DEPOT_LAT`/`GEOAPIFY_DEPOT_LON`), einmalig geocodiert, statt bei jeder Berechnung neu geocodiert | Depot-Adresse ändert sich nie — wiederholtes Geocoding wäre nur verschwendeter Netzwerk-Call bei jeder einzelnen Tour; macht "Depot nicht geocodierbar" außerdem zu einer schnellen, lokalen Prüfung ohne Netzwerkabhängigkeit | 2026-08-02 |
| Automatische Neuberechnung an **drei** statt zwei Code-Stellen: `bearbeiteFahrt()`, `updatePickupTour()` **und** `createPickupTour()` | Die eigenen Acceptance Criteria dieser Spec nennen "Kundendetailseite: Abholung anlegen/ändern" — eine neu angelegte Abholung braucht ebenfalls eine erste Berechnung ihrer Tourengruppe, sonst bliebe sie bis zum nächsten zufälligen Edit unberechnet | 2026-08-02 |
| `autoCreateNextPickup()` bewusst **kein** Trigger | Automatisch erzeugte Folge-Touren sind in der Spec nicht genannt und würden bei Batch-Läufen unnötig viele zusätzliche Geoapify-Calls auslösen | 2026-08-02 |
| Gemeinsames, reines Berechnungsmodul (`src/lib/routing/tour-route.ts`, kein Server Action) statt Logik direkt in jeder Trigger-Stelle | Backfill-Skript und die drei Trigger-Stellen brauchen exakt dieselbe Berechnungs- und Validierungslogik — ein einziges Modul verhindert Drift zwischen den Aufrufstellen | 2026-08-02 |
| Migration der fünf bereits live existierenden Spalten via `ADD COLUMN IF NOT EXISTS` (analog zu PROJ-21s `abgeschlossen_am`) | Spalten existieren in Produktion bereits ungetrackt; diese Form ist sicher gegen Produktion (No-Op) und legt sie in jeder neuen Umgebung trotzdem an | 2026-08-02 |
| `route_manual_override` wird von Migration und Modul bewusst nicht angefasst | Gehört zu einem späteren, separaten Feature (manuelles Überschreiben) | 2026-08-02 |
| Backfill-Skript (`scripts/PROJ-42_backfill_routen.ts`) läuft über `tsx` und importiert direkt `createAdminClient` + das gemeinsame Modul, statt dem bisherigen Plain-JS-Skript-Muster (`update-holidays.mjs`) zu folgen | Sonst müsste die Routing-Kernlogik ein zweites Mal in JS nachgebaut werden — ein Modul als einzige Quelle der Wahrheit ist wichtiger als Konsistenz mit dem älteren Skript-Muster | 2026-08-02 |
| Neue Env-Variablen `GEOAPIFY_API_KEY`, `GEOAPIFY_DEPOT_LAT`, `GEOAPIFY_DEPOT_LON`; kein neues HTTP-Client-Paket | Kein Geoapify-Client existiert bisher im App-Code; Route-Planner ist eine einfache JSON-API, mit eingebautem `fetch` aufrufbar | 2026-08-02 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Übersicht
Backend-/berechnungslastiges Feature. Der einzige sichtbare UI-Effekt ist
eine additive Erweiterung der bestehenden `/fahrer`-Touren-Liste (PROJ-21)
um Reihenfolge, Gesamtstrecke/-fahrzeit und Ankunftszeit je Stopp — es gibt
keine neue Seite und keine neue Komponentenstruktur.

### Datenmodell
Es werden ausschließlich fünf bereits in der Live-Datenbank vorhandene,
bisher aber nicht per Migration erfasste Spalten auf `tms.tours` formal
übernommen: `route_order` (Position in der optimierten Reihenfolge je
Stopp), `route_calculated_at` (Zeitpunkt der letzten erfolgreichen
Berechnung, pro Tourengruppe identisch), `route_distance_meters` und
`route_duration_seconds` (Gesamtstrecke/-fahrzeit der Tour, pro
Tourengruppe identisch), `berechnete_ankunftszeit` (Ankunftszeit je Stopp,
ausgehend von 09:00 Uhr Depot-Start). Eine neue Migration fügt diese
Spalten "falls noch nicht vorhanden" hinzu — sicher gegenüber der
Produktions-DB, wo sie bereits existieren. Die ebenfalls vorbereitete
Spalte `route_manual_override` bleibt für dieses Feature unangetastet
(späterer Baustein). Keine neue Tabelle, keine RLS-/Berechtigungsänderung
nötig — Zugriff läuft wie beim Rest von `tms.tours` ausschließlich
serverseitig über den Admin-Client.

### Kernlogik: ein gemeinsames Berechnungsmodul
Ein einziges, wiederverwendbares Modul kapselt die gesamte
Berechnungslogik für "eine Tourengruppe (ein Fahrer + ein Datum) neu
berechnen": offene Stopps dieser Gruppe laden → Kundenadress-Koordinaten
laden → alle Koordinaten validieren (fehlt eine einzige, wird für die
ganze Tour nichts gespeichert) → Geoapify Route Planner mit festem
Depot-Start aufrufen (Ziel: kürzeste Fahrzeit, keine Rückfahrt) →
Reihenfolge, Gesamtstrecke/-fahrzeit und je-Stopp-Ankunftszeit (09:00 +
kumulative Fahrzeit) zurückschreiben → klares Erfolgs- oder
Fehlschlag-Ergebnis zurückgeben. Dieses eine Modul wird sowohl vom
Backfill-Skript als auch von allen drei automatischen Auslösern genutzt,
damit es nur eine einzige Stelle mit dieser Logik gibt.

### Depot als fester Ausgangspunkt
Die Depot-Adresse (Zur Reithalle 86, Dorsten) wird einmalig in feste
Koordinaten übersetzt und als Konstante hinterlegt — nicht bei jeder
Tour-Berechnung neu abgefragt, da sich die Adresse nicht ändert. Jede
Berechnung prüft zuerst, ob diese Koordinaten vorhanden/gültig sind, bevor
irgendeine Kundenadresse angefragt wird — genau das erfüllt die
Anforderung "Depot nicht geocodierbar → sofort und klar fehlschlagen,
ohne unnötige Anfragen".

### Automatische Neuberechnung: drei Auslöser
1. **Fahrt-bearbeiten-Dialog (PROJ-41)** — bei jeder tatsächlichen
   Fahrer- oder Datums-Änderung wird sowohl die alte als auch die neue
   Tourengruppe neu berechnet.
2. **Kundendetailseite — Abholung ändern** — gleiches Verhalten wie oben.
3. **Kundendetailseite — Abholung neu anlegen** — die neue Tourengruppe
   wird einmalig berechnet (es gibt keine "alte" Gruppe).

Eine reine Notiz-Änderung löst nirgends eine Neuberechnung aus. In allen
drei Fällen gilt: die Neuberechnung passiert erst NACH dem erfolgreichen
Speichern von Fahrer/Datum/Notiz, und ein Fehlschlag der Berechnung wird
nur protokolliert — er lässt das eigentliche Speichern niemals scheitern.

### Einmaliges Backfill-Skript
Ein eigenständiges Skript berechnet einmalig alle aktuell offenen
Tourengruppen ohne (oder mit zuletzt fehlgeschlagener) Route. Prüft zuerst
die Depot-Koordinaten (harter, sofortiger Abbruch bei Fehlen); danach wird
jede Tourengruppe unabhängig behandelt — eine einzelne fehlerhafte Tour
(ungültige Adresse, Geoapify kurzzeitig nicht erreichbar) wird übersprungen,
der Lauf für alle anderen läuft weiter. Am Ende gibt es einen
Zusammenfassungs-Report (wie viele erfolgreich/fehlgeschlagen, mit Grund).
Erneutes Ausführen überschreibt einfach vorhandene Werte — kein
Duplikat-Schutz nötig.

### Anzeige in der Touren-Liste
Eine Tourengruppe, deren Route erfolgreich und vollständig berechnet
wurde, wird in der berechneten Reihenfolge angezeigt, inklusive
Gesamtstrecke/-fahrzeit am Tourkopf und Ankunftszeit je Stopp. Fehlt eine
(vollständige) Berechnung, bleibt exakt das bisherige Verhalten aus
PROJ-21 (Sortierung nach Datum/Anlage-Reihenfolge, keine
Distanz-/Zeit-Anzeige) unverändert bestehen.

### Neue externe Abhängigkeit
Diese App ruft Geoapify bisher nirgends direkt auf (die vorhandenen
Adress-Koordinaten werden von einem externen Prozess befüllt). Für die
Routenberechnung wird erstmals ein direkter Geoapify-Zugriff aus der App
heraus benötigt — dafür wird ein API-Schlüssel als Umgebungsvariable
hinterlegt (für jede Umgebung, in der das Feature läuft).

### Dateien-Liste
**Neue Dateien:**
- `src/lib/routing/tour-route.ts` — gemeinsames Berechnungsmodul
- `supabase/migrations/<timestamp>_PROJ-42_routenberechnung_spalten.sql` — Migration
- `scripts/PROJ-42_backfill_routen.ts` — einmaliges Backfill-Skript

**Bestehende Dateien (angepasst):**
- `src/lib/actions/fahrten.ts` (`bearbeiteFahrt()`, `ladeAdressenFuerPartner()`)
- `src/lib/actions/pickup-tours.ts` (`updatePickupTour()`, `createPickupTour()`)
- `src/lib/actions/fahrten-helpers.ts` (`gruppiereZuTouren()`)
- `src/components/fahrer/tour-liste.tsx` (Anzeige-Erweiterung)

**Neue Dependencies:**
- `tsx` (Dev-Dependency, nur für das Backfill-Skript)
- Kein neues HTTP-Client-Paket (eingebautes `fetch` reicht für die
  Geoapify-JSON-API)

## Backend Implementation Notes

**Gebaut (`/backend`, 2026-08-02):**
- Migration `supabase/migrations/20260802090000_PROJ-42_routenberechnung_spalten.sql`
  — `ADD COLUMN IF NOT EXISTS` für die fünf Spalten, `route_manual_override`
  bewusst nicht angefasst.
- Gemeinsames Berechnungsmodul `src/lib/routing/tour-route.ts`:
  `berechneUndSpeichereRoute(adminClient, fahrerId, datum)` (Kernlogik: laden
  → validieren → Geoapify Route Planner aufrufen → zurückschreiben) sowie
  `loeseNeuberechnungAus(adminClient, gruppen[])` als gemeinsamer
  Log-nie-wirft-Wrapper für die drei Trigger-Stellen.
- Alle drei Trigger verdrahtet: `bearbeiteFahrt()` (`fahrten.ts`),
  `updatePickupTour()` (jetzt mit Vorher-Lesen von Fahrer/Datum, vorher nicht
  vorhanden) und `createPickupTour()` (`pickup-tours.ts`) — jeweils nach dem
  erfolgreichen eigenen Speichern, nie blockierend.
- Backfill-Skript `scripts/PROJ-42_backfill_routen.ts` (`npm run backfill:routen`,
  läuft über `tsx`), Pre-Flight-Check der Depot-Env-Vars vor jeder DB-Anfrage,
  Pro-Gruppe-Fehlerisolierung, Abschluss-Report.
- `tsx` als Dev-Dependency ergänzt und installiert (`npm install`).
- Unit-Tests `src/lib/routing/tour-route.test.ts` (10 Tests: Erfolgspfad,
  No-Op ohne Stopps, ungültige Koordinate bricht ohne Geoapify-Call ab,
  fehlende Depot-Konstanten/API-Key, Geoapify nicht erreichbar,
  Sicherheitsnetz bei Feldnamen-Mismatch der Geoapify-Antwort,
  `loeseNeuberechnungAus` wirft nie/dedupliziert/überspringt leere Gruppen).
- Verifiziert: `npm run build`, `npx tsc --noEmit`, `npx eslint`, gesamte
  Unit-Test-Suite (394/394 grün) — alle ohne Fehler in den neuen/geänderten
  Dateien.

**Gebaut (`/frontend`, 2026-08-02):**
- `gruppiereZuTouren()` (`src/lib/actions/fahrten-helpers.ts`) erweitert:
  sortiert Stopps nach `routeOrder`, wenn ALLE Stopps einer Tourengruppe
  denselben, nicht-null `routeCalculatedAt`-Zeitstempel tragen (garantiert
  durch die Alles-oder-nichts-Schreiblogik von `berechneUndSpeichereRoute`);
  gibt sonst unverändert den bisherigen Datums-/Anlage-Reihenfolge-Fallback
  ohne Distanz-/Fahrzeit-Anzeige zurück. `Tour` trägt neu
  `gesamtDistanzMeter`/`gesamtDauerSekunden` (null ohne vollständige
  Berechnung), `Fahrt` trägt neu `routeOrder`/`berechneteAnkunftszeit`.
- `getEigeneOffeneTouren()`/`getAlleOffeneTouren()` (`fahrten.ts`) laden neu
  die fünf Routen-Spalten mit und reichen sie an `gruppiereZuTouren()` durch.
- `tour-liste.tsx`: Tourkopf zeigt Gesamtstrecke/-fahrzeit zusätzlich zur
  Stopp-Anzahl, wenn vorhanden (`formatDistanz`/`formatDauer`); jeder Stopp
  zeigt zusätzlich zum Status-Badge die berechnete Ankunftszeit
  (`formatAnkunftszeit`, Europe/Berlin), wenn vorhanden — beides rein additiv,
  keine bestehende Anzeige verändert.
- 4 neue Unit-Tests in `fahrten-helpers.test.ts` (Sortierung nach
  `routeOrder`, Fallback bei unvollständiger/veralteter Berechnung, kein
  Leaken interner Routing-Felder auf `Fahrt`-Ebene).
- Verifiziert: `npm run build`, `npx tsc --noEmit`, `npx eslint`, gesamte
  Unit-Test-Suite (398/398 grün).
- **Nicht** live im Browser verifiziert: `NEXT_PUBLIC_SUPABASE_URL` zeigt auf
  die echte Produktions-Supabase-Instanz (kein lokales/Staging-DB), und ohne
  gesetzten `GEOAPIFY_API_KEY` + einem echten Backfill-Lauf existiert aktuell
  keine Tour mit berechneter Route, an der sich die neue Anzeige zeigen ließe.

**Offene Voraussetzung vor dem ersten echten Lauf (Backfill oder Trigger):**
- Drei neue Umgebungsvariablen müssen vom User gesetzt werden (in `.env.local`
  für lokal, `.env.production` fürs Deployment) — dieser Agent konnte
  `.env.local.example` aus Berechtigungsgründen nicht selbst bearbeiten:
  - `GEOAPIFY_API_KEY` — bestehender Geoapify-Zugang mit Routing-Berechtigung
    (noch vom User zu ergänzen).
  - `GEOAPIFY_DEPOT_LAT=51.7530556` / `GEOAPIFY_DEPOT_LON=6.9911492` — für
    „Gudel Werkzeuge GmbH & Co. KG, Zur Reithalle 86, 46286 Dorsten-Lembeck“,
    per OpenStreetMap-Nominatim-Geocoding ermittelt (zwei unabhängige
    Abfragen, hausnummerngenauer Treffer, übereinstimmend) — noch vom User
    in `.env.local`/`.env.production` einzutragen.
- Die exakten Feldnamen der Geoapify-Route-Planner-Antwort (`job_id`/`id`,
  `start_time`/`arrival_time`) wurden anhand der öffentlichen Dokumentation
  angenommen, nicht gegen einen echten API-Call verifiziert (kein Testzugang
  in dieser Umgebung) — das im Code eingebaute Sicherheitsnetz lässt die
  Berechnung klar fehlschlagen (statt falsche Daten zu speichern), falls die
  Annahme nicht stimmt. Vor dem produktiven Backfill-Lauf einmal mit einer
  echten Tour testen und bei Bedarf die Feldnamen in
  `rufeGeoapifyRoutePlanner()` (`tour-route.ts`) anpassen.

## QA Test Results

**Tested:** 2026-08-02
**App URL:** http://localhost:3000 (Unit-/Code-Tests) + https://tms.gudel-werkzeuge.de via lokalem Next-Dev-Server gegen Produktions-Supabase (Playwright E2E, kein Staging vorhanden)
**Tester:** QA Engineer (AI)

**Wichtige Rahmenbedingung:** Zum Testzeitpunkt ist `GEOAPIFY_API_KEY` noch nicht gesetzt und noch kein Backfill-Lauf erfolgt — es existiert aktuell keine einzige Tour mit erfolgreich berechneter Route in Produktion. Alle Kriterien rund um eine *erfolgreiche* Berechnung (Reihenfolge/Distanz/Fahrzeit/Ankunftszeit) sind deshalb nur per Unit-Test/Code-Review verifiziert, nicht live am echten Geoapify-Endpunkt. Alle Kriterien rund um *Fehlschlag-Verhalten und den Nie-blockiert-das-Speichern-Grundsatz* sind dagegen live gegen Produktion verifizierbar — und wurden es auch, da genau dieser Zustand (Geoapify-Konfiguration fehlt) aktuell vorliegt.

### Acceptance Criteria Status

#### AC-1: Depot & Grundlage
- [x] Fester Depot-Ort wird immer als Startpunkt verwendet, nie ein Fahrer-Standort (Code-Review: `berechneUndSpeichereRoute` liest ausschließlich `GEOAPIFY_DEPOT_LAT/LON`)
- [x] Depot nicht geocodierbar → klarer Fehlschlag ohne unnötige Kundenadress-Anfragen (Unit-Test: fetch wird nachweislich nie aufgerufen)

#### AC-2: Initiale Berechnung (Backfill)
- [~] Backfill berechnet Route für alle offenen Touren ohne Route — Kernlogik unit-getestet, Skript-Ablauf per Code-Review geprüft; **nicht live gegen Produktion ausgeführt** (fehlender API-Key)
- [x] Tour mit ungültiger Koordinate bei einem Stopp → nichts wird für diese Tour gespeichert, andere Touren unabhängig davon berechnet (Unit-Test)
- [x] Geoapify bei einer einzelnen Anfrage nicht erreichbar → nur diese Tour übersprungen, Lauf läuft weiter (Unit-Test + Code-Review der Pro-Gruppe-Fehlerbehandlung im Skript)
- [x] Erneuter Lauf überschreibt einfach, kein Duplikat-Schutz nötig (Code-Review: keine Existenzprüfung vor dem Schreiben)

#### AC-3: Automatische Neuberechnung
- [x] Fahrer/Datum-Änderung über PROJ-41-Dialog → alte UND neue Tourengruppe neu berechnet — **live gegen Produktion verifiziert** (neuer Test `tests/PROJ-42-routenberechnung.spec.ts`, Server-Log bestätigt Aufruf für beide Gruppen bei Änderung UND beim Zurücksetzen)
- [~] Gleiches über die Kundendetailseite (`updatePickupTour`/`createPickupTour`) — nur unit-getestet (`pickup-tours.test.ts`, 6 Tests), **nicht live E2E verifiziert** (kein risikoarmer, sauber rücksetzbarer Live-Datensatz in dieser Runde identifiziert — Empfehlung: als Folge-Polish per dediziertem E2E-Test nachholen)
- [x] Notiz-only-Änderung löst KEINE Neuberechnung aus — Unit-getestet für beide Trigger-Stellen (`fahrten.test.ts`, `pickup-tours.test.ts`)
- [x] Fehlschlagende Neuberechnung blockiert NIE das eigentliche Speichern — **live gegen Produktion verifiziert**: Server-Log zeigt "Routenberechnung übersprungen... Depot-Koordinaten sind nicht konfiguriert" bei JEDER Fahrer/Datum-Änderung während des E2E-Laufs, während das Speichern selbst nachweislich jedes Mal erfolgreich war ("Gespeichert."-Toast + korrekter neuer Zustand)

#### AC-4: Anzeige in der Touren-Liste
- [~] Erfolgreich berechnete Route → Stopps in berechneter Reihenfolge, Gesamtstrecke/-fahrzeit am Tourkopf — nur unit-getestet (`fahrten-helpers.test.ts`), keine Live-Tour mit Berechnung vorhanden
- [~] Berechnete Ankunftszeit je Stopp — dito, nur unit-getestet
- [x] Keine (oder fehlgeschlagene) Berechnung → Datums-/Anlage-Reihenfolge-Fallback ohne Distanz-/Fahrzeit-Anzeige — **live gegen Produktion verifiziert** (neuer E2E-Test bestätigt: aktuelle Live-Tour zeigt weder "km" noch "Std." im Tourkopf)

### Edge Cases Status

#### EC-1: Tour mit nur einem Stopp
- [x] Triviale Position 1, Distanz/Fahrzeit trotzdem berechnet (neuer Unit-Test ergänzt während dieser QA-Runde)

#### EC-2: Tour mit ungültiger Adresse bei einem Stopp
- [x] Ganze Tour übersprungen, nicht nur der eine Stopp (Unit-Test)

#### EC-3: Geoapify komplett nicht erreichbar während des gesamten Backfills
- [x] Handled correctly (Code-Review + Unit-Test der zugrundeliegenden Fehlerisolation) — vollständiger Skript-Lauf gegen simulierten Totalausfall nicht separat durchgespielt, ergibt sich aber direkt aus der Pro-Gruppe-Isolation

#### EC-4: Depot-Adresse selbst nicht geocodierbar
- [x] Blockiert korrekt VOR jeder Tour/Kundenadresse (Unit-Test + Backfill-Skript-Pre-Flight-Check per Code-Review)

#### EC-5: Tour, die nie erfolgreich berechnet wurde
- [x] Fällt auf bisherige Sortierung zurück — **live verifiziert** (aktueller Produktionszustand)

### Security Audit Results
- [x] Authentication: `bearbeiteFahrt()` und alle Fahrer-Leseaktionen verlangen eine gültige Session + Rolle fahrer/admin (`pruefeFahrerZugriff()`) — unverändert durch PROJ-42
- [x] Secrets: `GEOAPIFY_API_KEY` wird ausschließlich serverseitig gelesen (kein `NEXT_PUBLIC_`-Prefix, kein Logging des Wertes selbst) — kein Leak an den Client
- [x] Input handling: Geoapify-Request-Body wird ausschließlich aus validierten Zahlen (Koordinaten) und DB-UUIDs gebaut, keine String-Interpolation von Nutzereingaben; alle DB-Zugriffe laufen über den parametrisierten Supabase-Query-Builder (kein raw SQL) — keine Injection-Fläche durch PROJ-42 neu eröffnet
- [ ] **BUG-1 gefunden** (siehe unten) — Autorisierungslücke in `pickup-tours.ts`, die PROJ-42 zwar nicht verursacht, aber deren praktische Auswirkung durch die neu ausgelösten (kostenpflichtigen) Geoapify-Aufrufe vergrößert
- [~] Rate limiting: keine Begrenzung, wie oft die (Geoapify-kostenpflichtige) Neuberechnung durch schnell wiederholtes Fahrer/Datum-Ändern ausgelöst werden kann — siehe BUG-2

### Bugs Found

#### BUG-1: Keine Rollenprüfung in `updatePickupTour()`/`createPickupTour()`/`deletePickupTour()` (pickup-tours.ts)
- **Status: ✅ Fixed (2026-08-02, `/backend`)** — neue `pruefeAdminZugriff()`-Funktion
  in `pickup-tours.ts` (analog `pruefeFahrerZugriff()`/`requireRole()`), geprüft
  wird Login + `status === "aktiv"` + Rolle `admin`; in allen drei Funktionen
  als erste Zeile ergänzt. Zusätzlich UI-seitig abgesichert (Defense in Depth):
  `next-pickup-card.tsx` bekommt eine neue `isAdmin`-Prop von der Seite
  (`kunden/[id]/page.tsx`, die dieses Flag bereits für andere Karten berechnet)
  und blendet Bearbeiten-Stift sowie „Abholung erstellen" für Nicht-Admins aus.
  Rollen-Scope (nur Admin, nicht zusätzlich Arbeitsvorbereitung) mit dem User
  abgestimmt. 4 neue Unit-Tests (`pickup-tours.test.ts`): nicht eingeloggt,
  falsche Rolle, deaktivierter Admin-Account, erfolgreicher Admin-Zugriff —
  alle grün. Kein bestehender E2E-Test betroffen (keiner deckte diese UI
  bisher ab). `npm run build`/`tsc`/`eslint` weiterhin fehlerfrei.
- **Severity:** High
- **Vorbestehend, nicht durch PROJ-42 verursacht** — entdeckt während des Security-Audits dieser QA-Runde, weil PROJ-42 genau diesen Code-Pfad um die Neuberechnungs-Logik erweitert. Im Gegensatz zu `bearbeiteFahrt()` (`fahrten.ts`), das vor jeder Aktion `pruefeFahrerZugriff()` (Rolle fahrer/admin) prüft, prüfen alle drei Funktionen in `pickup-tours.ts` ausschließlich `if (!user)` — also nur "eingeloggt", nicht "welche Rolle". Auch die UI (`next-pickup-card.tsx`) blendet den Bearbeiten-Stift für JEDEN eingeloggten Nutzer ein, unabhängig von der Rolle.
- **Steps to Reproduce:**
  1. Als beliebiger eingeloggter Nutzer (z. B. Rolle "Werker" oder "QS", nicht Admin/Arbeitsvorbereitung) eine Kundendetailseite `/kunden/[id]` mit geplanter Abholung öffnen
  2. Auf den Bearbeiten-Stift bei "Nächste Abholung" klicken — der Dialog öffnet sich ohne weitere Prüfung
  3. Fahrer/Datum ändern oder die Abholung komplett löschen — Erwartet: Zugriff verweigert für nicht dazu berechtigte Rollen. Tatsächlich: Änderung/Löschung wird anstandslos durchgeführt
- **Verstärkter Impact durch PROJ-42:** jede so unautorisierte Änderung löst jetzt zusätzlich einen echten, kostenpflichtigen Geoapify-API-Call aus
- **Priority:** Empfehlung: vor oder kurz nach dem PROJ-42-Deploy als eigener kleiner Fix beheben (Rollen-Check analog `pruefeFahrerZugriff()` ergänzen) — blockiert nach den Projekt-eigenen Regeln formal den "Approved"-Status, auch wenn PROJ-42 selbst korrekt funktioniert. Liegt in der Entscheidung des Users, ob als Hotfix vorgezogen oder separat getrackt.
- **Re-QA-Verifikation (2026-08-02):** Live gegen Produktion bestätigt — Test-Account ist Admin (Zugriff auf `/verwaltung/abholungskalender` ohne Redirect); neuer permanenter Test `tests/PROJ-42-routenberechnung.spec.ts` ("Admin kann die 'Nächste Abholung'-Karte öffnen") bestätigt: Bearbeiten-Stift sichtbar, Dialog öffnet korrekt, Formularfelder vorhanden, Abbrechen funktioniert — Admin-Pfad live grün. Negativer Fall (Nutzer ohne Admin-Rolle) bewusst nur unit-verifiziert (`pickup-tours.test.ts`, 4 Tests) — kein zweiter Test-Account mit anderer Rolle vorhanden, Anlage eines neuen Produktions-Accounts war nicht Teil dieses QA-Laufs. Code-Review bestätigt zusätzlich: `CreatePickupModal` ruft dieselbe, jetzt geschützte `createPickupTour()`-Aktion auf — kein Bypass über einen zweiten Pfad.

#### BUG-2: Keine Rate-Begrenzung für die (kostenpflichtige) automatische Neuberechnung
- **Status: ✅ Fixed (2026-08-02, `/backend`)** — einfacher In-Memory-Cooldown
  (30s) pro Tourengruppe in `loeseNeuberechnungAus()` (`tour-route.ts`):
  wiederholte Auslösung derselben Fahrer+Datum-Kombination innerhalb des
  Cooldowns wird übersprungen und nur geloggt, kein neuer Geoapify-Call.
  Betrifft nur die ereignisbasierten Trigger, nicht das Backfill-Skript (ruft
  `berechneUndSpeichereRoute()` bewusst direkt auf). Bewusst simpel (kein
  Redis/DB) gehalten, da der Next.js-Server als einzelner, dauerhaft laufender
  Docker-Container betrieben wird. 1 neuer Unit-Test bestätigt: zweiter Aufruf
  für dieselbe Gruppe direkt danach löst keine erneute Berechnung aus.
- **Severity:** Low
- **Beschreibung:** Schnelles wiederholtes Ändern von Fahrer/Datum an derselben Fahrt (z. B. versehentlich oder mutwillig) löst jedes Mal einen neuen Geoapify-Aufruf aus, ohne Debounce/Rate-Limit. Kein Sicherheitsproblem im engeren Sinn, aber ein Kosten-/Abuse-Vektor, der in der Spec nicht ausdrücklich adressiert wurde (Rate Limiting ist laut allgemeinen Projekt-Regeln "optional für MVP").
- **Priority:** Nice to have — kein Blocker für dieses Feature.
- **Re-QA-Verifikation (2026-08-02):** Live gegen Produktion bestätigt — beim Zurücksetzen der Testdaten im PROJ-42-E2E-Lauf (Fahrer/Datum kurz nacheinander zweimal geändert) protokollierte der Server für beide Tourengruppen exakt den erwarteten Cooldown: „Cooldown aktiv (zuletzt vor 3s ausgelöst)" statt eines erneuten Geoapify-Versuchs. Gleiches Muster zusätzlich beim Regressionslauf der PROJ-41-Suite reproduziert (unabhängiger zweiter Beleg). Neuer Unit-Test bleibt zusätzlich grün.

### Re-QA Summary (2026-08-02, nach Bugfixes)
- **Beide Bugs verifiziert behoben:** BUG-1 live (Admin-Pfad, neuer Test) + unit-getestet (Ablehnungsfälle); BUG-2 live (Cooldown-Log bei zwei unabhängigen Testläufen beobachtet) + unit-getestet
- **Regressionstest:** komplette PROJ-21/PROJ-41/PROJ-42-Suite (17 E2E-Tests) erneut mit `--workers=1` gefahren, 17/17 grün — keine neuen Regressionen durch die Bugfixes
- **Unit-Tests:** 414/414 grün, `npm run build`/`tsc --noEmit`/`eslint` fehlerfrei
- **Kein neuer Bug durch die Fixes selbst gefunden**

### Summary
- **Acceptance Criteria:** 9/13 vollständig verifiziert (davon 4 live gegen Produktion, 5 per Unit-Test/Code-Review), 4/13 nur per Unit-Test/Code-Review verifiziert (blockiert durch fehlenden `GEOAPIFY_API_KEY`/Backfill-Lauf), 0/13 fehlgeschlagen
- **Bugs Found:** 2 total (1 High, 1 Low) — **beide gefixt UND re-verifiziert** (live + unit-getestet), 0 offen
- **Security:** 1 vorbestehende Autorisierungslücke gefunden, gefixt und live nachverifiziert (BUG-1); keine neue Angriffsfläche durch PROJ-42 selbst
- **Production Ready:** **JA** — keine offenen Critical/High-Bugs, beide gefundenen Bugs gefixt und sowohl live (soweit möglich) als auch per Unit-Test re-verifiziert
- **Empfehlung:** GEOAPIFY_API_KEY setzen + einmaligen Backfill-Testlauf gegen eine einzelne echte Tour vor dem produktiven Vollbackfill, um die 4 offenen Unit-Test-only-Kriterien und die Geoapify-Feldnamen-Annahme final live zu bestätigen

## Deployment
**Deployed:** 2026-08-02 zu https://tms.gudel-werkzeuge.de (`./scripts/deploy.sh PROJ-42`,
Post-Deploy-Smoke grün im 1. Anlauf, keine Fehler in Container-Logs). Git-Tag `v1.42.0-PROJ-42`.

- Migration `20260802090000_PROJ-42_routenberechnung_spalten.sql` gegen die
  Produktions-Supabase-Instanz angewendet (`node scripts/apply-migration.mjs`) —
  sicherer No-Op, da die fünf Spalten bereits live existierten.
- `.env.production` auf dem Server bewusst **ohne** `GEOAPIFY_API_KEY`/
  `GEOAPIFY_DEPOT_LAT`/`GEOAPIFY_DEPOT_LON` deployed (User-Entscheidung: „ohne
  Key deployen, später nachtragen") — die Routenberechnung bleibt bis dahin
  inaktiv (Trigger feuern, schlagen sicher/geloggt fehl, Touren-Liste zeigt
  weiter den bisherigen Datums-Fallback). Kein zweiter Deploy nötig, sobald
  die drei Variablen nachgetragen werden — die Funktionalität aktiviert sich
  von selbst beim nächsten Fahrer/Datum-Trigger bzw. manuellen Backfill-Lauf
  (`npm run backfill:routen`).
- Kein dediziertes `tests/deploy/PROJ-42-*.spec.ts` erstellt (bestehende
  generische Smoke-Tests liefen grün) — als Folge-Polish empfohlen, analog zur
  offenen Empfehlung bei PROJ-21/PROJ-41.
- Offene Nachfolge-Schritte für den User: (1) drei Geoapify-Env-Variablen in
  `.env.production` ergänzen, (2) `npm run backfill:routen` einmalig gegen
  die aktuell offenen Touren laufen lassen, (3) Ergebnis in der `/fahrer`-
  Touren-Liste stichprobenartig prüfen.
