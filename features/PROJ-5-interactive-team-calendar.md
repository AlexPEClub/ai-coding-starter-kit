# PROJ-5: Interactive Team Calendar (Interaktiver Team-Kalender)

## Status: Planned
**Created:** 2026-02-17
**Last Updated:** 2026-02-17

## Dependencies
- Requires: PROJ-1 (User Authentication)
- Requires: PROJ-3 (Tour & Appointment Scheduling) — calendar displays appointments from that data

## Overview
A visual calendar interface showing all scheduled appointments across the team. Replaces the fragmented mental model of Excel sheets with a single, filterable view. Admins see the full team; Trainers see only their own appointments. Supports weekly and monthly views.

## User Stories
- As an Admin, I want to see all trainers' appointments in a calendar view so that I can spot gaps and overlaps at a glance.
- As a Trainer, I want to see my own appointments in a weekly calendar so that I know what my week looks like.
- As an Admin, I want to filter the calendar by trainer so that I can focus on one person's schedule.
- As an Admin, I want to filter the calendar by region (OÖ, Tirol, etc.) so that I can see the workload for a geographic area.
- As any user, I want to switch between weekly and monthly views so that I can zoom in for detail or out for overview.
- As an Admin, I want to click on an appointment in the calendar to view or edit its details so that I don't need to navigate to a separate list.
- As an Admin, I want to drag and drop an appointment to a new date/time so that rescheduling is fast.

## Acceptance Criteria
- [ ] Calendar displays all appointments as colored blocks on the correct day and time slot (weekly view)
- [ ] Monthly view shows appointments as compact items on each day cell
- [ ] Each appointment block shows: pharmacy name, time, status indicator (color-coded by status)
- [ ] Admins can filter by Trainer (dropdown) and by Region (dropdown); filters can be combined
- [ ] Trainers see only their own appointments; filter options are not shown to them
- [ ] Clicking an appointment block opens a detail/edit panel (slide-over or modal) without full page navigation
- [ ] Drag-and-drop rescheduling updates the appointment date/time and saves to the database (Admin only)
- [ ] Navigation between weeks/months is smooth (previous/next buttons + "today" shortcut)
- [ ] Appointments with status "Abgesagt" are visually de-emphasized (greyed out) but still visible
- [ ] The calendar is responsive and usable on tablet (touch-friendly)
- [ ] Public holidays are NOT shown (not in scope for MVP)

## Edge Cases
- What if multiple appointments occur at the same time slot? → Stack them side-by-side in the time column (standard calendar behavior).
- What if a Trainer has no appointments in the selected week? → Display an empty calendar with a clear empty-state message.
- What if an appointment spans midnight (e.g. 23:00–01:00)? → Show it split across two days or flag it as unusual.
- What if the user drags an appointment to a past date? → Show a warning; require confirmation to proceed.
- What if the calendar is loaded with 500+ appointments in a month? → Use date-range queries to load only the visible period; lazy-load adjacent periods.
- What if two trainers have conflicting appointments visible to an Admin? → Both are shown in the calendar; the Conflict Checker (PROJ-11) handles the warning logic.

## Technical Requirements
- Calendar library: Consider FullCalendar or a lightweight alternative
- Date queries must be scoped to the visible range (no full-table scan)
- Real-time update not required for MVP (manual refresh is acceptable)
- Performance: Calendar must render within 500ms for a typical week view (≤50 appointments)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Pages & Routes
```
app/(app)/
  kalender/
    page.tsx    ← Client Component wrapper (FullCalendar requires browser)
                  Fetches appointments for the visible date range via Server Action or API
```

### Component Structure
```
Kalender Page
+-- Filter bar (Admin only)
|   +-- Trainer Select (all trainers dropdown)
|   +-- Region Select (OÖ / Salzburg / Tirol / Vorarlberg / Alle)
+-- View Toggle (Tabs: "Woche" / "Monat")
+-- Navigation row
|   +-- ← Vorherige button
|   +-- "Heute" button
|   +-- Nächste → button
|   +-- Current period label (e.g. "17.–23. Feb 2026")
+-- FullCalendar component (Client Component)
|   +-- Week view (timeGridWeek): hourly rows, events as colored blocks
|   +-- Month view (dayGridMonth): event pills per day cell
|   +-- Event block: [Pharmacy name] [Start time] [Status color]
|       Color map:
|         geplant        → blue
|         fixiert        → amber/orange
|         durchgefuehrt  → green
|         abgesagt       → grey (muted)
|   +-- Click event → Appointment Detail Sheet opens (slide-over)
|   +-- Drag & drop → date/time updates (Admin only; disabled for Trainer)
+-- Appointment Detail Sheet (shadcn Sheet, right side)
|   +-- Pharmacy name + address
|   +-- Date + Start/End time
|   +-- Status badge + quick status change (Admin)
|   +-- Assigned trainer
|   +-- Notes
|   +-- "Zur Detailseite" link (→ /termine/[id])
|   +-- Close button (X)
```

### Data Model (no new tables)
The calendar reads from the existing `termine` table (PROJ-3). No additional data storage is needed.

```
Data fetched for calendar:
  SELECT id, apotheke_id → name, trainer_id → name, datum,
         zeit_start, zeit_ende, status, notiz
  WHERE datum BETWEEN [range_start] AND [range_end]
  AND (trainer_id = filter OR no filter)
  AND (apotheke.region = filter OR no filter)
```

### How Data Flows
1. Page mounts → FullCalendar renders with the current week/month as initial range
2. On date range change (navigate prev/next or switch view) → Client Component calls a Server Action with the new date range + active filters → returns appointment array
3. Appointments are transformed into FullCalendar event objects: `{ id, title: pharmacyName, start: datetime, end: datetime, color: statusColor, extendedProps: { ... } }`
4. User clicks an event → `eventClick` callback sets `selectedAppointment` state → Sheet opens with appointment data (already loaded, no extra fetch)
5. Admin drags event to new time slot → `eventDrop` / `eventResize` callback → Server Action updates `datum`, `zeit_start`, `zeit_ende` in `termine` → calendar re-fetches to confirm

### Key Technical Decisions
- **FullCalendar**: Chosen over react-big-calendar because it supports both week time-grid and month grid views, drag-and-drop, and event resizing in one package. MIT-licensed for non-commercial use.
- **Client Component with Server Action data fetching**: The calendar itself must be a Client Component (FullCalendar uses DOM APIs). Data is fetched on range changes via a Server Action to keep Supabase credentials server-side.
- **Sheet instead of modal for appointment detail**: A slide-over sheet keeps the calendar visible in the background, providing context while reading/editing appointment details.
- **Admin drag-drop only**: FullCalendar's `editable` prop is set to `true` only when the current user's role is `admin`. Trainers get a read-only view.
- **Colour-coded status**: A simple mapping of status enum → Tailwind color class. The legend is shown at the top of the calendar for clarity.

### Dependencies (new packages to install)
- `@fullcalendar/react` — React integration
- `@fullcalendar/core` — Core engine
- `@fullcalendar/daygrid` — Month grid view (dayGridMonth)
- `@fullcalendar/timegrid` — Week time view (timeGridWeek)
- `@fullcalendar/interaction` — Drag-drop, click, resize

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
