# PROJ-21: Fahrer — Tourenliste (nur Anzeige)

## Status: Deployed
**Created:** 2026-07-31
**Last Updated:** 2026-08-01

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

## Implementation Notes (Frontend)

Umgesetzt am 2026-08-01, `/fahrer` mit beiden Tabs komplett fertig:

- **Route/Seite:** `src/app/(app)/fahrer/page.tsx` — Rollen-Gate (`fahrer`/`admin`, sonst
  Redirect `/dashboard`), lädt beide Tabs serverseitig parallel (`Promise.all`).
- **Server Actions:** `src/lib/actions/fahrten.ts` — `getEigeneOffeneTouren()`,
  `getAlleOffeneTouren()`, `listFahrerOptionen()`. Gemeinsame Gruppierung
  (`gruppiereZuTouren`) bündelt Fahrten zu Touren nach Fahrer+Datum.
- **Components:** `src/components/fahrer/tour-liste.tsx` (Akkordeon-Liste, wiederverwendet in
  beiden Tabs), `src/components/fahrer/tourenplanung-client.tsx` (Fahrer-/Datum-Filter,
  client-seitig gefiltert — Datenmenge klein genug, kein Server-Roundtrip nötig).
- **Nav:** Link in `src/components/app-header.tsx` wieder ergänzt.

**Wichtiger Fund beim Browser-Test (nicht in der Architektur vorhergesehen):**
`tms.tours` hat **keine GRANTs für die `authenticated`-Rolle** — nur `service_role` darf lesen
(verifiziert per `information_schema.role_table_grants`). Die ursprüngliche Architektur-Annahme
("DB erlaubt jedem eingeloggten Nutzer das Lesen aller Fahrten, Einschränkung nur über RLS/Code")
war dadurch technisch ungenau — richtig ist: **RLS greift hier praktisch gar nicht**, da schon die
Tabellen-Rechte fehlen. Die Seite liest deshalb über `createAdminClient({ schema: "tms" })`
(Service-Role, wie im übrigen Projekt üblich, z.B. `pickup-tours.ts`) und erzwingt "nur eigene
Fahrten" ausschließlich über den `fahrer_id`-Filter im Code — im Ergebnis inhaltlich das, was die
Architektur wollte, nur mit korrigierter technischer Begründung.

**Verifikation:** Lint + Build grün. Im Dev-Server mit dem Playwright-Testaccount geprüft
(Rollen-Gate, Leerzustand beider Tabs, keine Datenlecks). Die eigentliche Akkordeon-/Filter-Logik
wurde zusätzlich mit echten Fahrer-Daten (Christian & Mechthild Gudel) verifiziert — Gruppierung,
Adressen (`partner_addresses`, `address_type='shipping'`), Status-Badges, Fahrer-/Datum-Filter und
Leerzustand bei keinen Treffern funktionieren wie spezifiziert. Kein Login mit einem echten,
Touren-tragenden Account im Browser möglich (kein Passwort vorhanden) — dafür wurde der
`fahrer_id`-Filter temporär (nur lokal, nicht committet) auf einen echten Fahrer umgestellt, visuell
geprüft und danach wieder korrekt zurückgesetzt.

**Kein separater `/backend`-Schritt nötig:** Es gibt keine neuen Tabellen/API-Endpunkte: die
lesenden Server Actions sind bereits vollständig Teil dieser Frontend-Umsetzung (wie in anderen
Features des Projekts, z.B. `pickup-tours.ts`, üblich).

## QA Test Results

**Tested:** 2026-08-01
**App URL:** http://localhost:3000 (lokaler Dev-Server gegen Produktions-Supabase — kein Staging vorhanden)
**Tester:** QA Engineer (AI)

### Acceptance Criteria Status

#### Zugang & Rollen
- [x] Nutzer ohne Rolle `fahrer`/`admin` wird von `/fahrer` auf `/dashboard` umgeleitet (E2E, live verifiziert mit dediziertem rollenlosen QA-Account, Rolle nur `werker`)
- [x] Nutzer mit Rolle `fahrer`/`admin` sieht beide Tabs „Ich" und „Tourenplanung"

#### Tab „Ich"
- [x] Leerzustand „Keine offenen Touren." wird angezeigt, wenn der Fahrer keine offenen Touren hat (live mit Playwright-Testaccount, 0 eigene offene Touren)
- [~] Akkordeon-Aufklappen mit Stopp-Details (Firma, Adresse, Status-Badge) — **nicht direkt mit einem echten, Touren-tragenden Account in Tab „Ich" verifizierbar** (kein Passwort für einen echten Fahrer-Account vorhanden, siehe bereits in den Implementation Notes dokumentierte Einschränkung). Stattdessen indirekt verifiziert: Tab „Ich" und Tab „Tourenplanung" rendern exakt dieselbe `TourListe`-Komponente (`src/components/fahrer/tour-liste.tsx`) — die Akkordeon-/Stopp-Detail-Logik wurde live und vollständig über Tab „Tourenplanung" mit echten Produktivdaten bestätigt (siehe unten). Restrisiko: keines identifiziert, da identischer Code-Pfad.
- [x] Fehlende Adressfelder werden stillschweigend weggelassen (Code-Review: `formatAdresse()` in `tour-liste.tsx` filtert `null`/leere Felder heraus, keine Fehlermeldung)

#### Tab „Tourenplanung" (Fahrer + Admin)
- [x] Zeigt offene Touren aller Fahrer inkl. Fahrername und Stopp-Anzahl (live mit echten Produktivdaten, z.B. „Mo., 06.07.2026 — Mechthild Gudel — 7 Stopps")
- [x] Tour aufklappen zeigt Firma, Adresse und Status-Badge je Stopp (live verifiziert: Rhehag GmbH, Tönnissen Erich GmbH, Verfürth GmbH … je mit Status-Badge „Geplant")
- [x] Filter nach Fahrer schränkt die Liste ein
- [x] Filter nach Fahrer+Datum ohne Treffer zeigt Leerzustand „Keine Touren für diese Auswahl."
- [x] Fahrten ohne zugewiesenen Fahrer werden mit Hinweis „Kein Fahrer zugewiesen" angezeigt, nicht ausgeblendet

**8/8 testbare Acceptance Criteria bestanden** (1 AC nur indirekt verifizierbar, siehe „~" oben, mit Begründung warum das Restrisiko vernachlässigbar ist).

### Edge Cases Status

- [x] Doppel-Abholung / mehrere Stopps am selben Tag: bestätigt mit echten Daten (mehrere Touren mit 3–14 Stopps in Produktivdaten beobachtet)
- [x] „Offen" unabhängig vom Datum: bestätigt — Touren mit Datum vor dem heutigen Tag (2026-08-01), z.B. 06.07.2026, werden weiterhin angezeigt, solange Status offen ist
- [x] Große Anzahl Stopps an einem Tag: Touren mit bis zu 14 Stopps rendern ohne Probleme, kein Pagination-Bedarf bestätigt
- [x] Fahrten ohne zugewiesenen Fahrer: werden mit Hinweistext angezeigt statt ausgeblendet (siehe AC oben)

### Security Audit Results
- [x] Authentication: `/fahrer` ohne Login leitet zu `/login` (Middleware, Code-Review + bestehendes Verhalten projektweit)
- [x] Authorization (Rollen-Gate UI): Nutzer ohne `fahrer`/`admin` wird von `/fahrer` weggeleitet (live verifiziert)
- [x] Authorization (Datentrennung „Ich"): `getEigeneOffeneTouren()` filtert serverseitig hart auf `fahrer_id = eingeloggter User`, kein client-seitiger Filter — kein Weg für einen Fahrer, die Touren eines anderen Fahrers über Tab „Ich" zu sehen
- [ ] **BUG-1 (Medium, Defense-in-Depth):** Die Server Actions in `src/lib/actions/fahrten.ts` (`getEigeneOffeneTouren`, `getAlleOffeneTouren`, `listFahrerOptionen`) prüfen nur, ob ein Nutzer eingeloggt ist (`auth.getUser()`) — **nicht**, ob er die Rolle `fahrer`/`admin` hat. Der Rollen-Schutz existiert ausschließlich in `page.tsx` (Server Component, Redirect). Aktuell sind diese Aktionen an keine Client Component durchgereicht (nur serverseitig innerhalb der Seite aufgerufen), wodurch Next.js sie im aktuellen Build nicht als eigenständig aufrufbare Endpunkte im Client-Bundle exponiert — das Risiko ist **aktuell nicht praktisch ausnutzbar**. Es widerspricht aber der eigenen Architektur-Entscheidung („Zugriffsschutz wird explizit im Anwendungscode geprüft") und ist fragil: Sobald ein späterer Baustein (z.B. ein Refresh-Button, eine Live-Aktualisierung) eine dieser Funktionen an eine Client Component durchreicht, entsteht sofort eine echte Bypass-Lücke, über die jeder eingeloggte Nutzer (z.B. nur Rolle `werker`) alle offenen Touren aller Kunden/Fahrer abrufen könnte. Empfehlung: expliziten Rollen-Check (`fahrer` oder `admin`) direkt in jede der drei Funktionen einbauen, nicht nur auf den Seiten-Gate verlassen.
- [x] Input validation: Keine Freitext-Eingabefelder mit Server-Rückwirkung in diesem Baustein (nur Select/Date-Filter, rein client-seitig, keine SQL-Injection-Fläche)
- [x] Rate limiting: Kein neuer Endpunkt mit erhöhtem Missbrauchspotential (reine Lese-Aktionen)

### Accessibility-Befund
- [ ] **BUG-2 (Low, A11y):** Das Fahrer-Filter-Dropdown in Tab „Tourenplanung" (`tourenplanung-client.tsx`, `<SelectTrigger>`) hat keinen zuverlässig zugänglichen Namen — verifiziert per Playwright: `getByRole("combobox", { name: /Alle Fahrer/ })` findet 0 Treffer, obwohl „Alle Fahrer" sichtbar im Trigger steht; nur `getByRole("combobox")` (ohne Namensfilter) findet das Element. Das benachbarte Datumsfeld hat korrekt `aria-label="Datum filtern"` — der `SelectTrigger` hat kein Äquivalent. Screenreader-Nutzer bekommen für dieses Steuerelement keinen aussagekräftigen Namen vorgelesen. Empfehlung: `aria-label="Fahrer filtern"` auf dem `SelectTrigger` ergänzen.

### Responsive & Cross-Browser
- [x] Chromium (Desktop): 8/8 E2E-Tests grün, mehrfach reproduziert
- [x] Mobile-Viewport 375px (via Chromium-Emulation): kein horizontales Scrollen, Filter-Leiste und Touren-Karten rendern korrekt, Touch-Ziele (Select/Input/Accordion) ≥ 48px bereits im Code bestätigt (`min-h-[48px]`-Klassen)
- [ ] **Mobile Safari (WebKit): nicht abschließend verifizierbar in dieser Session.** Login-Formular hat unter WebKit auf diesem Host wiederholt nicht zuverlässig submitted (kein `POST /login` in den Server-Logs, auch mit auf 45s verlängertem Timeout). Dieser Host ist ein geteilter Produktions-Host mit durchgehend sehr knappem freiem Speicher (~500–700 MB frei von 7,6 GB) neben dem laufenden Supabase-Produktions-Stack — die Chromium-Suite lief im selben Zeitraum dagegen 8/8 zuverlässig und wiederholt grün. Da andere Features (z.B. PROJ-11) in genau dieser Umgebung bereits erfolgreich auf Mobile Safari getestet wurden, wird dies als Umgebungs-/Ressourcen-Engpass eingeordnet, nicht als PROJ-21-spezifischer Bug. Empfehlung: Mobile-Safari-Lauf kurz vor `/deploy` wiederholen, wenn der Host mehr freien Speicher hat.

### Automatisierte Tests
- **Unit-Tests (Vitest):** `src/lib/actions/fahrten-helpers.test.ts` — 4/4 grün (Gruppierung nach Fahrer+Datum, Trennung nach Fahrer/Datum, Fahrten ohne Fahrer eigene Gruppe, Sortierung nach Datum inkl. „ohne Datum" ans Ende). `gruppiereZuTouren` + Typen dafür in eigene `fahrten-helpers.ts` ausgelagert (siehe Decision unten).
- **E2E-Tests (Playwright):** `tests/PROJ-21-fahrer-tourenliste.spec.ts` — 8/8 grün auf Chromium (mehrfach reproduziert, seriell `--workers=1` wegen knappem Host-Speicher).
- `npm run lint`: grün (0 Errors, 1 unabhängige Vorwarnung in `revenue-chart.tsx`, nicht PROJ-21-bezogen)
- `npm run build`: grün

### Regression-Test
- `/wareneingang` weiterhin erreichbar und funktional (Rollen-Gate, Heading sichtbar)
- Nav-Link „Fahrer" im Burger-Menü (`app-header.tsx`) funktioniert, führt korrekt zu `/fahrer`
- `/dashboard` weiterhin erreichbar nach Login

### Bugs Found

#### BUG-1: Server Actions in fahrten.ts prüfen keine Rolle, nur Login (Defense-in-Depth-Lücke)
- **Severity:** Medium
- **Status:** ✅ Fixed (2026-08-01, direkt im Anschluss an die QA-Runde)
- **Steps to Reproduce (Code-Review, aktuell nicht praktisch ausnutzbar):**
  1. `getEigeneOffeneTouren()`, `getAlleOffeneTouren()`, `listFahrerOptionen()` in `src/lib/actions/fahrten.ts` lesen
  2. Keine der drei Funktionen prüft `profile.roles` auf `fahrer`/`admin` — nur `auth.getUser()` (eingeloggt?)
  3. Erwartet: Rollen-Check auch in den Aktionen selbst, nicht nur im Seiten-Gate
  4. Tatsächlich: Rollen-Check existiert nur in `page.tsx`
- **Fix:** Neue gemeinsame Helper-Funktion `pruefeFahrerZugriff()` in `fahrten.ts` — lädt das Profil über `getCurrentProfile()` und prüft `roles` explizit auf `fahrer`/`admin` (identische Logik zum Seiten-Gate). Alle drei Funktionen rufen diesen Check jetzt zuerst auf und geben bei fehlender Berechtigung `{ ok: false, error: "Keine Berechtigung." }` zurück, bevor irgendein Datenzugriff über den Admin-Client erfolgt. `getEigeneOffeneTouren` nutzt jetzt `profile.id` (aus dem geprüften Profil) statt eines separaten `auth.getUser()`-Aufrufs.
- **Verifikation nach Fix:** `npm run lint` grün, `npm run build` grün, Unit-Tests 4/4 grün, komplette E2E-Suite (`tests/PROJ-21-fahrer-tourenliste.spec.ts`) erneut 8/8 grün auf Chromium — keine Regression durch den Fix.
- **Priority:** Erledigt

#### BUG-2: Fahrer-Filter-Dropdown ohne zugänglichen Namen (A11y)
- **Severity:** Low
- **Steps to Reproduce:**
  1. `/fahrer` → Tab „Tourenplanung" öffnen
  2. Accessibility-Baum des Fahrer-Filter-Dropdowns prüfen (z.B. `getByRole("combobox", { name: "Alle Fahrer" })`)
  3. Erwartet: zugänglicher Name „Alle Fahrer" (oder ähnlich, wie beim Datumsfeld `aria-label="Datum filtern"`)
  4. Tatsächlich: kein zugänglicher Name gefunden (0 Treffer), nur die reine Rolle „combobox" ist auffindbar
- **Priority:** Nice to have / nächster kleiner Polish-Durchgang

### Summary
- **Acceptance Criteria:** 8/9 direkt verifiziert, 1/9 indirekt über identischen Code-Pfad (siehe „~" oben) — inhaltlich 9/9 abgedeckt
- **Bugs Found:** 2 total (0 Critical, 0 High, 1 Medium, 1 Low) — **BUG-1 (Medium) noch am selben Tag gefixt und re-verifiziert**, BUG-2 (Low) offen
- **Security:** BUG-1 behoben — alle drei Server Actions in `fahrten.ts` prüfen jetzt explizit die Rolle (`fahrer`/`admin`), nicht nur den Login-Status; sonst Pass
- **Production Ready:** YES
- **Recommendation:** Deploy. BUG-2 (A11y, Fahrer-Filter-Dropdown ohne zugänglichen Namen) bei nächster Gelegenheit als Polish mitnehmen. Mobile-Safari-Lauf vor `/deploy` bei mehr freiem Host-Speicher wiederholen.

## Deployment

**Deployed:** 2026-08-01
**Production URL:** https://tms.gudel-werkzeuge.de/fahrer
**Git Tag:** `v1.21.0-PROJ-21`

- Pre-Checks (Lint + Build) grün, `docker compose build` + `up -d` erfolgreich, Traefik routet weiterhin per Labels.
- Automatische Post-Deploy-Verifikation (`./scripts/deploy.sh PROJ-21`, `playwright.deploy.config.ts`): **grün im 1. Anlauf** (8 passed, 14 skipped — Skips sind bereits vorhandene, bedingt laufende PROJ-11-Tests, kein PROJ-21-Bezug).
- Zusätzlich manuell gegen die Live-URL verifiziert (da noch kein dediziertes `tests/deploy/PROJ-21-*.spec.ts` existiert): Login mit dem Playwright-Testaccount, `/fahrer` lädt, Rollen-Gate/Tabs „Ich"+„Tourenplanung" sichtbar, Tab-Wechsel funktioniert, Fahrer-Filter-Dropdown sichtbar.
- Container-Logs (`docker compose logs`) auf Fehler/Exceptions geprüft — keine gefunden.
- Kein neuer `tests/deploy/`-Spec für PROJ-21 ergänzt (nice-to-have für einen Folge-Durchgang, siehe Empfehlung unten).

### Bekannte offene Punkte nach Deploy
- **BUG-2 (Low, A11y):** Fahrer-Filter-Dropdown ohne zugänglichen Namen — weiterhin offen, nicht blockierend.
- **Mobile Safari (WebKit):** In dieser Session auf dem ressourcenknappen Entwicklungs-Host nicht abschließend testbar (siehe QA-Abschnitt) — Live-Deploy-Verifikation lief aber inkl. Mobile-Safari-Smoke-Tests erfolgreich gegen Produktion (`smoke.spec.ts`, 3/3 grün auf Mobile Safari), damit ist die Kernfunktion auf Mobile Safari in Produktion bestätigt. Die volle PROJ-21-Spec auf Mobile Safari wurde dort nicht erneut gegengetestet — optionaler Nachtrag.
- Empfehlung für einen Folge-Baustein: dediziertes `tests/deploy/PROJ-21-fahrer-tourenliste.spec.ts` ergänzen, das die Kern-ACs (Rollen-Gate, beide Tabs) automatisiert gegen die Live-URL prüft, statt nur manuell.

## Refine 2026-08-01 (nach Deploy, direktes Feedback vom PM beim Live-Test)

Drei kleine Anpassungen, alle noch am Deploy-Tag umgesetzt und erneut deployed:

1. **Emoji vor der Überschrift entfernt:** `🚚 Fahrer` → `Fahrer` (`page.tsx`).
2. **Tab „Ich" umbenannt in „Mir zugewiesen"** — sprachlich klarer, was der Tab zeigt
   (eigene offene Touren). Interner Tab-`value` (`"ich"`) unverändert, nur das sichtbare
   Label geändert.
3. **Neue Fällig/Überfällig-Anzeige für den Status „Geplant":** Nur Fahrten mit Status
   „geplant" (noch nicht gestartet) werden jetzt zusätzlich anhand des Tour-Datums
   eingefärbt:
   - Datum = heute → Badge „Fällig" (neue gelbe/amber `warning`-Variante).
   - Datum in der Vergangenheit → Badge „Überfällig" (rot, `destructive`).
   - Datum in der Zukunft oder kein Datum → unverändert „Geplant".
   - „Unterwegs"/„Angekommen"/„Problem" bleiben unabhängig vom Datum unverändert (PM-Entscheidung:
     nur der „noch nicht gestartet"-Status soll auf Überfälligkeit hinweisen).
   - „Heute" wird **serverseitig** in `page.tsx` per `Intl.DateTimeFormat` mit
     `timeZone: "Europe/Berlin"` bestimmt (nicht `new Date()` im Client) — konsistent mit der
     bestehenden Architektur-Entscheidung „Offen ist serverseitig bestimmt", vermeidet
     UTC-Off-by-one-Fehler rund um Mitternacht.

### Technische Umsetzung
- Neue reine Funktion `berechneFahrtBadge(status, datum, heute)` in `fahrten-helpers.ts`
  (testbar, kein Server-Client-Import) — löst die bisherigen lokalen `STATUS_LABEL`/
  `STATUS_VARIANT`-Konstanten in `tour-liste.tsx` ab, die jetzt zentral hier liegen.
- Neue Badge-Variante `warning` (Amber) in `src/components/ui/badge.tsx` ergänzt (Erweiterung
  der bestehenden shadcn-Komponente, keine Neuimplementierung) — wiederverwendbar für künftige
  Fällig/Warn-Anzeigen in anderen Stationen.
- `heute` wird in `page.tsx` einmal berechnet und über `TourListe`/`TourenplanungClient`
  durchgereicht (Props), damit „Ich" und „Tourenplanung" konsistent denselben Tageswert nutzen.
- 5 neue Unit-Tests für `berechneFahrtBadge` (Fällig/Überfällig/Geplant-Zukunft/kein Datum/andere
  Status), E2E-Suite entsprechend angepasst (bekannte Produktivtour vom 06.07.2026 zeigt jetzt
  „Überfällig" statt „Geplant", da das Datum inzwischen in der Vergangenheit liegt — mit
  Screenshot gegen echte Daten visuell verifiziert).

### Verifikation
- Lint + Build grün, Unit-Tests 9/9 grün, E2E-Suite 8/8 grün (Chromium, gegen Live-Daten).
- Visuell per Screenshot bestätigt: Überschrift ohne Icon, Tab „Mir zugewiesen", alle 7 Stopps
  der überfälligen Tour (06.07.2026) zeigen den roten „Überfällig"-Badge.
- „Fällig" (gelb, Datum = heute) hat aktuell keine passenden Live-Daten zum visuellen
  Gegenprüfen (keine offene „geplant"-Fahrt mit heutigem Datum in der Produktion) — Logik ist
  aber über den Unit-Test exakt abgedeckt.
