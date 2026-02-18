# PROJ-6: Dashboard & Home Screen

## Status: Planned
**Created:** 2026-02-17
**Last Updated:** 2026-02-17

## Dependencies
- Requires: PROJ-1 (User Authentication)
- Requires: PROJ-3 (Tour & Appointment Scheduling) — upcoming appointments
- Requires: PROJ-4 (Training Session Data Entry) — overdue reports indicator
- Optional: PROJ-7 (Reporting & Analytics) — summary metrics may pull from reporting queries

## Overview
The landing page after login. Gives each user role a role-appropriate overview of the most important information: upcoming appointments, alerts requiring action, and key metrics. Replaces the "first thing I do when I open Excel" mental model.

## User Stories
- As an Admin, I want to see today's and this week's appointments across all trainers on the dashboard so that I get an immediate overview.
- As an Admin, I want to see which completed appointments are missing their session report so that I can follow up with the relevant Trainer.
- As a Trainer, I want to see my next 5 upcoming appointments on the dashboard so that I know what's coming without navigating to the calendar.
- As a Trainer, I want to see which of my appointments still need a session report so that I am reminded to complete them.
- As a Management user, I want to see high-level KPIs (total TN this month, average quality rating) so that I can assess performance at a glance.
- As any user, I want to navigate to the most common actions from the dashboard so that I can reach key features in one click.

## Dashboard Sections by Role

### Admin Dashboard
- **Today's Appointments** — all trainers, with quick status update
- **This Week Summary** — count of scheduled/fixiert/done appointments
- **Missing Reports Alert** — list of "Durchgeführt" appointments without a Bericht
- **Quick Stats** — Total TN this month, active trainers, appointments this week

### Trainer Dashboard
- **My Next Appointments** — next 5 upcoming, with pharmacy name, date, time
- **My Pending Reports** — appointments needing data entry
- **My Stats This Month** — personal TN count, average quality rating

### Management Dashboard
- **KPI Cards** — Total TN this month, Avg. rating (Verständlichkeit / Nutzbarkeit / Kompetenz), number of tours completed
- **Recent Activity** — last 10 completed sessions across all trainers
- **Link to full reports** → PROJ-7

## Acceptance Criteria
- [ ] Dashboard is the first page shown after login (redirect from `/`)
- [ ] Each role sees a different layout tailored to their needs (as defined above)
- [ ] Data on the dashboard is fresh (max 5 minutes cache or loaded on every visit)
- [ ] "Missing Reports" alert section lists appointments name, date, and trainer; links directly to the report form
- [ ] Quick action buttons on the dashboard: "Add Appointment", "View Calendar", "View Reports"
- [ ] Management KPI cards show the current calendar month by default
- [ ] Empty states are handled gracefully for each section (no blank spaces)
- [ ] Dashboard loads in under 2 seconds on a standard connection

## Edge Cases
- What if a Trainer has no upcoming appointments? → Show an empty state: "No upcoming appointments — contact your Admin."
- What if the Management dashboard has no data yet? → Show zero-state KPI cards (0 TN, N/A rating) with a note.
- What if there are 50+ missing reports? → Show the first 10 with a "View all" link.
- What if an Admin clicks a "missing report" link but the Trainer already submitted it (race condition)? → Show the submitted report instead of the entry form.

## Technical Requirements
- Dashboard queries must use efficient aggregations (avoid N+1 queries)
- Use `unstable_cache` from Next.js for KPI aggregations (revalidate every 5 minutes)
- Dashboard is server-rendered for initial load (Next.js App Router)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
