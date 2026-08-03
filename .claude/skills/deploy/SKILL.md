---
name: deploy
description: Deploy via Docker + Traefik on Hetzner with production-ready checks, error tracking, and security headers setup.
argument-hint: "feature-spec-path or 'to staging' / 'to production'"
user-invocable: true
---

# DevOps Engineer

## Ausführung
Dieser Skill läuft nicht im Hauptkontext, sondern wird an den Subagenten
"DevOps Engineer" delegiert (Modell fest auf Haiku gepinnt, siehe
`.claude/agents/devops-engineer.md` — spart Kosten bei der Umsetzung).

Rufe das Agent-Tool auf: `subagent_type: "DevOps Engineer"`, Prompt enthält
den Pfad zur Feature-Spec (bzw. "to staging"/"to production") und die
Anweisung, diese SKILL.md-Datei vollständig zu lesen und den gesamten
Workflow inkl. Checkliste und Tracking-Updates abzuarbeiten.

Warte den Abschlussbericht ab, prüfe per Status-Updates-Regel, dass
`features/INDEX.md` und die Feature-Spec aktualisiert wurden, und melde dich
beim User mit dem im Skill vorgesehenen Handoff-Text.

## Role
You are an experienced DevOps Engineer handling deployment, environment setup, and production readiness.

## Before Starting
1. Read `features/INDEX.md` to know what is being deployed
2. Check QA status in the feature spec
3. Verify no Critical/High bugs exist in QA results
4. If QA has not been done, tell the user: "Run `/qa` first before deploying."

## Workflow

### 1. Pre-Deployment Checks
- [ ] `npm run build` succeeds locally
- [ ] `npm run lint` passes
- [ ] QA Engineer has approved the feature (check feature spec)
- [ ] No Critical/High bugs in test report
- [ ] All environment variables documented in `.env.local.example`
- [ ] No secrets committed to git (env files live on the server / in the secrets store, not in the repo)
- [ ] All database migrations applied on the self-hosted Supabase instance (if applicable)
- [ ] All code committed and pushed to remote

## Environments

| Environment | Domain | Purpose |
|-------------|--------|---------|
| Staging | `tms-staging.gudel-werkzeuge.de` | Validate a feature before production |
| Production | `tms.gudel-werkzeuge.de` | Live system |

> Domains are planned and will be wired up via Traefik routing labels once DNS is pointed at the Hetzner host. Until DNS is live, deploy and test against the server IP / a temporary host.

### 2. Infrastructure Setup (first deployment only)

> **Prerequisites (manual, do these first):**
> - SSH access to the Hetzner host.
> - Docker and a Traefik reverse proxy already running on the host (Traefik terminates TLS via Let's Encrypt and routes by hostname).
> - The existing self-hosted Supabase instance reachable from the app container.
> - DNS records for `tms.gudel-werkzeuge.de` and `tms-staging.gudel-werkzeuge.de` pointing at the host (can be added later — see note above).

Guide the user through:
- [ ] Add a `Dockerfile` (multi-stage Next.js standalone build) and a `docker-compose.yml` service for the app
- [ ] Set `output: 'standalone'` in `next.config.ts` so the image stays small
- [ ] Attach the app service to the shared Traefik Docker network
- [ ] Add Traefik labels for host routing + TLS, e.g. `traefik.http.routers.tms.rule=Host(\`tms.gudel-werkzeuge.de\`)` (and a separate router for the staging host)
- [ ] Provide environment variables via an `.env` file on the server or compose `env_file:` — point `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` at the self-hosted Supabase instance (never commit these)

### 3. Deploy + automatische Verifikation

**Standardweg — immer über das Deploy-Skript:**

```bash
./scripts/deploy.sh PROJ-XX
```

Das Skript führt in einem Durchgang aus:
1. **Pre-Checks:** `npm run lint` + `npm run build`
2. **Deploy:** `docker compose build` + `docker compose up -d` (Traefik routet per Labels)
3. **Post-Deploy-Verifikation:** Playwright-Smoke gegen die Live-URL, **max. 5 Anläufe**
   - Erfolg → `Deployed ✅`
   - Fehler → Stopp; Screenshots/Trace unter `test-results-deploy/` als Beweis

Stellschrauben (Env): `DEPLOY_TARGET` (`staging`|`production`), `DEPLOY_BASE_URL`,
`MAX_VERIFY_ATTEMPTS`, `SKIP_DEPLOY=1` (nur verifizieren).

> Erst nach **staging** verifizieren, dann dasselbe Image nach **production** promoten.
> Rollout beobachten: `docker compose logs -f` und die Traefik-Logs (Routing & TLS).

### 4. Post-Deployment Verification

Der Playwright-Smoke (Schritt 3) prüft automatisch Erreichbarkeit, korrekte App
(TMS-2.0-Fingerabdruck) und gerendertes Login-Formular. Zusätzlich manuell abhaken:

- [ ] Automatischer Post-Deploy-Check grün (`Deployed ✅`)
- [ ] Deployed feature works as expected (feature-spezifischer Test in `tests/deploy/`)
- [ ] Database connections to self-hosted Supabase work (if applicable)
- [ ] Authentication flows work (if applicable)
- [ ] TLS certificate is valid (Traefik / Let's Encrypt)
- [ ] No errors in container logs (`docker compose logs`)

### 5. Production-Ready Essentials

For first deployment, guide the user through these setup guides:

**Error Tracking (5 min):** See [error-tracking.md](../../../docs/production/error-tracking.md)
**Security Headers (copy-paste):** See [security-headers.md](../../../docs/production/security-headers.md)
**Performance Check:** See [performance.md](../../../docs/production/performance.md)
**Database Optimization:** See [database-optimization.md](../../../docs/production/database-optimization.md)
**Rate Limiting (optional):** See [rate-limiting.md](../../../docs/production/rate-limiting.md)

### 6. Post-Deployment Bookkeeping
- Update feature spec: Add deployment section with production URL and date
- Update `features/INDEX.md`: Set status to **Deployed**

## Handoff
> "Deployed! Feature ist live."

**Empfehlung:** Neue Session starten (`/clear` oder neues Terminal) für das nächste Feature/die nächste Stage — hält den Kontext schlank.
- Create git tag: `git tag -a v1.X.0-PROJ-X -m "Deploy PROJ-X: [Feature Name]"`
- Push tag: `git push origin v1.X.0-PROJ-X`

## Common Issues

### Build fails in Docker but works locally
- Check the Node.js version in the `Dockerfile` base image matches local
- Ensure all dependencies are in package.json (not just devDependencies)
- Review the `docker compose build` output for the specific error
- Confirm `next.config.ts` uses `output: 'standalone'` so the runtime image has everything it needs

### Environment variables not available
- Verify vars are present in the server `.env` / compose `env_file:` and the container was recreated (`docker compose up -d`)
- Client-side vars need the `NEXT_PUBLIC_` prefix and are baked in at **build** time — rebuild the image after changing them
- Restart/recreate the container after changing server-only vars (they don't apply retroactively)

### Database connection errors
- Verify the self-hosted Supabase URL and anon key in the server env
- Confirm the app container can reach the Supabase instance (shared Docker network / host firewall)
- Check RLS policies allow the operations being attempted

### Routing / TLS issues (Traefik)
- Verify the Traefik `Host(...)` label matches the requested domain exactly
- Confirm DNS for the domain resolves to the Hetzner host
- Check the Traefik logs for ACME/Let's Encrypt certificate errors
- Ensure the app service is on the same Docker network as Traefik

## Rollback Instructions
If production is broken:
1. **Immediate:** Re-deploy the previous known-good image tag on the host (`docker compose up -d` with the prior tag), so Traefik routes to the working container again
2. **Fix locally:** Debug the issue, `npm run build`, commit, push
3. Build the fixed image, deploy to staging, verify, then promote to production

## Full Deployment Checklist
- [ ] Pre-deployment checks all pass
- [ ] Docker image builds successfully
- [ ] Deployed to staging and verified first
- [ ] Production URL loads and works
- [ ] Feature tested in production environment
- [ ] No console errors, no container log errors
- [ ] Error tracking setup (Sentry or alternative)
- [ ] Security headers configured in next.config
- [ ] Lighthouse score checked (target > 90)
- [ ] Feature spec updated with deployment info
- [ ] `features/INDEX.md` updated to Deployed
- [ ] Git tag created and pushed
- [ ] User has verified production deployment

## Git Commit
```
deploy(PROJ-X): Deploy [feature name] to production

- Production URL: https://tms.gudel-werkzeuge.de
- Deployed: YYYY-MM-DD
```
