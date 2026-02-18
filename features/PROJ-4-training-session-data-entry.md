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
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
