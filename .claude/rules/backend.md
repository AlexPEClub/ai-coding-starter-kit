---
paths:
  - "src/app/api/**"
  - "src/lib/**"
  # Updated by /setup to match the chosen backend, e.g. "pocketbase/**", "appwrite/**", "supabase/**"
---

# Backend Development Rules

> Stack-neutral principles below. The **stack-specific rules** section is written by `/setup` once the backend is chosen.

## API Routes (any backend)
- Validate all inputs using Zod schemas before processing
- Always check authentication: verify the user's session exists
- Return meaningful error messages with appropriate HTTP status codes
- Use a `limit` on all list queries
- Never trust the client — enforce authorization on the server / in access rules

## Query Patterns
- Avoid N+1 loops — use the backend's join/expand/relationship feature
- Cache rarely-changing data (e.g. `unstable_cache` in Next.js)
- Always handle and surface backend errors

## Security (any backend)
- Never hardcode secrets in source code
- Use environment variables for all credentials
- Keep admin/service keys server-side only — never ship them to the client
- Validate and sanitize all user input
- Encrypt sensitive data at rest where the backend supports it

## Data Protection (DSGVO)
- Store personal/sensitive data only in the region agreed in `docs/STACK.md`
- Prefer EU-hosted / self-hosted storage for sensitive data (see STACK.md rationale)
- Collect the minimum data necessary; document retention and deletion

## Stack-specific rules
<!-- Written by /setup. Examples of what goes here:
     Supabase  → enable Row Level Security on every table; policies for SELECT/INSERT/UPDATE/DELETE.
     Appwrite  → collection- and document-level permissions; server SDK key server-side only.
     PocketBase→ per-collection API rules (list/view/create/update/delete); scheduled SQLite backups.
     Nhost     → per-role, per-row/column permissions in Hasura; production allow-lists.
     Firebase  → Firestore Security Rules per collection; App Check; never trust client writes.
     None      → namespaced local storage keys; validate on read; no server-side authz. -->
