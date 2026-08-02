# PROJ-42: Routenberechnung für Touren (Geoapify)

## Status: Planned
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

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
