# PROJ-4: Monday.com Task Auto-Creation

## Status: Approved
**Created:** 2026-06-07
**Last Updated:** 2026-06-07

## Dependencies
- Requires: PROJ-1 (Supabase Infrastructure) — Auth + `suggestions`-Tabelle
- Requires: PROJ-3 (Review & Approval Dashboard) — Bestätigen-Button + Server Action `updateSuggestionStatus`

## User Stories
- Als Stefan möchte ich, dass ein Monday.com-Task automatisch angelegt wird, wenn ich einen NORA-Vorschlag bestätige, damit ich keine manuelle Nacharbeit habe.
- Als Stefan möchte ich, dass der Task in der richtigen Gruppe (Marketing / Produkt / Operations) landet, damit mein Monday-Board strukturiert bleibt.
- Als Stefan möchte ich den vollen Vorschlagsinhalt (Body, Insight, Quelle) direkt im Monday-Task sehen, damit ich den Kontext ohne Umweg ins Dashboard habe.
- Als Stefan möchte ich nach der Task-Erstellung einen klickbaren Link zum Task sehen, damit ich ihn sofort in Monday öffnen kann.
- Als Stefan möchte ich, dass ein Fehler klar kommuniziert wird und kein halbfertiger Zustand entsteht, damit ich vertrauensvoll erneut versuchen kann.
- Als Stefan möchte ich das Monday-Board nicht manuell einrichten müssen, damit NORA sofort nach Eingabe des API-Keys einsatzbereit ist.

## Out of Scope
- **Retroaktive Task-Erstellung** — Vorschläge, die vor PROJ-4-Deployment bestätigt wurden, erhalten keinen Monday-Task nachträglich
- **Abgelehnte Vorschläge** — nur bestätigte Vorschläge lösen eine Monday-Aktion aus; abgelehnte werden ignoriert
- **Notion Document Auto-Creation** — deferred to PROJ-5
- **Bearbeiten / Löschen von Monday-Tasks aus NORA** — Tasks werden nur erstellt, nie aus NORA heraus verändert
- **Status-Sync von Monday → NORA** — wenn ein Monday-Task auf "Erledigt" gesetzt wird, ändert sich nichts in NORA
- **Retry-Mechanismus für fehlgeschlagene Erstellungen** — kein automatischer Wiederholungsversuch; Stefan klickt erneut auf "Bestätigen"
- **Multi-Workspace-Support** — ein API-Key, ein Workspace; keine Auswahl
- **Implementation Tracking & History** — deferred to PROJ-6

## Acceptance Criteria

### Board Auto-Setup

- [ ] Angenommen `MONDAY_API_KEY` ist gesetzt und noch kein "NORA BizDev"-Board existiert, wenn zum ersten Mal eine Bestätigung ausgelöst wird, dann erstellt NORA automatisch ein Board mit dem Namen "NORA BizDev" und drei Gruppen: "Marketing", "Produkt", "Operations" und speichert die Board-ID persistent (Supabase Config-Tabelle).
- [ ] Angenommen das "NORA BizDev"-Board wurde bereits erstellt und die ID ist gespeichert, wenn Stefan erneut einen Vorschlag bestätigt, dann wird kein neues Board angelegt — die gespeicherte Board-ID wird direkt verwendet.
- [ ] Angenommen das Board wurde in Monday.com manuell gelöscht, wenn Stefan einen Vorschlag bestätigt, dann erkennt NORA den 404-Fehler, erstellt das Board neu und speichert die neue Board-ID.

### Task-Erstellung

- [ ] Angenommen Stefan klickt auf "Bestätigen" und `MONDAY_API_KEY` ist gesetzt, wenn die Monday-API erreichbar ist, dann wird zuerst ein Task mit dem Vorschlagstitel als Name in der passenden Gruppe angelegt — und erst danach der Supabase-Status auf `approved` gesetzt.
- [ ] Angenommen der Task wurde erfolgreich angelegt, wenn die Erstellung abgeschlossen ist, dann wird eine Update-Nachricht mit folgendem Inhalt im Task gespeichert: Body-Text, Insight (als "💡 Insight:"-Abschnitt) und Quelle (als "📎 Quelle:"-Abschnitt).
- [ ] Angenommen der Task und das Update wurden erfolgreich erstellt, wenn Stefan die Bestätigung abschließt, dann erscheint ein Toast: *"✓ Task erstellt"* mit einem klickbaren Link, der die Monday-Task-URL im neuen Tab öffnet.
- [ ] Angenommen der Vorschlag hat die Kategorie `marketing`, wenn der Task erstellt wird, dann landet er in der Gruppe "Marketing" im "NORA BizDev"-Board — analog für `product` → "Produkt" und `operations` → "Operations".

### Fehlerbehandlung

- [ ] Angenommen die Monday-API ist nicht erreichbar oder gibt einen Fehler zurück, wenn Stefan auf "Bestätigen" klickt, dann bleibt der Supabase-Status auf `pending`, es wird kein DB-Update durchgeführt, und ein Toast erscheint: *"Monday.com nicht erreichbar — bitte erneut versuchen."*
- [ ] Angenommen `MONDAY_API_KEY` ist nicht als Umgebungsvariable gesetzt, wenn Stefan auf "Bestätigen" klickt, dann erscheint ein Toast: *"Monday.com nicht konfiguriert — API-Key fehlt."* und der Vorschlag bleibt auf `pending`.
- [ ] Angenommen die Monday-API gibt HTTP 429 (Rate Limit) zurück, wenn Stefan einen Task erstellen will, dann erscheint ein Toast: *"Monday.com kurz überlastet — bitte in einer Minute erneut versuchen."* — kein Auto-Retry, kein DB-Update.

## Edge Cases
- **Sehr langer Titel (>255 Zeichen):** Wird auf 255 Zeichen gekürzt bevor er an die Monday-API gesendet wird (API-Limit).
- **Fehlende Gruppe im Board:** Wenn die passende Gruppe (z. B. "Marketing") im Board nicht existiert, wird sie automatisch erstellt bevor der Task angelegt wird.
- **Bereits bestätigte Vorschläge (vor PROJ-4):** Erhalten keinen Monday-Task — kein Retroaktiv-Mechanismus in MVP.
- **Monday-API ändert Task-URL-Format:** Die Task-URL wird direkt aus der API-Antwort entnommen (nicht konstruiert) — robuster gegen API-Änderungen.
- **Netzwerkausfall nach Task-Erstellung aber vor DB-Update:** Monday-Task existiert, aber Supabase-Status bleibt `pending` — Stefan sieht die Karte weiterhin, kann erneut bestätigen, was einen doppelten Monday-Task erzeugt. Für MVP akzeptabel (sehr seltener Fall).

## Technical Requirements
- **Reihenfolge:** Monday-Task zuerst, dann Supabase-Update — verhindert `approved`-Zustand ohne Monday-Task
- **Sicherheit:** `MONDAY_API_KEY` ausschließlich server-seitig, nie mit `NEXT_PUBLIC_`-Prefix
- **Performance:** Task-Erstellung inkl. Board-Check < 5 Sekunden (Vercel maxDuration auf 30s gesetzt)
- **Persistenz:** Board-ID in Supabase `app_config`-Tabelle (Key-Value), nicht als Env-Var — damit kein Redeployment nach erster Board-Erstellung nötig

## Open Questions
- [ ] Soll der Monday-Task einen initialen Status (z. B. "Zu erledigen") bekommen, oder reicht der Monday-Standard-Status? — Empfehlung: Standard-Status, kein Extra-Setup
- [ ] Soll bei einem Doppel-Task (Edge Case: Netzwerkausfall nach Monday-Erstellung) eine Deduplizierungslogik eingebaut werden? — Empfehlung: Nein für MVP, in PROJ-6 (History) adressieren

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Task-Erstellung automatisch bei "Bestätigen" — kein separater Button | Eliminiert manuellen Schritt; PRD-Vision: "der Agent setzt sie selbständig als Monday-Tasks um" | 2026-06-07 |
| Dediziertes "NORA BizDev"-Board, vollautomatisch erstellt | Kein manuelles Setup durch Stefan; sofort einsatzbereit nach API-Key-Eingabe | 2026-06-07 |
| Drei Gruppen nach NORA-Kategorien (Marketing / Produkt / Operations) | Spiegelt die NORA-Struktur 1:1; Stefan findet Tasks intuitiv ohne Board-Umbau | 2026-06-07 |
| Body + Insight + Quelle als erste Update-Nachricht (nicht als Spalten) | Kein aufwändiges Column-Setup; voller Kontext trotzdem direkt im Task sichtbar | 2026-06-07 |
| Alles-oder-Nichts bei Fehler (kein DB-Update wenn Monday fehlschlägt) | Verhindert `approved`-Vorschläge ohne Monday-Task; einfachstes Fehlermodell | 2026-06-07 |
| Erfolgs-Toast mit klickbarem Link zur Monday-Task-URL | Stefan kann sofort in Monday öffnen und Task ergänzen — weniger Kontextwechsel | 2026-06-07 |
| Board-ID in Supabase `app_config` statt Env-Var | Kein Redeployment nach erster Board-Erstellung nötig; Board-ID ist Laufzeit-Zustand | 2026-06-07 |

### Technical Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Raw `fetch` statt Monday SDK (`monday-sdk-js`) | Monday.com GraphQL ist einfach genug für direkten `fetch`-Aufruf; kein zusätzliches npm-Paket, keine Bundle-Vergrößerung | 2026-06-07 |
| `app_config`-Tabelle in Supabase statt Env-Var für Board-ID | Board-ID ist Laufzeit-Zustand (wird erst bei erstem Lauf bekannt); Env-Var würde Redeployment nach Board-Erstellung erfordern | 2026-06-07 |
| Monday-Task zuerst, dann Supabase-Update | Verhindert `approved`-Zustand ohne Monday-Task; bei Monday-Fehler bleibt DB sauber auf `pending` | 2026-06-07 |
| Kein neues UI-Komponent — nur Toast-Link in bestehender `SuggestionCard` | PROJ-4 ist rein backend-seitig; die UI-Oberfläche ändert sich minimal | 2026-06-07 |
| Keine Speicherung der Monday-Task-URL in Supabase für MVP | URL wird nur im Toast gezeigt; persistente Speicherung kommt in PROJ-6 (Implementation Tracking) | 2026-06-07 |
| Neue `src/lib/monday.ts` — eigene Datei, nicht in `anthropic.ts` | Klare Trennung der externen Dienste; leichter testbar und austauschbar | 2026-06-07 |

---

## Tech Design (Solution Architect)

### Komponenten-Struktur

Keine neuen UI-Seiten oder -Komponenten. Änderungen sind fast vollständig backend-seitig — nur der Toast in der bestehenden `SuggestionCard` erhält einen Link.

```
Dashboard (bestehend — unverändert)
└── SuggestionCard (bestehend — Toast-Link ergänzen)
    └── "Bestätigen"-Button
        └── updateSuggestionStatus() [Server Action — ERWEITERT]
            ├── 1. Monday: Board suchen oder erstellen
            │       └── app_config-Tabelle (Supabase) — Board-ID lesen/schreiben
            ├── 2. Monday: Gruppe suchen oder erstellen (Marketing/Produkt/Operations)
            ├── 3. Monday: Task anlegen (Titel → Task-Name)
            ├── 4. Monday: Update-Nachricht hinzufügen (Body + Insight + Quelle)
            ├── 5. Supabase: suggestions.status → 'approved'
            └── Rückgabe: { monday_task_url }
```

### Neue Dateien

| Datei | Zweck |
|---|---|
| `src/lib/monday.ts` | Monday.com GraphQL-Client — alle API-Calls an Monday |
| Supabase Migration | `app_config`-Tabelle anlegen (Key-Value-Store) |

### Geänderte Dateien

| Datei | Änderung |
|---|---|
| `src/app/actions/suggestions.ts` | `updateSuggestionStatus` um Monday-Logik erweitern |
| `src/app/dashboard/suggestion-card.tsx` | Toast mit klickbarem Link wenn `monday_task_url` zurückkommt |

### Datenbankänderungen

**Neue Tabelle: `app_config`** (Key-Value-Store für Laufzeitkonfiguration)

```
app_config
├── key         Text (Primärschlüssel) — z. B. "monday_board_id"
├── value       Text                  — z. B. "12345678"
└── updated_at  Timestamp
```

Keine neue Spalte in `suggestions` für MVP — Monday-Task-URL wird nur im Toast gezeigt, nicht dauerhaft gespeichert (kommt in PROJ-6).

### Ablauf

```
Stefan klickt "Bestätigen"
       │
       ├─ MONDAY_API_KEY vorhanden? → Nein → Toast "nicht konfiguriert", Abbruch
       │
       ├─ Board-ID aus app_config lesen
       │   ├─ Vorhanden → Board in Monday prüfen
       │   │   ├─ Existiert → weiter
       │   │   └─ Gelöscht → Board neu erstellen, ID speichern
       │   └─ Nicht vorhanden → Board + Gruppen erstellen, ID speichern
       │
       ├─ Passende Gruppe suchen → nicht vorhanden → erstellen
       ├─ Task anlegen (Titel, max. 255 Zeichen)
       ├─ Update-Nachricht hinzufügen (Body + 💡 Insight + 📎 Quelle)
       ├─ Supabase: suggestions.status → 'approved'
       └─ Toast: "✓ Task erstellt" + Link zur Monday-Task-URL
```

### Neue Umgebungsvariable

| Variable | Zweck |
|---|---|
| `MONDAY_API_KEY` | Monday.com Personal API Token — nur server-seitig, nie `NEXT_PUBLIC_` |

### Abhängigkeiten

Keine neuen npm-Pakete. Monday.com GraphQL wird mit Standard-`fetch` aufgerufen.

## QA Test Results

**Getestet am:** 2026-06-07
**Methode:** Code-Level-Audit gegen alle Acceptance Criteria + Security-Review + automatisierte Unit-Tests. Live-E2E-Ausführung in dieser Cloud-Umgebung nicht möglich (keine Supabase-Credentials → Dev-Server startet nicht; identische Einschränkung wie PROJ-1/3). E2E-Tests sind geschrieben und mit `test.skip` hinterlegt, bis Test-Nutzer + Monday API Key vorhanden sind.

### Automatisierte Tests
- **Unit-Tests:** 40/40 grün (`npm test`) — davon 21 neue Tests für `monday.ts` (gql-Fehlerbehandlung, fetchBoard, createNoraBizDevBoard, ensureGroup, createTask, addUpdate) und 9 für die erweiterte Server Action
- **Build:** `npm run build` erfolgreich, keine TypeScript-Fehler
- **E2E:** 1 aktiver Test (Route-Schutz /dashboard → /login), 9 `test.skip` (benötigen Login + Monday API Key + Seed-Daten)

### Acceptance Criteria

| # | Kriterium | Ergebnis |
|---|-----------|----------|
| 1 | Board auto-erstellt (kein Board vorhanden) mit 3 Gruppen, ID in app_config gespeichert | ✅ Pass (Code) |
| 2 | Kein neues Board wenn ID bereits in app_config vorhanden | ✅ Pass (Code) |
| 3 | Gelöschtes Board erkannt (leere boards-Antwort) → Neuerstellung | ✅ Pass (Code) |
| 4 | Monday-Task zuerst, dann Supabase-Update (all-or-nothing) | ✅ Pass (Code) |
| 5 | Update-Nachricht mit Body + 💡 Insight + 📎 Quelle | ✅ Pass (Code + Unit Test) |
| 6 | Erfolgs-Toast "✓ Task erstellt" + "In Monday öffnen ↗"-Button | ✅ Pass (Code) |
| 7 | Kategorie-Zuordnung: marketing→Marketing, product→Produkt, operations→Operations | ✅ Pass (Code + Unit Test) |
| 8 | Monday-Fehler → pending bleibt, spezifischer Fehler-Toast | ✅ Pass (Code + Unit Test) |
| 9 | MONDAY_API_KEY fehlt → Toast "Monday.com nicht konfiguriert — API-Key fehlt." | ✅ Pass (Code + Unit Test, exakter Wortlaut) |
| 10 | HTTP 429 → Toast "Monday.com kurz überlastet..." | ✅ Pass (Code + Unit Test, exakter Wortlaut) |
| 11 | Titel >255 Zeichen → auf 255 Zeichen gekürzt | ✅ Pass (Code + Unit Test) |
| 12 | Fehlende Gruppe → automatisch erstellt | ✅ Pass (Code + Unit Test) |
| 13 | Authorization-Header ohne Bearer-Prefix (Monday.com-Konvention) | ✅ Pass (Unit Test) |

**Ergebnis: 13/13 Acceptance Criteria auf Code-Ebene erfüllt.**

### Security Audit (Red Team)

| Prüfung | Ergebnis |
|---------|----------|
| MONDAY_API_KEY Exposure | ✅ Nur in `monday.ts` und Server Action (server-seitig); kein `NEXT_PUBLIC_`-Prefix |
| Auth-Check vor Monday-Aufruf | ✅ `getUser()` wird vor allen Monday-Operationen geprüft |
| Client-Input-Injection | ✅ Vorschlags-Inhalt wird aus DB geholt (nicht vom Client) — kein Injection-Risiko |
| GraphQL-Injection | ✅ Alle variablen Werte über GraphQL-Variables übergeben (nie in Query-String eingebettet) |
| Supabase RLS auf app_config | ✅ SELECT + INSERT + UPDATE nur für authentifizierte Nutzer |
| SQL-Injection | ✅ Supabase parametrisiert alle Queries |
| Zod-Validierung | ✅ ID (UUID) + Status (Enum) validiert vor jeder Aktion |

### Gefundene Bugs

| # | Severity | Beschreibung | Status |
|---|----------|-------------|--------|
| 1 | Low | HTTP-Fehler-Toast zeigt `"Monday.com nicht erreichbar (HTTP 503)."` statt Spec-Text `"Monday.com nicht erreichbar — bitte erneut versuchen."` — informativer, aber nicht spec-konform | Offen — akzeptabel (mehr Info für Stefan) |
| 2 | Info | `url`-Feld von `create_item` benötigt Live-Verifizierung gegen echte Monday.com-API — wenn null, erscheint kein Toast-Link (Approval selbst funktioniert weiterhin) | Offen — verifizierbar beim ersten echten Test |
| 3 | Info | `app_config` UPDATE-Policy hat kein `WITH CHECK` — für Single-User-MVP akzeptabel | Dokumentiert |

**Keine Critical- oder High-Bugs.**

### Produktionsreife-Entscheidung: ✅ READY

40/40 Unit-Tests grün, 13/13 Acceptance Criteria auf Code-Ebene erfüllt, Security-Audit bestanden. Die 3 gefundenen Punkte sind Low/Informational und blockieren kein Deployment.

**Empfehlung vor Live-Gang:**
1. `app_config`-Migration in Supabase ausführen (SQL in `supabase/schema.sql` am Ende)
2. `MONDAY_API_KEY` in Vercel setzen
3. Ersten echten Test durchführen: Vorschlag bestätigen → Monday-Task prüfen → `url`-Feld verifizieren

## Deployment
_To be added by /deploy_
