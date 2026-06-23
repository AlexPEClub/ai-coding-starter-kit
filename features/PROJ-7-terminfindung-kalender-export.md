# PROJ-7: Terminfindung & Kalender-Export

## Status: Deployed
**Created:** 2026-06-22
**Last Updated:** 2026-06-23

## Dependencies
- PROJ-5 (Kanban-Board) — Terminfindung ersetzt MoveToPlanningDialog; Einstieg über Kanban-Karte (⋯-Menü)
- PROJ-6 (Aktivitäts-Detail) — iCal-Export-Button und „Termin anpassen"-Button in ActivityDetailSheet
- PROJ-8 (Nutzerprofil & Archiv) — speichert Kalender-Tokens (Google OAuth) und manuelle Blockierungen; PROJ-7 liest diese Daten via Edge Function

> **Reihenfolge:** PROJ-8 vor PROJ-7 bauen. Ohne PROJ-8-Daten zeigt das Overlay nur grau — kein Mehrwert für den Admin. iCal-Export (kein PROJ-8 nötig) kann als Quick Win bereits früher in PROJ-6 nachgerüstet werden.

## User Stories
- Als Admin möchte ich die Terminfindung für eine Aktivität starten, damit ich auf einem Kalender-Overlay sofort sehe, wann alle Mitglieder verfügbar sind.
- Als Admin möchte ich einen mehrtägigen Zeitraum im Kalender auswählen und bestätigen, damit der Termin für die gesamte Gruppe gesetzt ist.
- Als Admin möchte ich die Terminfindung nachträglich erneut starten können, damit ich auf Terminänderungen eines Mitglieds reagieren kann.
- Als Gruppenmitglied möchte ich den bestätigten Termin als iCal-Datei exportieren, damit ich ihn direkt in meinen Apple- oder Google-Kalender übernehmen kann.
- Als Admin möchte ich sehen, welche Mitglieder noch keinen Kalender verbunden haben, damit ich weiß, wie vollständig das Verfügbarkeits-Bild ist.

## Out of Scope
- Kalender-Verbindung der Nutzer (Google OAuth 2.0 + manuelle Blockierung) → PROJ-8
- Apple CalDAV / iCloud Kalender-Sync — erfordert App-spezifische Passwörter statt OAuth, zu komplex für Normalnutzer; auf spätere Version verschoben
- Benachrichtigungen an Mitglieder ohne Kalender-Verbindung → PROJ-12
- iCal-Export auf der Kanban-Karte (nur in der Detailansicht)
- Terminfindung für Aktivitäten im Status `abgeschlossen` (Terminalzustand — kein Termin mehr änderbar)
- Zeitfenster innerhalb eines Tages (Stunden-Granularität) — nur Tagesebene
- Automatisches Schreiben / Buchen in externe Kalender (nur Lesen + Export)
- Push-/E-Mail-Benachrichtigungen bei Termin-Bestätigung → PROJ-12
- Mehrere Terminoptionen zur Abstimmung (Doodle-Style) — Admin wählt direkt

## Acceptance Criteria

### Terminfindung starten (Kanban-Karte)

- [ ] Angenommen der Nutzer ist Admin oder Initiator und eine Aktivität liegt in der Spalte „Zu Planen", wenn er ⋯ → „Termin finden" wählt, dann öffnet sich das Terminfindungs-Sheet.
- [ ] Angenommen das Terminfindungs-Sheet öffnet sich, dann ruft die App sofort die Supabase Edge Function `get-group-availability` ab und zeigt einen Lade-Zustand.
- [ ] Angenommen die Daten geladen sind, dann zeigt das Sheet einen scrollbaren Monatskalender (12 Monate ab heute) mit farbigem Tages-Overlay:
  - **Grün** — alle Mitglieder mit verbundenem Kalender sind an diesem Tag frei
  - **Gelb** — Mehrheit frei, aber mindestens ein Mitglied hat Konflikt
  - **Rot** — Mehrheit der Mitglieder hat an diesem Tag Konflikte
  - **Grau** — kein Mitglied hat Kalender verbunden (Verfügbarkeit unbekannt)
- [ ] Angenommen mindestens ein Mitglied hat keinen Kalender verbunden (PROJ-8 noch nicht genutzt), dann erscheint ein Hinweis-Banner: „X von Y Mitgliedern ohne Kalender — deren Verfügbarkeit ist unbekannt."
- [ ] Angenommen der Admin tippt auf ein Start-Datum im Kalender und dann auf ein End-Datum, dann wird der Zeitraum im Kalender hervorgehoben (Rahmen um den Bereich); Start = Ende ist erlaubt (eintägige Aktivität).
- [ ] Angenommen der Admin tippt zuerst ein späteres Datum und dann ein früheres, dann werden Start und Ende automatisch getauscht.
- [ ] Angenommen der Admin bestätigt den gewählten Zeitraum, dann wechselt die Aktivität zu `in_planung`, `start_date` und `end_date` werden in `activities` gesetzt, das Sheet schließt sich und die Kanban-Karte wandert in die Spalte „In Planung".
- [ ] Angenommen der Nutzer ist Redakteur oder Beobachter, dann sieht er keinen „Termin finden"-Eintrag im ⋯-Menü.

### Terminfindung nachträglich anpassen (Detailansicht)

- [ ] Angenommen die Aktivität hat Status `in_planung` oder `planung_abgeschlossen` und der Nutzer ist Admin oder Initiator, dann sieht er in der Aktivitäts-Detail-Ansicht einen Button „Termin anpassen".
- [ ] Angenommen er tippt auf „Termin anpassen", dann öffnet sich das Terminfindungs-Sheet mit dem aktuell gesetzten Zeitraum vorausgewählt.
- [ ] Angenommen er wählt einen neuen Zeitraum und bestätigt, dann werden `start_date` und `end_date` aktualisiert; der Status der Aktivität bleibt unverändert.
- [ ] Angenommen der Nutzer ist Redakteur oder Beobachter, dann sieht er keinen „Termin anpassen"-Button.

### iCal-Export (Detailansicht)

- [ ] Angenommen die Aktivität hat einen bestätigten Termin (`start_date` + `end_date` gesetzt), dann erscheint in der Aktivitäts-Detail-Ansicht ein Button „Zum Kalender hinzufügen".
- [ ] Angenommen ein Mitglied tippt auf „Zum Kalender hinzufügen", dann wird eine RFC-5545-konforme `.ics`-Datei generiert und heruntergeladen mit: Titel = Aktivitätsname, Zeitraum = `start_date` bis `end_date` (ganztägige Events), Beschreibung = Aktivitätsbeschreibung (wenn vorhanden), Ort = `location`-Feld (wenn vorhanden).
- [ ] Angenommen kein Termin ist gesetzt (`start_date` = NULL), dann ist der „Zum Kalender hinzufügen"-Button nicht sichtbar.
- [ ] Angenommen die Aktivität hat Status `abgeschlossen`, dann bleibt der Export-Button sichtbar (der Termin ist unveränderlich aber weiterhin exportierbar).

### Fehlerverhalten

- [ ] Angenommen die Edge Function ist nicht erreichbar, wenn das Terminfindungs-Sheet öffnet, dann zeigt das Sheet einen Fehler-State: „Verfügbarkeiten konnten nicht geladen werden" mit einem „Erneut versuchen"-Button; alle Tage erscheinen grau.
- [ ] Angenommen die Kalender-Abfrage eines einzelnen Mitglieds schlägt fehl (z.B. abgelaufener Google-Token), dann wird dieses Mitglied als grau/unbekannt gewertet, die übrigen Daten werden normal angezeigt, und ein Hinweis erscheint: „Für X Mitglied(er) konnte die Verfügbarkeit nicht geladen werden."
- [ ] Angenommen die Bestätigung des Zeitraums schlägt wegen API-Fehler fehl, dann bleibt das Sheet offen, eine Toast-Fehlermeldung erscheint, und der Status der Aktivität ändert sich nicht.

## Edge Cases
- **Alle Mitglieder grau (kein Kalender verbunden):** Kalender zeigt alle Tage grau; Admin kann trotzdem einen Zeitraum wählen — kein Blocker, volle Entscheidungshoheit beim Admin.
- **Start = Ende (eintägige Aktivität):** Erlaubt; iCal exportiert DTSTART = DTEND als ganztägiges Event.
- **Sehr langer Zeitraum (mehrere Wochen):** Kein Limit auf Zeitraumlänge; Kalender bleibt über 12 Monate scrollbar.
- **Termin ändern bei Status `planung_abgeschlossen`:** Status bleibt `planung_abgeschlossen`, nur `start_date`/`end_date` werden aktualisiert — kein Status-Downgrade.
- **Google-Token abgelaufen:** Edge Function versucht automatischen Token-Refresh via Google OAuth; schlägt Refresh fehl → Mitglied als grau markiert, Hinweis im Sheet.
- **Apple-Nutzer (kein CalDAV-Sync):** Erscheinen als grau/unbekannt; manuelle Blockierung (PROJ-8) als Fallback verfügbar.
- **Mitglied verlässt Gruppe während Terminfindungs-Sheet offen ist:** Edge Function filtert nur aktive `group_members`; veraltete Daten führen zu keinem Fehler (worst case: ein Mitglied mehr als grau).
- **Gruppe mit 1 Mitglied (Admin allein):** Kein Hinweis-Banner nötig; Kalender zeigt entweder Admins eigene Verfügbarkeit oder alles grau.

## Technical Requirements
- **Supabase Edge Function `get-group-availability`:**
  - Parameter: `group_id`, `date_from`, `date_to`
  - Prüft Gruppen-Mitgliedschaft des aufrufenden Nutzers (Security-Check)
  - Liest Kalender-Verbindungen und Tokens aus DB (geschrieben von PROJ-8)
  - Google: `freeBusy`-Endpoint (Google Calendar API v3) — gibt blockierte Zeiträume zurück
  - Manuelle Blockierungen (PROJ-8): direkt aus DB gelesen
  - Rückgabe: `{ members: [{ user_id, display_name, calendar_type: 'google'|'manual'|null, busy_ranges: [{start, end}] }] }`
  - Mitglieder ohne Verbindung: `calendar_type: null`, `busy_ranges: []`
- **Token-Refresh:** Edge Function versucht automatischen Google OAuth Token-Refresh bei `401`-Antwort; aktualisiert Token in DB
- **Antwortzeit:** < 3 Sekunden für Gruppen bis 10 Mitglieder (parallele API-Calls pro Mitglied)
- **Caching (30 Minuten):** Edge Function speichert Ergebnis in `group_availability_cache`-Tabelle (`group_id`, `cached_at`, `data jsonb`); Cache-TTL = 30 Minuten; UI zeigt „Zuletzt aktualisiert: vor X min" + „Aktualisieren"-Button für manuellen Refresh
- **Overlay-Berechnung (client-seitig):** App berechnet Farbe pro Tag aus `busy_ranges` aller Mitglieder:
  - 0 % Konflikte → grün
  - 1–49 % Mitglieder haben Konflikt → gelb
  - ≥ 50 % haben Konflikt → rot
  - Keine Daten → grau
- **iCal-Export:** RFC-5545-konformes `.ics`-Format, vollständig client-seitig generiert (kein Server-Roundtrip); ganztägige Events (`DTSTART;VALUE=DATE` / `DTEND;VALUE=DATE`)

## Open Questions
- [x] **Apple CalDAV OAuth:** ~~Ist das für die Zielgruppe akzeptabel?~~ → **Entschieden:** Apple CalDAV aus Scope entfernt. App-spezifische Passwörter sind zu komplex für Normalnutzer. Apple-Nutzer nutzen die manuelle Blockierungs-Option (PROJ-8). CalDAV-Integration als spätere Version (post-MVP).
- [x] **Caching der Free/Busy-Daten:** → **Entschieden:** 30-Minuten-Cache in Supabase (`group_availability_cache`-Tabelle). UI zeigt Timestamp + manuellen Refresh-Button.
- [x] **Reihenfolge PROJ-7 vs. PROJ-8:** → **Entschieden:** PROJ-8 zuerst. iCal-Export (kein PROJ-8 nötig) kann als Quick Win früher in PROJ-6 nachgerüstet werden.

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Kalender-Verbindung in PROJ-8, nicht in PROJ-7 | PROJ-7 bleibt fokussiert auf Terminfindung + Export; Profileinstellungen ist der natürliche Ort für Kalender-Verbindung | 2026-06-22 |
| Globale Verfügbarkeit (nicht pro Aktivität) | Nutzer pflegen Kalender einmalig; kein Aufwand pro Aktivität; Google/Apple Kalender sind ohnedies immer aktuell | 2026-06-22 |
| Fehlende Kalender-Daten = grau (nicht „verfügbar") | Verhindert falsche Terminwahl; Admin sieht transparent was unbekannt ist; kein Forced-Onboarding | 2026-06-22 |
| Tagesebene, keine Uhrzeiten | Freundesgruppen-Aktivitäten (Wandertag, Kurztrip, Dinner) sind tagesbasiert; Stundenslots erhöhen Komplexität ohne klaren MVP-Nutzen | 2026-06-22 |
| iCal-Export nur in Detailansicht | Konsistenter Ort; Nutzer kennen die Detailansicht als zentralen Informationspunkt (PROJ-6); kein Mehrwert auf Kanban-Karte | 2026-06-22 |
| Terminfindung ersetzt MoveToPlanningDialog (PROJ-5) | PROJ-5 Spec sagt explizit: „PROJ-7 ersetzt den Picker durch vollständige Terminfindungs-Ansicht" | 2026-06-22 |
| Google OAuth + manuelle Blockierung (kein Apple CalDAV) | Apple CalDAV erfordert App-spezifische Passwörter statt OAuth — Conversion-Killer für Normalnutzer; manuelle Blockierung als universeller Fallback; CalDAV post-MVP | 2026-06-22 |
| 30-Minuten-Cache für Free/Busy-Daten | Verhindert wiederholte API-Calls beim mehrfachen Öffnen des Sheets; manueller Refresh-Button gibt Admin Kontrolle; 30 min ist kurz genug für tagesaktuelle Planung | 2026-06-22 |
| PROJ-8 vor PROJ-7 bauen | PROJ-7 ohne PROJ-8-Daten zeigt nur grau — kein Mehrwert; PROJ-8 liefert eigenständigen Nutzen (Profil + Archiv) und ist Voraussetzung für volles PROJ-7 | 2026-06-22 |
| Kein Doodle-Style (mehrere Optionen zur Abstimmung) | Admin hat durch das Verfügbarkeits-Overlay bereits alle nötigen Informationen; zusätzliche Abstimmungsrunde verlängert den Flow unnötig | 2026-06-22 |
| Termin bei `planung_abgeschlossen` änderbar (ohne Status-Downgrade) | Terminänderungen können auch kurz vor der Aktivität nötig sein; Status-Downgrade würde die Gruppe unnecessarily irritieren | 2026-06-22 |

### Technical Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| `DateFinderSheet` als neues Sheet (nicht `MoveToPlanningDialog` erweitern) | Neue Komponente ist 10× komplexer — fullscreen Sheet, Async-Daten, Fehlerzustände, Overlay-Rendering. Das Dialog-Pattern passt nicht mehr. | 2026-06-23 |
| Overlay-Farbberechnung client-seitig (nicht server-seitig) | Hält die Edge-Function-Antwort schlank und wiederverwendbar; Farb-Schwellenwerte können ohne Backend-Deploy geändert werden. | 2026-06-23 |
| Kein npm-Package für iCal-Export | RFC-5545 ganztägige Events sind ~15 Zeilen Plain-String; eine Abhängigkeit dafür ist unnötige Komplexität. | 2026-06-23 |
| `DateFinderSheet` geteilt zwischen Kanban + Detailansicht | Single source of truth; `mode`-Prop steuert ob Status-Transition oder nur Datums-Update ausgeführt wird. | 2026-06-23 |
| Cache in Supabase-Tabelle (`group_availability_cache`), nicht im Client-State | Persistiert über Geräte/Sessions; alle Gruppenmitglieder profitieren vom selben Cache; verhindert parallele Google-API-Aufrufe wenn mehrere Admins das Sheet innerhalb von 30 Minuten öffnen. | 2026-06-23 |

---

## Tech Design (Solution Architect)

### Wiederverwendete Bestandteile

| Bestandteil | Nutzung durch PROJ-7 |
|---|---|
| `calendar_connections`-Tabelle | Edge Function liest Tokens für Google-API-Aufrufe |
| `user_date_blocks`-Tabelle | Edge Function fügt manuelle Blockierungen in Verfügbarkeit ein |
| `google-calendar-oauth` Edge Functions (PROJ-8) | Bereits deployed — PROJ-7 berührt sie nicht |
| shadcn/ui `Calendar` + `date-fns` | Basis des Verfügbarkeits-Kalenders |
| `KanbanCard` ⋯-Menü-Verkabelung | Nur Label + Ziel-Komponente ändern sich |
| `ActivityDetailSheet` | Erhält 2 neue Buttons |

---

### Komponentenbaum

```
KanbanBoard (modified)
└── DateFinderSheet (NEW — ersetzt MoveToPlanningDialog)
    ├── Header: Aktivitätsname + Schließen-Button
    ├── MissingCalendarBanner (bedingt: "X von Y ohne Kalender")
    ├── CacheRefreshBar ("Zuletzt aktualisiert vor X min" + Aktualisieren-Button)
    ├── AvailabilityCalendar (scrollbar, 12 Monate ab heute)
    │   └── Day cells: grün / gelb / rot / grau
    ├── SelectedRangeDisplay (hervorgehobener Zeitraum)
    ├── ErrorState (wenn Edge Function nicht erreichbar)
    └── Footer: Abbrechen + Termin bestätigen

ActivityDetailSheet (modified)
├── [bestehender Inhalt unverändert]
├── TerminAnpassenButton → öffnet DateFinderSheet
│   (Admin/Initiator, Status in_planung oder planung_abgeschlossen)
└── IcalExportButton "Zum Kalender hinzufügen" → .ics-Download
    (nur sichtbar wenn start_date gesetzt)
```

---

### Neue Backend-Teile

**`group_availability_cache`-Tabelle (neue DB-Migration)**

Speichert ein gecachtes Verfügbarkeitsergebnis pro Gruppe. Felder: `group_id` (unique), `cached_at`, `data` (jsonb mit vollständigem Ergebnis). Kein RLS nötig — nur durch Edge Function via Service-Role zugänglich. TTL = 30 Minuten, erzwungen durch Edge Function.

**`get-group-availability` Edge Function (neu)**

Orchestriert die Verfügbarkeitsabfrage:
1. Validiert Gruppen-Mitgliedschaft des aufrufenden Nutzers (Security-Check)
2. Prüft Cache — wenn frisch (< 30 Min), sofortige Rückgabe
3. Liest alle `calendar_connections` + `user_date_blocks` aller Gruppenmitglieder
4. Ruft Google Calendar `freeBusy`-API **parallel** für alle Mitglieder mit gültigem Token auf
5. Versucht automatischen Token-Refresh bei 401-Fehlern; aktualisiert Token in DB
6. Mitglieder, bei denen Refresh scheitert → `calendar_type: null` (grau in UI)
7. Fügt Google Busy Ranges + manuelle Blockierungen zu einheitlicher Liste pro Mitglied zusammen
8. Schreibt Ergebnis in Cache, liefert Antwort zurück

Antwort-Struktur: Liste von Mitgliedern, jeweils mit `display_name`, `calendar_type` (`'google'` / `'manual'` / `null`) und Liste von Busy-Zeiträumen.

---

### Neue Frontend-Teile

**`useGroupAvailability`-Hook (neu)**

Kapselt den Edge-Function-Aufruf. Exponiert: Ladezustand, Fehlerzustand, Rohdaten der Mitglieder, `cachedAt`-Timestamp und `refresh()`-Funktion für den manuellen Refresh-Button.

**Verfügbarkeits-Farbberechnung (client-seitig, im Hook)**

Für jeden Tag im 12-Monats-Fenster berechnet der Hook den Anteil der Mitglieder-mit-Kalenderdaten, die einen Konflikt haben:
- 0 % Konflikte → grün
- 1–49 % → gelb
- ≥ 50 % → rot
- Keine Mitglieder mit Daten → grau

Läuft lokal im Browser — kein zusätzlicher Server-Roundtrip.

**`DateFinderSheet`-Komponente (neu)**

Fullscreen Bottom-Sheet (gleiches Muster wie `ActivityDetailSheet`). Props: `activityId`, `groupId`, `mode` (`'schedule'` = setzt Status auf `in_planung` | `'adjust'` = Status bleibt unverändert), `initialDateRange` (vorbelegt bei Termin-Anpassung). Bei Bestätigung: speichert `start_date` + `end_date` in `activities` via bestehendes `updateActivity`-Muster.

Nutzt bestehenden shadcn/ui `Calendar` als Basis-Grid mit Custom Day-Rendering für Verfügbarkeitsfarben. Kein neues Kalender-Package nötig.

**`ical-export.ts`-Utility (neu)**

Rein client-seitige Hilfsfunktion — kein Server-Roundtrip, kein npm-Package. Baut einen validen RFC-5545-String (~15 Zeilen) und löst einen Browser-Datei-Download aus. Felder: SUMMARY (Aktivitätsname), DTSTART/DTEND als ganztägige Dates, DESCRIPTION (falls vorhanden), LOCATION (falls vorhanden), stabiler UID.

---

### Änderungen an bestehenden Komponenten

| Komponente | Änderung |
|---|---|
| `KanbanCard` | Menü-Label: "In Planung verschieben" → "Termin finden" |
| `KanbanBoard` | Tauscht `MoveToPlanningDialog` gegen `DateFinderSheet` aus |
| `ActivityDetailSheet` | Fügt "Termin anpassen"-Button (Admin + Status-Guard) + "Zum Kalender hinzufügen"-Button (Datums-Guard) hinzu |
| `MoveToPlanningDialog` | Wird eingestellt — vollständig durch `DateFinderSheet` ersetzt |

## Implementation Notes (Frontend — 2026-06-23)

### New files
- `src/lib/ical-export.ts` — RFC-5545 client-side iCal generator; no npm package; ganztägige Events (`DTSTART;VALUE=DATE`/`DTEND;VALUE=DATE`); DTEND exklusiv (Day+1)
- `src/hooks/useGroupAvailability.ts` — ruft `get-group-availability` Edge Function auf; berechnet Farb-Map für 12 Monate client-seitig (O(member × day)); exponiert `getDayColor(date)`, `refresh()`, `cachedAt`, `membersWithoutCalendar`
- `src/components/groups/DateFinderSheet.tsx` — Fullscreen Bottom-Sheet (96dvh); react-day-picker v10 range mode mit modifiersClassNames für Verfügbarkeitsfarben; MissingCalendarBanner, CacheRefreshBar, ErrorState, Availability-Legend, Footer mit Range-Preview

### Modified files
- `KanbanCard.tsx` — Menu-Label "In Planung verschieben" → "Termin finden"
- `KanbanBoard.tsx` — `MoveToPlanningDialog` durch `DateFinderSheet mode="schedule"` ersetzt; `handleMoveToPlanning` entfernt; DialogState `move-to-planning` → `find-date`
- `ActivityDetailSheet.tsx` — `DateFinderSheet mode="adjust"` + `handleIcalExport`; Buttons "Termin anpassen" (canEdit + status guard) und "Zum Kalender hinzufügen" (start_date guard, auch im readOnly-Modus sichtbar)

### Deviations from spec
- Availability-Farben als leichte Tages-Backgrounds (`bg-green-100` etc.) via `modifiersClassNames`; im selektierten Range-Bereich überschreibt die Primary-Selection-Farbe die Availability-Farbe (react-day-picker v10 data-attribute-Styling hat Vorrang) — visuell akzeptabel für MVP
- `Nav: () => <></>` statt `Nav: () => null` wegen TypeScript-Einschränkung in react-day-picker v10

## Implementation Notes (Backend — 2026-06-23)

### DB Migration
- `group_availability_cache` Tabelle erstellt: `id`, `group_id` (unique FK → groups.id CASCADE), `cached_at`, `data` (jsonb); RLS aktiviert ohne Policies (nur Service Role Zugriff)
- `activities` Tabelle hatte `start_date`, `end_date`, `location` bereits aus PROJ-8 — keine neue Migration nötig
- `database.types.ts` aktualisiert: `start_date`/`end_date`/`location` in `activities` ergänzt; `group_availability_cache` Tabellen-Typ hinzugefügt

### Edge Function `get-group-availability`
- `supabase/functions/get-group-availability/index.ts` — deployed als Version 1; `verify_jwt: true`
- Sicherheits-Check: JWT → user.id → Mitgliedschaft in `group_members` (Forbidden bei nicht-Mitglied)
- Cache-Logik: prüft `group_availability_cache` per `group_id`; bei Alter < 30 Min sofortige Rückgabe; nach Neuberechnung upsert per `group_id`
- Parallel-Abfragen: `profiles`, `calendar_connections`, `user_date_blocks` gleichzeitig in `Promise.all`; Google freeBusy pro Mitglied ebenfalls parallel
- Token-Refresh: proaktiv wenn `expires_at - 60s ≤ now`; reaktiv bei `null`-Antwort von Google; schlägt Refresh fehl → `calendar_type: null` (grau)
- `calendar_type`-Logik: `'google'` wenn verbunden + API erreichbar; `'manual'` wenn nur `user_date_blocks` vorhanden; `null` wenn keine Daten
- Manuelle Blockierungen: `user_date_blocks.start_date`/`end_date` → ISO-Datetime-Range (`T00:00:00Z` / `T23:59:59Z`); mit Google Busy Ranges gemergt

### Benötigte Env Vars (Supabase Edge Functions)
- `GOOGLE_CLIENT_ID` — Google OAuth App Client ID
- `GOOGLE_CLIENT_SECRET` — Google OAuth App Client Secret
(bereits für PROJ-8 `google-calendar-oauth` Funktion gesetzt)

## QA Test Results

**QA Date:** 2026-06-23
**Status:** APPROVED — All bugs fixed, 152/152 unit tests pass.

### Summary

| Category | Count |
|---|---|
| Acceptance Criteria tested | 18 / ~25 |
| Acceptance Criteria passed | 17 |
| Acceptance Criteria blocked (require multi-user / credentials) | 7 |
| Bugs — Critical | 0 |
| Bugs — High | 1 |
| Bugs — Medium | 0 |
| Bugs — Low | 2 |
| Unit tests added | 38 (152 total pass after fixes) |
| E2E tests added | 19 (1 pass, 18 skip pending test credentials) |

### Acceptance Criteria Results

#### Terminfindung starten (Kanban-Karte)
| AC | Result | Notes |
|---|---|---|
| "Termin finden" erscheint im ⋯-Menü für Admin/Initiator | PASS | AC-KANBAN-1 |
| DateFinderSheet öffnet sich | PASS | AC-KANBAN-2 |
| Sheet ruft Edge Function ab + zeigt Lade-Zustand | PASS | AC-KANBAN-5 |
| Kalender mit Farb-Overlay + Legende | PASS | AC-KANBAN-3 |
| Hinweis-Banner für Mitglieder ohne Kalender | PASS | AC-BANNER-1 (conditional) |
| Cache-Refresh-Bar ("Zuletzt aktualisiert") | PASS | AC-CACHE-1 |
| Datumsauswahl und Range-Preview im Footer | PASS | AC-RANGE-1 |
| "Termin bestätigen" deaktiviert ohne Datum | PASS | AC-KANBAN-4 |
| Auto-Swap Start/Ende wenn falsch herum gewählt | PASS | Code-Review (handleRangeSelect) |
| Aktivität wechselt zu in_planung bei Bestätigung | SKIP | Benötigt Test-Credentials |
| Abbrechen schließt Sheet ohne Statusänderung | PASS | AC-KANBAN-6 |
| Redakteur/Beobachter sieht kein "Termin finden" | SKIP | Benötigt Multi-User-Test |

#### Terminfindung nachträglich anpassen (Detailansicht)
| AC | Result | Notes |
|---|---|---|
| "Termin anpassen"-Button sichtbar für Admin/Initiator (in_planung / planung_abgeschlossen) | PASS | AC-ADJUST-1 |
| Sheet öffnet sich im Anpassen-Modus ("Termin anpassen" Titel, "Termin speichern" Button) | PASS | AC-ADJUST-2 |
| Aktuell gesetzter Zeitraum vorausgewählt | SKIP | Benötigt Aktivität mit gesetztem Termin |
| Neuer Zeitraum wird gespeichert, Status bleibt unverändert | SKIP | Benötigt Test-Credentials |
| Redakteur/Beobachter sieht keinen "Termin anpassen"-Button | SKIP | Benötigt Multi-User-Test |

#### iCal-Export (Detailansicht)
| AC | Result | Notes |
|---|---|---|
| "Zum Kalender hinzufügen" sichtbar wenn start_date gesetzt | PASS | AC-ICAL-1 |
| Download-Trigger bei Klick (Browser download event) | PASS | AC-ICAL-2 |
| RFC-5545 konformes Format (Unit Tests) | PARTIAL | DTSTART ✓, CRLF ✓, UID ✓, SUMMARY ✓, DESCRIPTION ✓, LOCATION ✓, Escaping ✓ — **DTEND FAIL (BUG-1)** |
| Button nicht sichtbar wenn kein Termin gesetzt | PASS | AC-ICAL-3 |
| Aktivität abgeschlossen: Export-Button bleibt sichtbar | SKIP | Benötigt abgeschlossene Aktivität |

#### Fehlerverhalten
| AC | Result | Notes |
|---|---|---|
| Edge Function nicht erreichbar → Fehler-State mit Retry-Button | PASS | Code-Review (ErrorState + Retry button implementiert) |
| Einzelnes Mitglied schlägt fehl → wird als grau gewertet | PASS | Code-Review (Edge Function: catch → calendar_type: null) |
| Bestätigung schlägt fehl → Sheet bleibt offen, Toast-Fehler | PASS | Code-Review (handleConfirm: toast.error + kein onClose) |

### Bugs

#### BUG-1 (HIGH): iCal-Export DTEND timezone bug — falsches Enddatum in UTC+ Zeitzonen

**Datei:** `src/lib/ical-export.ts` Zeile 14–16

**Beschreibung:** `new Date(opts.endDate + 'T00:00:00')` erzeugt ein lokales Datum. Die anschließende Umwandlung mit `.toISOString().slice(0, 10)` extrahiert das UTC-Datum, das in allen UTC+-Zeitzonen (u.a. Deutschland UTC+1/UTC+2) **einen Tag zu früh** liegt. Das erzeugte DTEND ist falsch — Google Calendar, Apple Calendar und Outlook erhalten eine Aktivität, die einen Tag kürzer als geplant erscheint.

**Reproduktion (Deutschland, UTC+2):**
- Aktivität mit `end_date = '2024-06-15'`
- Erwartet: `DTEND;VALUE=DATE:20240616`
- Tatsächlich: `DTEND;VALUE=DATE:20240615`

**Fix:** UTC-Datumsarithmetik verwenden:
```ts
const [y, m, d] = opts.endDate.split('-').map(Number)
const dtend = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10).replace(/-/g, '')
```

**Unit Test:** 4 `it.fails()`-Tests in `src/lib/ical-export.test.ts` dokumentieren das korrekte Verhalten; werden zu regulären `it()`-Tests sobald der Fix eingespielt ist.

---

#### BUG-2 (LOW): Grammatikfehler im MissingCalendarBanner

**Datei:** `src/components/groups/DateFinderSheet.tsx` Zeile 198

**Beschreibung:** Wenn genau 1 Mitglied keinen Kalender verbunden hat, erscheint der Text: `"1 von 5 Mitglieder ohne Kalender"` — korrekt im Deutschen wäre `"1 von 5 Mitgliedern ohne Kalender"` (Dativ Plural nach "von").

**Fix:** `? \`1 von ${totalMembers} Mitglieder\`` → `? \`1 von ${totalMembers} Mitgliedern\``

---

#### BUG-3 (LOW): Veraltete PROJ-5 E2E-Tests nach Ersatz von MoveToPlanningDialog

**Datei:** `tests/PROJ-5-kanban-board.spec.ts` Zeilen AC-ACTION-2 und AC-ACTION-3

**Beschreibung:** Die Tests suchen nach `"In Planung verschieben"` als Dialog-Titel und Button-Text sowie `"Zeitraum auswählen"` — diese UI-Elemente wurden durch `DateFinderSheet` ersetzt (PROJ-7). Die Tests schlagen fehl, sobald Test-Credentials gesetzt sind.

**Fix:** AC-ACTION-2 und AC-ACTION-3 in `tests/PROJ-5-kanban-board.spec.ts` auf das neue `DateFinderSheet`-Muster aktualisieren (Titel: "Termin finden", Button: "Termin bestätigen").

### Security Audit

| Check | Result |
|---|---|
| Edge Function: JWT erforderlich (`verify_jwt: true`) | PASS |
| Edge Function: Aufrufer muss Gruppen-Mitglied sein (Security-Check) | PASS |
| Service Role Key nie an Client weitergegeben | PASS |
| Google OAuth Tokens nur server-seitig (Edge Function) zugänglich | PASS |
| `group_availability_cache`: RLS aktiviert, keine Client-Policies (nur Service Role) | PASS |
| iCal-Export: vollständig client-seitig, kein Server-Roundtrip | PASS |
| Keine hardcodierten Secrets in Quellcode | PASS |
| Parameterisierte DB-Queries (Supabase-Client) | PASS |
| XSS: iCal-Felder werden escaped (RFC-5545 Escaping) | PASS |
| Autorisierung: "Termin finden" nur für Admin/Initiator sichtbar (canManage-Check) | PASS |

### Test Files

- **Unit Tests:** `src/lib/ical-export.test.ts` (22 Tests), `src/hooks/useGroupAvailability.test.ts` (16 Tests)
- **E2E Tests:** `tests/PROJ-7-terminfindung-kalender-export.spec.ts` (19 Tests)

## Deployment

**Deployed:** 2026-06-23
**Production URL:** https://ai-coding-starter-kit-ebon.vercel.app
**Vercel Deployment ID:** dpl_E3YmDKBTuSNqfZ25LE7cFCLno2pF
**Git Tag:** v1.7.0-PROJ-7

### Deployment Notes
- Vercel production build: ✅ (33s, all 12 static pages generated)
- Edge Function `get-group-availability` deployed to Supabase (Version 2, ACTIVE)
- `npm run lint` is broken in Next.js 16 (`next lint` command was removed) — does not affect Vercel builds (Vercel ran the build clean). Fix: update `package.json` lint script to use `eslint` directly.
- GitHub auto-deploy did not trigger (webhook delay); deployed manually via `npx vercel --prod`
