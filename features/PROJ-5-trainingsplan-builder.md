# PROJ-5: Trainingsplan-Builder

## Status: Planned
**Created:** 2026-05-30
**Last Updated:** 2026-05-30

## Dependencies
- Requires: PROJ-3 (Patienten-Verwaltung) — Patienten müssen angelegt sein
- Requires: PROJ-4 (Übungsdatenbank & Editor) — Übungen müssen in der Bibliothek vorhanden sein

## User Stories
- Als Therapeut möchte ich einen neuen Trainingsplan für einen Patienten erstellen, damit das Tier ein strukturiertes Rehabilitationsprogramm bekommt.
- Als Therapeut möchte ich Übungen aus meiner Bibliothek zum Plan hinzufügen und pro Übung Wochentage, Wiederholungen, Sätze, Dauer und eine Notiz angeben.
- Als Therapeut möchte ich einen Plan als Entwurf speichern, um ihn vorzubereiten, bevor er für den Besitzer sichtbar wird.
- Als Therapeut möchte ich einen aktiven Plan jederzeit anpassen können, um auf den Fortschritt oder Veränderungen im Zustand des Tieres zu reagieren.
- Als Therapeut möchte ich einen bestehenden Plan duplizieren, um ihn als Startpunkt für einen anderen Patienten oder einen Folgeplan zu nutzen.
- Als Therapeut möchte ich alle Pläne eines Patienten auf der Patientendetailseite sehen (Entwürfe, aktive Pläne, abgeschlossene Pläne).
- Als Therapeut möchte ich einen aktiven Plan vorzeitig abschließen, wenn die Therapiephase beendet ist.

## Out of Scope
- Tagesaufgaben & Kalender-Tracking (Generierung konkreter Tagesaufgaben aus dem Planprotokoll) — deferred to PROJ-7
- Trainingsplan im Kunden-Portal sichtbar machen — deferred to PROJ-7 (PROJ-7 überbrückt zu PROJ-6)
- Fortschrittserfassung (welche Tagesaufgaben erledigt, Compliance-Rate) — deferred to PROJ-7 und PROJ-9
- Video-Uploads oder Anleitungsvideos direkt im Plan — deferred to PROJ-8
- Plattformweiter Vorlagen-Marktplatz (Pläne zwischen Praxen teilen) — deferred to PROJ-12
- Therapeuten-Feedback direkt am Plan — deferred to PROJ-10
- Planversionen / Änderungshistorie
- Bulk-Aktionen (mehrere Pläne gleichzeitig abschließen oder duplizieren)
- Hartes Löschen von Plänen

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

### Plan erstellen (Entwurf)
- [ ] Angenommen der Therapeut ist auf der Patientendetailseite, wenn er auf "Neuer Trainingsplan" klickt, dann öffnet sich das Plan-Formular mit den Feldern Name (Pflicht), Startdatum (Pflicht), Laufzeit in Wochen (Pflicht, Default: 4), optionale Beschreibung und einer leeren Übungsliste.
- [ ] Angenommen der Therapeut lässt Name oder Startdatum leer und speichert, dann wird für jedes fehlende Pflichtfeld eine Validierungsfehlermeldung direkt am Feld angezeigt.
- [ ] Angenommen der Therapeut füllt alle Pflichtfelder aus und klickt "Als Entwurf speichern", dann wird der Plan mit Status "Entwurf" angelegt und erscheint in der Planübersicht der Patientendetailseite.
- [ ] Angenommen die Netzwerkverbindung beim Speichern fehlschlägt, dann wird eine Fehlermeldung angezeigt und alle Eingaben bleiben im Formular erhalten.

### Übungen hinzufügen, bearbeiten und entfernen
- [ ] Angenommen der Therapeut klickt im Plan-Formular auf "Übung hinzufügen", dann öffnet sich eine Suche aus seiner Übungsbibliothek (nur aktive Übungen werden angezeigt).
- [ ] Angenommen der Therapeut wählt eine Übung aus, dann wird sie zur Übungsliste des Plans hinzugefügt mit leeren Feldern: Wochentage, Wiederholungen (optional), Sätze (optional), Dauer (optional), Notiz (optional).
- [ ] Angenommen der Therapeut klickt auf "Entfernen" neben einer Übung, dann wird diese Übung sofort aus der Plan-Übungsliste entfernt.
- [ ] Angenommen der Therapeut möchte die Reihenfolge der Übungen im Plan ändern, dann kann er Übungen per Drag-and-Drop umsortieren; die neue Reihenfolge wird beim Speichern übernommen.

### Plan aktivieren
- [ ] Angenommen der Plan hat Status "Entwurf" und mindestens eine Übung mit mindestens einem ausgewählten Wochentag, wenn der Therapeut auf "Aktivieren" klickt, dann wechselt der Status zu "Aktiv".
- [ ] Angenommen der Plan hat keine Übungen, wenn der Therapeut auf "Aktivieren" klickt, dann wird die Fehlermeldung "Ein Plan muss mindestens eine Übung enthalten" angezeigt.
- [ ] Angenommen mindestens eine Übung im Plan hat keinen Wochentag ausgewählt, wenn der Therapeut auf "Aktivieren" klickt, dann wird die Fehlermeldung "Alle Übungen müssen mindestens einen Wochentag haben" angezeigt und die betroffene Übung wird hervorgehoben.

### Aktiven Plan bearbeiten
- [ ] Angenommen der Plan hat Status "Aktiv", dann sind alle Felder (Name, Laufzeit, Startdatum, Übungen, Wochentage, Parameter) weiterhin bearbeitbar.
- [ ] Angenommen der Therapeut speichert Änderungen an einem aktiven Plan, dann werden diese sofort übernommen.
- [ ] Angenommen der Therapeut entfernt alle Übungen aus einem aktiven Plan und versucht zu speichern, dann wird die Fehlermeldung "Ein Plan muss mindestens eine Übung enthalten" angezeigt.

### Plan abschließen
- [ ] Angenommen der Therapeut klickt auf "Plan abschließen" bei einem aktiven oder als Entwurf gespeicherten Plan, dann erscheint ein Bestätigungsdialog.
- [ ] Angenommen der Therapeut bestätigt, dann wechselt der Plan zu "Abgeschlossen" und ist danach read-only (keine Bearbeitung mehr möglich, aber sichtbar als Verlauf).
- [ ] Angenommen das Enddatum eines aktiven Plans ist überschritten, dann wird der Plan beim nächsten Öffnen der Patientendetailseite automatisch als "Abgeschlossen" angezeigt.

### Plan duplizieren
- [ ] Angenommen der Therapeut klickt auf "Duplizieren" bei einem beliebigen Plan, dann öffnet sich ein Formular mit allen Feldern des Originals vorausgefüllt (Name: "Kopie von [Originalname]", Startdatum: leer, alle Übungen mit ihren Wochentagen und Parametern übernommen), und der Therapeut wählt den Zielpatienten (Standard: derselbe Patient).
- [ ] Angenommen der Therapeut bestätigt das Duplizieren ohne ein Startdatum einzugeben, dann wird eine Validierungsfehlermeldung "Startdatum ist erforderlich" angezeigt.
- [ ] Angenommen der Therapeut gibt ein Startdatum ein und bestätigt, dann wird ein neuer Plan mit Status "Entwurf" für den ausgewählten Patienten angelegt.

### Planübersicht (Patientendetailseite)
- [ ] Angenommen der Therapeut öffnet die Patientendetailseite, dann sieht er in der Trainingsplan-Sektion alle Pläne sortiert nach Status (Aktiv zuerst, dann Entwurf, dann Abgeschlossen) und innerhalb jedes Status nach Startdatum absteigend.
- [ ] Angenommen der Therapeut klickt auf einen Plan in der Übersicht, dann sieht er die Plandetails: Planname, Startdatum, Laufzeit, berechnetes Enddatum, optionale Beschreibung sowie alle Übungen mit ihren Wochentagen und Parametern.
- [ ] Angenommen ein Patient hat noch keine Trainingspläne, dann zeigt die leere Sektion einen Call-to-Action "Ersten Trainingsplan erstellen".

## Edge Cases
- Plan ohne Übungen aktivieren → Validierungsfehler "mindestens eine Übung", Aktivierung blockiert
- Übung im Plan ohne Wochentag → Aktivierung blockiert bis alle Übungen mindestens einen Wochentag haben
- Archivierte Übung in einem aktiven Plan → bleibt im Plan erhalten und liefert weiterhin Tagesaufgaben an PROJ-7; kann aber nicht zu neuen Plänen hinzugefügt werden
- Plan dupliziert, enthält archivierte Übungen aus dem Original → werden ins Duplikat übernommen; Therapeut muss selbst prüfen ob die archivierten Übungen noch verwendet werden sollen
- Startdatum liegt in der Vergangenheit → erlaubt (Therapeut dokumentiert nachträglich)
- Enddatum automatisch berechnet als: Startdatum + (Laufzeit × 7 Tage)
- Plan endet in wenigen Tagen (kurze Laufzeit, Startdatum gestern) → zeigt Status "Aktiv" bis Enddatum erreicht, dann automatisch "Abgeschlossen"
- Patient hat mehrere gleichzeitig aktive Pläne → alle werden angezeigt; kein Maximum für MVP
- Zwei Therapeuten derselben Praxis bearbeiten gleichzeitig denselben Plan → letztes Speichern gewinnt (kein Konflikthandling für MVP)
- Plan wird als Entwurf abgeschlossen (nie aktiviert) → erlaubt; er erscheint danach in der Abgeschlossen-Gruppe als Verlauf

## Technical Requirements (optional)
- Security: Trainingspläne sind strikt Tenant-isoliert — kein Therapeut kann Pläne anderer Praxen sehen oder bearbeiten
- Performance: Planübersicht mit bis zu 50 Plänen pro Patient lädt ohne Pagination für MVP

## Open Questions
_Keine offenen Fragen._

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Pro-Übung-Wochentage (nicht Plan-weite Wochentage) | Erlaubt flexible Protokolle: z.B. Dehnungsübungen täglich, Kräftigungsübungen 3× pro Woche — typisch in der Tierphysio | 2026-05-30 |
| Entwurf-Status vor Aktivierung | Therapeut kann Pläne vorbereiten, ohne dass PROJ-7 sofort Tasks generiert; klare Trennung zwischen Vorbereitung und Durchführung | 2026-05-30 |
| Aktive Pläne vollständig bearbeitbar | Tierphysio-Protokolle ändern sich oft mid-Therapie; gesperrte Pläne würden Workflow-Probleme verursachen | 2026-05-30 |
| Kein hartes Löschen | Konsistent mit PROJ-3 und PROJ-4; Planhistorie ist wichtig für Dokumentation und zukünftige Analytics (PROJ-9) | 2026-05-30 |
| Laufzeit in Wochen (nicht Enddatum direkt) | Therapeuten denken in "4-Wochen-Programm", nicht in konkreten Datumsangaben; intuitiver und schneller auszufüllen | 2026-05-30 |
| Mehrere aktive Pläne gleichzeitig erlaubt | Komplexe Reha-Programme kombinieren oft Kraft-, Mobilitäts- und Koordinationspläne; ein Limit würde die klinische Realität einschränken | 2026-05-30 |
| Plan duplizieren auch für anderen Patienten | Standard-Protokolle für häufige Diagnosen (z.B. Kreuzbandriss beim Hund) werden oft für mehrere Patienten genutzt; plattformweites Teilen kommt mit PROJ-12 | 2026-05-30 |
| PROJ-5 definiert Planstruktur, PROJ-7 generiert Tagesaufgaben | Klare Verantwortungstrennung: PROJ-5 ist der "Builder" (Was soll gemacht werden?), PROJ-7 ist der "Executor" (Was ist heute dran?) | 2026-05-30 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| _To be added by /architecture_ | | |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
