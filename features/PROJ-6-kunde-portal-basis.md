# PROJ-6: Kunde-Portal (Basis-UI)

## Status: Planned
**Created:** 2026-05-29
**Last Updated:** 2026-05-29

## Dependencies
- Requires: PROJ-3 (Patienten-Verwaltung) — Tierbesitzer und Tiere müssen angelegt sein
- Requires: PROJ-16 (Terminverwaltung) — Termine werden im Portal angezeigt

## User Stories
- Als Tierbesitzer möchte ich eine Einladung per E-Mail erhalten, damit ich Zugang zum Portal meiner Praxis bekomme.
- Als Tierbesitzer möchte ich beim ersten Login ein Passwort setzen, damit mein Konto gesichert ist.
- Als Tierbesitzer möchte ich meine Tiere und ihre Basisinformationen sehen, damit ich den Behandlungsüberblick habe.
- Als Tierbesitzer möchte ich meine kommenden Termine sehen, damit ich weiß, wann der nächste Termin ist.
- Als Tierbesitzer möchte ich mein Profil (Name, E-Mail, Passwort) verwalten, damit meine Daten aktuell sind.
- Als Therapeut möchte ich einem Tierbesitzer einen Portal-Zugang senden, damit er Zugang zu seinen Tier- und Termindaten bekommt.

## Out of Scope
- Online-Buchung oder Stornierung von Terminen durch Tierbesitzer — deferred to a future feature
- Tagesaufgaben und Übungsvideos im Portal — deferred to PROJ-7 (Tagesaufgaben) und PROJ-8 (Video-Upload)
- Nachrichten / Chat mit dem Therapeuten — deferred to PROJ-13 (Messaging)
- Praxis-übergreifendes Login (ein Account für mehrere Praxen) — nicht im MVP
- Tierbesitzer kann Tier-Stammdaten bearbeiten — Therapeut bleibt Datenverantwortlicher
- Tierbesitzer kann eigene Adress- und Kontaktdaten bearbeiten — deferred to PROJ-15 (Kundenverwaltung)
- Vergangene Termine im Portal — nur kommende Termine für MVP
- Benachrichtigungen / Push-Notifications — nicht im MVP

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

### Einladung versenden (Therapeuten-Seite)
- [ ] Angenommen der Therapeut ist eingeloggt und öffnet die Besitzerdetails in PROJ-3, wenn er auf "Portal-Zugang senden" klickt, dann erhält der Besitzer eine Einladungsmail mit einem Link (gültig 7 Tage).
- [ ] Angenommen der Besitzer hat noch keinen Portal-Zugang, wenn die Einladung erfolgreich versendet wird, dann wechselt der Zugangs-Status in der Besitzeransicht auf "Einladung gesendet".
- [ ] Angenommen der Besitzer hat bereits einen aktiven Portal-Zugang, wenn der Therapeut erneut "Portal-Zugang senden" klickt, dann wird ein neuer Link versendet und der alte Link wird invalidiert.
- [ ] Angenommen der Einladungslink ist abgelaufen (älter als 7 Tage), wenn der Besitzer darauf klickt, dann sieht er die Fehlermeldung "Dieser Einladungslink ist nicht mehr gültig. Bitte kontaktiere deine Praxis für einen neuen Link."
- [ ] Angenommen ein Besitzer hat keine E-Mail-Adresse hinterlegt (nur Telefon), dann ist der Button "Portal-Zugang senden" deaktiviert mit dem Hinweis "E-Mail-Adresse erforderlich".

### Erstzugang & Passwort setzen (Besitzer-Seite)
- [ ] Angenommen der Besitzer klickt auf einen gültigen Einladungslink, dann sieht er eine Willkommensseite mit dem Praxisnamen und einem Formular "Passwort wählen" (min. 8 Zeichen).
- [ ] Angenommen der Besitzer gibt ein Passwort mit weniger als 8 Zeichen ein und bestätigt, dann wird eine Validierungsfehlermeldung "Passwort muss mindestens 8 Zeichen haben" angezeigt.
- [ ] Angenommen der Besitzer setzt erfolgreich ein Passwort, dann wird er direkt ins Portal-Home weitergeleitet.
- [ ] Angenommen der Einladungslink wurde bereits verwendet (Passwort wurde gesetzt), wenn jemand den Link erneut öffnet, dann wird er zur Login-Seite weitergeleitet.

### Portal-Shell & Navigation
- [ ] Angenommen der Tierbesitzer ist eingeloggt, dann sieht er eine vereinfachte App-Shell mit Navigation: Meine Tiere, Termine, Profil.
- [ ] Angenommen der Tierbesitzer ist eingeloggt, dann hat er keinen Zugriff auf Therapeuten-Bereiche (keine Patienten-Verwaltung, keine Praxiseinstellungen, keine Übungsübersicht).
- [ ] Angenommen ein nicht-eingeloggter Nutzer ruft eine geschützte Portal-Seite auf, dann wird er zur Portal-Login-Seite weitergeleitet.

### Meine Tiere
- [ ] Angenommen der Besitzer öffnet "Meine Tiere", dann sieht er alle seine verknüpften Tiere mit Tiername, Tierart und Foto (falls vorhanden).
- [ ] Angenommen der Besitzer hat noch keine verknüpften Tiere, dann sieht er den Hinweis "Noch keine Tiere in deinem Portal — deine Praxis verknüpft dein Tier mit deinem Konto."
- [ ] Angenommen der Besitzer klickt auf ein Tier, dann sieht er eine Detailseite mit: Tiername, Tierart, Rasse, Geburtsdatum (falls vorhanden) sowie Platzhalter-Sektionen für Tagesaufgaben (PROJ-7) und Videos (PROJ-8).
- [ ] Angenommen der Besitzer ist auf der Tier-Detailseite, dann kann er keine Felder bearbeiten (read-only).

### Termine
- [ ] Angenommen der Besitzer öffnet "Termine", dann sieht er alle kommenden Termine seiner Tiere (Status "Geplant", ab heute), sortiert aufsteigend nach Datum mit: Datum, Uhrzeit, Dauer, Tiername, Terminart (falls gesetzt).
- [ ] Angenommen der Besitzer hat keine kommenden Termine, dann sieht er den Hinweis "Keine Termine geplant — deine Praxis wird dich über kommende Termine informieren."
- [ ] Angenommen ein Termin hat vergangenes Datum, dann erscheint er nicht in der Terminliste des Portals (read-only, nur kommende).

### Profil
- [ ] Angenommen der Besitzer öffnet sein Profil, dann kann er Vorname und Nachname ändern und speichern.
- [ ] Angenommen der Besitzer möchte sein Passwort ändern, dann muss er erst das aktuelle Passwort eingeben und dann ein neues setzen (min. 8 Zeichen).
- [ ] Angenommen der Besitzer möchte seine E-Mail ändern, dann erhält er eine Bestätigungsmail an die neue Adresse; die alte E-Mail bleibt bis zur Bestätigung aktiv.
- [ ] Angenommen der Besitzer speichert Profiländerungen, dann werden diese sofort angezeigt.

## Edge Cases
- Einladungslink abgelaufen (> 7 Tage) → Fehlermeldung, Therapeut muss neuen Link senden
- Einladungslink bereits verwendet (Konto bereits aktiv) → Redirect zur Portal-Login-Seite
- Besitzer hat keine Tiere zugeordnet → leere "Meine Tiere" mit erklärendem Hinweis
- Derselbe Tierbesitzer in zwei verschiedenen Praxen → zwei separate Accounts (gleiche E-Mail, zwei Workspaces); Login für jeden Workspace separat
- Therapeut invalidiert Einladungslink durch erneutes Senden — alter Link wirft Fehlermeldung
- Besitzer hat nur Telefon, keine E-Mail hinterlegt → "Portal-Zugang senden" deaktiviert
- Netzwerkfehler beim Passwort setzen → Fehlermeldung, Formular bleibt erhalten
- Patient (Tier) des Besitzers wird vom Therapeuten archiviert → Tier erscheint weiterhin im Portal (Daten bleiben sichtbar, kein automatisches Entfernen)

## Technical Requirements (optional)
- Security: Tierbesitzer sehen nur Daten ihres eigenen Tenants und ihrer eigenen verknüpften Tiere — keine Tenant-übergreifenden Daten
- Security: Einladungslinks sind single-use und zeitlich begrenzt (7 Tage)
- Security: Portal-Shell und Therapeuten-Shell sind klar getrennt — keine gemeinsamen Routen

## Open Questions
_Keine offenen Fragen._

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Zugang per Therapeuten-Einladung (kein Self-Sign-up) | Stellt sicher, dass nur bekannte Besitzer Zugang erhalten; Tenant-Zuordnung ist eindeutig | 2026-05-29 |
| Passwort-Setzen beim Erstzugang (kein temporäres Passwort) | Temporäre Passwörter per E-Mail sind Sicherheitsrisiko; Set-Password-Flow ist sicherer und nutzerfreundlicher | 2026-05-29 |
| Eigene, vereinfachte App-Shell (nicht die Therapeuten-Shell) | Saubere Trennung; Kunden sehen keine sensitiven Praxisdaten; UI ist auf Besitzer-Bedürfnisse zugeschnitten | 2026-05-29 |
| Tier- und Termindaten read-only für Besitzer | Therapeut bleibt Datenverantwortlicher; Besitzer-Änderungen würden klinische Daten gefährden | 2026-05-29 |
| Profil editierbar (Name, E-Mail, Passwort) | Besitzer muss eigene Kontodaten selbst verwalten können | 2026-05-29 |
| Separater Account pro Praxis | Einfachste Lösung für MVP; Tenant-Isolation bleibt klar; praxis-übergreifendes Login ist erheblicher Mehraufwand | 2026-05-29 |
| Einladungslink 7 Tage gültig | Ausreichend Zeit für den Besitzer; kurze Gültigkeit reduziert Sicherheitsrisiken bei unsicheren E-Mail-Postfächern | 2026-05-29 |
| Nur kommende Termine im Portal | Besitzer braucht hauptsächlich "Was ist als nächstes?"; vergangene Termine sind für MVP nicht notwendig | 2026-05-29 |

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
