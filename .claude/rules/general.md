# General Project Rules

## New Project Detection (MANDATORY)
Before starting ANY work, check if the project has been initialized:
1. Read `docs/PRD.md` - if it still contains placeholder text like "_Describe what you are building_", the project is NOT initialized
2. Run `gh issue list` - if no issues exist, no features have been defined

**If the project is not initialized:**
- Do NOT write any code or create any components
- Do NOT skip ahead to implementation
- Instead, tell the user: "This project hasn't been set up yet. Let's start by defining what you want to build. Run `/requirements` with a description of your idea (e.g. `/requirements I want to build a task management app`)."
- If the user already described their idea in the current message, run `/requirements` automatically with their description

**If the project is initialized but the user requests a feature not yet in GitHub Issues:**
- Guide them to run `/requirements` first to create the issue before any implementation

## Feature Tracking
- All features are tracked as **GitHub Issues** — use `gh issue list` to see current state
- Feature status is tracked via labels: `planned`, `in-progress`, `in-review`, `deployed`
- Feature details (user stories, acceptance criteria, edge cases) live in the issue body
- Tech design and QA results are added as comments on the issue
- One issue per feature (Single Responsibility)
- Never combine multiple independent functionalities in one issue

## GitHub Issue Commands
```bash
gh issue list                                    # See all features + status
gh issue list --label "in-progress"              # Filter by status
gh issue view <number>                           # Read feature details
gh issue create --title "..." --body "..." --label "planned,feature"
gh issue comment <number> --body "..."           # Add tech design or QA results
gh issue edit <number> --add-label "in-progress" --remove-label "planned"
gh issue close <number> --comment "Deployed to production"
```

## Git Conventions
- Commit format: `type(#N): description` where N is the GitHub issue number
- Types: feat, fix, refactor, test, docs, deploy, chore
- Check existing components before building: `git ls-files src/components/`
- Check existing APIs before building: `git ls-files src/app/api/`

## Human-in-the-Loop
- Always ask for user approval before finalizing deliverables
- Present options using clear choices rather than open-ended questions
- Never proceed to the next workflow phase without user confirmation

## Status Updates (MANDATORY)
After completing work on any feature, you MUST update the GitHub issue:

1. **Read** the issue first: `gh issue view <number>`
2. **Update label** to reflect new status: `gh issue edit <number> --add-label "..." --remove-label "..."`
3. **Add comment** with implementation notes or QA results
4. **Verify** with `gh issue view <number>` that labels updated correctly

Valid label transitions: `planned` → `in-progress` → `in-review` → `deployed`

**NEVER do this:**
- Do NOT say "I've updated the issue" without actually running `gh issue` commands
- Do NOT skip updates because "it's obvious" or "minor"

## File Handling
- ALWAYS read a file before modifying it - never assume contents from memory
- After context compaction, re-read files and re-check issue status before continuing
- Run `git diff` to verify what has already been changed in this session
- Never guess at import paths, component names, or API routes - verify by reading

## Handoffs Between Skills
- After completing a skill, suggest the next skill to the user
- Format: "Next step: Run `/skillname` to [action]"
- Handoffs are always user-initiated, never automatic
