# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> A Next.js template with an AI-powered development workflow using specialized skills for Requirements, Architecture, Frontend, Backend, QA, and Deployment.

## Tech Stack

- **Framework:** Next.js 16 (App Router), TypeScript
- **Styling:** Tailwind CSS + shadcn/ui (copy-paste components)
- **Backend:** Supabase (PostgreSQL + Auth + Storage) - optional
- **Deployment:** Vercel
- **Validation:** Zod + react-hook-form
- **State:** React useState / Context API

## Build & Test Commands

```bash
npm run dev        # Development server (localhost:3000)
npm run build      # Production build
npm run lint       # ESLint
npm run start      # Production server
```

To add shadcn/ui components: `npx shadcn@latest add <component-name> --yes`

## Project Structure

```
src/
  app/              Pages (Next.js App Router)
  components/
    ui/             shadcn/ui components (35+ pre-installed — NEVER recreate these)
  hooks/            Custom React hooks
  lib/              Utilities (supabase.ts, utils.ts)
features/           Feature specifications (PROJ-X-name.md)
  INDEX.md          Feature status overview
docs/
  PRD.md            Product Requirements Document
  production/       Production guides (error-tracking, security-headers, performance, rate-limiting)
.claude/
  rules/            Auto-applied coding rules (matched by file path patterns)
  skills/           Invocable workflows (/requirements, /architecture, /frontend, /backend, /qa, /deploy, /help)
  agents/           Sub-agent configs for forked skills (frontend-dev, backend-dev, qa-engineer)
```

## Development Workflow

1. `/requirements` - Create feature as GitHub Issue (interactive, inline)
2. `/architecture #N` - Design tech architecture, posts as issue comment (inline)
3. `/frontend #N` - Build UI components (runs as forked sub-agent)
4. `/backend #N` - Build APIs, database, RLS policies (runs as forked sub-agent)
5. `/qa #N` - Test against acceptance criteria + security audit (runs as forked sub-agent)
6. `/deploy #N` - Deploy to Vercel, closes the issue (inline)

Heavy skills (`/frontend`, `/backend`, `/qa`) run as forked sub-agents with isolated context windows to prevent context pollution between phases.

## Feature Tracking (GitHub Issues)

All features are tracked as **GitHub Issues** — no local spec files.

```bash
gh issue list                          # Alle Features + Status
gh issue list --label "in-progress"    # Nach Status filtern
gh issue view <number> --comments      # Feature + Tech Design + QA lesen
```

**Labels:** `planned` → `in-progress` → `in-review` → `deployed`

**If `docs/PRD.md` still has placeholder text or `gh issue list` returns nothing**, the project is not initialized — run `/requirements` before any implementation work.

## Key Conventions

- **Feature IDs:** GitHub Issue numbers (#1, #2, ...)
- **Commits:** `feat(#N): description`, `fix(#N): description`
- **Single Responsibility:** One issue per feature
- **shadcn/ui first:** NEVER create custom implementations of Button, Input, Select, Dialog, Card, Badge, Tabs, Toast, Table, etc. — check `src/components/ui/` first
- **Always read before editing:** Never assume file contents; re-read after context compaction

## Frontend Rules (auto-applied to `src/components/**`, `src/app/**/page.tsx`)

- Use Tailwind CSS exclusively (no inline styles, no CSS modules)
- All components must be responsive (375px / 768px / 1440px)
- Implement loading, error, and empty states
- Use TypeScript interfaces for all props
- Supabase auth: use `window.location.href` (not `router.push`) for post-login redirect; always verify `data.session` before redirecting

## Backend Rules (auto-applied to `src/app/api/**`, `src/lib/supabase*`)

- ALWAYS enable Row Level Security on every Supabase table
- Validate all inputs with Zod before processing
- Always check authentication in API routes
- Use Supabase joins instead of N+1 query loops; use `.limit()` on all list queries
- Any RLS policy changes or auth flow changes require explicit user approval

## Security Rules (auto-applied to `src/app/api/**`, `.env*`, `next.config.*`)

- Use `NEXT_PUBLIC_` prefix ONLY for values safe to expose in the browser
- Document all required env vars in `.env.local.example`
- Any new environment variables must be added to `.env.local.example`

## Product Context

@docs/PRD.md
