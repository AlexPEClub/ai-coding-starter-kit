# PROJ-4: Übungsdatenbank & Editor

## Status: Planned
**Created:** 2026-05-29
**Last Updated:** 2026-05-29

## Dependencies
- Requires: PROJ-2 (Therapeuten-Authentifizierung & Workspace) — eingeloggter Therapeut, Workspace-Kontext für Tenant-Isolation

## User Stories
- Als Therapeut möchte ich eine neue Übung anlegen (mit Titel, Kategorie, Beschreibung, Diagramm, Schritten und Tags), damit ich meine praxisinterne Übungsbibliothek aufbauen kann.
- Als Therapeut möchte ich aus vordefinierten Diagramm-Vorlagen wählen oder ein eigenes Bild hochladen, damit Tierbesitzer die Übung visuell verstehen.
- Als Therapeut möchte ich meine Übungsbibliothek nach Titel oder Tags durchsuchen und nach Kategorie filtern, damit ich schnell die richtige Übung finde.
- Als Therapeut möchte ich eine Übung bearbeiten, damit ich Inhalte verbessern oder aktualisieren kann.
- Als Therapeut möchte ich eine Übung archivieren, wenn sie nicht mehr verwendet wird, damit die Bibliothek übersichtlich bleibt.

## Out of Scope
- Plattform-weites Teilen von Übungen zwischen Praxen — deferred to PROJ-12 (Übungs-Marktplatz)
- Video-Upload direkt in die Übung (nur URL/Link) — Video-Upload ist PROJ-8
- Hartes Löschen von Übungen — nur Archivieren erlaubt
- Duplikat-Erkennung bei Übungsnamen — Übungsnamen sind nicht eindeutig (zwei Übungen "Sitzübung" möglich)
- Übungen dem Kunden direkt zeigen (ohne Trainingsplan) — deferred to PROJ-5 und PROJ-7
- Versionierung / Änderungshistorie von Übungen — nicht im MVP
- Admin-only Bearbeitung — alle Therapeuten im Workspace können alle Übungen verwalten (Rollen kommen mit PROJ-11)
- Bulk-Aktionen (mehrere Übungen gleichzeitig archivieren)

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

### Übung anlegen
- [ ] Angenommen der Therapeut ist eingeloggt, wenn er auf "Neue Übung" klickt und Übungstitel, Kategorie und Kurze Beschreibung ausfüllt und speichert, dann wird die Übung angelegt und in der Bibliothek angezeigt.
- [ ] Angenommen der Therapeut lässt ein Pflichtfeld leer und speichert, dann wird für jedes fehlende Pflichtfeld eine Validierungsfehlermeldung direkt am Feld angezeigt.
- [ ] Angenommen der Therapeut wählt eine Diagramm-Vorlage aus, dann wird eine Vorschau des ausgewählten Diagramms im Formular angezeigt.
- [ ] Angenommen der Therapeut lädt ein eigenes Bild hoch (jpg/png/webp, max. 5 MB), dann wird es als Übungszeichnung gespeichert und im Formular als Vorschau angezeigt.
- [ ] Angenommen der Therapeut lädt ein Bild hoch, das kein Bild-Format ist oder größer als 5 MB ist, dann wird eine Fehlermeldung angezeigt und kein Bild wird gespeichert.
- [ ] Angenommen der Therapeut fügt Schritte in der Schritt-für-Schritt-Anleitung hinzu, dann kann er beliebig viele Schritte hinzufügen (min. 1, kein Maximum für MVP) und einzelne Schritte entfernen.
- [ ] Angenommen der Therapeut gibt Tags ein (Komma-separiert), dann werden diese gespeichert und in der Suche berücksichtigt.
- [ ] Angenommen der Therapeut gibt eine Video-URL ein, dann wird diese ohne Format-Validierung gespeichert (beliebige URL erlaubt).

### Übung bearbeiten
- [ ] Angenommen der Therapeut öffnet eine Übung aus der Bibliothek, dann öffnet sich ein Bearbeitungsformular mit allen aktuellen Werten vorausgefüllt.
- [ ] Angenommen der Therapeut ändert Felder und speichert, dann werden die Änderungen sofort in der Bibliothek angezeigt.
- [ ] Angenommen die Netzwerkverbindung beim Speichern fehlschlägt, dann wird eine Fehlermeldung angezeigt und alle Eingaben bleiben im Formular erhalten.

### Übungsbibliothek (Liste)
- [ ] Angenommen der Therapeut öffnet die Übungsdatenbank, dann sieht er alle aktiven Übungen seiner Praxis alphabetisch sortiert.
- [ ] Angenommen der Therapeut gibt einen Suchbegriff ein, dann werden nur Übungen angezeigt, deren Titel oder Tags den Begriff enthalten.
- [ ] Angenommen der Therapeut wählt eine Kategorie als Filter, dann werden nur Übungen dieser Kategorie angezeigt.
- [ ] Angenommen keine Übungen in der Bibliothek vorhanden sind (neu angelegte Praxis), dann zeigt die leere Liste einen Call-to-Action "Erste Übung anlegen".
- [ ] Angenommen eine Suche oder ein Filter ergibt keine Treffer, dann wird die Meldung "Keine Übung gefunden" angezeigt.

### Übung archivieren & reaktivieren
- [ ] Angenommen der Therapeut klickt auf "Archivieren" bei einer Übung, dann erscheint ein Bestätigungsdialog.
- [ ] Angenommen der Therapeut bestätigt das Archivieren, dann verschwindet die Übung aus der Standardliste und erscheint nur noch beim Filter "Archiviert".
- [ ] Angenommen eine Übung ist archiviert, wenn der Therapeut auf "Reaktivieren" klickt, dann wird die Übung sofort wieder als aktiv gesetzt und in der Standardliste angezeigt.
- [ ] Angenommen eine archivierte Übung ist in bestehenden Trainingsplänen referenziert, dann bleibt sie in diesen Plänen erhalten und funktioniert weiter.

## Edge Cases
- Übung nur mit Pflichtfeldern (kein Diagramm, keine Schritte, keine Tags, kein Video) → erlaubt, alle optionalen Felder können leer bleiben
- Zwei Übungen mit demselben Namen → erlaubt, kein Duplikat-Check
- Bild-Upload > 5 MB oder falsches Format → Fehlermeldung, kein Upload, vorheriges Bild (falls vorhanden) bleibt erhalten
- Video-URL mit falschem Format (z.B. kein http://) → wird so gespeichert wie eingegeben, keine Validierung
- Archivierte Übung in bestehendem Trainingsplan → Plan und Übungsreferenz bleiben unverändert; Übung kann nicht für neue Pläne ausgewählt werden
- Suche ohne Treffer → "Keine Übung gefunden" statt leerer Liste
- Zwei Therapeuten derselben Praxis bearbeiten gleichzeitig dieselbe Übung → letztes Speichern gewinnt (kein Konflikthandling für MVP)
- Therapeut entfernt alle Schritte aus der Schritt-für-Schritt-Anleitung → Feld bleibt leer (optional)

## Technical Requirements (optional)
- Security: Übungen sind strikt Tenant-isoliert — Therapeuten können nur Übungen ihrer eigenen Praxis sehen und bearbeiten
- Performance: Übungsliste mit bis zu 200 Einträgen lädt ohne Pagination für MVP
- Storage: Übungsbilder (Uploads) in Supabase Storage, Bucket per Tenant isoliert; max. 5 MB pro Bild

## Open Questions
_Keine offenen Fragen._

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Übungsbibliothek pro Praxis privat (Tenant-isoliert) | Jede Praxis pflegt ihre eigene Bibliothek; plattformweites Teilen kommt mit PROJ-12 (Marktplatz) | 2026-05-29 |
| Kategorie als feste Auswahlliste | Ermöglicht Filterung und spätere Analytics (PROJ-9); Freitext würde Suche und Auswertung erschweren; MVP-Kategorien: Kraftaufbau, Koordination, Mobilisation, Dehnung, Gleichgewicht | 2026-05-29 |
| Diagramm: 3 Vorlagen + eigenes Bild hochladen | Vorlagen für häufige Übungen (schnell, kein Upload nötig); Bild-Upload für individuelle Übungen ohne passende Vorlage | 2026-05-29 |
| Bild-Upload statt In-Browser-Zeichnen | In-Browser-Zeichnen funktioniert in der Praxis nicht gut; Therapeuten zeichnen auf Papier, fotografieren, laden hoch | 2026-05-29 |
| Video als URL/Link (kein Upload) | Video-Upload ist ein eigenes komplexes Feature (PROJ-8); für Anleitungsvideos reicht ein externer Link für MVP | 2026-05-29 |
| Archivieren statt löschen | Übungen können in bestehenden Trainingsplänen referenziert sein; hartes Löschen würde diese Pläne beschädigen | 2026-05-29 |
| Alle Therapeuten im Workspace können alle Übungen bearbeiten | Übungen gehören der Praxis, nicht dem einzelnen Therapeuten; Rollen-basierte Einschränkungen kommen mit PROJ-11 | 2026-05-29 |
| Suche nach Titel + Tags, Filter nach Kategorie | Ausreichend für MVP mit kleiner Bibliothek; komplexere Filterung kommt bei Bedarf später | 2026-05-29 |

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
