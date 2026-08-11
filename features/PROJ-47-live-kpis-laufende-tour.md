# PROJ-47: Fahrer — Live-KPIs während laufender Tour

## Status: Planned
**Created:** 2026-08-11
**Last Updated:** 2026-08-11

> Neues Feature, entstanden aus einem Bündel von Verbesserungswünschen für die
> Fahrer-Seite (zusammen mit Refines an PROJ-41/42/44/45/46 am selben Tag).
> Baut auf der bestehenden Fahrer-Tourenliste (PROJ-21), dem Tour-Start
> (PROJ-46), der Routenberechnung (PROJ-42, inkl. der am 2026-08-11 ergänzten
> standortbasierten Neuberechnung) und der Erledigt-Aktion (PROJ-44) auf.

## Dependencies
- Requires: PROJ-21 (Fahrer — Tourenliste) — Basis-UI (`tour-liste.tsx`, Accordion-Gruppierung nach Fahrer+Datum)
- Requires: PROJ-46 (Tour starten) — liefert das Start-Gating (`tourGestartet`), das bestimmt, ob die KPI-Leiste überhaupt sichtbar ist
- Requires: PROJ-42 (Routenberechnung) — liefert `berechneteAnkunftszeit`/`routeOrder` pro Stopp, Basis für "nächste Ankunftszeit" und "voraussichtliches Tourende"
- Requires: PROJ-44 (Stopp-Detail-Modal) — liefert den Status-Wechsel ("erledigt"), nach dem die KPI-Leiste neu berechnet werden muss

## User Stories
- Als Fahrer möchte ich während meiner laufenden Tour auf einen Blick sehen, wie viele Stopps ich schon erledigt habe und wie viele noch offen sind, damit ich meinen Fortschritt einschätzen kann, ohne die Liste durchzuzählen.
- Als Fahrer möchte ich sehen, wann ich voraussichtlich mit meiner Tour fertig bin, damit ich meinen restlichen Tag planen kann.
- Als Fahrer möchte ich sehen, wer mein nächster Kunde ist und wann ich dort voraussichtlich ankomme, damit ich mich auf den nächsten Stopp einstellen kann, ohne erst in der Liste nachschauen zu müssen.
- Als Admin/Verwaltung möchte ich denselben Fortschritts-Überblick für die Touren meiner Fahrer sehen (rein lesend), damit ich den Tagesablauf einschätzen kann, ohne nachzufragen.

## Out of Scope
- **Eigene Dashboard-Seite/Bento-KPI-Kacheln** — die Leiste ist eine kompakte, platzsparende Zeile innerhalb des bestehenden Accordion-Elements, kein Bestandteil des künftigen Verwaltungs-Dashboards (PROJ-7).
- **Live-Sync über mehrere gleichzeitig geöffnete Browser-Fenster/Geräte** (z. B. Push an ein zweites Admin-Tab) — kein neuer Supabase-Realtime-Kanal; die Leiste aktualisiert sich nur über das bestehende `revalidatePath`-Muster im jeweils eigenen Fenster.
- **Rückfahrt zum Depot in "voraussichtliches Tourende"** — endet beim letzten offenen Stopp, konsistent mit der PROJ-42-Entscheidung, keine Rückfahrt einzurechnen.
- **Adresse/weitere Details zum nächsten Kunden** in der KPI-Leiste — nur der Name; die volle Adresse steht bereits in der Stopp-Zeile direkt darunter.
- **Anzeige, wenn die Tour noch nicht gestartet wurde** — die Leiste erscheint ausschließlich nach Tour-Start (PROJ-46-Gating), analog zum bestehenden "Gestartet um HH:MM"-Text.
- **Eigene Server-Aktion/eigener Datenabruf** — die KPI-Leiste wird ausschließlich aus bereits geladenen Tour-/Fahrt-Daten (aus PROJ-21/42/44/46) clientseitig abgeleitet, kein neuer Query.
- **Manuelles Ein-/Ausblenden der Leiste durch den Fahrer** — immer sichtbar, sobald die Tour gestartet ist, kein Toggle.

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

### Sichtbarkeit
- [ ] Angenommen eine Tour wurde noch nicht gestartet, wenn ihr Accordion-Element aufgeklappt wird, dann erscheint keine KPI-Leiste (nur der bestehende "Tour starten"-Button).
- [ ] Angenommen eine Tour wurde gestartet, wenn ihr Accordion-Element aufgeklappt wird, dann erscheint die KPI-Leiste oberhalb der Stopp-Liste.
- [ ] Angenommen ein Admin/Verwaltung betrachtet den Tab "Tourenplanung", wenn eine dort angezeigte Tour bereits gestartet wurde, dann sieht er dieselbe KPI-Leiste wie der Fahrer (rein lesend, keine Aktionsmöglichkeit).

### Fortschritt & verbleibende Stopps
- [ ] Angenommen eine gestartete Tour hat N Stopps insgesamt, von denen K bereits "erledigt" sind, wenn die KPI-Leiste angezeigt wird, dann zeigt ein Fortschrittsbalken das Verhältnis K/N sowie die Anzahl verbleibender Stopps (N−K) als Text.
- [ ] Angenommen ein weiterer Stopp wird als "erledigt" markiert, wenn die Seite danach neu lädt (bestehendes `revalidatePath`-Muster), dann zeigt der Fortschrittsbalken und die Anzahl verbleibender Stopps den neuen, korrekten Stand.

### Nächster Stopp & Ankunftszeit
- [ ] Angenommen es gibt noch mindestens einen offenen Stopp, wenn die KPI-Leiste angezeigt wird, dann zeigt sie den Namen des nächsten offenen Stopps (nach `routeOrder` sortiert, erster nicht-erledigter Stopp).
- [ ] Angenommen der nächste offene Stopp hat eine `berechneteAnkunftszeit`, wenn die KPI-Leiste angezeigt wird, dann zeigt sie diese Ankunftszeit zusätzlich zum Kundennamen an.
- [ ] Angenommen der nächste offene Stopp hat keine `berechneteAnkunftszeit` (z. B. weil keine vollständige Routenberechnung vorliegt), wenn die KPI-Leiste angezeigt wird, dann wird nur der Kundenname gezeigt, die Ankunftszeit wird weggelassen (kein Fehler, kein Platzhalter).

### Voraussichtliches Tourende
- [ ] Angenommen der letzte (nach `routeOrder` sortierte) offene Stopp der Tour hat eine `berechneteAnkunftszeit`, wenn die KPI-Leiste angezeigt wird, dann zeigt sie diese Zeit als "voraussichtliches Tourende" (bereits inklusive der in der Berechnung enthaltenen Verweilzeit, keine Rückfahrt zum Depot).
- [ ] Angenommen für die Tour liegt keine vollständige Routenberechnung vor, wenn die KPI-Leiste angezeigt wird, dann wird "voraussichtliches Tourende" stillschweigend weggelassen — Fortschrittsbalken, verbleibende Stopps und nächster Kunde werden trotzdem angezeigt.

### Aktualisierung nach Neuberechnung
- [ ] Angenommen im Hintergrund läuft eine Routen-Neuberechnung (z. B. nach Tour-Start oder nach einem Erledigt-Klick, siehe PROJ-42/44/46), wenn diese abgeschlossen ist und die Seite danach neu lädt, dann zeigt die KPI-Leiste die aktualisierten Ankunftszeiten/Tourende-Schätzung, ohne dass der Fahrer manuell etwas tun muss.

## Edge Cases
- **Letzter offener Stopp wird gerade erledigt:** Sobald der letzte offene Stopp einer Tour auf "erledigt" gesetzt wird, verschwindet die gesamte Tourengruppe aus der Liste (bestehendes PROJ-44-Verhalten) — der Zustand "KPI-Leiste mit 0 verbleibenden Stopps" tritt dadurch in der UI nie sichtbar auf, kein Sonderfall nötig.
- **Tour ohne jegliche Routenberechnung** (z. B. Geoapify nicht konfiguriert): Fortschrittsbalken, verbleibende Stopps und nächster Kunde werden trotzdem angezeigt; Ankunftszeit und Tourende bleiben durchgängig weg — kein Fehlerzustand, kein Absturz.
- **Nur ein einziger Stopp in der Tour:** Fortschrittsbalken zeigt 0/1 bzw. 1/1, "nächster Kunde" und "Tourende" beziehen sich auf denselben, einzigen Stopp — kein Sonderfall in der Berechnung nötig (Formel funktioniert bei N=1 unverändert).
- **Sehr große Verspätung/Verzögerung im Tagesverlauf:** Da "Tourende" direkt aus der jeweils aktuellen `berechneteAnkunftszeit` des letzten Stopps abgeleitet wird und diese durch die PROJ-42/44-Refine-Erweiterung nach jedem Erledigt-Klick ab dem tatsächlichen Standort/Zeitpunkt neu berechnet wird, zieht sich eine reale Verspätung automatisch nach — keine separate Abweichungs-Logik in diesem Feature nötig.
- **Admin betrachtet eine Tour eines Fahrers, der gerade zwischen zwei Stopps unterwegs ist:** identisches Verhalten wie beim Fahrer selbst — die Leiste zeigt den zuletzt aus der Datenbank geladenen Stand, kein Live-Tracking des tatsächlichen Fahrer-Standorts (das ist nicht Teil dieses Features).

## Technical Requirements (optional)
- **Keine neue Server-Aktion/kein neuer Datenbank-Zugriff:** Alle benötigten Werte (Status je Stopp, `routeOrder`, `berechneteAnkunftszeit`, Kundenname) werden bereits von den bestehenden Ladefunktionen (`getEigeneOffeneTouren`/`getAlleOffeneTouren`, PROJ-21/42/44) geladen — die KPI-Leiste leitet ihre Werte rein clientseitig aus den bereits vorhandenen Props ab.
- **Terminal-Tauglichkeit:** Die KPI-Leiste folgt den bestehenden Design-System-Vorgaben (Kontrast, Lesbarkeit auch bei hellem Werkstattlicht); keine neuen Touch-Ziele nötig, da die Leiste rein informativ ist (keine Buttons).
- **Performance:** Rein clientseitige Ableitung aus bereits geladenen Daten — keine zusätzliche Latenz beim Seitenaufbau.

## Open Questions
- [ ] Exakte visuelle Feinjustierung (Icons, Reihenfolge der Werte in der Leiste, Animation des Fortschrittsbalkens bei Änderung) — bewusst offen gelassen für `/frontend`, analog zu den bereits an anderer Stelle (PROJ-44/45/46) offen gelassenen UX-Feinjustierungen.

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| KPI-Leiste sitzt innerhalb des Accordion-Elements der Tour in `tour-liste.tsx`, keine eigene Seite/eigenes Dashboard-Widget | Es handelt sich um Live-Infos zu einer konkreten, gerade laufenden Tour, nicht um eine übergreifende Kennzahl über alle Touren — gehört fachlich zur Tourenliste, nicht zum künftigen PROJ-7-Dashboard | 2026-08-11 |
| Sichtbar nur nach Tour-Start (PROJ-46-Gating), in beiden Tabs ("Mir zugewiesen" + "Tourenplanung", Admin rein lesend) | Konsistent mit dem bereits etablierten Muster aus PROJ-46 ("Gestartet um HH:MM" ist dort ebenfalls für Admin sichtbar) | 2026-08-11 |
| Kein neuer Supabase-Realtime-Kanal — Aktualisierung ausschließlich über das bestehende `revalidatePath("/fahrer")`-Muster | Keine Anforderung für Live-Sync über mehrere gleichzeitig offene Fenster/Geräte; das bestehende Muster reicht für den Alltag (ein Fahrer, ein Gerät) | 2026-08-11 |
| "Voraussichtliches Tourende" = Ankunftszeit am letzten offenen Stopp (inkl. Verweilzeit), keine Rückfahrt zum Depot | Konsistent mit der bereits in PROJ-42 getroffenen Entscheidung, keine Rückfahrt zum Depot zu berechnen; kein zusätzlicher Eingriff in die Routing-Engine nötig | 2026-08-11 |
| Bei fehlender Routenberechnung: Fortschrittsbalken/verbleibende Stopps/nächster Kunde bleiben sichtbar, nur Ankunftszeit/Tourende werden stillschweigend weggelassen | Konsistent mit dem bereits etablierten Fallback-Muster im Stopp-Detail-Modal (PROJ-44), das genauso verfährt, wenn `berechneteAnkunftszeit` fehlt | 2026-08-11 |
| Kompakte, ein-/zweizeilige Info-Leiste statt vollwertiger Bento-KPI-Kacheln | Die Leiste sitzt platzsparend innerhalb eines bereits aufgeklappten Accordion-Elements (nicht auf einer eigenen Dashboard-Seite); auf Mobile/Tablet ist der Platz dort begrenzt | 2026-08-11 |
| "Nächster Kunde/Stop" zeigt nur den Namen, keine Adresse | Die volle Adresse steht bereits in der Stopp-Zeile direkt darunter — eine Wiederholung würde nur unnötig Platz kosten | 2026-08-11 |
| Keine neue Server-Aktion — rein clientseitige Ableitung aus bereits geladenen Tour-/Fahrt-Daten | Alle benötigten Werte (Status, Reihenfolge, Ankunftszeit, Name) werden bereits von den bestehenden PROJ-21/42/44-Ladefunktionen geladen; ein zusätzlicher Datenabruf wäre doppelte Arbeit ohne Mehrwert | 2026-08-11 |

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
