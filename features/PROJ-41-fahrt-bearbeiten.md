# PROJ-41: Fahrer — Fahrt bearbeiten (Fahrer/Datum/Notiz + Änderungsverlauf)

## Status: Planned
**Created:** 2026-08-01
**Last Updated:** 2026-08-01

> Folge-Baustein zu PROJ-21 (Fahrer — Tourenliste, nur Anzeige, bereits deployed).
> Dort waren Stopps innerhalb einer Tour bewusst rein informativ — Bearbeiten war
> expliziter Scope-Ausschluss. Dieser Baustein liefert das Bearbeiten nach: Klick
> auf einen Stopp öffnet einen Dialog zum Ändern von Fahrer, Datum und Notiz,
> inklusive vollständigem Änderungsverlauf.

## Dependencies
- **PROJ-21 (Fahrer — Tourenliste)** — diese Spec erweitert die dort gebaute Seite
  `/fahrer` und deren Komponenten (`tour-liste.tsx`, `fahrten.ts`) um eine
  Bearbeiten-Aktion. Rollen-Gate (`fahrer`/`admin`) und Datenmodell (`tms.tours`)
  werden unverändert übernommen.

## User Stories
- Als Fahrer/Admin möchte ich einen Stopp antippen können, um den zugewiesenen
  Fahrer zu ändern, damit ich Umplanungen direkt in der Tourenliste vornehmen
  kann, ohne ein anderes System zu nutzen.
- Als Fahrer/Admin möchte ich das Datum eines Stopps ändern können, damit ich
  Terminverschiebungen sofort abbilden kann.
- Als Fahrer/Admin möchte ich eine Notiz zu einem Stopp hinterlegen können,
  damit wichtige Informationen (z. B. „Kunde erst nach 14 Uhr erreichbar") für
  alle sichtbar sind.
- Als Fahrer/Admin möchte ich sehen, wer wann was an einem Stopp geändert hat,
  damit ich nachvollziehen kann, warum sich etwas geändert hat, ohne extra
  nachfragen zu müssen.

## Out of Scope
- **Status ändern** (Geplant/Unterwegs/Angekommen/Problem) — weiterhin eigener
  Folge-Baustein (bereits als Out of Scope in PROJ-21 vermerkt).
- **Kartenansicht, Mehrtage-/Kalender-Ausblick** — weiterhin eigene
  Folge-Bausteine (PROJ-21 Out of Scope).
- **Fahrer auf „kein Fahrer zugewiesen" zurücksetzen** — bewusst nicht möglich;
  Fahrer bleibt Pflichtfeld beim Bearbeiten.
- **Sperr-/Konfliktmechanismus bei gleichzeitigem Bearbeiten** — bewusst nicht
  gebaut, siehe Decision Log.
- **Separate Verlaufs-Übersichtsseite über alle Stopps hinweg** — der Verlauf
  ist nur je Stopp im Bearbeiten-Dialog sichtbar, kein globales
  Audit-Dashboard.
- **Bearbeiten von erledigten/abgeschlossenen/archivierten Fahrten** — diese
  werden auf der Seite ohnehin nicht angezeigt (siehe PROJ-21), daher auch
  hier nicht bearbeitbar.
- **Automatische Benachrichtigung des neuen Fahrers** bei Fahrer-Wechsel
  (Push/E-Mail) — eigenes Folge-Thema (siehe PROJ-9 Benachrichtigungen in der
  PRD-Roadmap).
- **Auftragsnummer, Titel, Beschreibung oder andere Tour-Felder** — nur
  Fahrer, Datum und Notiz sind Teil dieses Bausteins.

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

### Zugriff & Auslösen
- [ ] Angenommen ein Nutzer mit Rolle `fahrer` oder `admin` ist auf `/fahrer`, wenn
  er einen Stopp innerhalb einer aufgeklappten Tour antippt, dann öffnet sich
  ein Bearbeiten-Dialog für genau diesen Stopp.
- [ ] Angenommen der Bearbeiten-Dialog ist offen, wenn er geöffnet wird, dann
  zeigt er die aktuellen Werte (Fahrer, Datum, Notiz) des Stopps vorausgefüllt.
- [ ] Angenommen ein Stopp hat Status Geplant, Unterwegs, Angekommen oder
  Problem, wenn der Nutzer ihn antippt, dann lässt er sich in allen vier
  Fällen gleichermaßen bearbeiten (keine Statuseinschränkung).

### Felder & Validierung
- [ ] Angenommen der Bearbeiten-Dialog ist offen, wenn der Nutzer kein
  Fahrer auswählt und speichert, dann erscheint ein Validierungshinweis und es
  wird nicht gespeichert.
- [ ] Angenommen der Bearbeiten-Dialog ist offen, wenn der Nutzer das Datum
  leert und speichert, dann erscheint ein Validierungshinweis und es wird
  nicht gespeichert.
- [ ] Angenommen der Bearbeiten-Dialog ist offen, wenn der Nutzer die Notiz
  leer lässt und speichert, dann wird trotzdem gespeichert (Notiz ist
  optional).
- [ ] Angenommen der Nutzer öffnet das Fahrer-Auswahlfeld, wenn die Liste
  sich öffnet, dann zeigt sie alle Nutzer mit Rolle `fahrer` (keine „kein
  Fahrer zugewiesen"-Option).

### Speichern
- [ ] Angenommen der Nutzer hat Fahrer, Datum und/oder Notiz geändert, wenn
  er auf „Speichern" klickt, dann werden die Änderungen übernommen, eine
  Erfolgsmeldung erscheint, der Dialog schließt sich und die Liste (beide
  Tabs) zeigt den neuen Stand.
- [ ] Angenommen der Fahrer eines Stopps wurde geändert, wenn die Liste
  danach neu geladen wird, dann erscheint der Stopp in der Tourengruppe des
  neuen Fahrers (nicht mehr beim alten).
- [ ] Angenommen das Datum eines „Geplant"-Stopps wurde auf heute oder in die
  Vergangenheit geändert, wenn die Liste danach neu geladen wird, dann zeigt
  der Status-Badge entsprechend „Fällig" bzw. „Überfällig" (bestehende Logik
  aus PROJ-21 greift automatisch, keine neue Logik nötig).
- [ ] Angenommen beim Speichern tritt ein Server-/Netzwerkfehler auf, wenn
  das passiert, dann bleibt der Dialog mit den eingegebenen Werten offen,
  eine Fehlermeldung erscheint, und nichts geht verloren.

### Änderungsverlauf
- [ ] Angenommen ein Stopp wurde noch nie bearbeitet, wenn der
  Bearbeiten-Dialog geöffnet wird, dann zeigt der Verlaufsbereich einen
  Hinweis wie „Noch keine Änderungen".
- [ ] Angenommen ein Stopp wurde bereits bearbeitet, wenn der
  Bearbeiten-Dialog geöffnet wird, dann zeigt der Verlaufsbereich für jede
  geänderte Eigenschaft, wer sie wann von welchem auf welchen Wert geändert
  hat (neueste Änderung zuerst).
- [ ] Angenommen bei einer Speicherung wurden mehrere Felder geändert (z. B.
  Fahrer UND Datum), wenn der Verlauf danach angezeigt wird, dann erscheint
  für jedes geänderte Feld ein eigener Eintrag, nicht geänderte Felder
  erscheinen nicht im Verlauf.
- [ ] Angenommen ein Fahrer (nicht Admin) ruft den Verlauf eines Stopps auf,
  den ein Kollege zuletzt geändert hat, wenn der Verlauf angezeigt wird, dann
  sieht er dieselben Einträge wie ein Admin (keine Einschränkung).

## Edge Cases
- **Gleichzeitiges Bearbeiten:** Zwei Nutzer bearbeiten denselben Stopp
  gleichzeitig — kein Konflikt-Hinweis, letzter Speicherstand gewinnt
  (User-Entscheidung); der Verlauf zeigt im Nachhinein, wer zuletzt was
  geändert hat.
- **Abbrechen mit ungespeicherten Änderungen:** Dialog schließt sich direkt
  ohne Rückfrage (kein „Änderungen verwerfen?"-Warndialog) — konsistent mit
  anderen einfachen Bearbeiten-Dialogen im Projekt (z. B. Hersteller-Verwaltung).
- **Sehr lange Notiz:** Freitext mit sinnvoller Zeichenbegrenzung (genaue
  Zahl folgt in `/architecture`); Nutzer bekommt einen Hinweis statt
  stillem Abschneiden.
- **Nur ein Feld geändert:** Wenn nur die Notiz geändert wird (Fahrer/Datum
  bleiben gleich), zeigt der Verlauf ausschließlich einen Eintrag für die
  Notiz-Änderung.
- **Leere Fahrerliste:** Theoretisch möglich (kein einziger Nutzer mit Rolle
  `fahrer` im System), praktisch nicht erwartet (bestehende Fahrerliste hat
  bereits mehrere Einträge). Dialog zeigt in diesem Fall eine leere Auswahl,
  Speichern bleibt durch die Pflichtfeld-Validierung blockiert.

## Technical Requirements (optional)
- **Security:** Rollen-Check (`fahrer`/`admin`) serverseitig in der neuen
  Server Action, nicht nur clientseitig — analog zum bestehenden Muster in
  `fahrten.ts` (siehe QA-Fund BUG-1 bei PROJ-21, wo genau das gefehlt hatte).
- **Datenmodell:** neue Spalte für die Notiz auf `tms.tours`, neue Tabelle für
  den Änderungsverlauf — genaue Form (Spaltentypen, RLS/Grants) wird in
  `/architecture` festgelegt.
- **Keine Sperr-/Concurrency-Mechanismen** nötig (siehe Edge Cases).

## Open Questions
- [ ] Genaues Zeichenlimit für die Notiz — technische Festlegung, wird in
  `/architecture` entschieden.
- [ ] Exaktes RLS-/Grant-Schema der neuen Verlaufstabelle (Vorbild:
  `tms.werkzeug_status_historie`) — technische Festlegung, wird in
  `/architecture` entschieden.

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Jeder mit Zugriff auf `/fahrer` (Rolle `fahrer` oder `admin`) darf jeden Stopp bearbeiten, nicht nur die eigenen | Passt zur bestehenden Team-Transparenz-Philosophie der Seite (Tab „Tourenplanung" zeigt bereits allen alles) | 2026-08-01 |
| Alle offenen Status (Geplant/Unterwegs/Angekommen/Problem) sind gleichermaßen bearbeitbar, keine Sonderregel je Status | Einfachheit fürs MVP; erledigte/archivierte Fahrten werden ohnehin nicht angezeigt | 2026-08-01 |
| Fahrer ist Pflichtfeld, kann nicht auf „kein Fahrer zugewiesen" zurückgesetzt werden | User-Entscheidung — eine Fahrt soll über diesen Dialog immer einem Fahrer zugeordnet bleiben | 2026-08-01 |
| Neue, generische Notiz-Spalte statt Wiederverwendung von `reschedule_notiz`/`problem_notiz` | Diese bestehenden Felder sind zweckgebunden für andere Features; eine allgemeine Notiz würde sich später mit deren eigentlichem Zweck in die Quere kommen | 2026-08-01 |
| Vollständiger Änderungsverlauf (wer/wann/was, alt→neu) statt nur aktuellem Stand | User-Entscheidung — Nachvollziehbarkeit war explizit gewünscht, trotz höherem Aufwand (neue Tabelle) | 2026-08-01 |
| Änderungsverlauf direkt im Bearbeiten-Dialog, kein separater Bereich/eigene Seite | Einfachheit — kein zusätzlicher Navigationspunkt nötig, der Verlauf ist genau dort am relevantesten, wo man gerade bearbeitet | 2026-08-01 |
| Verlauf für Fahrer + Admin gleichermaßen sichtbar | Konsistent mit der bestehenden Transparenz-Philosophie der Seite | 2026-08-01 |
| Verlauf protokolliert nur tatsächlich geänderte Felder mit altem+neuem Wert, kein Komplett-Schnappschuss aller Felder je Speicherung | Vermeidet Rauschen im Verlauf — nur relevante Änderungen sind sichtbar | 2026-08-01 |
| Letzter Speicherstand gewinnt bei gleichzeitigem Bearbeiten, kein Konflikt-Warnhinweis | User-Entscheidung — bei 5–10 Fahrern und seltenen gleichzeitigen Bearbeitungen ist das Risiko vernachlässigbar, der Verlauf macht Änderungen im Nachhinein nachvollziehbar | 2026-08-01 |

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
