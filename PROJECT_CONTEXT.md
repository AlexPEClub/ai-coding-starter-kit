# AI Coding Starter Kit

> A Next.js template with an AI-powered development workflow using 6 specialized agents

## Vision
Build web applications faster with AI agents handling Requirements, Architecture, Development, QA, and Deployment. Each agent has clear responsibilities and a human-in-the-loop workflow for quality control.

---

## Aktueller Status
Template ready - Start by defining your first feature!

---

## Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Sprache:** TypeScript
- **Styling:** Tailwind CSS
- **UI Library:** shadcn/ui (copy-paste components)

### Backend
- **Database:** Supabase (PostgreSQL with Auth)
- **State Management:** React useState / Context API
- **Data Fetching:** React Server Components / fetch

### Deployment
- **Hosting:** Vercel

---

## Features Roadmap

### Storefinder (Heizmann)

**Architektur-Übersicht:** [ARCHITECTURE-OVERVIEW.md](/features/ARCHITECTURE-OVERVIEW.md)

#### Phase 1: Backend Grundlagen
- [PROJ-1] Admin-Authentifizierung → 🔵 Planned → [Spec](/features/PROJ-1-admin-authentifizierung.md)
- [PROJ-3] Service-Typen Verwaltung → 🔵 Planned → [Spec](/features/PROJ-3-service-typen-verwaltung.md)
- [PROJ-2] Stützpunkt-Verwaltung → 🔵 Planned → [Spec](/features/PROJ-2-stuetzpunkt-verwaltung.md)

#### Phase 2: Widget-Konfiguration
- [PROJ-4] Widget-Konfiguration & Snippet → 🔵 Planned → [Spec](/features/PROJ-4-widget-konfiguration-snippet.md)

#### Phase 3: Frontend Widget
- [PROJ-8] Mehrsprachigkeit (i18n) → 🔵 Planned → [Spec](/features/PROJ-8-storefinder-mehrsprachigkeit.md)
- [PROJ-5] Kartenansicht (OSM/Google Maps) → 🔵 Planned → [Spec](/features/PROJ-5-storefinder-kartenansicht.md)
- [PROJ-7] Stützpunkt-Liste & Cards → 🔵 Planned → [Spec](/features/PROJ-7-storefinder-liste-cards.md)
- [PROJ-6] Suche & Filter → 🔵 Planned → [Spec](/features/PROJ-6-storefinder-suche-filter.md)

---

## Status-Legende
- ⚪ Backlog (noch nicht gestartet)
- 🔵 Planned (Requirements geschrieben)
- 🟡 In Review (User reviewt)
- 🟢 In Development (Wird gebaut)
- ✅ Done (Live + getestet)

---

## Development Workflow

1. **Requirements Engineer** erstellt Feature Spec → User reviewt
2. **Solution Architect** designed Schema/Architecture → User approved
3. **PROJECT_CONTEXT.md** Roadmap updaten (Status: 🔵 Planned → 🟢 In Development)
4. **Frontend + Backend Devs** implementieren → User testet
5. **QA Engineer** führt Tests aus → Bugs werden gemeldet
6. **DevOps** deployed → Status: ✅ Done

---

## Environment Variables

For projects using Supabase:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://eoajwzcqhdxufsnardom.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_BTJ3FmanNRs4Axp5YKtphw_GNJWA-uX
```

See `.env.local.example` for full list.

---

## Agent-Team Verantwortlichkeiten

- **Requirements Engineer** (`.claude/agents/requirements-engineer.md`)
  - Feature Specs in `/features` erstellen
  - User Stories + Acceptance Criteria + Edge Cases

- **Solution Architect** (`.claude/agents/solution-architect.md`)
  - Database Schema + Component Architecture designen
  - Tech-Entscheidungen treffen

- **Frontend Developer** (`.claude/agents/frontend-dev.md`)
  - UI Components bauen (React + Tailwind + shadcn/ui)
  - Responsive Design + Accessibility

- **Backend Developer** (`.claude/agents/backend-dev.md`)
  - Supabase Queries + Row Level Security Policies
  - API Routes + Server-Side Logic

- **QA Engineer** (`.claude/agents/qa-engineer.md`)
  - Features gegen Acceptance Criteria testen
  - Bugs dokumentieren + priorisieren

- **DevOps** (`.claude/agents/devops.md`)
  - Deployment zu Vercel
  - Environment Variables verwalten
  - Production-Ready Essentials (Error Tracking, Security Headers, Performance)

---

## Production-Ready Features

This template includes production-readiness guides integrated into the agents:

- **Error Tracking:** Sentry setup instructions (DevOps Agent)
- **Security Headers:** XSS/Clickjacking protection (DevOps Agent)
- **Performance:** Database indexing, query optimization (Backend Agent)
- **Input Validation:** Zod schemas for API safety (Backend Agent)
- **Caching:** Next.js caching strategies (Backend Agent)

All guides are practical and include code examples ready to copy-paste.

---

## Design Decisions

- **Warum separates Vite Widget-Bundle statt Next.js Page?**
  → Widget läuft auf fremden Websites per `<script>`-Tag. Next.js kann keine isolierten standalone JS-Bundles erzeugen.

- **Warum Leaflet.js als Standard Map-Provider?**
  → Open Source, kostenlos, kein API Key nötig. Google Maps als Option bei vorhandenem Key.

- **Warum Nominatim für Geocoding?**
  → Kostenloser OpenStreetMap-Service. Kein Account oder API Key nötig.

- **Warum eigene Mini-i18n statt Framework?**
  → Widget ist standalone. 3 Sprachen mit ~20 Schlüsseln brauchen kein 30KB+ Framework.

- **Warum Widget-Konfiguration in DB statt .env?**
  → Admins können Einstellungen live ändern ohne Re-Deploy.

---

## Folder Structure

```
ai-coding-starter-kit/
├── .claude/
│   └── agents/              ← 6 AI Agents (Requirements, Architect, Frontend, Backend, QA, DevOps)
├── features/                ← Feature Specs (Requirements Engineer creates these)
│   └── README.md            ← Documentation on how to write feature specs
├── src/
│   ├── app/                 ← Pages (Next.js App Router)
│   ├── components/          ← React Components
│   │   └── ui/              ← shadcn/ui components (add as needed)
│   └── lib/                 ← Utility functions
│       ├── supabase.ts      ← Supabase client (commented out by default)
│       └── utils.ts         ← Helper functions
├── public/                  ← Static files
├── PROJECT_CONTEXT.md       ← This file - update as project grows
└── package.json
```

---

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup Environment Variables (if using Supabase):**
   ```bash
   cp .env.local.example .env.local
   # Add your Supabase credentials
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Start using the AI Agent workflow:**
   - Tell Claude to read `.claude/agents/requirements-engineer.md` and define your first feature
   - Follow the workflow: Requirements → Architecture → Development → QA → Deployment

---

## Next Steps

1. **Define your first feature idea**
   - Think about what you want to build

2. **Start with Requirements Engineer**
   - Tell Claude: "Read .claude/agents/requirements-engineer.md and create a feature spec for [your idea]"
   - The agent will ask clarifying questions and create a detailed spec

3. **Follow the AI Agent workflow**
   - Requirements → Architecture → Development → QA → Deployment
   - Each agent knows when to hand off to the next agent

4. **Track progress via Git**
   - Feature specs in `/features/PROJ-X.md` show status (Planned → In Progress → Deployed)
   - Git commits track all implementation details
   - Use `git log --grep="PROJ-X"` to see feature history

---

**Built with AI Agent Team System + Claude Code**
