# PROJ-5: Notion Document Auto-Creation

## Status: Architected
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

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
