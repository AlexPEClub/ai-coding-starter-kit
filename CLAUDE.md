# AI Coding Starter Kit

> A stack-neutral template with an AI-powered development workflow using specialized skills for Setup, Requirements, Architecture, Frontend, Backend, QA, and Deployment.
> **The tech stack below is chosen per project by `/setup`.** Placeholders in `{{...}}` are filled in when you run it.

## Tech Stack

- **Framework:** Next.js (App Router), TypeScript
- **Styling (web):** Tailwind CSS + shadcn/ui (copy-paste components)
- **Backend:** {{BACKEND}}  <!-- e.g. PocketBase (self-hosted EU VPS) / Appwrite / Nhost / Supabase / none -->
- **Deployment (web):** {{DEPLOY_TARGET}}  <!-- e.g. Cloudflare Pages / Vercel / Coolify on Hetzner -->
- **Mobile:** {{MOBILE}}  <!-- React Native (Expo) / none -->
- **Data protection:** {{DATA_RESIDENCY}}  <!-- e.g. self-hosted in EU (Hetzner), no CLOUD Act exposure -->
- **Validation:** Zod + react-hook-form
- **State:** React useState / Context API

> Not configured yet? Run `/setup` first — it interviews you, weighs the options against GDPR and cost, and writes this section, the backend rules, and the deploy target. Full rationale lives in `docs/STACK.md`.

## Project Structure

```
src/               (single-app layout — becomes web/ if a mobile app is added)
  app/              Pages (Next.js App Router)
  components/
    ui/             shadcn/ui components (NEVER recreate these)
  hooks/            Custom React hooks
  lib/              Utilities (backend client, utils.ts)
features/           Feature specifications (PROJ-X-name.md)
  INDEX.md          Feature status overview
docs/
  PRD.md            Product Requirements Document
  STACK.md          Chosen stack + rationale + data-residency note (written by /setup)
  production/       Production guides (error tracking, security, performance)
```

> If `/setup` enabled mobile, the repo is a monorepo: `web/`, `mobile/` (Expo), and `packages/shared` (types + API client). See `docs/STACK.md`.

## Development Workflow

1. `/setup` - Configure the stack: backend, deployment, mobile (run once on a fresh clone, before /init)
2. `/init` - Initialize the project: PRD + feature map (run once at the start)
3. `/write-spec` - Create a full feature spec for one feature
4. `/architecture` - Design tech architecture (PM-friendly, no code)
5. `/frontend` - Build web UI components (shadcn/ui first!)
6. `/mobile` - Build the Expo (React Native) UI (only if mobile is enabled)
7. `/backend` - Build APIs, database, access rules
8. `/qa` - Test against acceptance criteria + security audit
9. `/deploy` - Deploy to the chosen target + production-ready checks

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
