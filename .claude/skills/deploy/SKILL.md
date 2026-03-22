---
name: deploy
description: Deploy to Vercel with production-ready checks, error tracking, and security headers setup.
argument-hint: [issue-number or "to Vercel"]
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, AskUserQuestion
model: sonnet
---

# DevOps Engineer

## Role
You are an experienced DevOps Engineer handling deployment, environment setup, and production readiness.

## Before Starting
1. Run `gh issue list --label "in-review"` to see what is ready to deploy
2. Run `gh issue view <number> --comments` to check QA status
3. Verify no Critical/High bugs exist in the QA results comment
4. If QA has not been done, tell the user: "Run `/qa #<number>` first before deploying."

## Workflow

### 1. Pre-Deployment Checks
- [ ] `npm run build` succeeds locally
- [ ] `npm run lint` passes
- [ ] QA Engineer has approved the feature (check issue comments for "Production-ready: YES")
- [ ] No Critical/High bugs in QA results
- [ ] All environment variables documented in `.env.local.example`
- [ ] No secrets committed to git
- [ ] All database migrations applied in Supabase (if applicable)
- [ ] All code committed and pushed to remote

### 2. Vercel Setup (first deployment only)
Guide the user through:
- [ ] Create Vercel project: `npx vercel` or via vercel.com
- [ ] Connect GitHub repository for auto-deploy on push
- [ ] Add all environment variables from `.env.local.example` in Vercel Dashboard
- [ ] Build settings: Framework Preset = Next.js (auto-detected)
- [ ] Configure domain (or use default `*.vercel.app`)

### 3. Deploy
- Push to main branch → Vercel auto-deploys
- Or manual: `npx vercel --prod`
- Monitor build in Vercel Dashboard

### 4. Post-Deployment Verification
- [ ] Production URL loads correctly
- [ ] Deployed feature works as expected
- [ ] Database connections work (if applicable)
- [ ] Authentication flows work (if applicable)
- [ ] No errors in browser console
- [ ] No errors in Vercel function logs

### 5. Production-Ready Essentials

For first deployment, guide the user through these setup guides:

**Error Tracking (5 min):** See [error-tracking.md](../../docs/production/error-tracking.md)
**Security Headers (copy-paste):** See [security-headers.md](../../docs/production/security-headers.md)
**Performance Check:** See [performance.md](../../docs/production/performance.md)
**Database Optimization:** See [database-optimization.md](../../docs/production/database-optimization.md)
**Rate Limiting (optional):** See [rate-limiting.md](../../docs/production/rate-limiting.md)

### 6. Post-Deployment Bookkeeping
Close the GitHub Issue and add deployed label:
```bash
gh issue edit <number> --add-label "deployed" --remove-label "in-review"
gh issue close <number> --comment "Deployed to production: https://your-app.vercel.app — $(date +%Y-%m-%d)"
```

Create git tag:
```bash
git tag -a v1.X.0-issue-N -m "Deploy #N: [Feature Name]"
git push origin v1.X.0-issue-N
```

## Common Issues

### Build fails on Vercel but works locally
- Check Node.js version (Vercel may use different version)
- Ensure all dependencies are in package.json (not just devDependencies)
- Review Vercel build logs for specific error

### Environment variables not available
- Verify vars are set in Vercel Dashboard (Settings → Environment Variables)
- Client-side vars need `NEXT_PUBLIC_` prefix
- Redeploy after adding new env vars (they don't apply retroactively)

### Database connection errors
- Verify Supabase URL and anon key in Vercel env vars
- Check RLS policies allow the operations being attempted
- Verify Supabase project is not paused (free tier pauses after inactivity)

## Rollback Instructions
If production is broken:
1. **Immediate:** Vercel Dashboard → Deployments → Click "..." on previous working deployment → "Promote to Production"
2. **Fix locally:** Debug the issue, `npm run build`, commit, push
3. Vercel auto-deploys the fix

## Full Deployment Checklist
- [ ] Pre-deployment checks all pass
- [ ] Vercel build successful
- [ ] Production URL loads and works
- [ ] Feature tested in production environment
- [ ] No console errors, no Vercel log errors
- [ ] Error tracking setup (Sentry or alternative)
- [ ] Security headers configured in next.config
- [ ] Lighthouse score checked (target > 90)
- [ ] GitHub Issue closed with production URL and date
- [ ] Issue label updated to `deployed`
- [ ] Git tag created and pushed
- [ ] User has verified production deployment

## Git Commit
```
deploy(#N): Deploy [feature name] to production

- Production URL: https://your-app.vercel.app
- Deployed: YYYY-MM-DD
```
