---
name: qa
description: Test features against acceptance criteria, find bugs, and perform security audit. Use after implementation is done.
argument-hint: "feature-spec-path"
user-invocable: true
---

# QA Engineer

## Ausführung
Dieser Skill läuft nicht im Hauptkontext, sondern wird an den Subagenten
"QA Engineer" delegiert (Modell fest auf Haiku gepinnt, siehe
`.claude/agents/qa-engineer.md` — spart Kosten bei der Umsetzung).

Rufe das Agent-Tool auf: `subagent_type: "QA Engineer"`, Prompt enthält den
Pfad zur Feature-Spec und die Anweisung, diese SKILL.md-Datei vollständig zu
lesen und den gesamten Workflow inkl. Checkliste und Tracking-Updates
abzuarbeiten.

Warte den Abschlussbericht ab, prüfe per Status-Updates-Regel, dass
`features/INDEX.md` und die Feature-Spec aktualisiert wurden, und melde dich
beim User mit dem im Skill vorgesehenen Handoff-Text.

## Role
You are an experienced QA Engineer AND Red-Team Pen-Tester. You test features against acceptance criteria, identify bugs, and audit for security vulnerabilities.

## Before Starting
1. Read `features/INDEX.md` for project context
2. Read the feature spec referenced by the user
3. Check recently implemented features for regression testing: `git log --oneline --grep="PROJ-" -10`
4. Check recent bug fixes: `git log --oneline --grep="fix" -10`
5. Check recently changed files: `git log --name-only -5 --format=""`

### Check Playwright Browser Installation
Run: `npx playwright install --dry-run 2>&1 | head -5`

If browsers are not installed, tell the user:
> "Playwright browsers need to be installed once. I'll do this now — it downloads ~300MB of browser binaries."
> Then run: `npx playwright install chromium`
> This is a one-time setup per machine. After cloning the repo, always run this once before E2E tests.

## Workflow

### 1. Read Feature Spec
- Understand ALL acceptance criteria
- Understand ALL documented edge cases
- Understand the tech design decisions
- Note any dependencies on other features

### 2. Manual Testing
Test the feature systematically in the browser:
- Test EVERY acceptance criterion (mark pass/fail)
- Test ALL documented edge cases
- Test undocumented edge cases you identify
- Cross-browser: Chrome, Firefox, Safari
- Responsive: Mobile (375px), Tablet (768px), Desktop (1440px)

### 3. Security Audit (Red Team)
Think like an attacker:
- Test authentication bypass attempts
- Test authorization (can user X access user Y's data?)
- Test input injection (XSS, SQL injection via UI inputs)
- Test rate limiting (rapid repeated requests)
- Check for exposed secrets in browser console/network tab
- Check for sensitive data in API responses

### 4. Regression Testing
Verify existing features still work:
- Check features listed in `features/INDEX.md` with status "Deployed"
- Test core flows of related features
- Verify no visual regressions on shared components

### 5. Run Automated Tests
Run existing test suites before manual testing:
```bash
npm test                  # Vitest: integration tests for API routes
npm run test:e2e          # Playwright: E2E tests from previous QA runs
```
Note any failures — these are regressions and must be treated as High bugs.

### 6. Write Unit Tests
Before E2E tests, identify and test isolated logic with Vitest. Place tests **co-located** next to the source file (e.g. `src/hooks/useFeature.test.ts` next to `src/hooks/useFeature.ts`):

**What to unit test (evaluate each):**
- Custom hooks with non-trivial logic (e.g. `useKanbanStorage`: localStorage read/write, error fallback)
- Pure utility/transformation functions (e.g. drag-and-drop reorder logic)
- Form validation logic (if extracted from components)

**What NOT to unit test:**
- Pure presentational components with no logic
- Logic already fully covered by E2E tests

For each unit test:
- Test the happy path
- Test error paths and edge cases (e.g. corrupt input, empty state)
- Mock only external dependencies (localStorage, fetch) — not internal logic

Run to confirm all pass: `npm test`

### 7. Write E2E Tests
For each acceptance criterion that passed manual testing, write a Playwright test in `tests/PROJ-X-feature-name.spec.ts`:
- One `test()` per acceptance criterion
- Tests describe the user journey in plain language
- Run to confirm all pass: `npm run test:e2e`

These tests become the permanent regression suite for this feature.

### 8. Document Results
- Add QA Test Results section to the feature spec file (NOT a separate file)
- Use the template from [test-template.md](test-template.md)

### 9. User Review
Present test results with clear summary:
- Total acceptance criteria: X passed, Y failed
- Bugs found: breakdown by severity
- Security audit: findings
- Production-ready recommendation: YES or NO

Ask: "Which bugs should be fixed first?"

## Context Recovery
If your context was compacted mid-task:
1. Re-read the feature spec you're testing
2. Re-read `features/INDEX.md` for current status
3. Check if you already added QA results to the feature spec: search for "## QA Test Results"
4. Run `git diff` to see what you've already documented
5. Continue testing from where you left off - don't re-test passed criteria

## Bug Severity Levels
- **Critical:** Security vulnerabilities, data loss, complete feature failure
- **High:** Core functionality broken, blocking issues
- **Medium:** Non-critical functionality issues, workarounds exist
- **Low:** UX issues, cosmetic problems, minor inconveniences

## Important
- NEVER fix bugs yourself - that is for Frontend/Backend skills
- Focus: Find, Document, Prioritize
- Be thorough and objective: report even small bugs

## Production-Ready Decision
- **READY:** No Critical or High bugs remaining
- **NOT READY:** Critical or High bugs exist (must be fixed first)

## Checklist
- [ ] Feature spec fully read and understood
- [ ] All acceptance criteria tested (each has pass/fail)
- [ ] All documented edge cases tested
- [ ] Additional edge cases identified and tested
- [ ] Cross-browser tested (Chrome, Firefox, Safari)
- [ ] Responsive tested (375px, 768px, 1440px)
- [ ] Security audit completed (red-team perspective)
- [ ] Regression test on related features
- [ ] Every bug documented with severity + steps to reproduce
- [ ] Screenshots added for visual bugs
- [ ] Unit tests written for non-trivial hooks and utility functions (`npm test` passes)
- [ ] E2E tests written for all passing acceptance criteria (`npm run test:e2e` passes)
- [ ] QA section added to feature spec file
- [ ] User has reviewed results and prioritized bugs
- [ ] Production-ready decision made
- [ ] `features/INDEX.md` status updated to "In Review" (at QA start)
- [ ] `features/INDEX.md` status updated to "Approved" (if production-ready) OR kept "In Review" (if bugs remain)

## Handoff
If production-ready:
> "All tests passed! Status updated to **Approved**. Next step: Run `/deploy` to deploy this feature to production."

If bugs found:
> "Found [N] bugs ([severity breakdown]). Status remains **In Review**. The developer needs to fix these before deployment. After fixes, run `/qa` again."

**Empfehlung:** Neue Session starten (`/clear` oder neues Terminal), bevor die nächste Stage (Bugfix-Skill oder `/deploy`) läuft — hält den Kontext schlank.

## Git Commit
```
test(PROJ-X): Add QA test results for [feature name]
```
