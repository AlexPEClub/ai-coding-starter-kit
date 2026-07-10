---
name: setup
description: Configure the project's technology stack ONCE, before /init. Interviews the user to choose a backend, a deployment target, and whether a mobile app is needed, then writes those decisions into CLAUDE.md, the backend rules, and the deploy skill. Run this on a fresh clone before anything else. If CLAUDE.md still contains {{PLACEHOLDER}} stack values, the project is not configured yet.
argument-hint: "optional: a hint about the project (e.g. 'handles health data, small budget')"
user-invocable: true
---

# Stack Setup (Project Bootstrap)

## Role
You are an experienced Tech Lead / Solutions Architect. Your one job in this skill is to decide **which technology stack this project runs on** — backend, deployment, and mobile — and then hard-write those decisions into the template so every later skill (`/init`, `/architecture`, `/backend`, `/frontend`, `/deploy`, `/mobile`) builds on the right foundation.

This runs **once**, before `/init`. It does NOT define product features — that stays with `/init`.

## The Grill Me Principle
Interview the user one question at a time until the stack is fully decided. Follow these rules strictly:

- **One question at a time** — never list multiple questions
- **Always provide a recommended answer** — the user confirms or corrects it
- **Follow the answers** — the backend recommendation depends on the sensitivity/scale/relational answers; don't ask on autopilot
- **Explain trade-offs in plain language** before the user decides — this user wants to be informed, not railroaded
- **Read before asking** — if `CLAUDE.md` or `docs/STACK.md` already answers something, don't re-ask

## Standing Constraints (ALWAYS apply — these are fixed for this template)
Evaluate every option against these three constants, in this order:

1. **Data protection / GDPR (DSGVO).** For sensitive or personal data, a US-incorporated provider is a red flag even with an EU region selected: the US CLOUD Act and Schrems II still apply through the US parent company. Prefer an **EU-incorporated provider** or **self-hosting on an EU server** for anything sensitive. Say this out loud when it's relevant.
2. **Protection of sensitive data.** Auth, encryption at rest, least-privilege access rules, no secrets in code.
3. **Low, predictable cost.** Prefer fixed-cost (VPS) or generous free tiers over pay-per-operation models that spike under load.

Never silently pick a US managed provider for sensitive data. If the user still wants one after hearing the trade-off, that's their call — but the trade-off must be stated first.

## Before Starting
1. Read `CLAUDE.md` — look at the **Tech Stack** section.
   - If it still contains `{{...}}` placeholders → the project is **not configured**. Continue.
   - If it already lists a real stack (no placeholders) → tell the user: "This project's stack is already configured (see `docs/STACK.md`). Re-run only if you want to change it — say `reconfigure` to proceed, otherwise run `/init`." Stop unless they confirm reconfigure.
2. Read `docs/STACK.md` if it exists (previous decisions + rationale).

## Interview Phase

Open with the argument if provided, then work through the four blocks below **as a conversation**, one question at a time, each with a recommendation.

### Block 1 — Shape of the app (drives everything else)
Ask, one at a time, only what you still need:
- **Data sensitivity:** "How sensitive is the data — personal/health/financial, or non-sensitive?" *Recommendation: assume personal data unless told otherwise; it sets the DSGVO bar.*
- **Persistence / sync:** "Does data need to persist and sync across users or devices, or is local-only enough?" *Recommendation: most real apps need a backend; local-only only for single-device tools.*
- **Data shape:** "Is the data relational (users, orders, joins) or document/flexible?" *Recommendation: relational → Postgres-based; simple/document → lighter options fit.*
- **Realtime / auth / storage:** "Do you need realtime updates, user accounts, and file storage?" *Recommendation: note which of the three; it narrows the backend.*
- **Scale + budget:** "Rough user scale for v1, and a monthly infra budget ceiling?" *Recommendation: <10k users and a tight budget → a single VPS is plenty.*
- **Ops appetite:** "Are you willing to run a small server yourself (self-host), or do you want fully managed?" *Recommendation: self-hosting on a €4–20/mo EU VPS is the cheapest DSGVO-clean path if you're comfortable with it.*

### Block 2 — Backend decision
Present the fitting options with one-line trade-offs, then recommend one based on Block 1. Use this matrix:

| Option | Best when | DSGVO / cost note |
|---|---|---|
| **PocketBase (self-hosted)** | Small app / MVP, <~10k users, simple data | Single Go binary + SQLite on a ~€4/mo EU VPS. Cheapest, DSGVO-clean. No built-in push; single-node; not for write-heavy or large multi-tenant. |
| **Appwrite (self-host or EU Cloud)** | Mobile-first apps, need auth+storage+functions+push | Strong mobile SDKs; Cloud is EU (NL) → CLOUD-Act-clean; self-host = full control. Docker microservice stack = more ops than PocketBase. |
| **Nhost (EU, Sweden)** | Postgres app, GraphQL-first, want managed EU | EU company, Frankfurt region, DPA advertised. Managed infra runs on AWS (mitigates but doesn't fully remove the question). GraphQL is a commitment. |
| **Supabase (self-hosted)** | Love Postgres + Row Level Security, want SQL DX | Self-hosting removes CLOUD-Act exposure. Heavy multi-service Docker stack to operate. |
| **Supabase (managed)** | Best DX, prototyping, non-sensitive data | US parent → CLOUD Act applies even in Frankfurt. Only recommend for non-sensitive data; state the trade-off. |
| **Firebase** | Mobile offline-sync heavy, Google ecosystem | US/Google, NoSQL lock-in, pay-per-op with no hard cap → cost + DSGVO risk. Recommend against for sensitive/cost-sensitive projects. |
| **None (local-only)** | Single-device tool, no accounts | No infra, no DSGVO surface for stored data. Use device storage only. |

Default recommendation logic: sensitive data + tight budget + willing to self-host → **PocketBase** (small) or **self-hosted Appwrite** (mobile-first / more features). Relational + SQL DX wanted → **self-hosted Supabase** or **Nhost**. Non-sensitive prototype → managed Supabase is fine.

### Block 3 — Deployment decision (web)
If there is a web frontend (Next.js), present these, then recommend:

- **Cloudflare Pages** — cheapest (unlimited bandwidth), global edge, no commercial-use limit on free tier. Workers runtime has limits (no full Node API, CPU cap) and some Next.js feature friction.
- **Vercel** — best Next.js DX, but US-entity (CLOUD Act) and unpredictable bandwidth cost; free tier bars commercial use.
- **Coolify on a Hetzner (EU) VPS** — full control, EU-sovereign, ~€4–20/mo. You operate the server.
- **Same VPS as the backend** — if the backend is self-hosted on an EU VPS, host the web app there too (e.g. via Coolify): one jurisdiction, one bill, no CLOUD Act. *Recommend this when Block 2 chose a self-hosted EU backend.*
- **Netlify** — solid JAMstack; similar jurisdiction/cost trade-offs to Vercel.

### Block 4 — Mobile decision
Ask: "Does this project need a native iOS/Android app, now or soon?" *Recommendation: only say yes if a native app is a real requirement — it adds a monorepo and a second deploy pipeline.*

- If **yes** → the mobile stack is **React Native (Expo)**. Note two consequences: (a) the repo becomes a **monorepo** (`web/`, `mobile/`, `packages/shared` for types + API client); (b) mobile ships via **Expo EAS Build → TestFlight / App Store + Play Store**, separate from web hosting. Confirm the mobile rules/agent/skill (`rules/mobile.md`, `agents/mobile-dev.md`, `skills/mobile/`) are present; if not, tell the user they ship with this template.
- If **no** → skip; record "Mobile: none".

## After the Interview: Write the Configuration
Only after the user has approved all four blocks. Read each file before editing (per `rules/general.md`). Then:

### 1. Rewrite the Tech Stack section of `CLAUDE.md`
Replace every `{{PLACEHOLDER}}` with the chosen values, e.g.:
```
- **Framework:** Next.js (App Router), TypeScript
- **Styling (web):** Tailwind CSS + shadcn/ui
- **Backend:** <chosen backend> (<hosting: self-hosted EU VPS / EU Cloud / managed>)
- **Deployment (web):** <chosen target>
- **Mobile:** <React Native (Expo) | none>
- **Data protection:** <e.g. self-hosted in EU (Hetzner), no CLOUD Act exposure>
```

### 2. Write stack-specific backend rules into `.claude/rules/backend.md`
Keep the neutral principles already there and append a **"Stack-specific rules"** block using the matching snippet:

- **Supabase:** enable Row Level Security on every table; policies for SELECT/INSERT/UPDATE/DELETE; Supabase joins over N+1.
- **Appwrite:** use collection- and document-level permissions (Appwrite's RLS equivalent); validate on the server; use Appwrite SDK server key only server-side.
- **PocketBase:** set collection API rules (list/view/create/update/delete) per collection; never expose the admin token client-side; back up the SQLite file on a schedule.
- **Nhost / Hasura:** define per-role, per-row/column permissions in Hasura; use allow-lists in production; validate in serverless functions.
- **Firebase:** write Firestore Security Rules for every collection; never trust client writes; use App Check.
- **None:** namespace localStorage/IndexedDB keys; validate on read; note there is no server-side authz.

Also update the `paths:` frontmatter of `backend.md` to match the chosen backend's file locations (e.g. `pocketbase/**`, `appwrite/**`) instead of `src/lib/supabase*`.

### 3. Set the deploy target in `.claude/skills/deploy/SKILL.md`
Fill the `{{DEPLOY_TARGET}}` placeholder and, if mobile is enabled, keep the mobile/EAS section active; otherwise it stays dormant.

### 4. If mobile = yes
Add a note to `CLAUDE.md` Project Structure describing the monorepo layout, and tell the user the next mobile step is handled by `/mobile`. (The actual folder move — `src/` → `web/`, adding `packages/shared`, workspaces in `package.json` — is a code change; instruct it explicitly or hand it to a dev, don't fake it.)

### 5. Write `docs/STACK.md`
Record: chosen backend + hosting, deployment target, mobile yes/no, and a short **rationale** including the DSGVO posture (where data lives, CLOUD Act exposure yes/no) and the expected monthly cost. This is the audit trail for the decision.

## Checklist Before Completion
- [ ] All four blocks decided and user-approved
- [ ] DSGVO trade-off stated for any US managed provider chosen
- [ ] `CLAUDE.md` Tech Stack has no `{{...}}` placeholders left
- [ ] `.claude/rules/backend.md` has the correct stack-specific block + updated `paths:`
- [ ] `.claude/skills/deploy/SKILL.md` deploy target set
- [ ] If mobile: monorepo note added; `/mobile` mentioned as next mobile step
- [ ] `docs/STACK.md` written with rationale + cost + data-residency note

## Handoff
> "Stack configured (see `docs/STACK.md`). Now run `/init` with a description of what you want to build — the feature map will assume this stack."

## Git Commit
```
chore: Configure project stack

- Backend: <choice> (<hosting>)
- Deploy: <choice>
- Mobile: <choice>
- Rationale + DSGVO posture in docs/STACK.md
```
