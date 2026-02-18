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

### Pages & Routes
```
app/(app)/
  dashboard/
    page.tsx    ← Server Component: fetches role-appropriate data,
                  renders the correct dashboard layout
                  Redirect target after login (/ → /dashboard)
```

### Component Structure

**Admin Dashboard:**
```
Admin Dashboard Page
+-- Page header: "Guten Morgen, [Name]" + Today's date
+-- Stat Cards row (4 cards)
|   +-- Termine heute (count)
|   +-- Termine diese Woche (count)
|   +-- Fehlende Berichte (count, red if > 0)
|   +-- Aktive Trainer (count)
+-- "Heute" Appointments Section
|   +-- Today's Termine Table
|       +-- Columns: Zeit, Apotheke, Trainer, Status Badge, Quick Status Change
|       +-- Empty state: "Keine Termine heute"
+-- Missing Reports Alert Section (only if count > 0)
|   +-- Alert banner: "X abgeschlossene Termine ohne Bericht"
|   +-- List: Date, Pharmacy, Trainer, Days overdue → Link to report form
|   +-- "Alle anzeigen" link (→ /berichte with filter)
+-- Quick Actions row
    +-- "Termin erstellen" button
    +-- "Kalender öffnen" button
    +-- "Berichte anzeigen" button
```

**Trainer Dashboard:**
```
Trainer Dashboard Page
+-- Page header: "Meine Übersicht" + Trainer's name
+-- "Meine nächsten Termine" section
|   +-- Up to 5 upcoming appointment cards
|       +-- Card: Pharmacy name, Date, Start-End time, Status badge
|       +-- Link: "Alle meine Termine"
|   +-- Empty state: "Keine bevorstehenden Termine"
+-- "Fehlende Berichte" section (if any)
|   +-- List of completed appointments without a submitted Bericht
|       +-- Pharmacy name, Date → Link to report form
|   +-- Empty state: "Alle Berichte vollständig ✓"
+-- "Meine Stats diesen Monat" section
    +-- TN count this month
    +-- Avg. Verständlichkeit / Nutzbarkeit / Kompetenz ratings
    +-- Sessions completed this month
```

**Management Dashboard:**
```
Management Dashboard Page
+-- Page header: "Übersicht [current month name]"
+-- KPI Cards row (4 cards)
|   +-- Gesamt TN (this month)
|   +-- Durchschn. Verständlichkeit
|   +-- Durchschn. Nutzbarkeit
|   +-- Durchschn. Kompetenz
+-- "Letzte Aktivität" section
|   +-- Last 10 completed sessions (all trainers)
|       +-- Date, Pharmacy, Trainer, TN, Avg Rating
+-- "Vollständige Berichte öffnen" button → /berichte
```

### Data Model (no new tables)
The dashboard reads from existing tables. All data is fetched via efficient aggregation queries:

```
For Admin:
  — Count of termine where datum = today
  — Count of termine where datum in current week
  — Count of termine where status = 'durchgefuehrt' AND no matching bericht
  — Count of distinct active trainers

For Trainer (own data only, filtered by trainer_id):
  — Next 5 termine where datum >= today, ordered by datum ASC
  — Termine where status = 'durchgefuehrt' AND no Bericht (or is_draft = true)
  — Sum of TN + avg ratings from berichte this calendar month

For Management:
  — Sum of TN from berichte this calendar month
  — Avg of each rating field from berichte this calendar month
  — Last 10 berichte with joined termin + apotheke + trainer data
```

### How Data Flows
1. User logs in → redirected to `/dashboard`
2. Server Component reads user's role from `user_profiles` (from the layout's UserContext, or directly)
3. Based on role, the server runs the appropriate aggregation queries against Supabase
4. KPI aggregations are cached with `unstable_cache` (revalidated every 5 minutes)
5. "Missing reports" list and today's appointments are NOT cached (must be fresh)
6. The page renders with all data populated before HTML is sent to the browser (no loading spinners)
7. Quick action buttons are regular links (no JavaScript needed for navigation)

### Key Technical Decisions
- **Server-rendered**: The entire dashboard is a Server Component. No client-side data fetching, no loading skeletons for the main content — data is ready on first paint.
- **Cached aggregations**: Expensive queries (monthly KPI totals) use `unstable_cache`. Action-required sections (missing reports, today's appointments) bypass the cache to always be current.
- **Role-based rendering**: One page file, three different layouts based on the `role` field. No separate routes per role — simpler to maintain.
- **shadcn Card components**: KPI stat cards and appointment cards are built from the existing `Card`, `CardHeader`, `CardContent` components. No new UI library needed.

### Dependencies
No new packages required.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
