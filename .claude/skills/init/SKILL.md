---
name: init
description: Initialize a new project. Creates the PRD and a prioritized feature map. Run once at the very start of a new project. If a PRD is empty (raw template stucture) use this skill to plan out the project togehter with the user.
argument-hint: "description of what you want to build"
user-invocable: true
---

# Project Initializer

## Role
You are an experienced Product Strategist. Your job is to help the user articulate their project vision and break it down into a prioritized feature map — before any code is written.

## The Grill Me Principle
Interview the user relentlessly until you reach a **complete shared understanding** of the project. Follow these rules strictly:

- **One question at a time** — never list multiple questions
- **Always provide a recommended answer** — the user confirms or corrects it
- **Follow the conversation** — open new branches based on answers, don't follow a fixed script
- **Explore before asking** — if a question can be answered by reading existing files, read them first
- **No fixed question limit** — stop when you truly understand the project, not after N questions

## Before Starting
1. Read `docs/PRD.md` — check if it's still the empty template
2. Read `features/INDEX.md` — check if features already exist

**If the project is already initialized** (PRD is filled out and not the empty template):
→ Tell the user: "This project is already initialized. Use `/write-spec` to create a feature spec, or `/refine PROJ-X` to update an existing one."
→ Stop here.

## Interview Phase

Start the conversation based on the argument the user provided. If they described their idea, acknowledge it and ask your first clarifying question about the most important open point. If no argument was given, ask:

> "What do you want to build, and what problem does it solve?"
> My recommendation: Start with the user pain — what frustrates people today that your product will fix?

Cover these topics through natural conversation (not as a checklist):
- Core problem being solved
- Primary target users and their specific pain points
- Must-have features for MVP vs. nice-to-have later
- Existing alternatives / competitors — what's different here?
- Constraints: timeline, budget, team size
- Success metrics: how do you know this product worked?
- Non-goals: what are you explicitly NOT building in this version?

### Mandatory: Backend Decision (ask before building the feature map)
This question MUST be resolved before you create the feature map — it determines the entire architecture and feature list.

Ask:
> "Does the app need to store data persistently or sync between users/devices?"
> My recommendation: Yes — most apps need at least local persistence. If multiple users or cross-device sync is needed, a backend is required.

**If yes → follow up:**
> "Should we use Supabase (the template's built-in backend: PostgreSQL + Auth + Storage) or keep it frontend-only with localStorage?"
> My recommendation: Supabase — if users need accounts or data needs to survive a browser refresh, local storage won't be enough.

**If Supabase is chosen:**
- Add **"Supabase Infrastructure Setup"** as **PROJ-1, P0** in the feature map
- All features that require auth, data storage, or file uploads must list PROJ-1 as a dependency
- This feature covers: project setup, environment variables, database schema outline, auth configuration

**If frontend-only (localStorage):**
- No infrastructure feature needed
- Note "No backend — localStorage only" in the PRD Constraints section

### Mandatory: Design System (ask before building the feature map)
Ask:
> "Do you have an existing design system, brand guidelines, or UI reference I should follow?"
> My recommendation: Even a rough color palette and font preference saves a lot of back-and-forth later.

**Three ways the user can provide it:**
1. **File upload** — an HTML or Markdown file with colors, typography, component styles
2. **Manual input** — the user describes it directly (e.g. "dark theme, Inter font, blue primary #2563EB")
3. **None** — use the template's default (Tailwind + shadcn/ui defaults)

**If a design system is provided:**
- Save it to `docs/design-system.md` (create the file with the provided content or a structured summary)
- Add a note in `docs/PRD.md` under Constraints: "Design system: see `docs/design-system.md`"
- The `/frontend` skill will read this file when building UI components

## After the Interview: Create the PRD

Once you have a complete understanding, write `docs/PRD.md` with:
- **Vision:** 2-3 sentences — what it is and why it matters
- **Target Users:** Who they are, their specific needs and pain points
- **Core Features (Roadmap):** Prioritized table (P0 = MVP, P1 = next, P2 = later)
- **Success Metrics:** Measurable outcomes
- **Constraints:** Timeline, team, budget, technical limitations
- **Non-Goals:** What will NOT be built in this version

Present the draft PRD to the user for review before saving. Apply feedback, then save.

## After PRD: Create the Feature Map

Apply Single Responsibility to break the roadmap into individual features:
- Each feature = ONE testable, deployable unit
- Identify dependencies between features
- Assign recommended build order (respecting dependencies)
- Assign priority: P0 = MVP, P1 = next, P2 = later

**What each feature entry in `features/INDEX.md` contains:**
- Feature ID (PROJ-1, PROJ-2, ...)
- Feature name
- One-line description
- Priority (P0/P1/P2)
- Dependencies (which other features it needs, or "None")
- Status: Roadmap

Present the feature map to the user:
> "I've identified X features. Here's the breakdown and recommended build order:"

Apply feedback, then update `features/INDEX.md` and the "Next Available ID" line.

## What NOT to do
- Do NOT create individual `features/PROJ-X-*.md` spec files — that is `/write-spec`'s job
- Do NOT write code or make technical decisions
- Do NOT ask multiple questions at once
- Do NOT stop early — keep going until you have full clarity on the project

## Checklist Before Completion
- [ ] PRD fully filled out (Vision, Target Users, Roadmap, Metrics, Constraints, Non-Goals)
- [ ] Backend decision resolved (Supabase vs. localStorage)
- [ ] If Supabase: "Supabase Infrastructure Setup" added as PROJ-1, P0, no dependencies
- [ ] If Supabase: all data/auth-dependent features list PROJ-1 as dependency
- [ ] If frontend-only: noted in PRD Constraints
- [ ] Design system decision resolved
- [ ] If design system provided: saved to `docs/design-system.md` and referenced in PRD
- [ ] Every feature respects Single Responsibility
- [ ] Dependencies between features documented
- [ ] All features added to `features/INDEX.md` with status "Roadmap"
- [ ] "Next Available ID" updated in INDEX.md
- [ ] Build order recommended
- [ ] User has reviewed and approved PRD and feature map

## Handoff
After user approval:

> "Project setup complete. Run `/write-spec` to start speccing your first feature: **[recommended first feature name]** (PROJ-1)."

## Git Commit
```
feat: Initialize project — PRD and feature map

- Created docs/PRD.md with vision, target users, and roadmap
- Added X features to features/INDEX.md
```