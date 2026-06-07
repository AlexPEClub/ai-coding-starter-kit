# PROJ-2: Daily Suggestion Engine

## Status: In Progress
**Created:** 2026-06-07
**Last Updated:** 2026-06-07

## Dependencies
- Requires: PROJ-1 (Supabase Infrastructure) — `suggestions` + `daily_reports` Tabellen, Auth
- Versorgt: PROJ-3 (Review & Approval Dashboard) — liefert die Vorschläge, die Stefan reviewt

## User Stories
- Als Stefan möchte ich, dass NORA jeden Morgen automatisch frische Vorschläge generiert, damit ich BizDev vorantreibe, ohne selbst Ideen produzieren zu müssen.
- Als Stefan möchte ich, dass die Vorschläge auf dem Kontext von Nexora AI basieren, damit sie relevant für mein Unternehmen und meine Zielgruppe (Pharma/Healthcare) sind.
- Als Stefan möchte ich, dass sich die Vorschläge nicht täglich wiederholen, damit ich kontinuierlich neue Impulse bekomme.
- Als Stefan möchte ich die Generierung per Button manuell auslösen können, damit ich sie testen oder einen ausgefallenen Tag nachholen kann.
- Als Stefan möchte ich, dass ein fehlgeschlagener Lauf protokolliert wird und mein Dashboard trotzdem funktioniert, damit ein API-Ausfall nichts kaputt macht.

## Out of Scope
- **Bearbeitbarer Firmen-Kontext (Settings-UI)** — im MVP festgeschrieben in einer Config-Datei; ein editierbares Feld wird ggf. ein eigenes späteres Feature
- **Live-Datenquellen** (Web, LinkedIn, Marktdaten) — deferred to PROJ-7 (Context-Aware Suggestions)
- **Monday.com / Notion Umsetzung** der bestätigten Vorschläge — PROJ-4 / PROJ-5
- **Review/Anzeige der Vorschläge** — PROJ-3 (dieses Feature erzeugt nur die Daten)
- **E-Mail-Benachrichtigung** bei Erfolg oder Fehler — im MVP nur DB-Protokollierung, keine Mails (`daily_reports.email_*`-Felder bleiben vorerst ungenutzt)
- **Feste Quote pro Kategorie** — Claude entscheidet die Verteilung dynamisch
- **Konfigurierbare Generierungs-Uhrzeit** — fest auf 07:00; keine UI dafür

## Acceptance Criteria

### Automatische Generierung

- [ ] Angenommen es ist 07:00 Uhr und für heute existiert noch kein erfolgreicher Report, wenn der Cron-Job läuft, dann generiert NORA 3–5 neue Vorschläge und speichert sie mit Status `pending` in der `suggestions`-Tabelle.
- [ ] Angenommen die Generierung war erfolgreich, wenn der Lauf abschließt, dann wird ein Eintrag in `daily_reports` mit dem heutigen `report_date`, `suggestions_count` und Status `sent` angelegt.
- [ ] Angenommen NORA generiert Vorschläge, wenn ein Vorschlag erstellt wird, dann sind die Felder `title`, `body`, `insight`, `source` und `category` befüllt und `category` ist einer von `marketing`, `product`, `operations`.
- [ ] Angenommen über die Tage werden mehrere Vorschläge generiert, wenn NORA läuft, dann verteilt Claude die 3–5 Vorschläge flexibel auf die Kategorien (keine feste Quote).

### Kontext & Wiederholungsvermeidung

- [ ] Angenommen ein Firmen-Kontext über Nexora AI ist hinterlegt, wenn NORA generiert, dann basieren die Vorschläge auf diesem Kontext (Produkt QualiPilot, Zielgruppe Pharma/Healthcare, Positionierung).
- [ ] Angenommen es existieren Vorschläge aus den letzten ~30 Tagen, wenn NORA generiert, dann bekommt Claude diese als Kontext mit der Anweisung, Wiederholungen zu vermeiden und auf bisherigen Ideen aufzubauen.

### Doppellauf-Schutz

- [ ] Angenommen für heute existiert bereits ein erfolgreicher Report (`sent`), wenn der Generierungs-Lauf erneut angestoßen wird, dann wird er übersprungen und keine neuen Vorschläge werden erstellt.
- [ ] Angenommen für heute existiert nur ein fehlgeschlagener Report (`failed`), wenn der Lauf erneut angestoßen wird, dann ist ein erneuter Versuch erlaubt.

### Manueller Trigger

- [ ] Angenommen Stefan ist eingeloggt und im Dashboard, wenn er auf „Jetzt generieren" klickt, dann wird derselbe geschützte Generierungs-Endpunkt aufgerufen wie beim Cron.
- [ ] Angenommen Stefan klickt „Jetzt generieren", wenn die Generierung läuft, dann zeigt der Button einen Lade-Zustand; nach Erfolg wird das Dashboard neu geladen und die neuen Vorschläge erscheinen.
- [ ] Angenommen der Generierungs-Endpunkt wird ohne gültiges Secret / ohne Login aufgerufen, wenn die Anfrage eintrifft, dann wird sie abgelehnt (kein unbefugtes Auslösen).

### Fehlerbehandlung

- [ ] Angenommen der Claude-API-Aufruf schlägt fehl, wenn NORA generiert, dann werden 2–3 automatische Wiederholungen mit kurzer Pause versucht.
- [ ] Angenommen alle Wiederholungen schlagen fehl, wenn der Lauf endgültig scheitert, dann wird KEIN halbfertiger Report gespeichert und ein `daily_reports`-Eintrag mit Status `failed` protokolliert.
- [ ] Angenommen die Generierung ist gescheitert, wenn Stefan das Dashboard öffnet, dann sieht er weiterhin offene Vorschläge der Vortage oder den Empty State — kein Crash, keine technische Fehlermeldung.

## Edge Cases
- **Cron läuft doppelt am selben Tag**: Zweiter Lauf wird durch den `sent`-Report-Check übersprungen
- **Claude liefert ungültiges/unparsbares Format**: Zählt als Fehlversuch → Retry → ggf. `failed`, keine kaputten Vorschläge in der DB
- **Claude liefert weniger als 3 oder mehr als 5 Vorschläge**: NORA akzeptiert 3–5; bei Abweichung wird auf den gültigen Bereich begrenzt/nachgesteuert (Detail → Architecture)
- **Erster Lauf ohne Historie**: 30-Tage-Kontext ist leer → NORA generiert ohne Wiederholungs-Kontext, völlig normal
- **Manueller Trigger während ein Lauf bereits läuft**: Doppellauf-Schutz / Idempotenz verhindert parallele Doppel-Generierung
- **Tag ohne Generierung (z. B. Server down um 07:00)**: Kein Report für den Tag; Stefan kann per Button nachholen
- **Sehr lange Historie**: Nur die letzten ~30 Tage werden als Kontext mitgegeben (Token-/Kostengrenze)

## Technical Requirements
- **Security**: Generierungs-Endpunkt geschützt (Cron-Secret und/oder Login); Claude-API-Key + Service-Role-Key nur serverseitig, nie im Client-Bundle
- **Performance**: Ein Lauf sollte innerhalb des Cron-/Function-Timeouts abschließen (Vercel-Limit beachten)
- **Zuverlässigkeit**: Idempotenz über `daily_reports.report_date` (UNIQUE); Retry-Logik bei API-Fehlern
- **Kosten**: 30-Tage-Kontext begrenzt die Token-Menge; ein Lauf pro Tag

## Open Questions
- [x] Welches Claude-Modell wird verwendet? → **Opus 4.8** (`claude-opus-4-8`) — beste Qualität, Kosten bei 1 Lauf/Tag vernachlässigbar
- [x] Genaues Antwortformat von Claude? → **Structured Outputs** (`output_config.format` mit JSON-Schema), validierte Vorschlags-Liste
- [x] Endpunkt-Schutz? → **Cron-Secret (Bearer) ODER eingeloggte Session** — ein Endpunkt, zwei Auth-Wege
- [x] Cron-Zeitzone? → **06:00 UTC** (Vercel-Cron läuft in UTC; ≈ 07:00–08:00 deutsche Zeit je nach Sommerzeit)

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Vollautomatisch täglich um 07:00, kein Pflicht-Klick | Stefans Zeit ist knapp; Vorschläge sollen morgens schon bereitliegen | 2026-06-07 |
| Firmen-Kontext fest in Config-Datei (kein Settings-UI) | Schnell umsetzbar für MVP; editierbares Feld später als eigenes Feature | 2026-06-07 |
| 3–5 Vorschläge/Tag insgesamt, flexible Kategorie-Verteilung | Hält 2-Min-Review realistisch (PRD: ≥5 geprüft/Woche); Claude wählt relevanteste Bereiche | 2026-06-07 |
| Letzte ~30 Tage als Kontext gegen Wiederholungen | Vorschläge bleiben frisch und entwickeln sich weiter; nutzt vorhandene Tabelle | 2026-06-07 |
| `source` = NORAs Denkgrundlage (nicht echte Quelle) im MVP | Keine Live-Daten im MVP; echte Quellen erst in PROJ-7 | 2026-06-07 |
| Bei Fehler: Retry, dann `failed`, kein halber Report | Datenintegrität; Stefans Dashboard bleibt funktional | 2026-06-07 |
| Keine E-Mail-Benachrichtigung im MVP, nur DB-Protokoll | Reduziert Komplexität; Fehler sind in `daily_reports` sichtbar | 2026-06-07 |
| Doppellauf-Schutz über `sent`-Report-Check; `failed` erlaubt Retry | Verhindert doppelte Vorschläge, lässt aber Nachholen zu | 2026-06-07 |
| Ein geschützter Endpunkt für Cron UND „Jetzt generieren"-Button | Kein doppelter Code; bequemes Testen/Nachholen | 2026-06-07 |

### Technical Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Offizielles `@anthropic-ai/sdk` als Claude-Client | Standard für Next.js/TypeScript, typsicher | 2026-06-07 |
| Modell: Opus 4.8 (`claude-opus-4-8`) | Höchste strategische Qualität; bei 1 Lauf/Tag Kosten vernachlässigbar | 2026-06-07 |
| Structured Outputs (`output_config.format` + JSON-Schema) | Claude liefert garantiert valide Vorschläge mit allen Pflichtfeldern; kein Parsing-Risiko | 2026-06-07 |
| Service-Role-Client für DB-Schreibzugriff | Cron-Lauf hat keine User-Session; Key bereits in PROJ-1 vorbereitet | 2026-06-07 |
| Endpunkt-Schutz: Cron-Secret (Bearer) ODER eingeloggte Session | Vercel-Cron nutzt Secret, Button nutzt Session — ein Endpunkt, zwei Auth-Wege | 2026-06-07 |
| Cron um 06:00 UTC via `vercel.json` | Vercel-Cron läuft in UTC; fester Zeitpunkt, DST-Verschiebung akzeptiert | 2026-06-07 |
| Neue Env-Vars: `ANTHROPIC_API_KEY`, `CRON_SECRET` | API-Zugang + Endpunkt-Schutz, beide server-seitig | 2026-06-07 |

---

## Tech Design (Solution Architect)

### Komponenten-Struktur

```
src/app/api/generate-suggestions/
  route.ts                 (Geschützter POST-Endpunkt — Cron + Button rufen ihn auf)

src/lib/
  anthropic.ts             (Claude-Client + Generierungs-Logik mit Retry)
  nora-context.ts          (Fester Firmen-Kontext über Nexora AI — die "Wissensbasis")

src/app/dashboard/
  generate-button.tsx      ("Jetzt generieren"-Button, oben rechts neben Logout)

vercel.json                (Cron-Job-Definition: täglich 06:00 UTC)
```

### Datenfluss

```
Auslöser A: Vercel Cron (täglich 06:00 UTC)   Auslöser B: Stefan klickt "Jetzt generieren"
        │                                             │
        └─────────────────┬───────────────────────────┘
                          ▼
   POST /api/generate-suggestions  (prüft: gültiges Cron-Secret ODER eingeloggte Session)
                          │
                          ├─ 1. Existiert heute schon ein "sent"-Report? → Ja: abbrechen (Doppellauf-Schutz)
                          ├─ 2. Lade letzte ~30 Tage Vorschläge (Wiederholungs-Kontext)
                          ├─ 3. Claude API (Opus 4.8): Firmen-Kontext + Historie → 3–5 Vorschläge (JSON)
                          │      (bei Fehler: 2–3 Retries mit kurzer Pause)
                          ├─ 4a. Erfolg → Vorschläge speichern (status pending) + daily_report "sent"
                          └─ 4b. Endgültiger Fehler → daily_report "failed", nichts gespeichert
```

### Datenmodell
Keine neuen Tabellen — nutzt die bestehenden `suggestions` + `daily_reports` aus PROJ-1.
NORA befüllt pro Vorschlag: `title`, `body`, `insight`, `source`, `category`, `report_date`, `status='pending'`.

### Neue Packages
- `@anthropic-ai/sdk` — offizieller Claude-Client (1 neues Package)

### Neue Umgebungsvariablen
- `ANTHROPIC_API_KEY` — Claude-API-Schlüssel (server-seitig, nie `NEXT_PUBLIC_`)
- `CRON_SECRET` — geheimer Token für den Cron-Aufruf des Endpunkts

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
