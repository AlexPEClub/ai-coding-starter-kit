# PROJ-11: Conflict Checker (Terminkonflikt-Erkennung)

## Status: Planned
**Created:** 2026-02-17
**Last Updated:** 2026-02-17

## Dependencies
- Requires: PROJ-1 (User Authentication)
- Requires: PROJ-3 (Tour & Appointment Scheduling) — conflict detection applies to appointments
- Requires: PROJ-2 (Pharmacy Customer Database) — pharmacy addresses needed for travel time estimation

## Overview
Automated detection of scheduling conflicts for trainers. Warns when a trainer has overlapping appointments or when the travel time between two consecutive appointments is unrealistically short. This eliminates one of the most painful issues with the current Excel-based system.

## Conflict Types

| Type | Description | Severity |
|------|-------------|----------|
| **Time Overlap** | Trainer has two appointments at the same time | Error — must resolve before saving |
| **Travel Time** | Less than 30 minutes between appointments in different cities | Warning — can override |
| **Double Booking** | Same pharmacy booked twice in the same day for the same trainer | Warning — can override |

## User Stories
- As an Admin, I want to be warned immediately when I try to book a trainer at a time they are already booked so that I don't create double-bookings.
- As an Admin, I want to see a warning when travel time between two consecutive appointments appears too short so that I can avoid logistical impossibilities.
- As an Admin, I want to be able to override a travel time warning with a reason so that I have flexibility when I know the situation (e.g. trainer is already nearby).
- As an Admin, I want to run a conflict scan on an entire tour so that I can find all issues before confirming the tour.
- As a Trainer, I want to see conflict warnings on my own appointments so that I can flag issues to the Admin.

## Acceptance Criteria
- [ ] When creating or editing an appointment, the system checks for time overlaps for the assigned trainer in real-time (before save)
- [ ] If a time overlap is detected, saving is blocked and the user sees a clear error: "This trainer already has an appointment at [time] at [pharmacy]"
- [ ] If travel time between consecutive appointments is < 30 minutes AND in different cities, a yellow warning is shown (not a blocker)
- [ ] The Admin can dismiss/override a travel time warning with an optional note; the appointment is then saved
- [ ] A "Scan Tour" button on the Tour detail page runs a full conflict check across all appointments in the tour and shows a summary
- [ ] Trainers can see conflict warnings on their own upcoming appointments (read-only warning indicator)
- [ ] Conflict scan results are not stored permanently (recalculated on demand)
- [ ] Time overlap check is also run when an existing appointment's time is changed

## Edge Cases
- What if two appointments are at the same pharmacy on the same day (e.g. morning and afternoon)? → No conflict; same-pharmacy same-day is explicitly allowed.
- What if the travel time cannot be calculated (unknown address)? → Skip the travel time check for that pair; show an info note: "Travel time check skipped (address missing)."
- What if the Admin ignores all warnings and saves anyway? → For warnings (not errors), the system allows it. For time overlaps (errors), saving is blocked.
- What if a trainer has 10 conflicts in one tour? → Show all conflicts in the tour scan summary, not just the first one.
- What if an appointment is in the same city as the previous one? → No travel time warning (same city = same postal code area).

## Technical Requirements
- Time overlap check: database query — find appointments where `trainer_id = X AND datum = D AND time ranges overlap`
- Travel time estimation: calculate distance based on stored lat/lng coordinates (from PROJ-8 geocoding); use a simple straight-line distance threshold (< 50 km = same region = no warning)
- No external routing API required for MVP — distance-based heuristic is sufficient
- Checks are performed server-side in an API route, not in the browser

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
