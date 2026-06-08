# PROJ-7: Context-Aware Suggestions (Live-Daten)

## Status: Architected
**Created:** 2026-06-08
**Last Updated:** 2026-06-08

## Dependencies
- Requires: PROJ-2 (Daily Suggestion Engine) — dieses Feature erweitert den Generierungs-Prompt mit Live-Kontext
- Requires: PROJ-5 (Notion Document Auto-Creation) — nutzt denselben `NOTION_API_KEY` und die bestehende BizDev-Datenbank
- Requires: PROJ-1 (Supabase Infrastructure) — liest Vorschlags-Historie aus der `suggestions`-Tabelle

## Übersicht
Heute generiert NORA Vorschläge auf Basis eines statischen Firmenbriefings (`NORA_COMPANY_CONTEXT` in `nora-context.ts`). Das führt zu generischen, sich wiederholenden Vorschlägen, die den echten Arbeitsstand nicht kennen.

Dieses Feature reichert den Generierungs-Prompt mit **drei Live-Quellen** an — automatisch, ohne manuellen Aufwand für Stefan:

1. **QualiPilot Living Spec** (Notion-Seite) — aktueller Produktstand, Entwicklungsprioritäten, offene Fragen. Wird von Stefan und Claude gemeinsam gepflegt. NORA liest sie vor jeder Generierung.
2. **NORA BizDev Datenbank** (Notion, existiert bereits) — letzte 30 Tage bestätigte Vorschläge (Titel, Kategorie, Datum). NORA baut auf Bestätigtem auf statt es zu wiederholen.
3. **Supabase Vorschlags-Historie** — letzte 30 Tage genehmigte + abgelehnte Vorschläge (Titel, Kategorie, Status). NORA weiß, was sie vermeiden soll.

Alle Quellen sind **best-effort**: fällt eine aus, läuft die Generierung still mit dem statischen Kontext weiter — nie blockiert.

## User Stories
- Als Stefan möchte ich, dass NORA mir nicht denselben Vorschlag bringt, den ich letzte Woche schon abgelehnt habe, damit ich meine < 2-Minuten täglich nicht mit bereits entschiedenen Themen verbringe.
- Als Stefan möchte ich, dass NORAss Produkt-Vorschläge auf dem aktuellen Entwicklungsstand von QualiPilot aufbauen, damit ich konkrete nächste Schritte statt generischer Feature-Ideen bekomme.
- Als Stefan möchte ich, dass NORA bestätigte Vorschläge als Ausgangspunkt für Folgevorschläge nutzt (z.B. „nächster Schritt nach dem bestätigten Outreach-Plan"), damit die BizDev-Arbeit kontinuierlich voranschreitet statt immer bei null anzufangen.
- Als Stefan möchte ich, dass ein QualiPilot Living Spec in Notion existiert, den NORA und Claude gemeinsam pflegen, damit das Produktwissen über QualiPilot wächst ohne dass ich es manuell einpflegen muss.
- Als Stefan möchte ich, dass fehlende oder nicht erreichbare Live-Quellen die Vorschlagsgenerierung niemals blockieren, damit mein täglicher Workflow zuverlässig bleibt.

## Out of Scope
- **GitHub-Aktivität lesen** — deferred für jetzt; Repo existiert (`billichstefan-ui/Qualipilot`), wird als optionale Quelle (Env-Vars `GITHUB_TOKEN` + `QUALIPILOT_REPO=billichstefan-ui/Qualipilot`) vorbereitet, aber erst aktiviert wenn Code vorhanden ist
- **Web-Scraping** (Branchen-News, Competitor-Monitoring) — PRD-Constraint: kein bezahltes/externes API im MVP
- **Manuelles Briefing-UI im Dashboard** — verworfen zugunsten automatischem Notion-Lesen; kein neues UI-Element nötig
- **Echtzeit-Updates** — NORA liest Kontext einmal pro Generierungslauf, kein Continuous Polling
- **„Kontext aktualisieren"-Button** für Stefan — nicht nötig, da automatisch bei jeder Generierung gelesen
- **Competitor-Analyse** — eigenes Feature, nicht Teil dieses Scopes
- **QualiPilot als separates Produkt** — QualiPilot ist ein eigenständiges B2B-SaaS für Pharma-Unternehmen, hat eine eigene Codebase und ist von NORA vollständig entkoppelbar. NORA kennt QualiPilot, QualiPilot kennt NORA nicht.

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

- [ ] Angenommen die Supabase-Vorschlags-Historie enthält Einträge der letzten 30 Tage, wenn NORA Vorschläge generiert, dann sind Titel und Kategorie der genehmigten und abgelehnten Vorschläge im Generierungs-Prompt enthalten
- [ ] Angenommen ein Vorschlag wurde in den letzten 30 Tagen mindestens 2x abgelehnt, wenn NORA neue Vorschläge generiert, dann schlägt sie dieses Thema/diese Richtung nicht erneut vor
- [ ] Angenommen bestätigte Vorschläge der letzten 30 Tage existieren, wenn NORA neue Vorschläge generiert, dann baut sie inhaltlich auf diesen auf statt sie zu wiederholen
- [ ] Angenommen ein QualiPilot Living Spec existiert in Notion, wenn NORA Produkt-Vorschläge generiert, dann basieren die Produkt-Vorschläge auf dem Inhalt des Living Spec
- [ ] Angenommen der QualiPilot Living Spec existiert nicht (oder die Seite ist leer), wenn NORA Vorschläge generiert, dann fällt sie still auf den statischen `NORA_COMPANY_CONTEXT` zurück — keine Fehlermeldung, keine Blockierung
- [ ] Angenommen Notion ist nicht erreichbar (Timeout, 429, 5xx), wenn NORA Vorschläge generiert, dann laufen die Vorschläge trotzdem durch — stiller Fallback auf statischen Kontext, kein Fehler für Stefan sichtbar
- [ ] Angenommen `NOTION_API_KEY` ist nicht gesetzt, wenn NORA Vorschläge generiert, dann wird die Notion-Quelle übersprungen — Generierung läuft normal mit Supabase-Historie + statischem Kontext

## Edge Cases
- **Notion-Rate-Limit (429):** Stiller Fallback — zählt wie „Notion nicht erreichbar"
- **Living Spec ohne Inhalt** (leere Seite angelegt, aber noch kein Text): Als nicht existent behandeln → statischer Fallback
- **Sehr viele Einträge in Supabase** (>100 Vorschläge in 30 Tagen): Auf die 20 aktuellsten begrenzen um den Prompt nicht zu überladen
- **Leere Vorschlags-Historie** (Neustart, frischer Account): Kein Fehler — NORA generiert ohne Historien-Kontext, nur statischer Context
- **Living Spec enthält veraltete Information** (z.B. Feature das längst gebaut wurde): Kein technisches Problem — Stefan/Claude aktualisieren die Seite; NORA liest immer den aktuellen Stand
- **`GITHUB_TOKEN` / `QUALIPILOT_REPO` gesetzt** (Env-Vars für spätere GitHub-Quelle): Werden ignoriert bis GitHub-Quelle aktiviert wird — kein Fehler

## Technical Requirements
- Alle Notion-Lese-Operationen: Timeout nach 5s, danach stiller Fallback
- Supabase-Abfrage der Historie: max. 20 Einträge, sortiert nach `created_at` DESC, letzten 30 Tage
- Living Spec Page ID: in `app_config` Tabelle als `notion_qualipilot_page_id` gespeichert
- Generierungs-Latenz: Live-Daten dürfen Gesamtlaufzeit um max. 10s erhöhen (Cron-Job, kein User-wartet)
- Keine neuen Env-Vars nötig: nutzt bestehende `NOTION_API_KEY` und Supabase-Verbindung

## Open Questions
- [x] Wie wird der QualiPilot Living Spec initial erstellt? → **NORA erstellt automatisch eine Vorlage beim ersten Lauf** (Architecture 2026-06-08)
- [x] Wie viel vom Living Spec-Inhalt soll in den Prompt? → **Max. 3.000 Zeichen** (Architecture 2026-06-08)
- [x] Soll NORA explizit auf Live-Daten referenzieren? → **Nein** — Vorschläge klingen natürlich besser ohne technische Hinweise (Architecture 2026-06-08)

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Automatisches Notion-Lesen statt manuelles Dashboard-Briefing | Kein zusätzlicher Aufwand für Stefan; Living Spec entsteht als Nebenprodukt der gemeinsamen QualiPilot-Entwicklung | 2026-06-08 |
| Supabase-Historie für abgelehnte Vorschläge | Notion enthält nur bestätigte Vorschläge; Supabase kennt auch Ablehnungen → verhindert Wiederholungen besser | 2026-06-08 |
| 30-Tage-Lookback-Fenster | Aktuell genug für relevante Kontinuität, alt genug um genug Daten zu haben | 2026-06-08 |
| Max. 20 Einträge aus Supabase-Historie | Prompt-Länge im Griff halten; die 20 aktuellsten Einträge sind am relevantesten | 2026-06-08 |
| GitHub-Quelle vorbereiten aber noch nicht aktivieren | QualiPilot hat noch kein Repo; Anbindung wird als Env-Var-gesteuerte optionale Quelle vorbereitet — aktiviert sich selbst wenn Repo + Token gesetzt | 2026-06-08 |
| QualiPilot ist von NORA entkoppelbar | QualiPilot = eigenständiges B2B SaaS, NORA = Stefans internes Tool. Abhängigkeit nur in eine Richtung: NORA kennt QualiPilot, nicht umgekehrt | 2026-06-08 |
| Best-effort für alle Live-Quellen | Vorschlagsgenerierung darf niemals blockieren (PRD-Constraint: < 2 Min täglicher Workflow) | 2026-06-08 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| Neues Modul `live-context.ts` statt Erweiterung von `route.ts` | Separation of concerns: Kontext-Aggregation ist eigenständige Verantwortung; leichter testbar | 2026-06-08 |
| Alle drei Quellen parallel, jede mit eigenem try/catch | Maximale Geschwindigkeit; eine fehlerhafte Quelle blockiert die anderen nicht | 2026-06-08 |
| 5s Timeout pro Notion-Quelle | Generierungslauf läuft im Cron-Job; 5s ist großzügig genug für Notion, klein genug um den maxDuration-Limit (60s) nicht zu gefährden | 2026-06-08 |
| Max. 3.000 Zeichen aus Living Spec | Ausreichend für Produktkontext; verhindert Prompt-Überladung bei langen Seiten | 2026-06-08 |
| Living Spec auto-erstellen bei erstem Lauf | Kein manueller Setup-Schritt für Stefan; sofort nützlich mit NORA_COMPANY_CONTEXT als Startinhalt | 2026-06-08 |
| Explizite Living-Spec-Referenz im Vorschlag-Text: NEIN | Vorschläge klingen natürlich; kein technischer Hinweis stört die < 2-Min-UX | 2026-06-08 |
| Supabase-Query erweitert: title + category + status | `status` nötig um approved vs. rejected zu unterscheiden; `category` für bessere Verteilung | 2026-06-08 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Datenfluss

```
Vercel Cron / Dashboard-Button
         ↓
GET/POST /api/generate-suggestions   (bestehend — PROJ-2)
         ↓
fetchLiveContext()                   (neu — src/lib/live-context.ts)
    ├── Supabase: letzte 20 Vorschläge (title, category, status, letzte 30 Tage)
    ├── Notion BizDev DB: letzte 30 Tage bestätigte Einträge (title, category, date)
    │   └── liest notion_database_id aus app_config (existiert seit PROJ-5)
    └── Notion Living Spec: Text-Inhalt (max. 3.000 Zeichen)
        ├── liest notion_qualipilot_page_id aus app_config
        └── existiert nicht → auto-erstellt Vorlage, speichert ID
    [jede Quelle: try/catch + 5s Timeout → stiller Fallback auf null]
         ↓
generateSuggestions(liveContext)     (bestehend, neuer Parameter)
         ↓
buildPrompt(liveContext)             (erweiterter Prompt, 3 neue Abschnitte)
         ↓
Claude API (claude-opus-4-8)
         ↓
Insert → Supabase suggestions
```

### Prompt-Erweiterung

`buildPrompt()` fügt bis zu drei neue Abschnitte ein (jeweils nur wenn Daten vorhanden):

```
## QualiPilot Aktueller Stand (aus Living Spec)
[Inhalt der Notion-Seite, max. 3.000 Zeichen]

## Bereits bestätigt (letzte 30 Tage) — darauf aufbauen:
- [Titel] | [Kategorie] | [Datum]

## Abgelehnt (letzte 30 Tage) — NICHT wiederholen:
- [Titel] | [Kategorie]
```

### Notion Living Spec — Auto-Erstellung

Beim ersten Generierungslauf: `app_config` enthält noch kein `notion_qualipilot_page_id`.
NORA erstellt automatisch eine Vorlage-Seite unter der bestehenden Notion Parent-Page
(gleiche `NOTION_PARENT_PAGE_ID` wie die BizDev-Datenbank), befüllt sie mit dem
aktuellen `NORA_COMPANY_CONTEXT` als Startinhalt, speichert die ID in `app_config`.
Stefan und Claude pflegen die Seite danach gemeinsam. Schlägt die Erstellung fehl →
stiller Fallback, kein Fehler.

### Datenmodell-Änderung

Keine neuen Tabellen. Neuer Eintrag in der bestehenden `app_config`-Tabelle:

| Schlüssel | Typ | Beschreibung |
|---|---|---|
| `notion_qualipilot_page_id` | string | Notion Page ID des QualiPilot Living Spec. Automatisch gesetzt beim ersten Lauf. |

### Geänderte / neue Dateien

| Datei | Änderung |
|---|---|
| `src/lib/live-context.ts` | **Neu** — fetcht alle drei Quellen parallel, gibt `LiveContext`-Objekt zurück |
| `src/lib/notion.ts` | **Erweitert** — neue Funktionen: BizDev-Einträge lesen, Living Spec Inhalt lesen, Living Spec Seite erstellen |
| `src/lib/anthropic.ts` | **Erweitert** — `buildPrompt()` nimmt optionalen `LiveContext`-Parameter, fügt neue Abschnitte ein |
| `src/app/api/generate-suggestions/route.ts` | **Erweitert** — ruft `fetchLiveContext()` auf, übergibt Ergebnis an `generateSuggestions()` |
| `.env.local.example` | **Erweitert** — dokumentiert optionale `GITHUB_TOKEN` + `QUALIPILOT_REPO` für späteren GitHub-Ausbau |

**Keine neuen Packages** — nutzt ausschließlich bestehende Abhängigkeiten.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
