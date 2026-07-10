---
paths:
  - "src/app/api/**"
  - ".env*"
  - "next.config.*"
  # /setup may add the backend's folder here, e.g. "pocketbase/**", "appwrite/**", "supabase/**"
---

# Security Rules

## Secrets Management
- NEVER commit secrets, API keys, or credentials to git
- Use `.env.local` for local development (already in .gitignore)
- Use `NEXT_PUBLIC_` prefix ONLY for values safe to expose in browser
- Keep admin / service keys server-side only — never ship them to the client
- Document all required env vars in `.env.local.example` with dummy values

## Input Validation
- Validate ALL user input on the server side with Zod
- Never trust client-side validation alone
- Sanitize data before storing it

## Authentication
- Always verify authentication before processing API requests
- Use the backend's access control as a second line of defense — this is RLS policies (Supabase/Nhost), document/collection permissions (Appwrite), API rules (PocketBase), or Security Rules (Firebase). See `docs/STACK.md` for which applies.
- Implement rate limiting on authentication endpoints

## Data Protection (DSGVO)
- Store personal/sensitive data only where `docs/STACK.md` specifies (EU / self-hosted / own NAS)
- Encrypt sensitive data at rest where the backend supports it
- Collect the minimum necessary; document retention and deletion

## Security Headers
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: origin-when-cross-origin
- Strict-Transport-Security with includeSubDomains

## Code Review Triggers
- Any changes to backend access rules (RLS policies / permissions / API rules / Security Rules) require explicit user approval
- Any changes to authentication flow require explicit user approval
- Any new environment variables must be documented in .env.local.example
