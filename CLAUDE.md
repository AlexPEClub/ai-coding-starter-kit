# AI Coding Starter Kit

> A Next.js template with an AI-powered development workflow using specialized skills for Requirements, Architecture, Frontend, Backend, QA, and Deployment.

## Tech Stack

- **Framework:** Next.js 16 (App Router), TypeScript
- **Styling:** Tailwind CSS + shadcn/ui (copy-paste components)
- **Backend:** Self-hosted Supabase (PostgreSQL + Auth + Storage)
- **Deployment:** Docker + Traefik on Hetzner
- **Validation:** Zod + react-hook-form
- **State:** React useState / Context API

## Project Structure

```
src/
  app/              Pages (Next.js App Router)
  components/
    ui/             shadcn/ui components (NEVER recreate these)
  hooks/            Custom React hooks
  lib/              Utilities (supabase.ts, utils.ts)
features/           Feature specifications (PROJ-X-name.md)
  INDEX.md          Feature status overview
docs/
  PRD.md            Product Requirements Document
  production/       Production guides (Sentry, security, performance)
```

## Development Workflow

1. `/init` - Initialize the project: PRD + feature map (run once at the start)
2. `/write-spec` - Create a full feature spec for one feature
3. `/architecture` - Design tech architecture (PM-friendly, no code)
4. `/frontend` - Build UI components (shadcn/ui first!)
5. `/backend` - Build APIs, database, RLS policies
6. `/qa` - Test against acceptance criteria + security audit
7. `/deploy` - Deploy via Docker + Traefik on Hetzner + production-ready checks

Use `/refine PROJ-X` at any point to revisit and improve an existing feature spec.

## Feature Tracking

All features tracked in `features/INDEX.md`. Every skill reads it at start and updates it when done. Feature specs live in `features/PROJ-X-name.md`.

## Key Conventions

- **Feature IDs:** PROJ-1, PROJ-2, etc. (sequential)
- **Commits:** `feat(PROJ-X): description`, `fix(PROJ-X): description`
- **Single Responsibility:** One feature per spec file
- **shadcn/ui first:** NEVER create custom versions of installed shadcn components
- **Human-in-the-loop:** All workflows have user approval checkpoints
- **Tests:** Unit tests co-located next to source files (`useHook.test.ts` next to `useHook.ts`). E2E tests in `tests/`.

## Build & Test Commands

```bash
npm run dev          # Development server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run start        # Production server
npm test             # Vitest unit/integration tests
npm run test:e2e     # Playwright E2E tests
npm run test:all     # Both test suites
```

## Product Context

@docs/PRD.md

## Feature Overview

@features/INDEX.md

## Pflicht-Workflow

Für jedes neue Feature und jede Code-Änderung gilt verbindlich:
`/write-spec` → User-Review → `/architecture` → User-Review →
`/frontend` → `/backend` → `/qa` → `/deploy`

Nach `/write-spec` und nach `/architecture` wird **IMMER** auf explizites
"approved" vom User gewartet, bevor der nächste Schritt beginnt.

Ausnahme: Trivialer Hotfix (z.B. Einzeiler, ENV-Variable),
**NUR** wenn der User das Wort "Hotfix" explizit verwendet.
Dann darf der volle Workflow übersprungen werden,
aber die Spec/INDEX muss danach trotzdem aktualisiert werden.

## Anforderungsaufnahme (Phase 1) — vor `/write-spec`

Bevor eine Spec geschrieben wird, wird die Anforderung strukturiert erhoben.
Dafür wird der `grill-me`-Skill aufgerufen, der den User Frage für Frage
(mit Empfehlung je Frage) interviewt, bis ein gemeinsames Verständnis steht.

Leitfaden mit 10 Themen (1–5 an TMS 2.0 angepasst) — dienen `grill-me` als
inhaltlicher Fahrplan, nicht als starre Checkliste:

1. **Ziel & Nutzen** — welches Problem löst das Feature, welcher Mehrwert?
2. **Rollen & Rechte** — welche der 7 Rollen sind betroffen, welche RLS-Regeln?
3. **Datenmodell** — Entitäten, Felder, Beziehungen, Pflichtangaben.
4. **Workflow & Status** — Stationen, Statusübergänge, Rückläufer/Achtung.
5. **UI & Terminal-Tauglichkeit** — Touch ≥ 48px, Mobile-First, Design-System.
6. **Edge Cases & Fehler** — was darf nicht passieren, wie fangen wir Fehler ab?
7. **Integrationen & APIs** — externe Abhängigkeiten, Schnittstellen.
8. **Notifications** — wann/wen benachrichtigen (Rückläufer, Engpässe)?
9. **Statistiken & Reporting** — welche Kennzahlen sollen messbar sein?
10. **Performance & Datenmenge** — erwartetes Volumen, Antwortzeiten.

**Stopp-Kriterium:** keine feste Fragenanzahl — `grill-me` läuft, bis alle
relevanten Themen geklärt sind, oder der User „Genug" sagt.
Erst danach folgt `/write-spec`.

## Technische Grundhaltung — Secure by Design

- **Security & Robustheit vor Geschwindigkeit** (Security/Robustness over Velocity).
- Im Zweifel den **sichersten und stabilsten Weg** wählen — auch wenn er langsamer ist.
- Gilt für Architektur-, Backend- und Deployment-Entscheidungen gleichermaßen.

## Post-Deploy-Verifikation (Playwright, automatisch)

Die `/deploy`-Skill verifiziert jeden Deploy automatisch über `./scripts/deploy.sh PROJ-XX`:

- Das Skript führt Pre-Checks (Lint + Build), den Docker-Deploy und anschließend
  einen **Playwright-Smoke-Test gegen die Live-URL** aus (`npm run test:deploy`,
  Config `playwright.deploy.config.ts`, Tests in `tests/deploy/`).
- **Bei Erfolg:** Meldung „Deployed ✅" und Status in `features/INDEX.md` auf *Deployed*.
- **Bei Fehler:** maximal **5 Anläufe** (mit Backoff, falls der Container warmläuft),
  dann **Stopp** — Screenshots/Trace unter `test-results-deploy/` dienen als Beweis.
- Feature-spezifische Deploy-Tests kommen als weitere `*.spec.ts` in `tests/deploy/`.

## Kommunikation mit dem Product Manager

- Rückfragen an den User werden per **Werkstatt-Analogie** erklärt (verständlich,
  ohne Tech-Jargon).
- Gilt **nur** für die Kommunikation mit dem User — **nicht** für die Interaktion
  mit anderen Tools/Skills (dort normaler technischer Stil).
