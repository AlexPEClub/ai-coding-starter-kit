# PROJ-4: Training Session Data Entry (Erfassungsmaske für Schulungsdaten)

## Status: Planned
**Created:** 2026-02-17
**Last Updated:** 2026-02-17

## Dependencies
- Requires: PROJ-1 (User Authentication)
- Requires: PROJ-3 (Tour & Appointment Scheduling) — a Bericht is always linked to a completed appointment

## Overview
After a training session (Termin) is marked as "Durchgeführt", the Trainer must enter the post-session data: participant count, duration, and quality ratings. This replaces the manual data entry in "Auswertung 2025.csv" and feeds the reporting system (PROJ-7).

## Data Model

### Bericht (Session Report)
| Field | Type | Notes |
|-------|------|-------|
| `termin_id` | FK | Links 1:1 to a completed Termin |
| `teilnehmer_anzahl` | integer | Number of participants (TN) |
| `dauer_stunden` | float | Session duration in hours (e.g. 1.5) |
| `rating_verstaendlichkeit` | integer | Scale 1–10 |
| `rating_nutzbarkeit` | integer | Scale 1–10 |
| `rating_kompetenz` | integer | Scale 1–10 |
| `themen` | text | Optional: topics covered |
| `interne_notiz` | text | Optional: internal notes for Admin |
| `submitted_at` | timestamp | When the Trainer submitted the report |
| `submitted_by` | FK | Which user submitted |

## User Stories
- As a Trainer, I want to open an appointment and fill in the session report (TN count, duration, ratings) after the session so that performance data is recorded.
- As a Trainer, I want the data entry form to be simple and mobile-friendly so that I can fill it in on my tablet on the way home.
- As an Admin, I want to see which completed appointments are still missing a report so that I can follow up with the Trainer.
- As an Admin, I want to edit a submitted report to fix errors so that the analytics data is accurate.
- As a Trainer, I want to save a draft report and complete it later so that I am not forced to finish on-site.
- As a Management user, I want to view submitted reports in read-only mode so that I can review individual session quality.

## Acceptance Criteria
- [ ] When an appointment is set to "Durchgeführt", a prompt appears offering to fill in the session report
- [ ] The report form contains: TN count (integer), Duration (decimal hours), three rating fields (1–10 each), optional Topics and Notes
- [ ] All three rating fields and TN count are required to submit; duration defaults to the appointment's scheduled duration
- [ ] The form can be saved as a draft and completed later
- [ ] A submitted report is linked 1:1 to the appointment (one report per appointment)
- [ ] Admin can see a list of "Durchgeführt" appointments with missing reports (highlighted as overdue after 48 hours)
- [ ] Admin can edit any submitted report
- [ ] Trainers can only submit/edit reports for their own appointments
- [ ] Management can view all reports (read-only)
- [ ] Ratings must be integers between 1 and 10 (validated client-side and server-side)
- [ ] TN count must be a non-negative integer

## Edge Cases
- What if a Trainer submits a report for an appointment that was not marked "Durchgeführt"? → Block submission; prompt the Trainer to first update the appointment status.
- What if a report has already been submitted and the Trainer tries to submit again? → Show the existing report and allow editing (versioning is not required for MVP).
- What if the appointment duration spans midnight? → Flag as unusual; allow submission with a confirmation warning.
- What if TN count is 0? → Allowed with a confirmation prompt ("Are you sure 0 participants attended?").
- What if a rating field is left at 0? → 0 is not a valid rating (scale is 1–10); require the user to enter a value.
- What if the appointment is cancelled after a draft report was started? → The draft is discarded; no report can be submitted for cancelled appointments.

## Technical Requirements
- RLS: Trainers can INSERT/UPDATE only their own reports (`submitted_by = auth.uid()`); Admins have full access; Management has SELECT only
- Unique constraint: one report per `termin_id`
- Index on: `termin_id`, `submitted_by`, `submitted_at`
- Server-side validation: TN count ≥ 0, duration > 0, all ratings in [1, 10]

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Pages & Routes
```
app/(app)/
  termine/
    [id]/
      page.tsx    ← Appointment detail page — contains the Bericht section
  berichte/
    page.tsx      ← Admin/Management: list of all submitted reports
                     Admin: shows "missing reports" alert at top
```

### Component Structure
```
Appointment Detail Page (termine/[id]) — Bericht section
+-- Status section
|   +-- Current status badge
|   +-- "Als Durchgeführt markieren" button (Trainer, if status = Fixiert)
|   +-- Status change dropdown (Admin)

+-- Bericht Section (visible when status = 'durchgefuehrt')
    [If no Bericht submitted yet:]
    +-- Prompt banner: "Bitte Schulungsdaten erfassen"
    +-- Bericht Form
    |   +-- Teilnehmer-Anzahl (TN) — number input, required
    |   +-- Dauer in Stunden — decimal input (pre-filled with scheduled duration)
    |   +-- Rating section "Bewertungen (1–10)"
    |   |   +-- Verständlichkeit — number input 1-10 or star/button selector
    |   |   +-- Nutzbarkeit     — number input 1-10
    |   |   +-- Kompetenz       — number input 1-10
    |   +-- Themen — textarea (optional)
    |   +-- Interne Notiz — textarea (optional, hidden from Trainer, visible to Admin)
    |   +-- "Entwurf speichern" button + "Bericht abschicken" button
    |   +-- Validation summary (shows errors inline)

    [If draft exists:]
    +-- Draft indicator badge: "Entwurf gespeichert"
    +-- Same form, pre-filled with draft data

    [If report submitted (is_draft = false):]
    +-- Submitted Bericht Card (read-only for Trainer/Management)
    |   +-- TN, Dauer, all three ratings
    |   +-- Submitted by + date
    +-- "Bearbeiten" button (Admin only, or Trainer for own report)

Berichte Page (Admin / Management list view)
+-- Page header: "Berichte"
+-- Alert section (Admin only): "X fehlende Berichte" → list with links
+-- Filter bar: Trainer, Region, Date range
+-- Reports Table
|   +-- Date, Pharmacy, Trainer, TN, Avg Rating, Submitted At
|   +-- Row click → opens Appointment Detail page
+-- Pagination
```

### Data Model
```
berichte table:
  id                        — UUID
  termin_id                 — UUID FK → termine (UNIQUE constraint: 1 report per appointment)
  teilnehmer_anzahl         — integer, NOT NULL when is_draft = false
  dauer_stunden             — numeric (e.g. 1.5), NOT NULL when is_draft = false
  rating_verstaendlichkeit  — integer 1–10, NOT NULL when is_draft = false
  rating_nutzbarkeit        — integer 1–10, NOT NULL when is_draft = false
  rating_kompetenz          — integer 1–10, NOT NULL when is_draft = false
  themen                    — text (optional)
  interne_notiz             — text (optional)
  is_draft                  — boolean (true = saved as draft, false = submitted)
  submitted_at              — timestamp (set when is_draft becomes false)
  submitted_by              — UUID FK → auth.users

Indexes: termin_id, submitted_by, submitted_at, is_draft
Unique constraint: termin_id (only one Bericht per appointment)
```

### How Data Flows
1. Trainer opens appointment detail → sees status = Durchgeführt → Bericht form appears
2. Trainer fills form → clicks "Entwurf speichern" → Server Action upserts row with `is_draft = true`
3. Trainer returns later → form is pre-filled with draft data
4. Trainer clicks "Abschicken" → Server Action validates all required fields server-side → sets `is_draft = false`, records `submitted_at`
5. After submission → form becomes read-only view card; Trainer can request Admin to edit if error
6. Admin visits /berichte → sees all submitted reports + "missing reports" alert for 'durchgefuehrt' termine without a Bericht (or with only a draft) older than 48h
7. Admin clicks "Bearbeiten" on any submitted report → same form in edit mode → Server Action updates the row

### Key Technical Decisions
- **Rating input UX**: Instead of typing numbers 1-10, the UI uses 10 clickable button-tiles (like "1 2 3 4 5 6 7 8 9 10") for a touch-friendly experience on tablets.
- **Draft system**: A single `is_draft` flag on the Bericht row. Upsert (insert or update) on the same `termin_id` makes "save draft" and "re-edit draft" seamless.
- **Server-side validation**: Required fields are validated in the Server Action before the database write. Even if someone bypasses the form, the server rejects incomplete submissions.
- **Interne Notiz visibility**: The `interne_notiz` field is hidden in the UI for Trainers (they cannot see or enter it); Admins see it when viewing or editing any report.

### Dependencies
No new packages required.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
