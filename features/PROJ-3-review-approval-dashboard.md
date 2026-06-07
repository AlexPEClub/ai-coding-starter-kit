# PROJ-3: Review & Approval Dashboard

## Status: In Progress
**Created:** 2026-06-06
**Last Updated:** 2026-06-06

## Dependencies
- Requires: PROJ-1 (Supabase Infrastructure) — Auth + `suggestions` table
- Requires: PROJ-2 (Daily Suggestion Engine) — populates the `suggestions` table with data to review

## User Stories
- Als Stefan möchte ich alle offenen Vorschläge auf einen Blick sehen, damit ich schnell entscheiden kann, welche ich bestätige oder ablehne.
- Als Stefan möchte ich einen Vorschlag mit einem Klick bestätigen oder ablehnen, damit der Review-Prozess weniger als 2 Minuten täglich dauert.
- Als Stefan möchte ich einen versehentlichen Klick rückgängig machen können, damit ich keine falschen Entscheidungen einsperre.
- Als Stefan möchte ich den Inhalt eines Vorschlags (Titel, Details, Insight, Quelle) sehen, damit ich eine fundierte Entscheidung treffe.
- Als Stefan möchte ich auf dem Handy reviewen können, damit ich BizDev auch unterwegs erledige.
- Als Stefan möchte ich einen Fortschritts-Zähler sehen (offen / bestätigt / abgelehnt), damit ich weiß, wie weit ich noch bin.

## Out of Scope
- **Bearbeiten von Vorschlägen** — nur Bestätigen/Ablehnen; Inhalte werden von PROJ-2 generiert und nicht manuell geändert
- **Monday.com Task-Erstellung** — wird in PROJ-4 gebaut; PROJ-3 speichert nur den Status in der DB
- **Notion Dokument-Erstellung** — wird in PROJ-5 gebaut
- **History-Ansicht (bereits bearbeitete Vorschläge)** — deferred to PROJ-6 (Implementation Tracking)
- **Filterung oder Sortierung** — nicht nötig für MVP; Gruppierung nach Kategorie reicht
- **Bulk-Aktionen** ("Alle bestätigen") — zu riskant für MVP; jede Entscheidung ist bewusst
- **Push-Notifications / E-Mail-Erinnerung** — außerhalb des Scope von PROJ-3
- **Mehrere Nutzer / Rollen** — nur Stefan verwendet das Dashboard

## Acceptance Criteria

### Anzeige der Vorschläge

- [ ] Angenommen Stefan ist eingeloggt, wenn er `/dashboard` öffnet, dann sieht er alle Vorschläge mit Status `pending` aus der `suggestions`-Tabelle, gruppiert nach Kategorie (Marketing, Produkt, Operations).
- [ ] Angenommen es gibt offene Vorschläge aus mehreren Tagen, wenn Stefan das Dashboard öffnet, dann werden Vorschläge älterer Tage mit ihrem `report_date` gekennzeichnet; heutige Vorschläge zeigen kein Datum.
- [ ] Angenommen Stefan öffnet das Dashboard, wenn die Seite lädt, dann sieht er oben einen Zähler: `X offen · Y bestätigt · Z abgelehnt` (Gesamtzahlen aus allen Tagen).
- [ ] Angenommen es gibt keine offenen Vorschläge, wenn Stefan das Dashboard öffnet, dann wird die Meldung „Alle Vorschläge bearbeitet — NORA arbeitet bereits am nächsten Report." mit einem passenden Icon angezeigt.

### Karten-Inhalt

- [ ] Angenommen ein Vorschlag existiert, wenn Stefan eine Karte betrachtet, dann sieht er: Kategorie-Badge (farbig), Titel (fett), Body-Text, und zwei Buttons (Bestätigen / Ablehnen).
- [ ] Angenommen ein Vorschlag hat `insight`- oder `source`-Felder, wenn Stefan auf „Details" klickt, dann klappt ein Bereich auf, der Insight und Source anzeigt.

### Bestätigen / Ablehnen

- [ ] Angenommen Stefan klickt auf „Bestätigen", wenn der Button gedrückt wird, dann wechselt der Button in einen Lade-Zustand und die Karte ändert sich erst, nachdem die Datenbank den Status-Wechsel auf `approved` bestätigt hat.
- [ ] Angenommen Stefan klickt auf „Ablehnen", wenn der Button gedrückt wird, dann wechselt der Button in einen Lade-Zustand und die Karte ändert sich erst, nachdem die Datenbank den Status-Wechsel auf `rejected` bestätigt hat.
- [ ] Angenommen eine Aktion erfolgreich war, wenn die Karte ihren neuen Zustand zeigt (grün für bestätigt, ausgegraut für abgelehnt), dann erscheint kurz ein „Rückgängig"-Link auf der Karte.
- [ ] Angenommen Stefan klickt auf „Rückgängig", wenn der Link sichtbar ist, dann wird der Status der Karte zurück auf `pending` gesetzt (pessimistisch — erst nach DB-Bestätigung).
- [ ] Angenommen die Karte zeigt ihren neuen Zustand, wenn Stefan die Seite neu lädt, dann ist die bearbeitete Karte nicht mehr in der Liste.

### Fehlerbehandlung

- [ ] Angenommen die Datenbank-Anfrage schlägt fehl, wenn Stefan Bestätigen oder Ablehnen klickt, dann wird ein Toast-Fehler angezeigt und die Karte bleibt unverändert im `pending`-Zustand.
- [ ] Angenommen Stefan ist nicht eingeloggt, wenn er `/dashboard` aufruft, dann wird er zur Login-Seite weitergeleitet (durch Middleware — bereits in PROJ-1 implementiert).

### Mobile & Layout

- [ ] Angenommen Stefan öffnet das Dashboard auf einem Mobilgerät, wenn die Seite lädt, dann werden die Karten einspaltig angezeigt und die Bestätigen/Ablehnen-Buttons sind groß genug für Touch-Bedienung.
- [ ] Angenommen Stefan öffnet das Dashboard auf einem Desktop (≥768px), wenn die Seite lädt, dann werden die Karten in einem 2–3-Spalten-Raster angezeigt.

## Edge Cases
- **Gleichzeitige Aktionen unmöglich**: Solo-User — kein Multi-User Konflikt
- **Vorschlag wird während des Ladens von PROJ-2 neu hinzugefügt**: Taucht erst beim nächsten Seitenaufruf auf; kein Live-Polling in PROJ-3
- **Netzwerkausfall während der Aktion**: Pessimistisches UI — Button bleibt im Lade-Zustand bis Timeout; danach Toast-Fehler, Karte bleibt `pending`
- **Alle 3 Kategorien leer, aber andere gefüllt**: Nur Kategorien mit Vorschlägen werden angezeigt; leere Kategorien werden ausgeblendet
- **Sehr langer Body-Text**: Body-Text wird auf 3 Zeilen abgeschnitten mit „mehr anzeigen" Link
- **Keine Internetverbindung beim Seitenaufruf**: Next.js zeigt Standard-Fehlerseite oder leere Liste; kein Crash

## Technical Requirements
- **Performance**: Dashboard lädt in < 2 Sekunden (alle pending suggestions in einem DB-Query)
- **Security**: Auth-Check durch Middleware (PROJ-1); RLS auf `suggestions`-Tabelle verhindert Zugriff ohne Session
- **Responsive**: Mobile-first, Breakpoints: 1 Spalte (< 768px), 2–3 Spalten (≥ 768px)
- **Accessibility**: Buttons haben beschreibende aria-labels; Farbkodierung wird nicht als einziges Unterscheidungsmerkmal genutzt

## Open Questions
- [ ] Soll der Zähler (`X offen · Y bestätigt`) alle Vorschläge aller Zeiten zählen oder nur die des aktuellen Tages? — Empfehlung: alle Zeiten, da Vorschläge tagesübergreifend angezeigt werden

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Alle offenen (pending) Vorschläge aller Tage anzeigen, nicht nur heute | Verhindert, dass ältere Vorschläge "verloren gehen"; Stefan sieht immer alle offenen Punkte auf einmal | 2026-06-06 |
| Nur Bestätigen/Ablehnen — kein Bearbeiten | Hält PROJ-3 auf eine einzige Entscheidungsaufgabe fokussiert; Inhalte werden von PROJ-2 generiert | 2026-06-06 |
| Pessimistisches UI (warten auf DB-Bestätigung) | Verhindert falsche Zustände bei Netzwerkfehlern; Konsistenz ist wichtiger als Geschwindigkeit | 2026-06-06 |
| „Rückgängig"-Link statt dauerhaften Edit-Modus | Schneller Undo ohne UI-Komplexität; verschwindet beim nächsten Reload | 2026-06-06 |
| Karte bleibt kurz sichtbar nach Aktion, verschwindet erst beim Reload | Gibt Stefan visuelles Feedback ohne abrupte Liste; Undo-Window bleibt erhalten | 2026-06-06 |
| Insight + Source aufklappbar (nicht immer sichtbar) | Hält die Karte kompakt für schnellen Review; Details verfügbar für fundierte Entscheidungen | 2026-06-06 |
| Responsive mobile-first | Stefan reviewt auch unterwegs; 2-Minuten-Ziel erfordert mobilen Zugriff | 2026-06-06 |

### Technical Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Server Component für Datenladen | Seite erscheint sofort ohne Lade-Spinner; kein useEffect + fetch nötig | 2026-06-07 |
| Next.js Server Actions statt API-Route | Kein separater Endpunkt; TypeScript von UI bis DB; Next.js 16 Best Practice | 2026-06-07 |
| useState in DashboardClient für UI-Zustand | Kein globaler State nötig — eine Seite, eine Komponente | 2026-06-07 |
| Zähler als Ableitung aus lokalem Zustand | Bleibt immer synchron mit dem, was Stefan sieht; kein zweiter DB-Call | 2026-06-07 |
| Alle Vorschläge laden (nicht nur pending) | Ermöglicht Zähler für approved/rejected ohne zweiten Query | 2026-06-07 |
| Sonner für Toast + Collapsible für Details | Beide shadcn-Komponenten bereits installiert — kein neues Package | 2026-06-07 |
| Toaster in layout.tsx einmalig ergänzen | Zentrale Stelle für Toast-Rendering, einmal für alle zukünftigen Features | 2026-06-07 |

---

## Tech Design (Solution Architect)

### Komponenten-Struktur

```
src/app/dashboard/
  page.tsx                   (Server Component — lädt alle Vorschläge aus Supabase)
  dashboard-client.tsx       (Client Component — verwaltet interaktiven Zustand)
  suggestion-card.tsx        (Client Component — einzelne Karte mit Aktionen)
  stats-bar.tsx              (Client Component — Zähler offen/bestätigt/abgelehnt)

src/app/actions/
  suggestions.ts             (Server Actions — updateSuggestionStatus)
```

### Visueller Baum

```
/dashboard (Server Component)
  └── DashboardClient (Client — hält den Zustand aller Vorschläge)
      ├── StatsBar (leitet Zahlen aus dem Zustand ab)
      ├── CategorySection "Marketing"
      │   └── SuggestionCard (×N)
      │       ├── Kategorie-Badge (farbig)
      │       ├── Titel + Body-Text
      │       ├── Collapsible — Insight & Source
      │       └── Bestätigen / Ablehnen / Rückgängig-Buttons
      ├── CategorySection "Produkt"
      │   └── SuggestionCard (×N)
      ├── CategorySection "Operations"
      │   └── SuggestionCard (×N)
      └── EmptyState (wenn keine pending Vorschläge)
```

### Datenfluss

```
1. Seitenaufruf
   Server Component → Supabase (ein Query, alle Vorschläge) → an DashboardClient übergeben

2. Stefan klickt „Bestätigen"
   Button → Lade-Zustand → Server Action → Supabase Update
   ↓ Erfolg: Karte wechselt zu „bestätigt", Rückgängig-Link erscheint
   ↓ Fehler: Toast-Meldung, Karte bleibt „pending"

3. Stefan klickt „Rückgängig"
   Rückgängig-Link → Server Action → Supabase Update zurück auf „pending"
   ↓ Erfolg: Karte kehrt zu normalem pending-Zustand zurück

4. Seiten-Reload
   Bearbeitete Karten verschwinden aus der Liste (nur noch pending werden angezeigt)
```

### Neue Packages
Keine. Alle shadcn-Komponenten bereits installiert: `Badge`, `Card`, `Button`, `Collapsible`, `Skeleton`, `Sonner`. Einzige Ergänzung: `<Toaster />` in `src/app/layout.tsx`.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
