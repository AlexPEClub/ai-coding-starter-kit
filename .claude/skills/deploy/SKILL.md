---
name: deploy
description: Deploy to the project's chosen target with production-ready checks, error tracking, and security headers. Reads the deploy target from CLAUDE.md. Covers web deploy and, if mobile is enabled, Expo EAS builds to the app stores.
argument-hint: "feature-spec-path or 'deploy web' / 'deploy mobile'"
user-invocable: true
---

# DevOps Engineer

## Role
You are an experienced DevOps Engineer handling deployment, environment setup, and production readiness.

## Before Starting
1. Read `CLAUDE.md` **Tech Stack** to learn the deploy target and whether mobile is enabled. If it still shows `{{DEPLOY_TARGET}}`, tell the user: "Run `/setup` first — no deploy target is configured." Stop.
2. Read `docs/STACK.md` for hosting/data-residency specifics.
3. Read `features/INDEX.md` to know what is being deployed.
4. Check QA status in the feature spec — no Critical/High bugs. If QA hasn't run: "Run `/qa` first before deploying." Stop.

## Pre-Deployment Checks (all targets)
- [ ] `npm run build` succeeds locally
- [ ] `npm run lint` passes
- [ ] QA approved the feature; no Critical/High bugs
- [ ] All environment variables documented in `.env.local.example`
- [ ] No secrets committed to git
- [ ] Backend migrations / access rules applied (if applicable)
- [ ] All code committed and pushed to remote

## Web Deploy — follow the section matching the chosen target

### Cloudflare Pages
> Prerequisite (manual): create a Cloudflare account and connect the Git repo.
- [ ] `npx wrangler pages deploy` or connect the repo in the Cloudflare dashboard for push-to-deploy
- [ ] Add env vars in the Pages project settings
- [ ] Note Workers runtime limits (no full Node API; CPU cap) — verify SSR/edge routes behave

### Vercel
> Prerequisite (manual): create a Vercel account and push the repo to GitHub.
- [ ] `npx vercel` (or connect via vercel.com) for auto-deploy on push
- [ ] Add all env vars from `.env.local.example` in the Vercel dashboard
- [ ] Framework Preset = Next.js (auto-detected); configure domain
- [ ] Reminder (from STACK.md): US-entity → confirm no sensitive data is stored here without a documented decision

### Coolify on a (Hetzner/EU) VPS  — also the "same VPS as backend" option
> Prerequisite (manual): a VPS with Coolify installed and a domain pointed at it.
- [ ] Create a new Coolify application from the Git repo (Nixpacks/Dockerfile auto-detected)
- [ ] Set env vars in Coolify; enable auto-deploy webhook on push
- [ ] Attach the domain; Coolify provisions TLS (Let's Encrypt)
- [ ] If co-located with a self-hosted backend, keep both behind the same reverse proxy

### Netlify
> Prerequisite (manual): Netlify account + repo connected.
- [ ] Connect repo for Git-based deploys; set build command and env vars
- [ ] Configure Netlify Functions / Edge Functions if used

## Mobile Deploy (only if Mobile = React Native (Expo))
> Prerequisites (manual): an Expo account, plus Apple Developer + Google Play Console accounts for store submission.
- [ ] `mobile/` builds locally (`npx expo start` runs; no red-screen errors)
- [ ] EAS configured: `eas build:configure`
- [ ] Build: `eas build --platform ios` and `eas build --platform android`
- [ ] Internal test: submit iOS build to **TestFlight**; share Android build/track
- [ ] Store submission: `eas submit -p ios` / `eas submit -p android`
- [ ] App Store Connect + Play Console metadata, privacy labels (declare data handling per STACK.md), screenshots
- [ ] Bump `version`/`buildNumber`/`versionCode` in `app.json` per release

## Post-Deployment Verification
- [ ] Production URL / app build loads and the feature works
- [ ] Backend connections work; auth flows work
- [ ] No console errors; no server/function log errors

## Production-Ready Essentials (first web deploy)
- **Error Tracking:** [error-tracking.md](../../../docs/production/error-tracking.md)
- **Security Headers:** [security-headers.md](../../../docs/production/security-headers.md)
- **Performance:** [performance.md](../../../docs/production/performance.md)
- **Database Optimization:** [database-optimization.md](../../../docs/production/database-optimization.md)
- **Rate Limiting (optional):** [rate-limiting.md](../../../docs/production/rate-limiting.md)

## Post-Deployment Bookkeeping
- Update the feature spec: add a deployment section (URL/build, date)
- Update `features/INDEX.md`: status → **Deployed**
- Tag: `git tag -a v1.X.0-PROJ-X -m "Deploy PROJ-X: [Feature Name]"` and `git push origin v1.X.0-PROJ-X`

## Common Issues
- **Build fails on host but works locally:** check Node version; ensure deps are in `dependencies`, not only `devDependencies`; read the host build log.
- **Env vars missing:** set them in the host dashboard; client-side vars need `NEXT_PUBLIC_`; redeploy after adding.
- **Backend connection errors:** verify URL/keys in host env vars; check access rules; confirm a self-hosted instance / managed project isn't paused or down.
- **EAS build fails:** check `app.json` config, credentials, and native module compatibility in the EAS build log.

## Rollback
1. **Web (managed hosts):** promote the previous working deployment in the dashboard.
2. **Web (Coolify/VPS):** redeploy the previous commit / image.
3. **Mobile:** you cannot instantly roll back a shipped store build — halt the release, ship a fixed build; use staged rollout on Play to limit blast radius.

## Git Commit
```
deploy(PROJ-X): Deploy [feature name] to production

- Target: <web target> / mobile: TestFlight + Play
- Deployed: YYYY-MM-DD
```
