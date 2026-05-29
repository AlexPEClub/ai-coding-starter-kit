# PROJ-16: Terminverwaltung

## Status: Planned
**Created:** 2026-05-29
**Last Updated:** 2026-05-29

## Dependencies
- Requires: PROJ-3 (Patienten-Verwaltung) — Termine werden Patienten zugeordnet; eingeloggter Therapeut mit Workspace-Kontext

## User Stories
- Als Therapeut möchte ich einen neuen Termin für einen Patienten anlegen, damit ich meinen Praxis-Kalender verwalten kann.
- Als Therapeut möchte ich alle kommenden Termine in einer übersichtlichen Liste sehen, damit ich meinen Arbeitstag planen kann.
- Als Therapeut möchte ich einen Termin bearbeiten (Datum, Uhrzeit, Status), damit ich Änderungen aktuell halte.
- Als Therapeut möchte ich auf der Patientendetailseite alle Termine dieses Patienten sehen, damit ich den Behandlungsverlauf nachvollziehen kann.
- Als Therapeut möchte ich einen Termin als "Abgeschlossen" oder "Abgesagt" markieren, damit meine Liste aktuell bleibt.

## Out of Scope
- Online-Buchung durch Tierbesitzer (Kunden) — deferred to PROJ-6 (Kunden-Portal) oder späteres Feature
- Vollständige Kalender-UI (Wochen-/Monatsansicht) — kommt wenn Kundenbuchung implementiert wird
- Wiederkehrende / recurring Termine — nicht im MVP
- Erinnerungen & Benachrichtigungen (E-Mail/Push) — nicht im MVP
- Hartes Löschen von Terminen — nur Statuswechsel erlaubt
- Bulk-Aktionen (mehrere Termine gleichzeitig bearbeiten)
- Terminbestätigung per E-Mail an Besitzer — deferred to PROJ-6
- Ressourcenplanung (Räume, Geräte) — nicht im MVP

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

### Termin anlegen
- [ ] Angenommen der Therapeut ist eingeloggt, wenn er in der zentralen Terminliste auf "Neuer Termin" klickt, dann öffnet sich ein Formular mit den Pflichtfeldern Patient, Datum, Uhrzeit, Dauer sowie den optionalen Feldern Terminart und Notizen.
- [ ] Angenommen der Therapeut legt einen Termin von der Patientendetailseite aus an, dann ist der Patient im Formular bereits vorausgewählt.
- [ ] Angenommen der Therapeut lässt ein Pflichtfeld leer und speichert, dann wird für jedes fehlende Pflichtfeld eine Validierungsfehlermeldung direkt am Feld angezeigt.
- [ ] Angenommen der neue Termin überschneidet sich zeitlich mit einem bereits bestehenden Termin, dann wird eine Warnmeldung "Dieser Termin überschneidet sich mit einem anderen Termin" angezeigt; der Therapeut kann trotzdem speichern.
- [ ] Angenommen der Therapeut speichert erfolgreich, dann ist der Termin mit Status "Geplant" in der Liste sichtbar.

### Termin bearbeiten
- [ ] Angenommen der Therapeut klickt auf einen Termin in der Liste, dann öffnet sich ein Bearbeitungsformular mit allen aktuellen Werten vorausgefüllt.
- [ ] Angenommen der Therapeut ändert Felder und speichert, dann werden die Änderungen sofort in der Liste angezeigt.
- [ ] Angenommen die Netzwerkverbindung beim Speichern fehlschlägt, dann wird eine Fehlermeldung angezeigt und die Eingaben bleiben im Formular erhalten.

### Status-Management
- [ ] Angenommen der Therapeut öffnet einen Termin, dann kann er den Status zwischen "Geplant", "Abgeschlossen" und "Abgesagt" wechseln.
- [ ] Angenommen der Therapeut setzt einen Termin auf "Abgesagt", dann verschwindet dieser aus der Standard-Listenansicht (kommende Termine) und ist nur noch in "Vergangene Termine" sichtbar.
- [ ] Angenommen der Therapeut setzt einen Termin auf "Abgeschlossen", dann wird er aus der kommenden Liste entfernt und in der Vergangenheitsansicht angezeigt.

### Zentrale Terminliste
- [ ] Angenommen der Therapeut öffnet die Terminliste, dann werden standardmäßig alle kommenden Termine (ab heute, Status "Geplant") aufsteigend nach Datum angezeigt.
- [ ] Angenommen es gibt keine kommenden Termine, dann zeigt die leere Liste einen Call-to-Action "Ersten Termin anlegen".
- [ ] Angenommen der Therapeut wechselt zur Ansicht "Vergangene Termine", dann werden alle Termine mit Datum in der Vergangenheit (Status Abgeschlossen oder Abgesagt) angezeigt.

### Terminsektion auf Patientendetailseite
- [ ] Angenommen der Therapeut öffnet die Patientendetailseite, dann sieht er eine Sektion "Termine" mit den kommenden Terminen dieses Patienten, sortiert aufsteigend nach Datum.
- [ ] Angenommen ein Patient hat noch keine Termine, dann zeigt die Sektion den Hinweis "Noch kein Termin geplant" mit einem CTA "Termin anlegen".
- [ ] Angenommen der Therapeut klickt in der Patientendetailseite auf "Termin anlegen", dann öffnet sich das Formular mit dem Patienten bereits vorausgewählt.

## Edge Cases
- Zwei Termine zur gleichen Zeit → Warnung, aber kein Blockieren; Therapeut kann trotzdem speichern (z.B. Hausbesuch parallel zur Praxis mit Assistent)
- Termin mit Datum in der Vergangenheit anlegen → erlaubt (Nacherfassung von nicht dokumentierten Terminen); kein Fehler
- Patient wird archiviert, hat aber noch offene Termine (Status "Geplant") → Termine bleiben erhalten; auf der Detailseite wird sichtbar, dass der Patient archiviert ist
- Netzwerkfehler beim Speichern → Fehlermeldung, alle Eingaben bleiben im Formular
- Kein Patient im System → "Neuer Termin"-Button führt zum Formular, Patientenfeld ist leer und Pflichtfeld-Validierung greift; Hinweis "Bitte zuerst einen Patienten anlegen" wäre hilfreicher UX
- Zwei Therapeuten derselben Praxis bearbeiten denselben Termin gleichzeitig → letztes Speichern gewinnt (kein Konflikthandling für MVP)

## Technical Requirements (optional)
- Security: Termine sind strikt Tenant-isoliert — kein Therapeut kann Termine anderer Praxen sehen
- Performance: Terminliste mit bis zu 500 Einträgen lädt ohne Pagination für MVP

## Open Questions
_Keine offenen Fragen._

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Listenansicht als primäre Ansicht (keine Kalender-UI für MVP) | Ausreichend für MVP mit wenigen Patienten; Kalender-UI kommt wenn Kundenbuchung (PROJ-6) implementiert wird | 2026-05-29 |
| Drei Status: Geplant / Abgeschlossen / Abgesagt | Ermöglicht Dokumentation des Behandlungsverlaufs; Abgesagt statt Löschen erhält Datenbasis | 2026-05-29 |
| Terminart als feste Auswahlliste (Dropdown) | Einfacher zu bauen als Freitext; ermöglicht spätere Filterung und Analytics; MVP-Liste: Erstuntersuchung, Folgebehandlung, Kontrolle, Hausbesuch | 2026-05-29 |
| Kein hartes Löschen | Konsistent mit PROJ-3; Termindaten bleiben für Dokumentation und spätere Auswertung erhalten | 2026-05-29 |
| Überlappungswarnung ohne Blockierung | Tierphysio-Praxen können parallele Termine haben (Hausbesuche, Assistenten); Therapeut bleibt in Kontrolle | 2026-05-29 |
| Anlegen von zentraler Liste und Patientendetailseite | Beide Einstiegspunkte sind natürliche Workflows; von Patientendetailseite spart einen Klick (Patient vorausgewählt) | 2026-05-29 |
| Standardansicht: Kommende Termine ab heute, Toggle für Vergangene | Therapeut arbeitet primär mit bevorstehenden Terminen; vergangene Termine sind für Dokumentation abrufbar | 2026-05-29 |
| Online-Buchung durch Kunden → Out of Scope | Zu komplex für MVP; kommt mit PROJ-6 (Kunden-Portal) oder als eigenständiges Feature | 2026-05-29 |

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
