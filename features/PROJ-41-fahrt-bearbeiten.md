# PROJ-41: Fahrer — Fahrt bearbeiten (Fahrer/Datum/Notiz + Änderungsverlauf)

## Status: In Progress
**Created:** 2026-08-01
**Last Updated:** 2026-08-02

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
- [x] Genaues Zeichenlimit für die Notiz — entschieden: 500 Zeichen, siehe
  Technical Decisions.
- [x] Exaktes RLS-/Grant-Schema der neuen Verlaufstabelle — entschieden:
  gleiches Muster wie `tms.tours` selbst (kein Zugriff für die normale
  Nutzer-Rolle, nur das interne System), siehe Technical Decisions.

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
| Bearbeiten öffnet sich als Pop-up-Fenster (Dialog), keine eigene Unterseite | Gleiches Muster wie die bestehende Hersteller-Verwaltung im Projekt; kein Seitenwechsel nötig, passt zur Terminal-Tauglichkeit (wenige Klicks) | 2026-08-01 |
| Datum als einfaches Datums-Eingabefeld, kein grafischer Kalender-Auswähler | Im Projekt gibt es aktuell keinen grafischen Kalender-Baustein; ein einfaches Datumsfeld ist auf allen Geräten zuverlässig und ausreichend | 2026-08-01 |
| Fahrerauswahl nutzt die bereits bestehende Fahrerliste der Seite (dieselbe wie beim Filtern in "Tourenplanung") | Kein neuer Datenabruf nötig, ein Ort der Wahrheit für "welche Fahrer gibt es" | 2026-08-01 |
| Berechtigungsprüfung (nur Fahrer/Admin dürfen speichern) läuft serverseitig, nicht nur im Dialog selbst | Vermeidet von Anfang an die Art von Lücke, die im letzten QA-Durchgang von PROJ-21 gefunden und behoben wurde (BUG-1) | 2026-08-01 |
| Änderungsverlauf wird beim Speichern gezielt festgehalten (nicht automatisch von der Datenbank selbst) | Nur so trägt der Eintrag zuverlässig den tatsächlich handelnden Nutzer, nicht nur "irgendein Systemzugriff" — gleiches Muster wie an einer bestehenden Stelle im Projekt (Werkzeug-Status-Verlauf, PROJ-34) | 2026-08-01 |
| Notiz auf 500 Zeichen begrenzt | Reicht für eine kurze Betriebsnotiz, verhindert versehentliches Einfügen langer Texte; keine bestehende Begrenzung an anderer Stelle im Projekt, die man hätte übernehmen können | 2026-08-01 |
| Neue Verlaufstabelle bekommt kein Zugriffsrecht für normale Nutzer-Logins direkt (nur das interne System darf lesen/schreiben) | Konsistent mit der Touren-Tabelle selbst, die genauso funktioniert — die eigentliche Rechteprüfung (wer darf was sehen/ändern) passiert bereits vollständig im Anwendungscode dieser Seite, ein zusätzlicher Datenbank-Zugriffsweg für normale Logins würde hier nichts beitragen | 2026-08-01 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### A) Komponenten-Struktur

```
/fahrer Seite
├─ Tab "Mir zugewiesen" / Tab "Tourenplanung" (unverändert aus PROJ-21)
│  └─ Touren-Liste (Akkordeon, unverändert)
│     └─ Stopp-Zeile — NEU: antippbar
│        └─ Bearbeiten-Dialog — NEU (Pop-up-Fenster)
│           ├─ Fahrer-Auswahl (Pflichtfeld, aus bestehender Fahrerliste)
│           ├─ Datum-Feld (Pflichtfeld)
│           ├─ Notiz-Feld (optional, Freitext, max. 500 Zeichen)
│           ├─ Änderungsverlauf-Bereich ("wer hat wann was geändert",
│           │  neueste zuerst; Hinweis "Noch keine Änderungen" wenn leer)
│           └─ Speichern / Abbrechen
```

### B) Datenmodell (in normaler Sprache)

- Jeder Stopp (bestehende Zeile in der Touren-Tabelle) bekommt ein neues
  Feld: eine kurze Notiz (Freitext, max. 500 Zeichen, darf leer sein).
- Neue Tabelle „Änderungen an Stopps": Für jede tatsächlich geänderte
  Eigenschaft eines Stopps (Fahrer, Datum oder Notiz) entsteht ein Eintrag —
  welcher Stopp, welche Eigenschaft, alter Wert, neuer Wert, wer hat
  geändert, wann. Nur geänderte Eigenschaften werden protokolliert, nicht
  alle drei bei jeder Speicherung (siehe Product Decisions).
- Kein neues Feld/keine neue Tabelle für den Status — das bleibt weiterhin
  ein Folge-Baustein.

### C) Technische Entscheidungen (Begründung)

- **Bestehende Bausteine wiederverwenden:** Pop-up-Fenster, Auswahlliste,
  Textfeld und Fehleranzeige sind bereits vorhandene Bausteine im
  Projekt-Design-System (genutzt z. B. in der Hersteller-Verwaltung) —
  nichts Neues zu gestalten.
- **Rechteprüfung serverseitig:** Wie im gesamten `/fahrer`-Bereich wird
  geprüft, ob der handelnde Nutzer wirklich Fahrer oder Admin ist, bevor
  irgendetwas gespeichert wird — nicht nur, ob der Bearbeiten-Dialog
  angezeigt wird.
- **Kein Sperrmechanismus bei Gleichzeit-Bearbeitung:** Bewusste
  Vereinfachung (siehe Spec-Entscheidung), kein zusätzlicher technischer
  Aufwand für ein bei 5–10 Fahrern seltenes Szenario.
- **Liste aktualisiert sich automatisch nach dem Speichern** (kein
  manuelles Neuladen der Seite durch den Nutzer nötig) — die bestehende
  Fällig/Überfällig-Anzeige aus PROJ-21 reagiert dabei automatisch auf ein
  geändertes Datum, ohne dass dafür etwas Neues gebaut werden muss.

### D) Abhängigkeiten (Pakete)

- Keine neuen Pakete — Pop-up-Fenster, Auswahlliste, Datumsfeld, Textfeld
  und Fehleranzeige sind bereits vorhandene Bausteine im Projekt.

## Implementation Notes (Frontend + Backend)

Umgesetzt am 2026-08-02 (Frontend, Server Actions und Migration in einem
Durchgang, analog zu PROJ-21 — kein separater `/backend`-Schritt nötig, siehe
unten):

- **Migration:** `supabase/migrations/20260802070000_PROJ-41_fahrt_bearbeiten.sql`
  — neue Spalte `tours.notiz` (text, `CHECK (char_length(notiz) <= 500)`),
  neue Tabelle `tms.tour_aenderungen` (`tour_id`, `feld`, `alter_wert`,
  `neuer_wert`, `geaendert_von`, `geaendert_am`), RLS aktiviert ohne Policies
  für `authenticated` (gleiches Muster wie `tms.tours` selbst).
- **Wichtiger Fund direkt nach der Migration:** Genau wie schon einmal bei
  `tms.knowledge_document_categories` (PROJ-29-Hotfix) erbte die neue Tabelle
  die `ALTER DEFAULT PRIVILEGES` nicht, weil die Migration direkt als
  `postgres` ausgeführt wurde — jeder Zugriff über den Admin-Client schlug mit
  „permission denied for table tour_aenderungen" fehl. Fix per
  Folge-Migration `20260802071500_PROJ-41_grant_tour_aenderungen.sql`
  (`GRANT ... TO service_role`), live angewendet und verifiziert.
- **Server Actions (`src/lib/actions/fahrten.ts`):** neue Funktionen
  `bearbeiteFahrt()` (Rollen-Check via `pruefeFahrerZugriff()` → aktuelle
  Werte lesen → Update → pro geändertem Feld ein Verlaufs-Eintrag →
  `revalidatePath("/fahrer")`) und `getFahrtAenderungen()` (Verlauf lesen,
  Fahrer-Namen für `fahrer_id`-Änderungen auflösen). `notiz` in die
  bestehenden Lese-Funktionen ergänzt.
- **Frontend:** neue Komponente
  `src/components/fahrer/fahrt-bearbeiten-dialog.tsx` (Dialog, Fahrer-Select,
  Datum-Input, Notiz-Textarea mit Zeichenzähler, Verlaufsliste). Jede
  Stopp-Zeile in `tour-liste.tsx` ist jetzt ein Button, der den Dialog mit
  den aktuellen Werten öffnet; `fahrerOptionen` wird jetzt auch im Tab „Mir
  zugewiesen" durchgereicht (vorher nur in „Tourenplanung").
- **Echter Bug gefunden + behoben während der Live-Verifikation:** Nach
  erfolgreichem Speichern zeigte ein sofort wieder geöffneter Dialog
  kurzzeitig noch die alten Werte — `revalidatePath()` allein stößt beim
  Client keinen Nachlade-Vorgang an, wenn die Server Action nicht über eine
  `<form action>`-Bindung aufgerufen wird. Fix: `router.refresh()` im
  Erfolgsfall im Dialog ergänzt. Die Datenbank war zu jedem Zeitpunkt bereits
  korrekt (mehrfach direkt verifiziert) — betroffen war nur die
  Wiederanzeige im UI.

### Verifikation
- `npm run lint` grün, `npm run build` grün, bestehende Unit-Tests weiterhin
  9/9 grün.
- Live gegen echte Produktionsdaten verifiziert (kein Staging vorhanden):
  Fahrer ändern, Datum ändern (inkl. Verschieben in neue Tourengruppe),
  Notiz ändern, Änderungsverlauf (alt→neu, wer, wann) — jeweils mehrfach über
  direkte Datenbankabfragen bestätigt, nicht nur über die UI. Alle
  Test-Änderungen wurden danach auf den Ausgangszustand zurückgesetzt
  (Fahrer/Datum/Notiz der betroffenen echten Stopps unverändert gegenüber
  vorher).
- Neue Datei `tests/PROJ-41-fahrt-bearbeiten.spec.ts` mit 6 E2E-Tests (Dialog
  öffnet mit vorausgefüllten Werten, Abbrechen speichert nicht, Validierung
  leeres Datum, Validierung fehlender Fahrer bei zuvor unzugewiesenem Stopp,
  Notiz ändern + Verlauf + Zurücksetzen, Fahrer/Datum ändern + Umgruppierung
  + Zurücksetzen). Jeder einzelne Test wurde isoliert grün verifiziert.
- **Bekannte Einschränkung:** Der Entwicklungs-Host war während dieser
  Session akut speicherknapp (`free -h` zeitweise < 300 MB frei, ein
  OOM-Kill des lokalen Dev-Servers im Kernel-Log gefunden) — ein
  vollständiger Batch-Lauf aller 6 Tests hintereinander war deshalb nicht
  durchgängig stabil zu bekommen, obwohl jeder Test einzeln zuverlässig grün
  lief und die Kernlogik mehrfach direkt in der Datenbank bestätigt wurde.
  Dies ist eine Umgebungs-, keine Produktbefund (siehe auch PROJ-21-QA-Notiz
  zum selben Host). Empfehlung: E2E-Suite im `/qa`-Schritt erneut laufen
  lassen, idealerweise nach dem nächtlichen Aufräum-Cronjob (04:15 Uhr).

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
