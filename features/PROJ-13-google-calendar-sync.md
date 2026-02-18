# PROJ-13: Google Calendar Sync

## Status: Planned
**Created:** 2026-02-17
**Last Updated:** 2026-02-17

## Dependencies
- Requires: PROJ-1 (User Authentication)
- Requires: PROJ-3 (Tour & Appointment Scheduling) — appointments are the events to sync
- Requires: PROJ-10 (Email Notifications) — notification infrastructure may be reused for sync alerts

## Overview
Two-way synchronization between the platform's appointments and Google Calendar. Allows Trainers to see their appointments in Google Calendar on their phones and benefit from native calendar features (notifications, navigation integration). New events created in the platform are pushed to Google Calendar; changes in Google Calendar are reflected in the platform.

## Sync Behavior

| Direction | Trigger | Behavior |
|-----------|---------|----------|
| Platform → Google | Appointment created/updated/cancelled | Create/update/delete Google Calendar event |
| Google → Platform | Event moved in Google Calendar | Update appointment date/time in platform (with Admin notification) |

## User Stories
- As a Trainer, I want to connect my Google Calendar to the platform so that my appointments automatically appear in my phone's calendar.
- As a Trainer, I want to disconnect Google Calendar sync at any time so that I can stop the integration without losing data.
- As a Trainer, I want Google Calendar events to include the pharmacy name, address, and a link back to the appointment so that I have all info in one place.
- As an Admin, I want to know if a Trainer changes an appointment time in Google Calendar so that the platform reflects the actual schedule.
- As an Admin, I want to be able to disable Google Calendar sync for a specific user if needed so that I have control over integrations.

## Acceptance Criteria
- [ ] Each Trainer (and Admin if desired) can connect their Google account via OAuth 2.0 from the profile settings page
- [ ] After connecting, all future appointments assigned to that Trainer are automatically synced to their Google Calendar
- [ ] Synced events include: pharmacy name (as event title), address (as location), start/end time, appointment notes (as description), and a deep link to the platform appointment
- [ ] If an appointment is cancelled in the platform, the corresponding Google Calendar event is deleted
- [ ] If an appointment time is changed in the platform, the Google Calendar event is updated
- [ ] If an event is moved in Google Calendar, the platform appointment is updated and the Admin is notified
- [ ] Trainers can disconnect Google Calendar from their profile; existing events are NOT deleted from Google Calendar upon disconnect
- [ ] OAuth tokens are stored securely and refreshed automatically
- [ ] Sync failures (e.g. Google API errors) do not block platform usage; errors are logged and retried

## Edge Cases
- What if a Trainer's Google token expires? → Attempt to refresh automatically; if refresh fails, notify the Trainer to reconnect their account.
- What if the same appointment is edited rapidly multiple times? → Debounce sync updates; send only the final state (avoid multiple API calls for rapid changes).
- What if a Trainer deletes the synced event directly in Google Calendar? → The platform appointment is NOT deleted (one-directional in this case — deletion in Google does not cascade).
- What if the Trainer's Google Calendar API quota is exceeded? → Queue the sync and retry with exponential backoff; inform the user if sync is delayed.
- What if an appointment is created in the past (historical import)? → Do not sync historical appointments (only future appointments, from the time of connection onwards).

## Technical Requirements
- Google Calendar API v3 with OAuth 2.0
- Scopes required: `https://www.googleapis.com/auth/calendar.events`
- Store refresh tokens encrypted in a `user_integrations` table (never in plain text)
- Sync webhooks: use Google Calendar push notifications (watch API) for Google → Platform updates; fall back to polling if webhooks are not feasible
- All API calls must be rate-limit aware (Google allows 1M requests/day per project)
- Environment variables: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
