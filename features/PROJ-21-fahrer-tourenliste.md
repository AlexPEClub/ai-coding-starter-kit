# PROJ-21: Fahrer — Tourenliste (nur Anzeige)

## Status: Planned
**Created:** 2026-07-31
**Last Updated:** 2026-07-31

> Erster Baustein der komplett neu aufgesetzten Fahrer-Seite (die vorherige
> Implementierung wurde am 2026-07-30 auf User-Wunsch vollständig entfernt,
> siehe `features/INDEX.md`). Statt einer großen PROJ-21 wie zuvor wird die
> neue Fahrer-Seite bewusst in mehrere kleine, unabhängig lieferbare Bausteine
> aufgeteilt. Dieser Baustein liefert **nur die Anzeige** der Touren — keine
> Aktionen, keine Karte, keine Auftragserfassung. Folge-Bausteine (Status
> setzen, Kartenansicht, Kalender-Ausblick, Wiederanbindung von PROJ-34s
> Feld-Auftragserfassung) bekommen jeweils eigene, neue PROJ-IDs (ab PROJ-41).

## Dependencies
- **PROJ-1 (Auth & Rollen)** — Rollen `fahrer` + `admin` für das Rollen-Gate der Seite.
- Nutzt die bestehende Tabelle `tms.tours` (angelegt über PROJ-19/PROJ-20) — **keine neue
  Migration** in diesem Baustein, keine neuen Spalten.
- Ersetzt die zuvor komplett entfernte Fahrer-Seite (`/fahrer`, siehe `features/INDEX.md`,
  2026-07-30). Der DB-Stand (Spalten, `order_status`-Enum-Werte) aus der alten Implementierung
  ist unangetastet und wird hier nicht genutzt, bis ein späterer Baustein die Aktionen
  wiederaufbaut.

## Begriffe
- **Fahrt** = eine einzelne Abholung/ein einzelner Stopp bei einem Kunden (bisher ein Datensatz
  in `tms.tours`).
- **Tour** = alle Fahrten **eines Fahrers an einem Tag**, gebündelt und (vorerst nach
  Datum/Anlage-Reihenfolge) sortiert.

## User Stories
- Als **Fahrer** möchte ich im Tab „Ich" nur meine eigenen offenen Touren sehen, damit ich weiß,
  welche Abholungen bei mir anstehen.
- Als **Fahrer** möchte ich eine Tour antippen und die einzelnen Stopps aufgeklappt sehen, damit
  ich Details (Firma, Adresse) einsehen kann, ohne die Gesamtübersicht zu verlassen.
- Als **Fahrer/Admin** möchte ich im Tab „Tourenplanung" die offenen Touren aller Fahrer sehen,
  damit ich einen transparenten Gesamtüberblick über die aktuelle Logistik habe.
- Als **Fahrer/Admin** möchte ich die Touren-Liste nach Fahrer und Datum filtern können, damit ich
  gezielt nachsehen kann, was ein bestimmter Fahrer an einem bestimmten Tag fährt.
- Als **Fahrer/Admin** möchte ich den Status jeder Fahrt auf einen Blick sehen (nur Anzeige),
  damit ich weiß, was schon erledigt ist, auch ohne dass ich hier schon etwas ändern kann.

## Out of Scope
- **Status ändern** (z.B. „Unterwegs"/„Erledigt" setzen) — eigener Folge-Baustein, neue PROJ-ID.
- **Kartenansicht** — eigener Folge-Baustein, neue PROJ-ID.
- **Mehrtage-/Kalender-Ausblick** über die aktuell offenen Touren hinaus — eigener Folge-Baustein.
- **Auftrag im Feld anlegen + QR-Code-Druck** (Wiederanbindung von PROJ-34) — eigener
  Folge-Baustein; bis dahin bleibt diese Funktion unterbrochen (siehe Notiz bei PROJ-34 in
  `features/INDEX.md`).
- **Uhrzeiten, Kilometer, echte Routenberechnung** (z.B. über Geoapify) — spätere Bausteine, sobald
  die Grundstruktur sich bewährt hat.
- **Archiv/Verlauf abgeschlossener Touren** — nicht Teil dieser Spec; es werden nur offene/aktuelle
  Touren angezeigt.
- **Adress-Validierung/Datenqualität** (geplanter Cronjob, der unvollständige Adressen prüft und
  ergänzt) — eigenständiges, noch nicht gespecctes Folge-Thema.

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

### Zugang & Rollen
- [ ] Angenommen ein Nutzer ohne Rolle `fahrer` oder `admin` ist eingeloggt, wenn er `/fahrer`
  öffnet, dann wird er auf `/dashboard` umgeleitet.
- [ ] Angenommen ein Nutzer mit Rolle `fahrer` und/oder `admin` ist eingeloggt, wenn er `/fahrer`
  öffnet, dann sieht er beide Tabs („Ich" und „Tourenplanung") — es gibt keine zusätzliche
  Einschränkung zwischen den beiden Rollen.

### Tab „Ich"
- [ ] Angenommen ein Fahrer hat offene Touren, wenn er den Tab „Ich" öffnet, dann sieht er nur
  seine eigenen offenen Touren, chronologisch sortiert (nächste zuerst).
- [ ] Angenommen ein Fahrer hat aktuell keine offenen Touren, wenn er den Tab „Ich" öffnet, dann
  wird ein Leerzustand-Hinweis angezeigt (z.B. „Keine offenen Touren") statt einer leeren Fläche.
- [ ] Angenommen eine Tour ist in der Liste zugeklappt, wenn der Fahrer darauf tippt, dann klappt
  sie sich auf (Akkordeon) und zeigt die einzelnen Stopps dieser Tour (Firma, Adresse,
  Status-Badge).
- [ ] Angenommen ein Stopp hat keine oder nur eine unvollständige Adresse hinterlegt, wenn die
  Tour aufgeklappt wird, dann werden die vorhandenen Adressfelder angezeigt und fehlende Felder
  einfach weggelassen, ohne Fehlermeldung.

### Tab „Tourenplanung" (Fahrer + Admin)
- [ ] Angenommen ein Fahrer oder Admin ist eingeloggt, wenn er den Tab „Tourenplanung" öffnet,
  dann sieht er die offenen Touren aller Fahrer (Transparenz — keine Einschränkung nach Rolle).
- [ ] Angenommen der Nutzer ist im Tab „Tourenplanung", wenn er nach Fahrer und/oder Datum
  filtert, dann wird die Liste entsprechend eingeschränkt.
- [ ] Angenommen die aktuelle Fahrer-/Datum-Filterkombination liefert keine Treffer, wenn der
  Filter angewendet wird, dann wird ein passender Leerzustand-Hinweis angezeigt.
- [ ] Angenommen der Nutzer öffnet eine Tour im Tab „Tourenplanung", wenn er darauf tippt, dann
  klappt sie sich auf und zeigt die Stopps — gleiches Verhalten wie im Tab „Ich".

## Edge Cases
- **Doppel-Abholung:** Zwei Stopps am selben Tag beim gleichen Kunden werden als zwei separate
  Stopps innerhalb der Tour angezeigt, keine Zusammenfassung/Deduplizierung.
- **„Offen" ist serverseitig bestimmt:** Ob eine Tour als offen zählt, wird anhand des
  Server-Datums entschieden, nicht der Client-Uhrzeit — vermeidet Inkonsistenzen bei Fahrern,
  die zwischen Zeitzonen/mit falsch eingestellter Geräteuhr unterwegs sind.
- **Große Anzahl Stopps an einem Tag:** Keine Pagination innerhalb einer Tour vorgesehen — laut
  Klärung ist die Datenmenge klein (5–10 Fahrer, wenige Stopps/Tag).
- **Datenänderung während die Seite offen ist** (z.B. Admin ändert die Fahrer-Zuordnung einer
  Fahrt): kein Live-Update in diesem Baustein; ein Neuladen der Seite zeigt den aktuellen Stand.

## Technical Requirements (optional)
- **Security:** Rollen-Gate serverseitig geprüft (nicht nur clientseitig), analog zum bisherigen
  Muster der alten Fahrer-Seite.
- **Performance:** Keine Pagination nötig bei der aktuellen Datenmenge (5–10 Fahrer); eine
  einfache serverseitige Abfrage reicht aus.
- **Keine neue Migration:** Es werden ausschließlich bestehende Spalten aus `tms.tours` gelesen.

## Open Questions
- [ ] Adress-Validierungs-Cronjob (Datenqualität) — eigenständiges Folge-Thema, noch nicht
  gespecct; wird als separates Feature aufgenommen, sobald es angegangen wird.
- [ ] Datenqualitäts-Regel für Fahrten ohne zugewiesenen Fahrer — soll das künftig über eine harte
  Datenbank-Regel (Fahrer ist Pflicht beim Anlegen) verhindert werden, oder über einen
  überwachenden Cronjob mit Benachrichtigung erkannt werden? Eigenständiges Folge-Thema
  (zusammen mit der Adress-Validierung), nicht Teil dieses Bausteins. Aktuell betroffen: 3
  bestehende, bereits überfällige Fahrten ohne Fahrer — werden bewusst nicht rückwirkend bereinigt.

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Neue Begriffs-Ebene **Fahrt** (einzelner Stopp) vs. **Tour** (alle Fahrten eines Fahrers an einem Tag) eingeführt | Bildet die reale Arbeitsweise ab (ein Fahrer fährt an einem Tag mehrere Stopps nacheinander ab); vorher gab es nur einzelne Stopp-Einträge ohne Bündelung | 2026-07-31 |
| Nur offene/aktuelle Touren anzeigen, keine abgeschlossenen/vergangenen | Für die Tagesarbeit des Fahrers ist kein Verlauf nötig; eine unbegrenzte Liste würde mit der Zeit unübersichtlich und langsam | 2026-07-31 |
| Zwei Tabs: „Ich" (eigene offene Touren) und „Tourenplanung" (offene Touren aller Fahrer, filterbar nach Fahrer+Datum) — beide Tabs für Rollen `fahrer` und `admin` gleichermaßen sichtbar | Bewusste Team-Transparenz: Fahrer sollen die Touren ihrer Kollegen einsehen können, nicht nur Admins (revidiert im Architektur-Review, ursprünglich war „Tourenplanung" nur für Admin vorgesehen); „Tourenplanung" trifft den Zweck treffender als das neutrale „Alle" | 2026-07-31 |
| Aufklappen (Akkordeon) statt Modal/eigener Unterseite für die Stopp-Details | Terminal-Tauglichkeit: ein Touch, kein Seitenwechsel — passt zu Mobile-First/Touch ≥48px aus dem Design-System | 2026-07-31 |
| Sortierung der Stopps innerhalb einer Tour vorerst nach vorhandenen DB-Daten (Datum/Anlage-Reihenfolge), kein neues Reihenfolge-Feld | Echte Routenberechnung (z.B. Geoapify) ist ein späterer, eigener Baustein; kein Grund, das Schema jetzt schon zu ändern | 2026-07-31 |
| Status wird als reiner Info-Badge angezeigt (nicht klickbar/keine Aktion) | Die Daten werden ohnehin geladen; macht die Liste sofort nützlicher, ohne dem Folge-Baustein „Status setzen" vorzugreifen | 2026-07-31 |
| Fehlende Adressfelder werden stillschweigend weggelassen statt Fehlermeldung | Datenqualität ist ein separates Backlog-Thema (Adress-Validierungs-Cronjob); die Anzeige soll den Fahrer nicht blockieren | 2026-07-31 |
| Rollen-Gate `fahrer` + `admin` von Anfang an, obwohl die PROJ-34-Anbindung erst in einem späteren Baustein zurückkommt | Datenminimierung — andere Rollen (QS, Werker, Wareneingang) brauchen keinen Zugriff auf Touren-/Kundendaten | 2026-07-31 |
| Route bleibt `/fahrer`; PROJ-21-ID wird für diesen ersten Baustein wiederverwendet, Folge-Bausteine bekommen jeweils eigene neue PROJ-IDs (ab PROJ-41) | Entwicklungsprozess wird bewusst auf kleinere, unabhängig lieferbare Einheiten umgestellt (User-Wunsch), passt zur Feature-Granularitäts-Regel aus `/write-spec` | 2026-07-31 |
| Fahrten ohne zugewiesenen Fahrer werden im Tab „Tourenplanung" mit Hinweis „Kein Fahrer zugewiesen" angezeigt, nicht ausgeblendet | Der Admin muss diese Fälle sehen können, um sie zuzuordnen — Ausblenden würde das Problem nur verstecken statt es sichtbar zu machen | 2026-07-31 |
| Die 3 bestehenden, bereits überfälligen Fahrten ohne Fahrer werden NICHT rückwirkend in der Live-DB korrigiert | User-Entscheidung: keine manuelle Direktkorrektur der Produktionsdaten im Rahmen dieses Bausteins; eine spätere Datenqualitäts-Regel/Cronjob soll das strukturell verhindern und melden (siehe Open Questions) | 2026-07-31 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| Keine neue Migration — ausschließlich bestehende Tabellen/Spalten (Fahrten, Kunden, Adressen, Nutzerverwaltung) werden gelesen | Geringstmögliches Risiko für die Live-Datenbank; das Anzeige-Baustein braucht kein neues Datenmodell | 2026-07-31 |
| Zugriffsschutz wird explizit im Anwendungscode geprüft, nicht der Datenbank allein überlassen | Die Datenbank erlaubt aktuell technisch jedem eingeloggten Nutzer das Lesen aller Fahrten (bestehende, unveränderte Regel aus einem früheren Baustein) — die Seite selbst muss deshalb durchsetzen, dass Tab „Ich" nur die eigenen Fahrten lädt; Tab „Tourenplanung" hat keine zusätzliche Rollen-Einschränkung über das Seiten-Rollen-Gate (`fahrer`+`admin`) hinaus | 2026-07-31 |
| „Offen" = Status ist weder „erledigt" noch „abgeschlossen" noch „archiviert", unabhängig vom Datum | So bleiben auch überfällige, noch nicht erledigte Fahrten sichtbar, statt unbemerkt aus der Liste zu verschwinden — passend zur Live-Prüfung, bei der mehrere bereits überfällige offene Fahrten gefunden wurden | 2026-07-31 |
| Eine Tour wird nicht als eigener Datensatz gespeichert, sondern beim Anzeigen aus den Fahrten berechnet (gruppiert nach Fahrer + Datum) | Kein neues Datenmodell nötig für diesen Baustein; die Datenbank hat bereits vorbereitete, aber noch ungenutzte Felder für eine spätere echte Routenberechnung (Reihenfolge, Distanz, Fahrzeit) — diese bleiben hier unangetastet | 2026-07-31 |
| Wiederverwendung bestehender Bausteine aus dem Design-System (Reiter/Tabs, Aufklapp-Liste/Akkordeon, Status-Badge) | Alle benötigten Bausteine sind bereits im Projekt vorhanden — nichts Neues zu bauen oder zu installieren, auch kein Kartenpaket nötig (kein Kartenbaustein in diesem Schritt) | 2026-07-31 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### A) Komponenten-Struktur

```
Fahrer-Seite (/fahrer)
├─ Rollen-Gate (nur Rolle "fahrer" oder "admin", sonst Weiterleitung zu /dashboard)
├─ Tab "Ich"
│  ├─ Touren-Liste (eigene offene Touren, chronologisch, nächste zuerst)
│  │  └─ Touren-Zeile (Datum, Anzahl Stopps) — antippen klappt auf
│  │     └─ Stopp-Liste (aufgeklappt: Firma, Adresse, Status-Badge je Stopp)
│  └─ Leerzustand ("Keine offenen Touren")
└─ Tab "Tourenplanung" (sichtbar für Fahrer + Admin — Transparenz, keine Zusatz-Einschränkung)
   ├─ Filter-Leiste (Fahrer auswählen, Datum auswählen)
   ├─ Touren-Liste (offene Touren aller Fahrer, chronologisch)
   │  ├─ Touren-Zeile (Datum, Fahrername oder "Kein Fahrer zugewiesen", Anzahl Stopps)
   │  │  └─ Stopp-Liste (gleiches Verhalten wie in Tab "Ich")
   │  └─ Leerzustand ("Keine Touren für diese Auswahl")
```

### B) Datenmodell (in normaler Sprache)

- Eine **Fahrt** ist ein bestehender Datensatz (bisher "Tour" in der Datenbank genannt) mit:
  verknüpftem Kunden (liefert Firmenname + Adresse), geplantem Abholdatum, zugewiesenem Fahrer
  (fehlt in seltenen Altfällen) und einem Status.
- **Status-Werte:** offen = "geplant", "unterwegs", "angekommen", "mit Problem"; abgeschlossen =
  "erledigt", "abgeschlossen", "archiviert". Dieser Baustein zeigt ausschließlich offene Fahrten.
- Eine **Tour** wird für diesen Baustein **nicht** als eigener Datensatz gespeichert — sie entsteht
  erst bei der Anzeige, indem alle offenen Fahrten desselben Fahrers am selben Datum gebündelt
  werden.
- Die Datenbank hat bereits vorbereitete (aber noch leere) Felder für eine spätere echte
  Routenberechnung (Reihenfolge, Distanz, Fahrzeit) — dieser Baustein nutzt sie nicht; die
  Sortierung der Stopps erfolgt vorerst nach Datum/Anlagezeitpunkt.
- Firmenname und Adresse eines Stopps kommen aus der bestehenden Kunden-/Adressverwaltung — kein
  neues Feld nötig.
- Der Fahrername (für den Tab "Tourenplanung") kommt aus der bestehenden Nutzerverwaltung.
- **Live-Datencheck (2026-07-31):** aktuell ca. 107 offene Fahrten in der Datenbank, überschaubar
  auf wenige Fahrer verteilt — bestätigt, dass keine Pagination nötig ist. 3 davon haben aktuell
  keinen zugewiesenen Fahrer und sind bereits überfällig (siehe Decision Log).

### C) Technische Entscheidungen (Begründung)

- **Kein neues Datenmodell:** Es wird ausschließlich mit bestehenden Tabellen (Fahrten, Kunden,
  Adressen, Nutzerverwaltung) gearbeitet. Geringstmögliches Risiko für die Live-Datenbank, keine
  Migration nötig.
- **Zugriffsschutz im Code, nicht allein in der Datenbank:** Die Datenbank erlaubt aktuell jedem
  eingeloggten Nutzer technisch das Lesen aller Fahrten (das war schon vor diesem Baustein so).
  Die Seite selbst muss deshalb ausdrücklich sicherstellen, dass im Tab "Ich" nur die eigenen
  Fahrten geladen werden. Der Tab "Tourenplanung" hat keine zusätzliche Rollen-Einschränkung —
  jeder, der die Seite öffnen darf (Fahrer + Admin), sieht ihn (bewusste Team-Transparenz).
- **"Offen" unabhängig vom Datum:** Eine Fahrt gilt als offen, solange ihr Status nicht
  "erledigt"/"abgeschlossen"/"archiviert" ist — auch wenn das geplante Datum schon vergangen ist.
  So bleiben überfällige Fahrten sichtbar, statt unbemerkt zu verschwinden.
- **Kein neues Paket nötig:** Reiter/Tabs, Aufklapp-Liste (Akkordeon) und Status-Badge sind
  bereits vorhandene Bausteine im Projekt-Design-System.

### D) Abhängigkeiten (Pakete)

- Keine neuen Pakete — alle benötigten UI-Bausteine (Tabs, Akkordeon, Badge) sind bereits im
  Projekt vorhanden.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
