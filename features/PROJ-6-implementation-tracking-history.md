# PROJ-6: Implementation Tracking & History

## Status: Architected
**Created:** 2026-06-10
**Last Updated:** 2026-06-10

## Dependencies
- Requires: PROJ-1 (Supabase Infrastructure) — `suggestions`-Tabelle erhält neuen Status `implemented`
- Requires: PROJ-3 (Review & Approval Dashboard) — neuer Button + History-Tab in bestehender UI
- Requires: PROJ-2 (Daily Suggestion Engine) — NORA-Prompt wird um `implemented`-Kontext erweitert
- Requires: PROJ-7 (Context-Aware Suggestions) — `buildPrompt` in `anthropic.ts` bekommt neuen Abschnitt

## Übersicht
Heute weiß NORA (und Stefan), welche Vorschläge genehmigt oder abgelehnt wurden — aber nicht, welche davon tatsächlich umgesetzt wurden. Ein bestätigter Vorschlag in der DB und ein abgeschlossener Monday-Task in der Realität sind zwei verschiedene Dinge.

Dieses Feature schließt die Lücke: Stefan kann genehmigte Vorschläge manuell als **umgesetzt** markieren. Umgesetzte Vorschläge verschwinden aus der Hauptansicht (bleibt übersichtlich) und sind in einer neuen **History-Ansicht** einsehbar. NORA nutzt den neuen Status als stärkeres „darauf aufbauen"-Signal.

## User Stories
- Als Stefan möchte ich einen genehmigten Vorschlag als umgesetzt markieren können, damit mein Dashboard den echten Umsetzungsstand widerspiegelt und ich nicht zwischen DB und Monday.com hin- und herschalten muss.
- Als Stefan möchte ich, dass umgesetzte Vorschläge aus der Hauptansicht verschwinden, damit das Dashboard übersichtlich bleibt und ich nur noch offene Punkte sehe.
- Als Stefan möchte ich eine History-Ansicht mit allen Vorschlägen aller Statuses und einfachen Zählern, damit ich auf einen Blick erkenne wie viel BizDev-Arbeit tatsächlich passiert ist.
- Als Stefan möchte ich die History nach Status filtern können (umgesetzt / bestätigt / abgelehnt), damit ich gezielt nachvollziehen kann, was in welcher Kategorie passiert ist.
- Als Stefan möchte ich, dass NORA umgesetzte Vorschläge als starkes „darauf aufbauen"-Signal nutzt, damit neue Vorschläge auf abgeschlossener Arbeit aufbauen statt nur auf geplanter.

## Out of Scope
- **Automatische Synchronisation mit Monday.com-Status** — zu aufwändig für MVP; Markierung bleibt manuell in NORAas Dashboard
- **Undo-Funktion** nach Markierung als umgesetzt — Aktion ist nicht destruktiv; kein Undo nötig
- **Bearbeitbares Notizfeld** bei Markierung als umgesetzt (z.B. „was genau wurde gebaut") — deferred; MVP reicht Statuswechsel
- **Export der History** als CSV oder PDF — eigenes Feature, nicht MVP
- **Statistik-Charts / Grafiken** über Zeit — einfache Zähler reichen für MVP; Visualisierungen sind ein späteres Feature
- **E-Mail-Benachrichtigung** bei Umsetzung — nicht im Scope
- **Filterung nach Zeitraum** in der History — „alle Einträge" reicht für MVP; Datumsfilter später

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

### Als umgesetzt markieren
- [ ] Angenommen ein Vorschlag hat den Status `approved`, wenn Stefan auf „Als umgesetzt markieren" klickt, dann wechselt der Status auf `implemented` und der Vorschlag verschwindet sofort aus der Hauptansicht
- [ ] Angenommen ein Vorschlag hat Status `pending` oder `rejected`, wenn Stefan das Dashboard betrachtet, dann ist der „Als umgesetzt markieren"-Button für diesen Vorschlag nicht sichtbar
- [ ] Angenommen Stefan hat „Als umgesetzt markieren" geklickt, wenn die Aktion erfolgreich ist, dann erscheint ein Toast „Vorschlag als umgesetzt markiert" — kein Bestätigungsdialog vorher
- [ ] Angenommen die API-Anfrage zum Statuswechsel schlägt fehl, wenn Stefan auf den Button klickt, dann bleibt der Vorschlag in der Hauptansicht und ein Fehler-Toast wird angezeigt

### History-Ansicht
- [ ] Angenommen Stefan ist eingeloggt, wenn er die History-Ansicht öffnet, dann sieht er alle Vorschläge aller Statuses (pending, approved, implemented, rejected) sortiert nach Datum absteigend
- [ ] Angenommen die History ist geöffnet, wenn Stefan nach Status filtert, dann zeigt die Liste nur Vorschläge des gewählten Status
- [ ] Angenommen die History ist geöffnet, wenn Stefan oben auf die Zusammenfassung schaut, dann sieht er Zähler: „Umgesetzt: X | Bestätigt: Y | Abgelehnt: Z" für alle Einträge gesamt
- [ ] Angenommen die History ist leer (kein Vorschlag hat den gewünschten Status), wenn Stefan nach diesem Status filtert, dann erscheint ein leerer Zustand mit erklärendem Text

### NORA-Integration
- [ ] Angenommen Vorschläge mit Status `implemented` existieren, wenn NORA neue Vorschläge generiert, dann enthält der Prompt einen Abschnitt „Bereits umgesetzt — nächste Schritte darauf aufbauen:" mit diesen Titeln und Kategorien
- [ ] Angenommen sowohl `approved` als auch `implemented` Vorschläge existieren, wenn NORA generiert, dann erscheinen `implemented` Vorschläge als stärkeres Signal als nur `approved` — in einem eigenen Abschnitt über dem `approved`-Abschnitt

## Edge Cases
- **Doppelklick auf „Als umgesetzt markieren"**: Zweite Anfrage trifft auf bereits `implemented` Status → idempotent, kein Fehler, kein doppelter Toast
- **Sehr lange History** (100+ Vorschläge): Paginierung oder Scroll — kein Laden aller Einträge auf einmal; Performance-Grenze bei max. 50 Einträgen pro Seite
- **Alle Vorschläge als umgesetzt markiert**: Hauptansicht zeigt leeren Zustand mit „Alle Vorschläge umgesetzt — neue Generierung starten"
- **Vorschlag wird gleichzeitig bearbeitet und umgesetzt**: Statuswechsel über API ist atomisch; kein Race-Condition-Problem bei Single-User
- **History leer beim ersten Öffnen**: Erklärender Text „Noch keine Vorschläge vorhanden — neue Generierung starten"
- **`implemented`-Vorschläge fließen in NORA-Kontext** — nur letzte 30 Tage, um den Prompt nicht zu überladen

## Technical Requirements
- **Security**: Statuswechsel-Endpunkt erfordert eingeloggte Session (kein Cron-Secret)
- **Performance**: Statuswechsel < 500ms; History-Laden < 1s für bis zu 50 Einträge
- **Datenintegrität**: `implemented` ist ein neuer Status in der `suggestions`-Tabelle — bestehende Einträge bleiben unverändert

## Open Questions
- [ ] Soll der Status `implemented` auch rückgängig gemacht werden können (zurück auf `approved`)? — im Interview als nicht nötig bewertet, aber offen für spätere Entscheidung

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Manuelles Markieren statt automatischer Monday.com-Sync | Sync zu aufwändig für MVP; Stefan entscheidet selbst wann etwas „wirklich erledigt" ist | 2026-06-10 |
| Kein Bestätigungsdialog vor Markierung | Aktion ist nicht destruktiv; Dialog bremst den < 2-Min-Workflow | 2026-06-10 |
| History zeigt alle Statuses (inkl. pending, rejected) | Vollständiges Bild des BizDev-Fortschritts; nicht nur Erfolge | 2026-06-10 |
| Einfache Zähler statt Charts | MVP-Scope; Zähler liefern den Kernwert ohne Implementierungsaufwand | 2026-06-10 |
| `implemented` als eigener Abschnitt in NORA-Prompt (über `approved`) | Umgesetzte Arbeit ist stärkeres Signal als nur geplante; NORA soll darauf aufbauen | 2026-06-10 |
| Kein Undo nach Markierung als umgesetzt | Aktion ist reversibel über direkte DB-Korrektur; kein Undo-Button im MVP | 2026-06-10 |
| Zähler zeigen Gesamtzahlen (all-time) | Langfristiger BizDev-Fortschritt ist motivierender als nur aktuelle Woche | 2026-06-10 |

### Technical Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Bestehende Server Action erweitern statt neuer API-Endpunkt | `updateSuggestionStatus` deckt bereits alle Status-Wechsel ab; konsistentes Muster zu PROJ-3 | 2026-06-10 |
| `implemented` in CHECK-Constraint statt neue Tabelle | Minimale Änderung; kein neues Datenbankschema nötig | 2026-06-10 |
| History-Filter client-seitig (nicht via API) | Max. 50 Einträge werden vollständig geladen; client-seitiges Filtern ist performant genug und spart einen API-Call | 2026-06-10 |
| shadcn/ui Tabs für Hauptansicht / Verlauf | Bereits installiert; konsistent mit bestehendem Design-System | 2026-06-10 |
| `implemented` in `supabaseHistory` bereits mitgelesen (PROJ-7) | `live-context.ts` liest alle Statuses — kein zusätzlicher DB-Query nötig; nur `buildPrompt` anpassen | 2026-06-10 |
| History max. 50 Einträge (kein Paging) | Ausreichend für MVP bei 1–5 Vorschlägen/Tag; Paginierung kommt wenn nötig | 2026-06-10 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Komponenten-Struktur

```
Dashboard Page (bestehend — page.tsx)
+-- Header (unverändert)
+-- Tabs (NEU — shadcn/ui Tabs, bereits installiert)
    |
    +-- Tab 1: "Vorschläge" (bestehende Hauptansicht)
    |   +-- StatsBar (zeigt nur pending/approved)
    |   +-- DashboardClient (gefiltert: nur pending + approved sichtbar)
    |       +-- SuggestionCard
    |           +-- [approved] "Als umgesetzt markieren"-Button (NEU)
    |           +-- [approved] "Bestätigen"-Button (bestehend)
    |           +-- [approved] "Ablehnen"-Button (bestehend)
    |
    +-- Tab 2: "Verlauf" (NEU)
        +-- HistoryStats (Umgesetzt: X | Bestätigt: Y | Abgelehnt: Z)
        +-- StatusFilter (Alle / Umgesetzt / Bestätigt / Abgelehnt)
        +-- HistoryList (max. 50 Einträge, sortiert nach Datum desc)
            +-- HistoryCard (read-only: Titel, Kategorie-Badge, Status-Badge, Datum)
```

### Datenfluss

```
"Als umgesetzt markieren"-Klick
        ↓
updateSuggestionStatus(id, 'implemented')    (bestehende Server Action, erweitert)
        ↓
Supabase: status = 'implemented', reviewed_at = jetzt
        ↓
DashboardClient: Vorschlag verschwindet aus Hauptansicht
Toast: "Vorschlag als umgesetzt markiert"

Verlauf-Tab öffnen
        ↓
Alle Vorschläge aus Supabase (Server Component — max. 50, alle Statuses)
        ↓
HistoryView: Zähler berechnen + Liste anzeigen + Filter anwenden (client-seitig)

NORA Generierung (bestehend, erweitert)
        ↓
fetchLiveContext → supabaseHistory enthält implemented bereits (Status wird mitgelesen)
        ↓
buildPrompt: neuer Abschnitt "Bereits umgesetzt — nächste Schritte darauf aufbauen:"
             erscheint über dem "Bereits bestätigt"-Abschnitt
```

### Datenmodell

Keine neue Tabelle. Erweiterung der bestehenden `suggestions`-Tabelle:

| Feld | Typ | Änderung |
|---|---|---|
| `status` | string | Neuer Wert `implemented` in CHECK-Constraint ergänzt |
| `reviewed_at` | timestamp | Wird beim Markieren als umgesetzt befüllt (Feld existiert bereits) |

Supabase-Migration: idempotente Schema-Änderung — bestehende Einträge bleiben unverändert.

### Geänderte / neue Dateien

| Datei | Änderung |
|---|---|
| `src/app/actions/suggestions.ts` | **Erweitert** — `implemented` zu `VALID_STATUSES`; neuer Fall: nur DB-Update (kein Monday/Notion) |
| `src/app/dashboard/dashboard-client.tsx` | **Erweitert** — `implemented` aus Hauptansicht filtern; Tab-Wrapper |
| `src/app/dashboard/suggestion-card.tsx` | **Erweitert** — „Als umgesetzt markieren"-Button nur für `approved` |
| `src/app/dashboard/history-view.tsx` | **Neu** — HistoryStats + StatusFilter + HistoryList + HistoryCard |
| `src/app/dashboard/page.tsx` | **Erweitert** — alle Suggestions (inkl. `implemented`) laden |
| `src/lib/anthropic.ts` | **Erweitert** — `buildPrompt` um „Bereits umgesetzt"-Abschnitt |
| `supabase/schema.sql` | **Erweitert** — `implemented` in CHECK-Constraint von `suggestions.status` |

**Keine neuen Packages** — shadcn/ui `Tabs` bereits installiert.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
