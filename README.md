# AI Coding Starter Kit

> Build production-ready web apps faster with AI-powered Skills handling Requirements, Architecture, Development, QA, and Deployment.

This template uses [Claude Code](https://docs.anthropic.com/en/docs/claude-code) with modern Skills, Rules, and Sub-Agents to provide a complete AI-powered development workflow.

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/ai-coding-starter-kit.git my-project
cd my-project
npm install
npx playwright install chromium   # one-time: installs browser for E2E tests (~300MB)
```

### 2. (Optional) Supabase Setup

If you need a backend:

1. Create Supabase Project: [supabase.com](https://supabase.com)
2. Copy `.env.local.example` to `.env.local`
3. Add your Supabase credentials
4. Uncomment the Supabase client in `src/lib/supabase.ts`

Skip this step if you're building frontend-only (landing pages, portfolios, etc.)

### 3. Start Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Initialize Your Project

Open Claude Code and run `/init` with a brief description of your idea:

```
/init I want to build a project management tool for small teams
where users can create projects, assign tasks, and track progress.
```

The skill interviews you one question at a time (**Grill Me** principle — always with a recommended answer you just confirm or correct) until there's a shared understanding. It then:
1. Creates your **Product Requirements Document** (`docs/PRD.md`)
2. Breaks the project into a prioritized feature map (P0/P1/P2)
3. Updates **feature tracking** (`features/INDEX.md`)
4. Recommends which feature to build first

### 5. Spec Your First Feature

After initialization, create a detailed spec for the first feature:

```
/write-spec PROJ-1
```

The skill interviews you about this single feature in depth — user stories, edge cases, acceptance criteria. Use `/refine PROJ-X` at any point to revisit and improve an existing spec.

### 6. Build Features

```
/architecture    Design the tech approach for features/PROJ-1-user-auth.md
/frontend        Build the UI for features/PROJ-1-user-auth.md
/backend         Build the API for features/PROJ-1-user-auth.md
/qa              Test features/PROJ-1-user-auth.md
/deploy          Deploy to Vercel
```

Each skill suggests the next step when it finishes. Handoffs are always user-initiated.

---

## Available Skills

| Skill | Command | What It Does |
|-------|---------|-------------|
| Project Initializer | `/init` | One-time setup: creates PRD + feature map via Grill Me interview |
| Feature Spec Writer | `/write-spec` | Creates a full spec for one feature (user stories, AC, edge cases) |
| Spec Refiner | `/refine PROJ-X` | Reopens an existing spec to improve, extend, or challenge it |
| Solution Architect | `/architecture` | Designs PM-friendly tech architecture (no code, only high-level design) |
| Frontend Developer | `/frontend` | Builds UI with React, Tailwind CSS, and shadcn/ui |
| Backend Developer | `/backend` | Builds APIs, database schemas, RLS policies with Supabase |
| QA Engineer | `/qa` | Tests features against acceptance criteria + security audit |
| DevOps | `/deploy` | Deploys to Vercel with production-ready checks |
| Help | `/help` | Context-aware guide: shows where you are and what to do next |

### How Skills Work

- **Skills** are defined in `.claude/skills/` and auto-discovered by Claude Code
- **Rules** in `.claude/rules/` are auto-applied based on file context (no manual loading)
- **Sub-Agents** run heavy tasks (frontend, backend, QA) in isolated contexts for cost efficiency
- **CLAUDE.md** provides project context automatically at every session start

---

## Development Workflow

```
0. Setup     /init          -->  PRD + feature map (once per project)
1. Spec      /write-spec      -->  Feature spec in features/PROJ-X.md
             /refine PROJ-X -->  Revisit and improve an existing spec
2. Design    /architecture  -->  Tech design added to feature spec
3. Build     /frontend      -->  UI components implemented
             /backend       -->  APIs + database (if needed)
4. Test      /qa            -->  Test results added to feature spec
5. Ship      /deploy        -->  Deployed to Vercel
```

### Feature Tracking

Features are tracked in `features/INDEX.md`:

| ID | Feature | Status | Spec |
|----|---------|--------|------|
| PROJ-1 | User Login | Deployed | [Spec](features/PROJ-1-user-login.md) |
| PROJ-2 | Dashboard | In Progress | [Spec](features/PROJ-2-dashboard.md) |

Every skill reads this file at start and updates it when done, preventing duplicate work.

---

## Tech Stack

| Category | Tool | Why? |
|----------|------|------|
| **Framework** | Next.js 16 | React + Server Components + App Router |
| **Language** | TypeScript | Type safety |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **UI Library** | shadcn/ui | Copy-paste, customizable components |
| **Backend** | Supabase (optional) | PostgreSQL + Auth + Storage + Realtime |
| **Deployment** | Vercel | Zero-config Next.js hosting |
| **Validation** | Zod | Runtime type validation |

---

## Project Structure

```
ai-coding-starter-kit/
+-- CLAUDE.md                        <-- Auto-loaded project context
+-- .claude/
|   +-- settings.json                <-- Team permissions (committed)
|   +-- settings.local.json          <-- Personal overrides (gitignored)
|   +-- rules/                       <-- Auto-applied coding rules
|   |   +-- general.md                   Git workflow, feature tracking
|   |   +-- frontend.md                  shadcn/ui, component standards
|   |   +-- backend.md                   RLS, validation, queries
|   |   +-- security.md                  Secrets, headers, auth
|   +-- skills/                      <-- Invocable workflows (/command)
|   |   +-- init/SKILL.md                /init
|   |   +-- write-spec/SKILL.md           /write-spec
|   |   +-- refine/SKILL.md              /refine
|   |   +-- architecture/SKILL.md        /architecture
|   |   +-- frontend/SKILL.md            /frontend (runs as sub-agent)
|   |   +-- backend/SKILL.md             /backend (runs as sub-agent)
|   |   +-- qa/SKILL.md                  /qa (runs as sub-agent)
|   |   +-- deploy/SKILL.md              /deploy
|   |   +-- help/SKILL.md                /help
|   +-- agents/                      <-- Sub-agent configs
|       +-- frontend-dev.md              Model, tools, limits
|       +-- backend-dev.md
|       +-- qa-engineer.md
+-- features/                        <-- Feature specifications
|   +-- INDEX.md                         Status tracking
|   +-- README.md                        Spec format documentation
+-- docs/
|   +-- PRD.md                       <-- Product Requirements Document
|   +-- production/                  <-- Production setup guides
|       +-- error-tracking.md            Sentry setup (5 min)
|       +-- security-headers.md          XSS/Clickjacking protection
|       +-- performance.md               Lighthouse, optimization
|       +-- database-optimization.md     Indexing, N+1, caching
|       +-- rate-limiting.md             Upstash Redis
+-- src/
|   +-- app/                         <-- Pages (Next.js App Router)
|   +-- components/
|   |   +-- ui/                      <-- shadcn/ui components (35+ installed)
|   +-- hooks/                       <-- Custom React hooks
|   +-- lib/                         <-- Utilities
+-- public/                          <-- Static files
```

---

## Getting Started

### 1. Initialize the Project

Run `/init` with a brief description of your idea. The skill interviews you one question at a time and fills out `docs/PRD.md` with your vision, target users, and a prioritized feature map.

### 2. Spec Your First Feature

Run `/write-spec PROJ-1`. The skill interviews you in depth about this single feature and creates a complete spec in `features/PROJ-1-name.md` — user stories, acceptance criteria, edge cases. Then suggest running `/architecture` as the next step.

### 3. Add shadcn/ui Components (as needed)

35+ components are pre-installed. Add more as needed:
```bash
npx shadcn@latest add [component-name]
```

### 4. Production Setup (first deployment)

When you're ready to deploy, the `/deploy` skill guides you through:
- Vercel setup and deployment
- Error tracking with Sentry
- Security headers configuration
- Performance monitoring with Lighthouse

See `docs/production/` for detailed setup guides.

---

## How It Works Under the Hood

### Skills (`.claude/skills/`)
Each skill is a structured workflow that Claude Code discovers automatically. Skills can run inline (in the main conversation) or as forked sub-agents (isolated context window).

| Skill | Execution | Why? |
|-------|-----------|------|
| `/init` | Inline | Needs live interview with user |
| `/write-spec` | Inline | Needs live interview with user |
| `/refine` | Inline | Needs live interview with user |
| `/architecture` | Inline | Short output, user reviews in real-time |
| `/frontend` | Sub-agent (forked) | Heavy file editing, lots of output |
| `/backend` | Sub-agent (forked) | Heavy file editing, SQL, API code |
| `/qa` | Sub-agent (forked) | Systematic testing, lots of output |
| `/deploy` | Inline | Deployment needs user oversight |
| `/help` | Inline | Quick status check and guidance |

### Rules (`.claude/rules/`)
Coding standards that are auto-applied based on which files Claude is working with. No manual loading needed.

### Sub-Agent Configs (`.claude/agents/`)
Lightweight configurations that define model, tool access, and turn limits for forked skills.

### CLAUDE.md
Auto-loaded at every session start. Contains tech stack, conventions, and references to PRD and feature index.

---

## Context Engineering

AI agents work best with clean, structured context - not longer prompts. This template is designed around these principles:

### State lives in files, not in memory

Every skill reads `features/INDEX.md` and the relevant feature spec at start. After context compaction or a new session, nothing is lost - the agent simply re-reads the files. Progress tracking, acceptance criteria, and tech designs all live in markdown files, not in the conversation.

### Context is layered

Not everything is loaded at once. Information is layered by relevance:

| Layer | What | When loaded |
|-------|------|-------------|
| `CLAUDE.md` | Tech stack, conventions, commands | Every session (auto) |
| `.claude/rules/` | Coding standards | When editing matching files (auto) |
| Skill `SKILL.md` | Workflow instructions | When skill is invoked |
| Feature spec | Requirements, AC, tech design | On demand (skill reads it) |
| `docs/production/` | Deployment guides | Only when referenced |

### Context is isolated

Heavy implementation skills (`/frontend`, `/backend`, `/qa`) run as **forked sub-agents** with their own context window. Research noise from one skill doesn't pollute another. Each fork starts clean and loads only what it needs.

### Context recovery is built in

All forked skills include a **Context Recovery** section: if the context is compacted mid-task, the agent re-reads the feature spec, checks `git diff` for progress, and continues without restarting or duplicating work.

### Always read, never guess

A global rule (`rules/general.md`) enforces: always read a file before modifying it, never assume contents from memory, verify import paths and API routes by reading. This prevents hallucinated code references - the most common source of AI coding errors.

---

## Customization for Your Team

This template is designed as a starting point. Customize it for your team:

1. **Edit CLAUDE.md** - Add your project-specific conventions and build commands
2. **Edit docs/PRD.md** - Define your product vision and roadmap
3. **Edit .claude/rules/** - Adjust coding standards for your team
4. **Edit .claude/skills/** - Modify workflows to match your process
5. **Edit .claude/settings.json** - Configure team permissions

---

## Production Guides

Standalone guides in `docs/production/`:

| Guide | Setup Time | What It Does |
|-------|-----------|-------------|
| [Error Tracking](docs/production/error-tracking.md) | 5 min | Sentry integration for automatic error capture |
| [Security Headers](docs/production/security-headers.md) | 2 min | XSS, Clickjacking, MIME sniffing protection |
| [Performance](docs/production/performance.md) | 10 min | Lighthouse checks, image optimization, caching |
| [Database Optimization](docs/production/database-optimization.md) | 15 min | Indexing, N+1 prevention, query optimization |
| [Rate Limiting](docs/production/rate-limiting.md) | 10 min | Upstash Redis for API abuse prevention |

---

## Scripts

```bash
npm run dev          # Development server (localhost:3000)
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npm test             # Vitest: integration tests for API routes
npm run test:e2e     # Playwright: E2E tests for user flows
npm run test:all     # Run both test suites
```

---

## Author

Created by **Alex Sprogis** – AI Product Engineer & Content Creator.

- [YouTube](https://www.youtube.com/@alex.sprogis)
- [Website](https://alexsprogis.de)

---

## License

MIT License - feel free to use for your projects!
