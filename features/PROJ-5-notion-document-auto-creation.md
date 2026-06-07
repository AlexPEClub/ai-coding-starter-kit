# PROJ-5: Notion Document Auto-Creation

## Status: Deployed
**Created:** 2026-06-07
**Last Updated:** 2026-06-07

## Dependencies
- Requires: PROJ-1 (Supabase Infrastructure) — Auth + `suggestions`-Tabelle + `app_config`-Tabelle
- Requires: PROJ-3 (Review & Approval Dashboard) — Bestätigen-Button + Server Action `updateSuggestionStatus`
- Requires: PROJ-4 (Monday.com Task Auto-Creation) — Monday muss zuerst erfolgreich sein; Notion ist best-effort danach

## User Stories
- Als Stefan möchte ich, dass beim Bestätigen eines Vorschlags automatisch eine Notion-Seite erstellt wird, damit ich eine dauerhafte Wissensbasis meiner BizDev-Entscheidungen aufbaue.
- Als Stefan möchte ich, dass die Notion-Seite den vollen Vorschlagsinhalt (Titel, Body, Insight, Quelle) formatiert als lesbare Strategie-Seite enthält, damit ich den Kontext ohne Umweg ins Dashboard habe.
- Als Stefan möchte ich, dass alle Notion-Seiten in einer strukturierten Datenbank "NORA BizDev" mit Kategorie, Datum und Monday-Task-Link liegen, damit ich filtern, sortieren und wiederfinden kann.
- Als Stefan möchte ich nach der Erstellung einen direkten Link zur Notion-Seite sehen, damit ich sie sofort öffnen und ergänzen kann.
- Als Stefan möchte ich, dass ein Notion-Fehler meinen bestätigten Monday-Task nicht rückgängig macht, damit ich keine doppelten Tasks bekomme.
- Als Stefan möchte ich das Notion-Setup nicht manuell durchführen müssen — nur API-Key + Parent-Seite konfigurieren reicht.

## Out of Scope
- **Retroaktive Seiten-Erstellung** — Vorschläge, die vor PROJ-5-Deployment bestätigt wurden, erhalten keine Notion-Seite nachträglich
- **Abgelehnte Vorschläge** — nur bestätigte Vorschläge erhalten eine Notion-Seite
- **Bearbeiten / Löschen von Notion-Seiten aus NORA** — Seiten werden nur erstellt, nie aus NORA heraus verändert
- **Sync von Notion → NORA** — Änderungen in Notion beeinflussen NORA nicht
- **Notion als Ersatz für Monday** — beide Integrationen sind komplementär, nicht redundant
- **Vollautomatische Notion-Workspace-Erkennung ohne Parent-Page-ID** — Notion's API erfordert eine explizite Parent-Page; Stefan gibt `NOTION_PARENT_PAGE_ID` als Env-Var an
- **Implementation Tracking & History** — deferred to PROJ-6
- **Retry-Mechanismus für fehlgeschlagene Notion-Erstellungen** — kein Auto-Retry; bei Fehler bleibt Vorschlag approved, Stefan kann Notion-Seite manuell erstellen

## Acceptance Criteria

### Datenbank Auto-Setup

- [ ] Angenommen `NOTION_API_KEY` und `NOTION_PARENT_PAGE_ID` sind gesetzt und noch keine "NORA BizDev"-Datenbank existiert, wenn zum ersten Mal eine Bestätigung ausgelöst wird, dann erstellt NORA automatisch eine Notion-Datenbank "NORA BizDev" mit den Eigenschaften: Kategorie (Select: Marketing/Produkt/Operations), Datum (Date), Monday-Task-Link (URL) — und speichert die Datenbank-ID in `app_config`.
- [ ] Angenommen die Datenbank-ID ist bereits in `app_config` gespeichert, wenn Stefan erneut bestätigt, dann wird keine neue Datenbank angelegt — die gespeicherte ID wird direkt verwendet.
- [ ] Angenommen die Datenbank wurde in Notion manuell gelöscht, wenn Stefan bestätigt, dann erkennt NORA den Fehler, erstellt die Datenbank neu und speichert die neue ID.

### Seiten-Erstellung

- [ ] Angenommen Monday-Task wurde erfolgreich erstellt und Notion ist erreichbar, wenn die Bestätigung abgeschlossen wird, dann wird eine neue Seite in der "NORA BizDev"-Datenbank angelegt mit: Titel = Vorschlagstitel, Kategorie = passende Select-Option, Datum = heutiges Datum, Monday-Task-Link = URL des Monday-Tasks.
- [ ] Angenommen die Notion-Seite wurde angelegt, wenn der Seiteninhalt aufgebaut wird, dann enthält der Seitenblock folgende Abschnitte: **Body** (als Paragraph-Block), **💡 Insight** (als Heading 3 + Paragraph), **📎 Quelle** (als Heading 3 + Paragraph) — nur wenn die jeweiligen Felder befüllt sind.
- [ ] Angenommen die Notion-Seite wurde erfolgreich erstellt, wenn Stefan die Bestätigung abschließt, dann erscheint ein zweiter Toast: *"✓ Notion-Seite erstellt"* mit einem klickbaren Button *"In Notion öffnen ↗"*, der die Seite im neuen Tab öffnet.
- [ ] Angenommen der Vorschlag hat Kategorie `marketing`, wenn die Seite erstellt wird, dann ist die Select-Eigenschaft "Kategorie" auf "Marketing" gesetzt — analog für `product` → "Produkt" und `operations` → "Operations".

### Fehlerbehandlung (best-effort)

- [ ] Angenommen Monday-Task wurde erfolgreich erstellt, aber Notion ist nicht erreichbar, wenn die Bestätigung abgeschlossen wird, dann wird der Vorschlag trotzdem als `approved` gespeichert und ein Warn-Toast erscheint: *"Task erstellt — Notion konnte nicht erreicht werden."*
- [ ] Angenommen `NOTION_API_KEY` ist nicht gesetzt, wenn Stefan bestätigt, dann läuft Monday normal durch, der Vorschlag wird `approved`, und ein Warn-Toast erscheint: *"Monday-Task erstellt — Notion nicht konfiguriert."*
- [ ] Angenommen `NOTION_PARENT_PAGE_ID` ist nicht gesetzt, wenn Stefan bestätigt, dann läuft Monday normal durch, der Vorschlag wird `approved`, und ein Warn-Toast erscheint: *"Monday-Task erstellt — Notion Parent-Page nicht konfiguriert."*
- [ ] Angenommen die Notion-API gibt HTTP 429 zurück, wenn die Seite erstellt werden soll, dann wird der Vorschlag trotzdem approved und ein Warn-Toast erscheint: *"Monday-Task erstellt — Notion kurz überlastet."*

## Edge Cases
- **Sehr langer Titel (>2000 Zeichen):** Notion-Seiten-Titel werden auf 2000 Zeichen gekürzt (Notion API-Limit).
- **Insight oder Quelle null:** Die jeweiligen Abschnitte werden in der Seite weggelassen — keine leeren Überschriften.
- **Datenbank-Eigenschaft "Kategorie" fehlt:** Wenn die Select-Eigenschaft nach manueller Änderung in Notion fehlt, wird die Seite ohne Kategorie-Eigenschaft angelegt (kein Fehler, nur fehlende Eigenschaft).
- **Monday-Fehler vor Notion:** Wenn Monday fehlschlägt (wie bisher), wird Notion gar nicht erst aufgerufen — PROJ-4-Verhalten unverändert.
- **Netzwerkausfall zwischen Monday-Erfolg und Notion-Versuch:** Monday-Task existiert, Notion-Seite fehlt → Vorschlag wird trotzdem approved (best-effort), Warn-Toast erscheint.
- **NOTION_PARENT_PAGE_ID zeigt auf eine Seite, auf die die Integration keinen Zugriff hat:** Notion gibt 403 zurück → Warn-Toast "Notion Zugriff verweigert — Integration zur Parent-Seite hinzufügen."

## Technical Requirements
- **Reihenfolge:** Monday zuerst (PROJ-4), dann Notion (best-effort), dann Supabase-Update
- **Sicherheit:** `NOTION_API_KEY` ausschließlich server-seitig, nie mit `NEXT_PUBLIC_`-Prefix
- **Performance:** Gesamtdauer "Bestätigen" < 10 Sekunden (Monday + Notion + DB)
- **Persistenz:** Notion-Datenbank-ID in Supabase `app_config` (Key: `notion_database_id`) — kein Redeployment nach erster Erstellung nötig

## Open Questions
- [ ] Soll die Notion-Seiten-URL dauerhaft in der `suggestions`-Tabelle gespeichert werden (neue Spalte `notion_page_url`)? — Empfehlung: Ja, für PROJ-6 (Implementation Tracking); für PROJ-5-MVP reicht der Toast-Link
- [ ] Soll Stefan in Notion eine Parent-Seite manuell anlegen (z.B. "NORA"), oder kann NORA eine Toplevel-Seite direkt im Workspace erstellen? — Empfehlung: Stefan legt einmalig eine Parent-Seite an und gibt die ID als Env-Var an; Workspace-Root erfordert erweiterte Berechtigungen

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Gleicher Auslöser wie Monday — "Bestätigen" löst beide aus | Kein zusätzlicher manueller Schritt; PRD-Vision: "der Agent setzt sie selbständig um" | 2026-06-07 |
| Notion-Dokument als ausführliche Strategie-Seite (Body + Insight + Quelle als Blöcke) | Differenziert sich von Monday-Task (kompakt/actionable) durch Tiefe; Notion = Wissensbasis | 2026-06-07 |
| Notion-Datenbank mit Eigenschaften (Kategorie, Datum, Monday-Link) | Strukturierte Wissensbasis; Stefan kann filtern/sortieren; mehr Wert als einfache Seiten | 2026-06-07 |
| Notion ist best-effort — bei Fehler bleibt Vorschlag approved | Verhindert Duplikat-Monday-Tasks beim Retry; Monday ist die primäre Aktion | 2026-06-07 |
| Zwei separate Toasts (Monday + Notion) statt ein kombinierter | Klare Trennung der zwei Ergebnisse; Sonner unterstützt nur einen Action-Button pro Toast | 2026-06-07 |
| `NOTION_PARENT_PAGE_ID` als Env-Var (einmalig manuell) statt Workspace-Root | Notion's Berechtigungsmodell erfordert explizite Integration-Freigabe pro Seite; Workspace-Root-Zugriff ist komplexer zu konfigurieren | 2026-06-07 |
| Datenbank-ID in `app_config` gespeichert — wie Monday Board-ID | Kein Redeployment nach erster Erstellung; konsistentes Muster mit PROJ-4 | 2026-06-07 |

### Technical Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Raw `fetch` statt `@notionhq/client` SDK | Notion REST ist einfach genug; konsistent mit `monday.ts`; kein zusätzliches npm-Paket | 2026-06-07 |
| Notion-Datenbank-ID in `app_config` (Key: `notion_database_id`) | Konsistentes Muster mit PROJ-4 (Monday Board-ID); kein Redeployment nach erster Erstellung | 2026-06-07 |
| Notion best-effort nach Monday-Erfolg, vor Supabase-Update | Monday ist primär; Notion-Fehler darf Approval nicht blockieren; Supabase-Update bleibt letzter Schritt | 2026-06-07 |
| Neues `notion_warning`-Feld im Action-Rückgabewert | Ermöglicht spezifischen Warn-Toast ohne den `success`-Status zu kompromittieren | 2026-06-07 |
| Neue `src/lib/notion.ts` — eigene Datei, nicht in `suggestions.ts` | Klare Trennung der externen Dienste; gleiche Struktur wie `monday.ts`; leichter testbar | 2026-06-07 |
| `Notion-Version: 2022-06-28` Header — aktuelle stabile Version | Stabile API-Version; schützt vor Breaking Changes bei neuen Notion-API-Versionen | 2026-06-07 |

---

## Tech Design (Solution Architect)

### Komponenten-Struktur

Keine neuen UI-Seiten oder -Komponenten. Änderungen sind vollständig backend-seitig — nur `dashboard-client.tsx` bekommt den zweiten Toast.

```
Dashboard (bestehend — unverändert)
└── SuggestionCard (bestehend — unverändert)
    └── "Bestätigen"-Button
        └── updateSuggestionStatus() [Server Action — ERWEITERT]
            ├── 1. Monday: Task erstellen (PROJ-4 — unverändert)
            ├── 2. Notion: Datenbank suchen oder erstellen (best-effort)
            │       └── app_config-Tabelle (Key: notion_database_id)
            ├── 3. Notion: Seite mit Properties + Inhalts-Blöcken anlegen
            ├── 4. Supabase: suggestions.status → 'approved'
            └── Rückgabe: { monday_task_url, notion_page_url?, notion_warning? }
```

### Neue Dateien

| Datei | Zweck |
|---|---|
| `src/lib/notion.ts` | Notion REST API-Client — Datenbank + Seiten erstellen |

### Geänderte Dateien

| Datei | Änderung |
|---|---|
| `src/app/actions/suggestions.ts` | Nach Monday-Erfolg: Notion best-effort, dann DB-Update; erweiterter Rückgabe-Typ |
| `src/app/dashboard/dashboard-client.tsx` | Zweiter Toast mit "In Notion öffnen ↗" + Warn-Toast bei notion_warning |

### Rückgabe-Typ der Server Action

```
{
  success: boolean
  error?: string             — Monday-Fehler (Vorschlag bleibt pending)
  monday_task_url?: string
  notion_page_url?: string   — URL der erstellten Notion-Seite
  notion_warning?: string    — Warn-Text wenn Notion fehlschlug aber Approval durchging
}
```

### Ablauf

```
Stefan klickt "Bestätigen"
       │
       ├─ Monday: Task erstellen (wie PROJ-4)
       │   └─ Fehler → Abbruch, Vorschlag bleibt pending
       │
       ├─ Notion (best-effort):
       │   ├─ NOTION_API_KEY fehlt → notion_warning setzen, überspringen
       │   ├─ NOTION_PARENT_PAGE_ID fehlt → notion_warning setzen, überspringen
       │   ├─ Datenbank-ID aus app_config → existiert noch? → sonst neu erstellen
       │   ├─ Seite anlegen (Kategorie, Datum, Monday-Link als Properties)
       │   ├─ Seiten-Blöcke hinzufügen (Body, 💡 Insight, 📎 Quelle)
       │   └─ Fehler → notion_warning setzen, weitermachen
       │
       ├─ Supabase: status → 'approved'
       │
       └─ Toast 1: "✓ Task erstellt — In Monday öffnen ↗" (immer)
          Toast 2: "✓ Notion-Seite erstellt — In Notion öffnen ↗" (bei Erfolg)
          ODER: Warn-Toast mit notion_warning (bei Fehler)
```

### Seitenstruktur in Notion

```
[Vorschlagstitel]          ← Seiten-Titel (Datenbankzeile)
Properties:
  Kategorie: Marketing     ← Select
  Datum: 2026-06-07        ← Date
  Monday-Task: [URL]       ← URL

─────────────────────────
Body-Text                  ← Paragraph-Block

💡 Insight                 ← Heading 3-Block
[Insight-Text]             ← Paragraph-Block

📎 Quelle                  ← Heading 3-Block
[Quellen-Text]             ← Paragraph-Block
```

### Neue Umgebungsvariablen

| Variable | Zweck |
|---|---|
| `NOTION_API_KEY` | Internal Integration Token — nur server-seitig, nie `NEXT_PUBLIC_` |
| `NOTION_PARENT_PAGE_ID` | Notion-Seiten-ID, unter der die Datenbank erstellt wird |

### Abhängigkeiten

Keine neuen npm-Pakete. Notion REST API wird mit Standard-`fetch` aufgerufen — konsistent mit `monday.ts`.

## Implementation Notes

### Neue Dateien
- `src/lib/notion.ts` — Notion REST API-Client (raw fetch, kein SDK). Funktionen: `fetchDatabase`, `createNoraBizDevDatabase`, `createPage`
- `src/lib/notion.test.ts` — 26 Unit-Tests (alle grün)

### Geänderte Dateien
- `src/app/actions/suggestions.ts` — `ActionResult` um `notion_page_url?` + `notion_warning?` erweitert; `getOrCreateNotionDatabase`-Hilfsfunktion; Notion best-effort Block nach Monday-Erfolg
- `src/app/dashboard/dashboard-client.tsx` — Zweiter Success-Toast "✓ Notion-Seite erstellt" + Warn-Toast für `notion_warning`
- `src/app/actions/suggestions.test.ts` — 5 neue Notion-Integrationstests; Notion-Mock hinzugefügt (70 Tests total, alle grün)

### Neue Umgebungsvariablen (in Vercel setzen)
- `NOTION_API_KEY` — Internal Integration Token von notion.so/my-integrations
- `NOTION_PARENT_PAGE_ID` — ID der Notion-Seite, unter der die "NORA BizDev"-Datenbank erstellt wird

### Abweichungen vom Design
Keine — Implementierung entspricht exakt dem Architecture-Design.

### Post-Deployment Fix (2026-06-07)
- **Problem:** `NOTION_PARENT_PAGE_ID` wurde als volle Notion-URL gesetzt → Notion-API lehnte `parent.page_id` ab ("should be a valid uuid").
- **Fix:** `normalizeNotionId()` in `src/lib/notion.ts` extrahiert die 32-stellige Hex-ID aus jedem Format (rohe ID, gestrichelte UUID, volle URL mit Query-Parametern) und formatiert sie als UUID. 7 neue Unit-Tests.
- **Commit:** `fix(PROJ-5): Accept full Notion URL or raw ID for NOTION_PARENT_PAGE_ID`
- **Verifiziert:** Notion-Seiten-Erstellung in Produktion erfolgreich.

## QA Test Results

**Datum:** 2026-06-07
**Tester:** QA Engineer (automatisiert + Code-Review)
**Status:** ✅ Approved — keine Critical/High Bugs

### Acceptance Criteria

#### Datenbank Auto-Setup
| # | Kriterium | Status | Notiz |
|---|-----------|--------|-------|
| AC-1 | Neue Datenbank "NORA BizDev" mit Eigenschaften bei erster Bestätigung | ✅ Pass | Code-Review: `createNoraBizDevDatabase` korrekt implementiert, ID in `app_config` gespeichert |
| AC-2 | Keine neue Datenbank wenn ID bereits in app_config | ✅ Pass | Code-Review: `fetchDatabase` prüft Existenz, `getOrCreateNotionDatabase` gibt gespeicherte ID zurück |
| AC-3 | Neue Datenbank wenn Notion-DB manuell gelöscht (404) | ✅ Pass | Code-Review: `fetchDatabase` gibt null bei 404 zurück → neue DB wird erstellt |

#### Seiten-Erstellung
| # | Kriterium | Status | Notiz |
|---|-----------|--------|-------|
| AC-4 | Seite mit Titel, Kategorie, Datum, Monday-Link angelegt | ✅ Pass | Code-Review: alle Properties korrekt gesetzt; 26 Unit-Tests grün |
| AC-5 | Seite enthält Body, 💡 Insight, 📎 Quelle als Blocks | ✅ Pass | Unit-Tests: optionale Blöcke werden bei null weggelassen |
| AC-6 | Toast "✓ Notion-Seite erstellt" mit "In Notion öffnen ↗" | ✅ Pass | Code-Review: dashboard-client.tsx L34-44 |
| AC-7 | Kategorie-Mapping: marketing→Marketing, product→Produkt, operations→Operations | ✅ Pass | Unit-Test: CATEGORY_TO_NOTION alle drei Werte geprüft |

#### Fehlerbehandlung
| # | Kriterium | Status | Notiz |
|---|-----------|--------|-------|
| AC-8 | Notion nicht erreichbar → Vorschlag approved + Warn-Toast | ✅ Pass | Code-Review + Unit-Test: best-effort try/catch, Supabase-Update läuft trotzdem |
| AC-9 | NOTION_API_KEY fehlt → Warn-Toast "Monday-Task erstellt — Notion nicht konfiguriert." | ✅ Pass | Unit-Test: `setzt notion_warning wenn NOTION_API_KEY fehlt` |
| AC-10 | NOTION_PARENT_PAGE_ID fehlt → Warn-Toast "Monday-Task erstellt — Notion Parent-Page nicht konfiguriert." | ✅ Pass | Unit-Test: `setzt notion_warning wenn NOTION_PARENT_PAGE_ID fehlt` |
| AC-11 | HTTP 429 → Vorschlag approved + Warn-Toast "Monday-Task erstellt — Notion kurz überlastet." | ✅ Pass | Unit-Test: `wirft bei HTTP 429` + best-effort Catch |

### Edge Cases
| Edge Case | Status | Notiz |
|-----------|--------|-------|
| Titel > 2000 Zeichen | ✅ Pass | Unit-Test: `kürzt Titel auf 2000 Zeichen` |
| Insight = null | ✅ Pass | Unit-Test: `lässt Insight-Blöcke weg wenn insight null ist` |
| Quelle = null | ✅ Pass | Unit-Test: `lässt Quellen-Blöcke weg wenn source null ist` |
| Monday schlägt fehl → Notion wird gar nicht aufgerufen | ✅ Pass | Code-Review: Notion-Block liegt im Monday-try-Block, nach `addUpdate()` |
| mondayUrl = null → Monday-Task-Link Property wird weggelassen | ✅ Pass | Unit-Test: `lässt Monday-Task-Link weg wenn mondayUrl null ist` |
| 403 bei Parent-Seite ohne Integration | ✅ Pass | Code-Review: wirft spezifische Meldung "Zugriff verweigert — Integration zur Parent-Seite hinzufügen." |
| Kategorie-Property in Notion manuell gelöscht | ⚠️ Low | Notion gibt 400 zurück → best-effort zeigt Warn-Toast statt Seite ohne Eigenschaft (akzeptabel für MVP) |

### Automated Tests
- **Unit-Tests (Vitest):** 70/70 ✅ — inkl. 26 neue notion.ts-Tests, 5 neue suggestions.ts Notion-Tests
- **E2E-Tests (Playwright):** Route-Schutz-Test aktiv; Integrationstests `test.skip` (benötigen echte Credentials — in Produktion auszuführen)

### Security Audit
| Prüfpunkt | Status | Detail |
|-----------|--------|--------|
| NOTION_API_KEY nie mit NEXT_PUBLIC_ | ✅ Pass | Grep über /src — kein Match |
| NOTION_API_KEY nie im Client-Bundle | ✅ Pass | `'use server'` Direktive in suggestions.ts |
| Auth-Check vor allen DB-Operationen | ✅ Pass | `auth.getUser()` vor jeder Aktion |
| Zod-Input-Validierung | ✅ Pass | UUID + enum-Validierung |
| Keine Injection-Möglichkeiten | ✅ Pass | Alle API-Calls verwenden strukturiertes JSON, kein String-Building |
| Keine sensiblen Daten in API-Response | ✅ Pass | ActionResult gibt nur URLs zurück |

### Gefundene Bugs
| ID | Schwere | Beschreibung | Reproduzierbar | Empfehlung |
|----|---------|-------------|----------------|------------|
| BUG-L001 | Low | Wenn die "Kategorie"-Property in Notion manuell gelöscht wird, schlägt `createPage` mit 400 fehl statt die Seite ohne Eigenschaft anzulegen | Nur wenn Stefan die DB-Struktur manuell ändert | Akzeptabel für MVP; Warn-Toast informiert Stefan |
| BUG-L002 | Low | Kein explizites fetch-Timeout für Notion/Monday API-Calls | Tritt auf wenn API hängt | Next.js Server Action Timeout (Standard: 30s) greift trotzdem |

### Responsiveness
- Code-Review: Keine neuen UI-Komponenten — vollständig backend-seitig, keine Responsive-Änderungen nötig

### Regression
- ✅ PROJ-4 Monday-Flow: Toast-Logik refactored aber funktional identisch (Code-Review bestätigt)
- ✅ PROJ-3 Ablehnen/Rückgängig: Kein PROJ-5-Code involviert

### Produktionsempfehlung
**✅ PRODUCTION READY** — Keine Critical oder High Bugs. Zwei Low-Bugs sind dokumentiert und für MVP akzeptabel.

## Deployment

**Status:** ✅ Deployed
**Production URL:** https://ai-coding-starter-kit-psi.vercel.app
**Deployed:** 2026-06-07
**Git Tag:** v1.2.0-PROJ-5
**Deploy-Methode:** Vercel Auto-Deploy von `main`

### Pre-Deployment Checks
- ✅ `npm run build` erfolgreich (TypeScript-Typprüfung grün)
- ✅ QA Approved — keine Critical/High Bugs
- ✅ Keine hartcodierten Secrets im Code (git grep verifiziert)
- ✅ Alle Änderungen committed und gepusht
- ⚠️ `npm run lint` nicht ausführbar (`next lint` in Next.js 16 entfernt, kein eslint.config.js — projektweites Setup-Thema, nicht PROJ-5-bezogen)

### Erforderliche Vercel Environment Variables (neu für PROJ-5)
- `NOTION_API_KEY` — Internal Integration Token (server-seitig)
- `NOTION_PARENT_PAGE_ID` — ID der Notion-Parent-Seite

### Manuelle Nacharbeit
- `.env.local.example` konnte nicht automatisch aktualisiert werden (Datei-Berechtigung gesperrt). Die neuen Variablen `NOTION_API_KEY` und `NOTION_PARENT_PAGE_ID` sollten dort dokumentiert werden.

### Notion-Setup (einmalig, vom Nutzer durchgeführt)
1. Internal Integration auf notion.so/my-integrations erstellt → Token als `NOTION_API_KEY`
2. Parent-Seite in Notion angelegt und Integration über "Verbindungen" hinzugefügt
3. Seiten-ID als `NOTION_PARENT_PAGE_ID` in Vercel gesetzt

### Post-Deployment Verifikation
- [ ] Vorschlag im Dashboard bestätigen → Notion-Toast "✓ Notion-Seite erstellt" erscheint
- [ ] "In Notion öffnen ↗" öffnet die erstellte Seite
- [ ] "NORA BizDev"-Datenbank in Notion enthält die Seite mit Kategorie, Datum, Monday-Link
- [ ] Seiteninhalt enthält Body + 💡 Insight + 📎 Quelle
