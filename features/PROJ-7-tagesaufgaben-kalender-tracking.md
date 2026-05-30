# PROJ-7: Tagesaufgaben & Kalender-Tracking

## Status: Planned
**Created:** 2026-05-30
**Last Updated:** 2026-05-30

## Dependencies
- Requires: PROJ-5 (Trainingsplan-Builder) — aktive Pläne mit Übungen, Wochentagen und Parametern
- Requires: PROJ-6 (Kunde-Portal Basis-UI) — Portal-Shell und Authentifizierung für Tierbesitzer

## User Stories
- Als Tierbesitzer möchte ich auf einen Blick sehen, welche Übungen heute für mein Tier fällig sind, damit ich das Programm zu Hause durchführen kann.
- Als Tierbesitzer möchte ich eine Aufgabe als erledigt markieren, damit ich und der Therapeut den Fortschritt verfolgen können.
- Als Tierbesitzer möchte ich die Aufgabendetails sehen (Übungsanleitung, Bild, Parameter, Therapeuten-Notiz), damit ich die Übung korrekt durchführe.
- Als Tierbesitzer möchte ich meinen 7-Tage-Kalender sehen, um vergangene und kommende Trainingstage auf einen Blick zu überblicken.
- Als Therapeut möchte ich auf der Patientendetailseite einen Compliance-Kalender sehen, damit ich erkenne, ob der Besitzer die Übungen regelmäßig macht.

## Out of Scope
- Erinnerungs-Notifications (Push, E-Mail) — nicht im MVP; aus PROJ-6 explizit ausgeschlossen
- Video-Feedback pro Aufgabe (Besitzer lädt Video seiner Übung hoch) — deferred to PROJ-8
- Therapeuten-Kommentar zu einzelnen erledigten Aufgaben — deferred to PROJ-10
- Fortschritts-Analytics (Schmerz/Steifheit-Kurven, Compliance-Trends über Zeit) — deferred to PROJ-9
- Manuelle Tagesaufgaben, die nicht aus einem Trainingsplan stammen
- Therapeut markiert Aufgaben als erledigt (nur Besitzer kann abhaken)
- Rückwirkendes Nachtragen vergangener Tage (Besitzer kann nur am selben Tag korrigieren)
- Übergreifende Kalenderansicht aller Patienten für den Therapeuten — nicht im MVP
- Monatskalender für Tierbesitzer — nur 7-Tage-Ansicht im MVP

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

### Navigations-Erweiterung im Kunden-Portal
- [ ] Angenommen der Tierbesitzer ist eingeloggt, dann sieht er in der Portal-Navigation einen Eintrag "Tagesaufgaben" (ergänzt die Navigation aus PROJ-6: Meine Tiere | Termine | **Tagesaufgaben** | Profil).

### Heute-Liste (Tierbesitzer)
- [ ] Angenommen der Tierbesitzer öffnet "Tagesaufgaben", dann sieht er alle Übungen, die heute fällig sind — aggregiert aus allen aktiven Plänen aller seiner Tiere.
- [ ] Angenommen der Tierbesitzer hat mehrere Tiere mit aktiven Plänen, dann zeigt jede Aufgabe in der Heute-Liste den Tiernamen als Label, damit klar ist, für welches Tier die Übung ist.
- [ ] Angenommen eine Aufgabe ist noch offen, dann sieht der Tierbesitzer: Tiername, Übungsname, Planname, Wiederholungen/Sätze/Dauer und einen "Erledigt"-Button.
- [ ] Angenommen der Tierbesitzer klickt auf eine Aufgabe, dann öffnet sich eine Detailansicht mit: Übungsname, Bild/Diagramm (aus PROJ-4), Schritt-für-Schritt-Anleitung, Wiederholungen/Sätze/Dauer und der Therapeuten-Notiz aus dem Plan (falls vorhanden).
- [ ] Angenommen der Tierbesitzer klickt in der Detailansicht auf "Erledigt", dann wird die Aufgabe in der Heute-Liste als erledigt markiert (visuell abhaken).
- [ ] Angenommen alle Aufgaben des Tages sind erledigt, dann erscheint eine Erfolgsmeldung "Alle Übungen für heute erledigt!".
- [ ] Angenommen der Tierbesitzer hat heute keinen Trainingstag laut seinen aktiven Plänen, dann zeigt die Heute-Liste die Meldung "Heute kein Training geplant".
- [ ] Angenommen der Tierbesitzer hat keine aktiven Pläne, dann zeigt die Heute-Liste die Meldung "Noch kein Trainingsplan aktiv — deine Praxis wird bald einen Plan für dich erstellen."

### Aufgabe rückgängig machen
- [ ] Angenommen eine Aufgabe wurde heute als erledigt markiert, wenn der Tierbesitzer auf "Rückgängig" klickt (noch am selben Tag), dann wird die Aufgabe wieder als offen angezeigt.
- [ ] Angenommen der Tag ist vorbei (Mitternacht lokaler Zeit), dann können erledigte Aufgaben dieses Tages nicht mehr geändert werden — der Rückgängig-Button ist nicht mehr sichtbar.

### 7-Tage-Kalender (Tierbesitzer)
- [ ] Angenommen der Tierbesitzer öffnet "Tagesaufgaben", dann sieht er unterhalb der Heute-Liste eine 7-Tage-Zeile (z.B. Mo–So der aktuellen Woche) mit einem Status-Indikator pro Tag: ✅ alle erledigt, ⚠️ teils erledigt, ⚫ Trainingstag, aber nichts erledigt, ⬜ kein Training an diesem Tag.
- [ ] Angenommen der Tierbesitzer klickt auf einen vergangenen Tag im 7-Tage-Kalender, dann sieht er die Aufgaben dieses Tages mit ihrem Erledigungsstatus (read-only, kein Abhaken möglich).
- [ ] Angenommen der Tierbesitzer klickt auf einen zukünftigen Tag im 7-Tage-Kalender, dann sieht er die geplanten Aufgaben dieses Tages (read-only, noch nicht abhakbar).
- [ ] Angenommen der heutige Tag ist in der 7-Tage-Zeile, dann ist er visuell hervorgehoben.

### Tier-Detailseite (Platzhalter-Füllung aus PROJ-6)
- [ ] Angenommen der Tierbesitzer öffnet die Detailseite eines Tieres (PROJ-6), dann zeigt die "Tagesaufgaben"-Sektion die heutigen Aufgaben dieses spezifischen Tieres (nur dieses Tier, nicht alle Tiere).

### Compliance-Kalender (Therapeut, Patientendetailseite)
- [ ] Angenommen der Therapeut öffnet die Patientendetailseite, dann sieht er in der Trainingsplan-Sektion pro aktivem Plan einen Compliance-Kalender mit den letzten 4 Wochen inklusive laufender Woche.
- [ ] Angenommen der Compliance-Kalender wird angezeigt, dann ist jeder Tag farblich kodiert: grün (alle Aufgaben erledigt), gelb (teils erledigt), rot (Trainingstag, nichts erledigt), weiß/leer (kein Trainingstag laut Plan).
- [ ] Angenommen der Therapeut klickt auf einen Tag im Compliance-Kalender, dann sieht er die Aufgaben dieses Tages mit dem Erledigungsstatus (welche Aufgaben wurden abhakt, welche nicht).
- [ ] Angenommen der Therapeut schaut auf den Compliance-Kalender, dann sieht er oberhalb eine Compliance-Rate für die letzten 4 Wochen (z.B. "12 von 16 Trainingstagen vollständig erledigt").
- [ ] Angenommen der Tierbesitzer hat noch keinen Portal-Zugang (keine Einladung gesendet oder nicht angenommen), dann erscheinen alle Trainingstage im Compliance-Kalender als rot mit dem Hinweis "Kein Portal-Zugang — Trainings-Compliance kann nicht erfasst werden" und einem direkten Link "Zugang senden".

## Edge Cases
- Plan wird mitten in der Woche geändert (neue Übung hinzugefügt, Wochentag geändert) → vergangene Tage im Kalender zeigen die alten Aufgaben (als sie damals gültig waren); ab dem nächsten Tag gilt die neue Planstruktur
- Besitzer öffnet die App kurz nach Mitternacht → neue Tagesaufgaben erscheinen basierend auf dem lokalen Datum des Besitzers (nicht UTC)
- Plan läuft aus (Enddatum heute) → Aufgaben erscheinen noch heute; ab morgen keine Aufgaben mehr aus diesem Plan
- Mehrere aktive Pläne für dasselbe Tier → alle Aufgaben aller Pläne erscheinen in der Heute-Liste, mit Planname als Label pro Aufgabe
- Übung im Plan wurde in PROJ-4 archiviert, nachdem der Plan aktiviert wurde → Aufgabe erscheint weiterhin mit den Übungsdaten, die zum Zeitpunkt der Planerstellung gespeichert wurden
- Tierbesitzer hat kein Tier mit aktivem Plan → Heute-Liste zeigt "Noch kein Trainingsplan aktiv"
- Tag hat 0 erledigte Aufgaben aber 0 geplante Aufgaben → ⬜ (kein Training), nicht ⚫ (Training nicht erledigt)
- Besitzer tippt "Erledigt" doppelt (race condition) → zweimaliges Tippen hat keine negativen Auswirkungen; Status bleibt "erledigt"

## Technical Requirements (optional)
- Security: Tierbesitzer sehen nur Tagesaufgaben für ihre eigenen Tiere im eigenen Tenant
- Security: Therapeuten sehen Compliance-Daten nur für Patienten ihres eigenen Workspaces
- Performance: Heute-Liste lädt in < 1 Sekunde für Tierbesitzer (MVP: max. 20 Aufgaben pro Tag)

## Open Questions
_Keine offenen Fragen._

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Nur Tierbesitzer kann Aufgaben abhaken (nicht Therapeut) | Klare Verantwortung: Besitzer dokumentiert sein eigenes Heimtraining; Therapeut ist Beobachter, nicht Ausführer | 2026-05-30 |
| Verpasste Aufgaben bleiben als "nicht erledigt" — kein Aufholen | Aufholaufgaben könnten sich anstauen und überfordern; sauberere Compliance-Daten für den Therapeuten | 2026-05-30 |
| Rückgängig nur am selben Tag | Verhindert nachträgliches Schönrechnen der Compliance; Korrektur von Versehen am selben Tag bleibt möglich | 2026-05-30 |
| 7-Tage-Kalender (nicht Monat) für Tierbesitzer | Einfacher für MVP; Tierbesitzer braucht primär "Was ist diese Woche dran?", kein Langzeitblick | 2026-05-30 |
| Compliance-Kalender nur pro Patient (nicht übergreifend) | Für 2 Beta-Therapeuten mit wenigen Patienten ausreichend; übergreifende Ansicht kommt bei Bedarf später | 2026-05-30 |
| Tagesaufgaben als eigener Navigationspunkt im Portal | Primäre tägliche Aktion des Besitzers verdient prominenten Platz; kein Verstecken unter "Meine Tiere" | 2026-05-30 |
| Aufgaben basieren auf lokalem Datum des Besitzers (nicht UTC) | Tierbesitzer trainiert nach seiner lokalen Zeit; UTC-Basierung würde zu falschen "kein Training heute"-Meldungen führen | 2026-05-30 |
| Compliance-Kalender zeigt auch ohne Portal-Zugang (mit Hinweis) | Therapeut soll sofort erkennen, dass Compliance 0% ist weil kein Zugang existiert — klarer Handlungsaufruf | 2026-05-30 |

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
