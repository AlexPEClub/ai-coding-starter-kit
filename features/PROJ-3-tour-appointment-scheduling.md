# PROJ-3: Tour & Appointment Scheduling (Tourenplanung & Termin-Slotting)

## Status: Planned
**Created:** 2026-02-17
**Last Updated:** 2026-02-17

## Dependencies
- Requires: PROJ-1 (User Authentication)
- Requires: PROJ-2 (Pharmacy Customer Database) — appointments are linked to pharmacies

## Overview
Core scheduling feature that replaces the "Fixiert von Sebastian.csv" and "Gesamt.csv" Excel files. Admins and Trainers can create appointments (Termine) linked to a specific pharmacy and trainer. A "Tour" is a series of appointments grouped by trainer and time period (e.g. "KW 42 Tirol").

## Data Model

### Termin (Appointment)
| Field | Type | Notes |
|-------|------|-------|
| `apotheke_id` | FK | Links to Apotheke |
| `trainer_id` | FK | Links to User (Trainer role) |
| `datum` | date | YYYY-MM-DD |
| `zeit_start` | time | HH:MM |
| `zeit_ende` | time | HH:MM |
| `status` | enum | Geplant, Fixiert, Durchgeführt, Abgesagt |
| `notiz` | text | Free-text notes (e.g. "10 min später") |
| `created_by` | FK | User who created the appointment |
| `created_at` | timestamp | Auto-generated |

### Tour (Grouping)
| Field | Type | Notes |
|-------|------|-------|
| `name` | string | e.g. "KW 42 Tirol" |
| `trainer_id` | FK | Assigned trainer |
| `region` | enum | OÖ, Salzburg, Tirol, Vorarlberg |
| `start_date` | date | First day of the tour |
| `end_date` | date | Last day of the tour |

## User Stories
- As an Admin, I want to create a new appointment by selecting a pharmacy, a trainer, and a date/time so that the schedule is recorded in the system.
- As an Admin, I want to group appointments into a named Tour (e.g. "KW 42 Tirol – Sebastian") so that related appointments are organized together.
- As an Admin, I want to change the status of an appointment (Geplant → Fixiert → Durchgeführt) so that the team always sees the current state.
- As a Trainer, I want to view all my upcoming appointments so that I can plan my week.
- As a Trainer, I want to add a note to an appointment (e.g. "start 10 min later") so that ad-hoc changes are tracked.
- As an Admin, I want to cancel an appointment and record a reason so that the cancellation history is preserved.
- As an Admin, I want to see all appointments for a given week across all trainers so that I have a full team overview.

## Acceptance Criteria
- [ ] Admin can create an appointment by selecting Apotheke, Trainer, Date, Start Time, End Time
- [ ] Appointment status defaults to "Geplant" on creation
- [ ] Admin can update appointment status through the defined workflow (Geplant → Fixiert → Durchgeführt / Abgesagt)
- [ ] Trainer can add/edit notes on their own appointments
- [ ] Appointments can be grouped into a named Tour
- [ ] Tour overview shows all appointments belonging to it in date order
- [ ] A Trainer can only see appointments assigned to them (enforced at DB level)
- [ ] Admins can see and edit all appointments
- [ ] Cancellation requires a reason note; cancelled appointments are preserved in history (not deleted)
- [ ] When an appointment is marked "Durchgeführt", the system prompts the Trainer to enter session data (links to PROJ-4)
- [ ] List view of appointments supports filtering by: Trainer, Region, Status, Date range

## Edge Cases
- What if the same pharmacy is booked twice on the same day? → Warn the Admin but allow it (the pharmacy may have multiple sessions).
- What if a Trainer is already booked at the same time? → Show a conflict warning (see also PROJ-11 Conflict Checker for full implementation).
- What if an appointment is cancelled after its training data (Bericht) has been entered? → The Bericht is preserved but flagged as associated with a cancelled appointment.
- What if a tour spans across multiple weeks? → The tour's start/end dates can span any range; all appointments within those dates belong to the tour.
- What if no appointments exist for a selected week? → Display an empty state with a clear call-to-action to add the first appointment.

## Technical Requirements
- Index on: `datum`, `trainer_id`, `status`, `apotheke_id`
- RLS: Trainers SELECT only their own appointments (`trainer_id = auth.uid()`); Admins have full access
- Foreign key: `apotheke_id` → `apotheken.id` ON DELETE RESTRICT (cannot delete a pharmacy with appointments)
- Foreign key: `trainer_id` → `auth.users.id`

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Pages & Routes
```
app/(app)/
  touren/
    page.tsx        ← Tour list
    [id]/
      page.tsx      ← Tour detail with its appointments
  termine/
    page.tsx        ← All appointments list (cross-tour view)
    [id]/
      page.tsx      ← Appointment detail + status actions + Bericht form (PROJ-4)
```

### Component Structure
```
Touren Page (List)
+-- Header: "Touren" + "Neue Tour" button (Admin only)
+-- Filter bar: Trainer select (Admin only), Region select, Date range
+-- Tour Cards (or table rows)
|   +-- Tour name, Trainer name, Region badge, Date range, # Termine, # Done
|   +-- Status indicator (all done? any cancelled?)
|   +-- Click → Tour Detail page

Neue Tour Dialog (Admin only)
+-- Tour name input (e.g. "KW 42 Tirol – Sebastian")
+-- Trainer selector
+-- Region selector
+-- Start date / End date pickers

Tour Detail Page ([id])
+-- Breadcrumb: Touren → [Tour Name]
+-- Tour info header (editable by Admin inline or via Edit button)
+-- Appointment Table (sorted by date ascending)
|   +-- Columns: Date, Time, Pharmacy, Status Badge, Note icon, Actions
|   +-- Status badge colors: Geplant=blue, Fixiert=orange, Durchgeführt=green, Abgesagt=grey
|   +-- Row click → Appointment Detail Sheet (slide-over)
|   +-- Actions (Admin): Edit, Cancel
+-- "Termin hinzufügen" button (Admin only)

Termin Add/Edit Dialog (Admin only)
+-- Apotheke searchable select (type to search by name/city)
+-- Trainer select (pre-filled with tour's trainer; Admin can override)
+-- Date picker
+-- Start time input + End time input
+-- Status select (Geplant / Fixiert)
+-- Notes textarea
+-- "Speichern" button

Termin Cancel Dialog (Admin only)
+-- Reason textarea (required)
+-- "Abgesagt markieren" button

Appointment Detail Sheet (Slide-over — opens on click)
+-- Pharmacy name + address
+-- Date + time
+-- Status badge + "Status ändern" dropdown (Admin full; Trainer: can mark Durchgeführt)
+-- Assigned trainer name
+-- Notes (editable by Trainer for own appointments)
+-- Link: "Vollständige Detailseite öffnen"
+-- If status = Durchgeführt: Bericht section (see PROJ-4)

Termine Page (All Appointments — cross-tour list)
+-- Filter bar: Trainer, Region, Status, Date range
+-- Table: Date, Pharmacy, Trainer, Tour, Status, TN (if Bericht submitted)
+-- Pagination
```

### Data Model
```
touren table:
  id          — UUID
  name        — text (e.g. "KW 42 Tirol – Sebastian")
  trainer_id  — UUID FK → auth.users
  region      — enum: 'OÖ' | 'Salzburg' | 'Tirol' | 'Vorarlberg'
  start_date  — date
  end_date    — date
  created_at  — auto-timestamp

termine table:
  id          — UUID
  tour_id     — UUID FK → touren (nullable — appointment can exist without a tour)
  apotheke_id — UUID FK → apotheken ON DELETE RESTRICT
  trainer_id  — UUID FK → auth.users
  datum       — date
  zeit_start  — time
  zeit_ende   — time
  status      — enum: 'geplant' | 'fixiert' | 'durchgefuehrt' | 'abgesagt'
  notiz       — text
  cancel_reason — text (only set when status = abgesagt)
  created_by  — UUID FK → auth.users
  created_at  — auto-timestamp

Indexes: datum, trainer_id, status, apotheke_id, tour_id
```

### How Data Flows
1. Admin creates a Tour → creates Tour record → starts adding Termine to it
2. Each Termin creation: select Apotheke (searchable), Trainer, Date/Time → Server Action inserts row
3. Status changes: Admin or Trainer changes status → Server Action updates `status` field → page revalidates
4. When status is set to "Durchgeführt" → UI shows a prompt to fill in the Bericht (PROJ-4)
5. Cancelled appointments: status = "abgesagt", cancel_reason recorded, row preserved forever

### Key Technical Decisions
- **Appointments can exist without a tour**: The `tour_id` is nullable so individual appointments can be created outside of a tour grouping (useful for one-off sessions).
- **Apotheke searchable select**: Instead of a plain dropdown (too many options), a combobox with server-side search (`Command` component from shadcn) lets Admins type to find a pharmacy.
- **Optimistic UI for status changes**: Status badge updates immediately on click; if the Server Action fails, it rolls back with an error toast.

### Dependencies
No new packages required for this feature.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
