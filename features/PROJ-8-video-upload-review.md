# PROJ-8: Video-Upload & Therapeuten-Review

## Status: Planned
**Created:** 2026-05-30
**Last Updated:** 2026-05-30

## Dependencies
- Requires: PROJ-6 (Kunde-Portal Basis-UI) — Portal-Shell und Authentifizierung für Tierbesitzer
- Requires: PROJ-7 (Tagesaufgaben & Kalender-Tracking) — Upload-Einstiegspunkt aus Tagesaufgaben-Detail
- Requires: PROJ-2 (Therapeuten-Authentifizierung & Workspace) — Therapeuten-Shell und Workspace-Kontext

## User Stories
- Als Tierbesitzer möchte ich ein Video meines Tieres beim Üben hochladen, damit der Therapeut die Ausführung beurteilen kann.
- Als Tierbesitzer möchte ich ein Video direkt aus einer Tagesaufgabe hochladen, damit der Therapeut den Übungskontext kennt.
- Als Tierbesitzer möchte ich alle Videos meines Tieres in einer Galerie sehen und erkennen, wenn neues Feedback vorhanden ist.
- Als Tierbesitzer möchte ich das Text-Feedback meines Therapeuten zu einem Video lesen, damit ich die Übung verbessern kann.
- Als Therapeut möchte ich eine Video-Inbox sehen, die mir alle neuen, unkommentierten Videos meiner Patienten zeigt, damit ich effizient Feedback geben kann.
- Als Therapeut möchte ich zu einem Video einen Text-Kommentar hinterlassen, damit der Besitzer konkrete Verbesserungshinweise bekommt.

## Out of Scope
- Video-Transcodierung / Adaptive Streaming / CDN — explizit aus den PRD Non-Goals; Supabase Storage direkt
- Therapeut antwortet mit einem Gegenvideo (Video-Response) — nicht MVP
- Video-Annotationen (Zeichnen oder Markieren im Video) — nicht MVP
- Tierbesitzer antwortet auf Therapeuten-Kommentar — deferred to PROJ-13 (Messaging)
- Push- oder E-Mail-Benachrichtigungen bei neuem Feedback — nicht im MVP (konsistent mit PROJ-6)
- Mehrere Videos gleichzeitig hochladen (Bulk Upload)
- Video direkt in die Übungsdatenbank hochladen — PROJ-4 erlaubt nur URL/Link; Video-Upload ist PROJ-8
- Automatische Thumbnail-Generierung (Supabase-Feature, keine Produktentscheidung hier)
- Video-Analyse oder KI-Auswertung — P2+

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

### Video hochladen (Tierbesitzer — aus Tagesaufgabe)
- [ ] Angenommen der Tierbesitzer ist in der Detailansicht einer Tagesaufgabe (PROJ-7), dann sieht er einen Button "Video hochladen".
- [ ] Angenommen der Tierbesitzer tippt auf "Video hochladen" in einer Tagesaufgabe, dann kann er ein Video aus seiner Galerie wählen oder direkt aufnehmen; das Video wird automatisch mit der Übung und dem Datum verknüpft.
- [ ] Angenommen der Tierbesitzer wählt eine Datei über 100 MB, dann wird die Fehlermeldung "Video darf maximal 100 MB groß sein" angezeigt und kein Upload gestartet.
- [ ] Angenommen der Tierbesitzer wählt eine Datei mit nicht unterstütztem Format (kein mp4, mov oder avi), dann wird die Fehlermeldung "Nur mp4, mov und avi sind erlaubt" angezeigt.
- [ ] Angenommen der Tierbesitzer wählt ein Video, das länger als 3 Minuten ist, dann wird die Fehlermeldung "Video darf maximal 3 Minuten lang sein" angezeigt.
- [ ] Angenommen das Video alle Validierungen besteht, wenn der Upload gestartet wird, dann sieht der Tierbesitzer einen Fortschrittsbalken.
- [ ] Angenommen der Upload erfolgreich abgeschlossen ist, dann erscheint eine Bestätigungsmeldung und das Video ist sofort in der Videos-Galerie des Tieres sichtbar.
- [ ] Angenommen die Netzwerkverbindung während des Uploads abbricht, dann wird eine Fehlermeldung angezeigt und das unvollständige Video wird nicht gespeichert.

### Video hochladen (Tierbesitzer — aus Tier-Detailseite)
- [ ] Angenommen der Tierbesitzer öffnet die Videos-Sektion auf der Tier-Detailseite (PROJ-6), dann sieht er alle bisherigen Videos des Tieres sowie einen Button "Video hochladen".
- [ ] Angenommen der Tierbesitzer tippt auf "Video hochladen" aus der Videos-Sektion (kein Aufgabenbezug), dann kann er ein allgemeines Video hochladen; das Video wird ohne Übungsverknüpfung gespeichert.
- [ ] Angenommen die Videos-Sektion leer ist (noch kein Video hochgeladen), dann sieht der Tierbesitzer den Hinweis "Noch kein Video hochgeladen — lade ein Video einer Übung hoch, damit dein Therapeut dir Feedback geben kann."

### Videos-Galerie (Tierbesitzer — Tier-Detailseite)
- [ ] Angenommen Videos vorhanden sind, dann sieht der Tierbesitzer eine Galerie mit: Thumbnail (oder Platzhalter), Upload-Datum, verknüpfte Übung (falls vorhanden), Feedback-Status-Badge ("Neues Feedback" / "Feedback vorhanden" / kein Badge wenn kein Feedback).
- [ ] Angenommen der Tierbesitzer öffnet ein Video mit dem Badge "Neues Feedback", dann wird der Badge als gesehen markiert und verschwindet.

### Video abspielen + Kommentare lesen (Tierbesitzer)
- [ ] Angenommen der Tierbesitzer tippt auf ein Video, dann öffnet sich eine Video-Player-Ansicht mit dem abspiel­baren Video und darunter eine Liste aller Therapeuten-Kommentare (Kommentartext, Datum, Therapeuten-Name).
- [ ] Angenommen kein Kommentar vorhanden ist, dann sieht der Tierbesitzer den Hinweis "Noch kein Feedback von deiner Praxis".

### Video löschen (Tierbesitzer)
- [ ] Angenommen ein Video hat noch keinen Therapeuten-Kommentar, dann sieht der Tierbesitzer einen "Löschen"-Button auf dem Video; nach Bestätigung wird das Video dauerhaft gelöscht.
- [ ] Angenommen ein Video hat bereits mindestens einen Therapeuten-Kommentar, dann wird kein "Löschen"-Button für den Tierbesitzer angezeigt (Video-Dokumentation bleibt erhalten).

### Video-Inbox (Therapeut — Hauptnavigation)
- [ ] Angenommen der Therapeut ist eingeloggt, dann sieht er in der Hauptnavigation einen Eintrag "Video-Inbox" mit einem Badge, der die Anzahl der Videos ohne Feedback anzeigt (verschwindet wenn alle kommentiert).
- [ ] Angenommen der Therapeut öffnet die Video-Inbox, dann sieht er standardmäßig alle Videos ohne Feedback, sortiert nach Upload-Datum (neueste zuerst), mit: Thumbnail, Patientenname, Tiername, Upload-Datum, verknüpfte Übung (falls vorhanden).
- [ ] Angenommen der Therapeut wählt den Filter "Bereits kommentiert", dann sieht er alle Videos, die mindestens einen Kommentar haben.
- [ ] Angenommen die Video-Inbox keine ausstehenden Videos enthält, dann sieht der Therapeut die Meldung "Keine neuen Videos — du bist auf dem aktuellen Stand."

### Video abspielen + Feedback geben (Therapeut)
- [ ] Angenommen der Therapeut klickt auf ein Video, dann öffnet sich eine Review-Ansicht mit: Video-Player, Kontext (Patientenname, Tiername, verknüpfte Übung + Datum), bisherige Kommentare und ein Textfeld für neuen Kommentar.
- [ ] Angenommen der Therapeut schreibt einen Kommentar und klickt "Feedback senden", dann wird der Kommentar mit Zeitstempel und Therapeuten-Name gespeichert und erscheint in der Kommentarliste.
- [ ] Angenommen der Therapeut lässt das Kommentarfeld leer und klickt "Feedback senden", dann wird die Fehlermeldung "Kommentar darf nicht leer sein" angezeigt.
- [ ] Angenommen der Therapeut hat mehrere Kommentare zu einem Video hinterlassen, dann werden alle Kommentare chronologisch aufgelistet (älteste zuerst).
- [ ] Angenommen der Therapeut klickt auf "Kommentar bearbeiten" bei seinem eigenen Kommentar, dann kann er den Text ändern und speichern.
- [ ] Angenommen der Therapeut klickt auf "Kommentar löschen" bei seinem eigenen Kommentar, dann erscheint ein Bestätigungsdialog; nach Bestätigung wird der Kommentar gelöscht.

### Video löschen (Therapeut)
- [ ] Angenommen der Therapeut klickt auf "Video löschen" (in Review-Ansicht oder Patientendetailseite), dann erscheint ein Bestätigungsdialog mit dem Hinweis, dass auch alle Kommentare gelöscht werden.
- [ ] Angenommen der Therapeut bestätigt das Löschen, dann werden Video und alle Kommentare dauerhaft entfernt.

### Patientendetailseite — Videos-Sektion (Therapeut)
- [ ] Angenommen der Therapeut öffnet die Patientendetailseite, dann sieht er eine Videos-Sektion mit allen Videos dieses Patienten, sortiert nach Upload-Datum (neueste zuerst), mit Feedback-Status-Indikator ("Ohne Feedback" / "Kommentiert").
- [ ] Angenommen keine Videos vorhanden sind, dann sieht der Therapeut den Hinweis "Noch kein Video hochgeladen".

## Edge Cases
- Video-Upload wird durch Netzwerktrennung mid-Upload unterbrochen → Fehlermeldung, kein teilweise gespeichertes Video, Speicherplatz wird freigegeben
- Tierbesitzer lädt zwei identische Videos hoch → beide werden gespeichert (kein Duplikat-Check)
- Therapeut kommentiert Video, während Tierbesitzer es gleichzeitig anschaut → kein Konflikt; neuer Kommentar erscheint beim nächsten Laden der Seite
- Tierbesitzer hat kein Portal-Zugang (kein Video möglich) → Video-Inbox des Therapeuten bleibt leer; Patientendetailseite zeigt Hinweis ohne Videos
- Therapeut löscht Video, das noch im Inbox als "ausstehend" angezeigt wird → Video verschwindet aus der Inbox; Badge-Zähler aktualisiert sich
- Kommentar wird bearbeitet → ursprünglicher Kommentar wird überschrieben (keine Versionshistorie des Kommentars)
- Besitzer tippt "Video hochladen" doppelt schnell → nur ein Upload-Dialog wird geöffnet
- Video-Upload mit falsch umbenannter Datei (z.B. "video.mp4" aber eigentlich ein PDF) → Fehlermeldung beim Upload, da Datei-MIME-Type geprüft wird
- "Neues Feedback"-Badge: wird als gelesen markiert sobald der Besitzer das Video öffnet (Player-Ansicht), nicht erst wenn er scrollt

## Technical Requirements (optional)
- Storage: Videos in Supabase Storage, Bucket per Tenant isoliert (max. 100 MB pro Video, Format mp4/mov/avi)
- Security: Tierbesitzer können nur Videos ihrer eigenen Tiere sehen; Therapeuten nur Videos ihrer eigenen Praxis
- Performance: Video-Player startet Wiedergabe ohne komplettes Vorherunterladen (Streaming / progressive download); max. 3 Sekunden bis erster Frame bei guter Internetverbindung

## Open Questions
_Keine offenen Fragen._

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Video primär aufgabengeknüpft + allgemeine Videos möglich | Aufgabenkontext macht Therapeuten-Feedback präziser; allgemeines Upload erlaubt Dokumentation außerhalb des Trainingsplans | 2026-05-30 |
| Nur Text-Kommentar (kein Video-Response, keine Annotationen) | Ausreichend für MVP; aufwändige Features wie Annotationen kommen bei Bedarf später | 2026-05-30 |
| Mehrere Kommentare pro Video (nicht nur einer) | Therapeut kann Nachtrag schreiben ohne Originale zu überschreiben; natürlicher für iterativen Feedback-Dialog | 2026-05-30 |
| 100 MB / 3 Min / mp4+mov+avi | Abdeckt typische Smartphone-Aufnahmen; im Rahmen des MVP-Storage-Budgets (<100 Videos); mov für iOS-Nutzer | 2026-05-30 |
| Video-Inbox als separater Navigations-Eintrag (Therapeut) | Effiziente tägliche Arbeit; Therapeut muss nicht patient-für-patient durchklicken; Badge zeigt unkommentierte Videos | 2026-05-30 |
| Nur in-App Badge ("Neues Feedback"), kein Push/E-Mail | Konsistent mit PROJ-6 (keine Notifications im MVP); reduziert Implementierungsaufwand erheblich | 2026-05-30 |
| Besitzer löscht nur ohne Feedback; Therapeut löscht immer | Balance: Besitzer korrigiert Fehler (falsch hochgeladen); einmal kommentiert ist Video Dokumentation und sollte nicht vom Besitzer entfernt werden können | 2026-05-30 |
| Keine Video-Transcodierung | PRD Non-Goal; für MVP mit <100 Videos und 2 Therapeuten ausreichend; alle modernen Browser können mp4 nativ | 2026-05-30 |

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
