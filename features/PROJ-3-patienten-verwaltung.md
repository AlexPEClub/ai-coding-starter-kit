# PROJ-3: Patienten-Verwaltung (CRUD)

## Status: Planned
**Created:** 2026-05-29
**Last Updated:** 2026-05-29

## Dependencies
- Requires: PROJ-2 (Therapeuten-Authentifizierung & Workspace) — eingeloggter Therapeut, Workspace-Kontext

## User Stories
- Als Therapeut möchte ich einen neuen Patienten (Tier) anlegen, damit ich die Rehabilitationsbetreuung beginnen kann.
- Als Therapeut möchte ich beim Anlegen eines Patienten einen bestehenden Besitzer auswählen oder direkt einen neuen erstellen, damit keine Duplikate entstehen.
- Als Therapeut möchte ich Patientendaten bearbeiten können, damit ich Änderungen (Gewicht, Diagnose, Besitzerdaten) aktuell halte.
- Als Therapeut möchte ich die Patientenliste nach Name durchsuchen und nach Status filtern, damit ich schnell den richtigen Patienten finde.
- Als Therapeut möchte ich einen Patienten archivieren, wenn die Behandlung abgeschlossen ist, damit die Liste übersichtlich bleibt.
- Als Therapeut möchte ich auf der Patientendetailseite alle relevanten Informationen auf einen Blick sehen.

## Out of Scope
- Separates Besitzer-Verzeichnis — deferred to PROJ-15 (Kundenverwaltung)
- Strukturierte medizinische Diagnose-Einträge mit Datum/Verlauf — P1, eigenes Feature
- Termine-Inhalt auf der Detailseite — deferred to PROJ-16 (Terminverwaltung)
- Trainingsplan-Inhalt auf der Detailseite — deferred to PROJ-5 (Trainingsplan-Builder)
- Kunden-Portal-Zugang für Tierbesitzer — deferred to PROJ-6
- Hartes Löschen von Patienten oder Besitzern
- Bulk-Aktionen (mehrere Patienten gleichzeitig archivieren)
- Patientenakte als PDF exportieren — deferred to PROJ-14 (Erweiterte Reports)
- Duplikat-Erkennung bei Tiernamen (Tiernamen sind nicht eindeutig)

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

### Patient anlegen
- [ ] Angenommen der Therapeut ist eingeloggt, wenn er auf "Neuer Patient" klickt und Tiername, Tierart und einen Besitzer ausfüllt und speichert, dann wird der Patient angelegt und die Detailseite geöffnet.
- [ ] Angenommen der Therapeut füllt das Formular aus, wenn er ein Pflichtfeld leer lässt, dann wird für jedes leere Pflichtfeld eine Validierungsfehlermeldung direkt am Feld angezeigt.
- [ ] Angenommen der Therapeut legt einen neuen Patienten an, wenn er "Neuen Besitzer anlegen" wählt, dann kann er Vorname, Nachname und mindestens E-Mail oder Telefon direkt im selben Formular eingeben.
- [ ] Angenommen der Therapeut legt einen neuen Patienten an, wenn er "Bestehenden Besitzer wählen" wählt, dann kann er einen Besitzer per Name suchen und aus einer Liste auswählen.
- [ ] Angenommen der Therapeut lädt ein Patientenfoto hoch, wenn die Datei kein Bild-Format (jpg/png/webp) ist oder größer als 5 MB ist, dann wird eine Fehlermeldung angezeigt.

### Patient bearbeiten
- [ ] Angenommen der Therapeut ist auf der Patientendetailseite, wenn er auf "Bearbeiten" klickt, dann öffnet sich ein Bearbeitungsformular mit allen aktuellen Werten vorausgefüllt.
- [ ] Angenommen der Therapeut bearbeitet einen Patienten, wenn er speichert, dann werden die Änderungen sofort auf der Detailseite angezeigt.
- [ ] Angenommen die Netzwerkverbindung schlägt beim Speichern fehl, dann wird eine Fehlermeldung angezeigt und die Eingaben bleiben erhalten.

### Patient archivieren & reaktivieren
- [ ] Angenommen der Therapeut ist auf der Detailseite eines aktiven Patienten, wenn er auf "Archivieren" klickt, dann erscheint ein Bestätigungsdialog.
- [ ] Angenommen der Therapeut bestätigt das Archivieren, dann wird der Patient aus der Standardliste entfernt und erscheint nur noch beim Filter "Archiviert".
- [ ] Angenommen ein Patient ist archiviert, wenn der Therapeut auf "Reaktivieren" klickt, dann wird der Patient sofort wieder als aktiv gesetzt.

### Patienten-Liste
- [ ] Angenommen der Therapeut öffnet die Patientenliste, dann werden standardmäßig alle aktiven Patienten angezeigt.
- [ ] Angenommen der Therapeut gibt einen Suchbegriff ein, dann werden nur Patienten angezeigt, deren Tiername oder Besitzername (Vor- oder Nachname) den Begriff enthält.
- [ ] Angenommen keine Patienten vorhanden sind, dann zeigt die leere Liste einen Call-to-Action "Ersten Patienten anlegen".
- [ ] Angenommen eine Suche ergibt keine Treffer, dann wird die Meldung "Kein Patient gefunden" angezeigt.
- [ ] Angenommen der Filter auf "Archiviert" gesetzt ist, dann werden nur archivierte Patienten angezeigt.

### Patientendetailseite
- [ ] Angenommen der Therapeut öffnet die Detailseite, dann sieht er: Tierdaten (alle Felder), Besitzerdaten (alle Felder), Anamnese/Notizen (Freitext), und Platzhalter-Sektionen für Termine und Trainingspläne.
- [ ] Angenommen der Therapeut bearbeitet das Anamnese/Notizen-Feld und speichert, dann wird der Text sofort aktualisiert.

### Tierbesitzer
- [ ] Angenommen ein Besitzer hat mehrere Tiere, wenn der Therapeut die Besitzerdaten auf einer Patientendetailseite aufruft, dann sieht er eine Liste aller verknüpften Tiere dieses Besitzers.
- [ ] Angenommen der Therapeut bearbeitet einen Besitzer, wenn er Vorname, Nachname und beide Kontaktfelder (E-Mail und Telefon) leer lässt, dann wird die Meldung "Mindestens E-Mail oder Telefon ist erforderlich" angezeigt.

## Edge Cases
- Zwei Patienten mit demselben Namen (z.B. zwei Hunde namens "Max") — erlaubt, kein Duplikat-Check
- Besitzer hat zwei Tiere, eines wird archiviert — der Besitzer und das zweite Tier bleiben aktiv
- Netzwerkfehler beim Speichern — Fehlermeldung, alle Eingaben bleiben im Formular erhalten
- Foto-Upload mit falschem Format oder > 5 MB — Fehlermeldung, kein Upload
- Suche ergibt keine Treffer — "Kein Patient gefunden" statt leerer Liste
- Zwei Therapeuten derselben Praxis bearbeiten gleichzeitig denselben Patienten — letztes Speichern gewinnt (kein Konflikthandling für MVP)
- Besitzer wird bei einem Patienten als "Neuer Besitzer" angelegt, obwohl er bereits existiert — kein automatischer Duplikat-Check für MVP; Therapeut muss selbst auf "Bestehenden Besitzer wählen" achten

## Technical Requirements (optional)
- Security: Patienten sind strikt Tenant-isoliert — kein Therapeut kann Patienten anderer Praxen sehen
- Performance: Patientenliste mit bis zu 200 Einträgen lädt ohne Pagination für MVP

## Open Questions
_Keine offenen Fragen._

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Patient = Tier (nicht Tierbesitzer) | Sauberere Datentrennung; Tierbesitzer als eigener Datensatz ermöglicht spätere Portal-Zugänge pro Besitzer (PROJ-6) | 2026-05-29 |
| Kein hartes Löschen | Daten bleiben für Dokumentation und spätere Auswertung erhalten; Archivieren reicht für Praxis-Workflow | 2026-05-29 |
| Besitzer einmal anlegen, mehrere Tiere verknüpfen | Vermeidet Datenduplikate; ein Besitzer mit zwei Hunden braucht nur einen Datensatz | 2026-05-29 |
| Kein Duplikat-Check bei Tiernamen | Tiernamen sind nicht eindeutig — viele Hunde heißen "Max"; Duplikate wären hier kein Problem | 2026-05-29 |
| Kein separates Besitzer-Verzeichnis im MVP | Besitzer werden im Kontext ihrer Tiere verwaltet; vollständiges Besitzer-Management kommt mit PROJ-15 | 2026-05-29 |
| Anamnese als Freitext | Strukturierte Diagnosefelder sind P1; für MVP reicht ein Freitext-Feld für klinische Notizen | 2026-05-29 |
| Patientenfoto max. 5 MB | Konsistent mit Profilbildern aus PROJ-2; sinnvoll für MVP-Storage-Budget | 2026-05-29 |

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
