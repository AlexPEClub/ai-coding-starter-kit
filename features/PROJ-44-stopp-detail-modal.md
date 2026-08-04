# PROJ-44: Fahrer — Stopp-Detail-Modal (Ändern / Navi / Erledigt)

## Status: Planned
**Created:** 2026-08-04
**Last Updated:** 2026-08-04

## Dependencies
- Requires: PROJ-21 (Fahrer — Tourenliste) — Tour-/Stopp-Liste, Rollen-Gate `/fahrer`
- Requires: PROJ-41 (Fahrt bearbeiten) — Bearbeiten-Dialog (Fahrer/Datum/Notiz), Chronologie-Mechanismus (`tms.tour_aenderungen`, `getFahrtAenderungen()`)
- Requires: PROJ-42 (Routenberechnung) — liefert `routeOrder`, `berechneteAnkunftszeit`, Gesamtstrecke/-fahrzeit der Tour. **Wird von diesem Feature erweitert** um eine Etappen-Distanz/-Fahrzeit pro Stopp (siehe Technical Requirements)

## Kontext

"Status ändern" wurde in den Specs von PROJ-21 und PROJ-41 bewusst als eigener
Folge-Baustein vertagt. Aktuell öffnet ein Klick auf einen Stopp in der
Fahrer-Tourenliste direkt den Bearbeiten-Dialog aus PROJ-41 — das ist zu
direkt, der Fahrer will beim Anklicken zuerst alle Infos zum Stopp sehen
(inkl. Chronologie) und erst über einen bewussten Klick die Bearbeiten-Maske
öffnen. Dieses Feature führt ein Detail-Modal ein und ergänzt zwei neue
Aktionen: zur Kundenadresse navigieren (Google Maps) und einen Stopp als
erledigt abhaken.

## User Stories
- Als Fahrer möchte ich beim Anklicken eines Stopps zuerst alle Infos und die
  Chronologie sehen, damit ich nicht versehentlich in den Bearbeiten-Modus
  komme, wenn ich nur nachschauen will.
- Als Fahrer möchte ich aus dem Detail-Modal heraus direkt zur Kundenadresse
  navigieren können, damit ich nicht erst Adresse abschreiben und in eine
  Maps-App kopieren muss.
- Als Fahrer möchte ich einen erledigten Stopp mit einer Bestätigung abhaken
  können, damit ich am Ende des Tages sehe, was schon erledigt ist und was
  noch ansteht.
- Als Fahrer/Admin möchte ich weiterhin über "Ändern" die bestehende
  Bearbeiten-Maske erreichen, damit Fahrer/Datum/Notiz wie bisher angepasst
  werden können.
- Als Admin möchte ich in der Tourenplanung genauso wie der Fahrer Stopps
  abhaken können, damit ich bei Bedarf für einen Fahrer nachpflegen kann.

## Out of Scope
- **Rückgängig machen ("Erledigt" zurücknehmen)** — kein Undo in diesem
  Feature. Falls ein Stopp fälschlich abgehakt wurde, ist das vorerst nur
  über direkten Datenbankzugriff korrigierbar; ein Undo-Baustein kann bei
  Bedarf als eigenes Folge-Feature nachgezogen werden.
- **Kumulierte Distanz seit Tourstart** — es wird nur die Etappen-Distanz
  (vom vorherigen Stopp bis zu diesem) angezeigt, keine Aufsummierung.
- **Auftrags-/Kommissionsbezug im Detail-Modal** — existiert aktuell nicht im
  `Fahrt`-Datenmodell, wird hier nicht ergänzt.
- **Deaktivierung des Navi-Buttons bei unvollständiger Adresse** — der Button
  bleibt immer aktiv und nutzt die vorhandenen Adressfelder.
- **Neue Benachrichtigungen** (z.B. Push an Admin bei "erledigt") — gehört zu
  PROJ-9 (Benachrichtigungen), nicht Teil dieses Features.
- **Bearbeiten-Dialog selbst wird nicht verändert** — Inhalt/Verhalten von
  `fahrt-bearbeiten-dialog.tsx` bleibt exakt wie in PROJ-41, nur der
  Einstiegspunkt (Klick auf Stopp) ändert sich.

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

### Detail-Modal öffnen & Inhalt
- [ ] Angenommen der Nutzer ist auf `/fahrer` (Tab „Mir zugewiesen“ oder „Tourenplanung“), wenn er auf einen Stopp klickt, dann öffnet sich das Detail-Modal (nicht mehr direkt der Bearbeiten-Dialog).
- [ ] Angenommen das Detail-Modal ist offen, dann zeigt es in dieser Reihenfolge: Kunde + Adresse (Header), Status-Badge, Datum, Fahrer, Notiz, Etappen-Distanz + Etappen-Fahrzeit (falls Route berechnet), berechnete Ankunftszeit (falls Route berechnet), Chronologie (Änderungsverlauf), danach die drei Buttons „Ändern“, „Navi“, „Erledigt“.
- [ ] Angenommen für die Tour wurde noch keine Route berechnet (PROJ-42), wenn das Detail-Modal geöffnet wird, dann werden Etappen-Distanz/-Fahrzeit und Ankunftszeit weggelassen (keine Platzhalter/Fehlermeldung).
- [ ] Angenommen ein Stopp hat noch keine Chronologie-Einträge, wenn das Detail-Modal geöffnet wird, dann zeigt der Chronologie-Bereich „Noch keine Änderungen.“ (wie im bestehenden Bearbeiten-Dialog).

### Ändern-Button
- [ ] Angenommen das Detail-Modal ist offen, wenn der Nutzer auf „Ändern“ klickt, dann schließt sich das Detail-Modal und der bestehende Bearbeiten-Dialog (Fahrer/Datum/Notiz, PROJ-41) öffnet sich unverändert.

### Navi-Button
- [ ] Angenommen der Stopp hat eine vollständige Adresse, wenn der Nutzer auf „Navi“ klickt, dann öffnet sich in einem neuen Tab ein Google-Maps-Link mit der Kundenadresse.
- [ ] Angenommen der Stopp hat eine unvollständige Adresse (z.B. Straße fehlt), wenn der Nutzer auf „Navi“ klickt, dann öffnet sich trotzdem ein Google-Maps-Link mit den vorhandenen Adressfeldern (PLZ/Ort).

### Erledigt-Button
- [ ] Angenommen ein Stopp hat einen Status ungleich erledigt/abgeschlossen/archiviert, wenn das Detail-Modal geöffnet wird, dann ist der „Erledigt“-Button sichtbar.
- [ ] Angenommen ein Stopp ist bereits erledigt/abgeschlossen/archiviert, wenn das Detail-Modal geöffnet wird, dann ist der „Erledigt“-Button nicht sichtbar.
- [ ] Angenommen das Detail-Modal ist offen, wenn der Nutzer auf „Erledigt“ klickt, dann erscheint eine Bestätigung mit dem Text „Stopp als erledigt markieren?“ und den Optionen Ja/Nein.
- [ ] Angenommen die Bestätigung ist offen, wenn der Nutzer „Nein“ klickt, dann schließt sich die Bestätigung ohne Änderung, das Detail-Modal bleibt offen.
- [ ] Angenommen die Bestätigung ist offen, wenn der Nutzer „Ja“ klickt, dann wird der Status des Stopps auf „erledigt“ gesetzt, ein Chronologie-Eintrag „Status: [alter Status] → erledigt“ wird angelegt, und beide Dialoge schließen sich.
- [ ] Angenommen ein Stopp wurde als erledigt markiert, dann wird er in der Tour-Liste weiterhin angezeigt, aber innerhalb seiner Tour ans Ende sortiert und durchgestrichen/grau mit Häkchen-Icon dargestellt.
- [ ] Angenommen alle Stopps einer Tour sind erledigt/abgeschlossen/archiviert, dann verhält sich die Tour in den Listen „Mir zugewiesen“/„Tourenplanung“ wie bisher schon bei vollständig abgeschlossenen Touren (fällt aus der Ansicht „offene Touren“ heraus — bestehende Logik aus PROJ-21, unverändert).
- [ ] Angenommen das Setzen auf „erledigt“ schlägt serverseitig fehl (z.B. keine Berechtigung, Netzwerkfehler), wenn der Nutzer „Ja“ bestätigt hat, dann erscheint eine Fehlermeldung als Toast, das Detail-Modal bleibt offen, und der Stopp bleibt unverändert in der Liste.

### Berechtigung
- [ ] Angenommen ein Nutzer mit Rolle Fahrer öffnet einen ihm zugewiesenen Stopp, dann kann er „Erledigt“ auslösen.
- [ ] Angenommen ein Nutzer mit Rolle Admin öffnet einen Stopp über den Tab „Tourenplanung“, dann kann er „Erledigt“ auslösen (analog zur bestehenden Berechtigung für „Ändern“ aus PROJ-41).

## Edge Cases
- Stopp wird von zwei Personen gleichzeitig geöffnet (z.B. Fahrer + Admin) und einer markiert ihn als erledigt, während der andere das Detail-Modal noch offen hat → letzter Schreibvorgang gewinnt (wie beim bestehenden Bearbeiten-Dialog), keine Konflikterkennung in diesem Feature.
- Route wurde berechnet, aber genau für diesen einzelnen Stopp fehlt aus irgendeinem Grund die Etappen-Distanz (z.B. Backfill nur teilweise gelaufen) → Etappen-Distanz/-Fahrzeit/Ankunftszeit werden für diesen Stopp weggelassen, keine Fehlermeldung.
- Nutzer klickt "Erledigt", schließt aber den Browser-Tab bevor er die Ja/Nein-Bestätigung beantwortet → keine Änderung, Stopp bleibt im ursprünglichen Status (Bestätigung wird nie serverseitig ausgelöst).
- Kundenadresse enthält Sonderzeichen (Umlaute, Straße mit "/") → müssen für den Google-Maps-Link korrekt URL-encodiert werden.
- Stopp ist bereits erledigt, aber der Nutzer öffnet trotzdem das Detail-Modal → alle Infos + Chronologie weiterhin einsehbar, nur der "Erledigt"-Button fehlt (siehe Acceptance Criteria).

## Technical Requirements (optional)
- **Datenmodell-Erweiterung (berührt PROJ-42):** Pro Stopp muss zusätzlich die
  Etappen-Distanz und Etappen-Fahrzeit (vom vorherigen Stopp zu diesem
  Stopp) gespeichert werden — aktuell speichert PROJ-42 nur die
  Gesamtstrecke/-fahrzeit der ganzen Tour (`gesamtDistanzMeter`/
  `gesamtDauerSekunden`). Geoapify liefert Distanz/Dauer pro Leg bereits in
  der bestehenden Routenberechnungs-Antwort — muss beim Speichern der Route
  zusätzlich pro Fahrt persistiert werden. Genaue Umsetzung (Spaltennamen,
  Migration) wird in `/architecture` entschieden.
- **Terminal-Tauglichkeit:** Alle Buttons im Detail-Modal (Ändern/Navi/
  Erledigt) und die Ja/Nein-Bestätigung folgen dem projektweiten Standard
  Touch-Ziel ≥ 48px (siehe `docs/design-system.md`), keine Ausnahme für
  dieses Feature.
- **Security:** Rollenprüfung für "Erledigt" serverseitig identisch zur
  bestehenden Prüfung in `bearbeiteFahrt()` (Fahrer nur für eigene Stopps,
  Admin für alle) — keine reine Client-Prüfung.

## Open Questions
- [ ] Genaue Spaltennamen/Migration für die neue Etappen-Distanz/-Fahrzeit
  pro Stopp — wird in `/architecture` geklärt.
- [ ] Muss das bestehende PROJ-42-Backfill-Skript (`update-holidays.mjs`-
  Pattern) erneut laufen, um die Etappen-Distanz auch für schon berechnete
  Touren nachzutragen, oder reicht es, dass neue Berechnungen ab Deploy die
  Etappen-Distanz mitliefern? — wird in `/architecture`/`/backend` geklärt.

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Klick auf Stopp öffnet Detail-Modal statt direkt Bearbeiten-Dialog | Fahrer soll erst Infos/Chronologie sehen können, bevor er versehentlich in den Bearbeiten-Modus gerät | 2026-08-04 |
| Erledigter Stopp bleibt sichtbar, sortiert ans Ende, statt zu verschwinden | Fahrer soll am Ende des Tages sehen können, was schon erledigt ist ("abgehakte Liste"), nicht nur eine schrumpfende Liste offener Stopps | 2026-08-04 |
| Kein Undo für "Erledigt" | Hält den Umfang des Features klein; Korrektur bei Fehlmarkierung ist ein seltener Fall, der vorerst manuell/administrativ gelöst wird | 2026-08-04 |
| "Erledigt"-Button verschwindet bei bereits finalem Status statt deaktiviert zu bleiben | Vermeidet Verwirrung durch einen Button, der nichts mehr tun kann | 2026-08-04 |
| Navi-Button bleibt immer aktiv, auch bei unvollständiger Adresse | Auch eine unvollständige Adresse (z.B. nur PLZ/Ort) bringt den Fahrer meist nah genug ans Ziel; ein deaktivierter Button wäre in der Praxis öfter im Weg als hilfreich | 2026-08-04 |
| Etappen-Distanz (nicht kumuliert) statt Gesamtstrecke der Tour im Modal | Fahrer will pro Stopp wissen, wie weit der nächste Sprung ist, nicht die Gesamtstrecke der Tour, die er an anderer Stelle schon sieht | 2026-08-04 |
| Fahrer + Admin dürfen "Erledigt" auslösen | Konsistent mit der bestehenden Berechtigung für "Ändern" aus PROJ-41 | 2026-08-04 |
| Fehlerfall folgt dem bestehenden PROJ-41-Muster (Toast + Dialog bleibt offen) | Konsistenz mit bereits etabliertem, bekanntem Verhalten im selben Bereich der App | 2026-08-04 |

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
