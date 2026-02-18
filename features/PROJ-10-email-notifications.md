# PROJ-10: Email Notifications (E-Mail Benachrichtigungen)

## Status: Planned
**Created:** 2026-02-17
**Last Updated:** 2026-02-17

## Dependencies
- Requires: PROJ-1 (User Authentication) — emails are sent to registered users
- Requires: PROJ-3 (Tour & Appointment Scheduling) — triggers from appointment status changes
- Requires: PROJ-4 (Training Session Data Entry) — reminder trigger for missing reports

## Overview
Automated email notifications keep Trainers and Admins informed about relevant events without requiring them to check the platform constantly. Replaces the manual email/WhatsApp coordination that currently happens outside of Excel.

## Notification Types

| Trigger | Recipient | Description |
|---------|-----------|-------------|
| New appointment assigned to trainer | Trainer | "You have a new appointment on [date] at [pharmacy]" |
| Appointment status changed to "Fixiert" | Trainer | "Your appointment on [date] is confirmed" |
| Appointment cancelled | Trainer | "Your appointment on [date] has been cancelled" |
| Appointment date/time changed | Trainer | "Your appointment on [date] has been rescheduled" |
| Appointment completed — missing report (48h reminder) | Trainer | "Please submit your session report for [date] at [pharmacy]" |
| Missing report after 72h | Admin | "Trainer [name] has not submitted a report for [date] at [pharmacy]" |
| Weekly summary (Monday morning) | Admin | Summary of the upcoming week's appointments |

## User Stories
- As a Trainer, I want to receive an email when a new appointment is assigned to me so that I am immediately informed without checking the platform.
- As a Trainer, I want to receive an email reminder 48 hours after a completed session if I haven't submitted the report so that I don't forget.
- As an Admin, I want to receive an email if a Trainer hasn't submitted a report after 72 hours so that I can follow up.
- As an Admin, I want to receive a weekly digest on Monday morning showing all appointments for the upcoming week so that I can start the week prepared.
- As an Admin, I want to enable or disable specific notification types per user so that people are not spammed with irrelevant emails.

## Acceptance Criteria
- [ ] Emails are sent for all trigger types defined in the table above
- [ ] Email templates include: the platform name, relevant appointment details (date, time, pharmacy, status), and a direct link to the appointment in the app
- [ ] The 48h and 72h reminders are sent by a scheduled job (cron), not just on user action
- [ ] Admins can enable/disable notification types globally (e.g. turn off weekly digest)
- [ ] Emails are sent in German (matching the platform language)
- [ ] Notification emails must not be spammy — each trigger fires at most once per appointment per event
- [ ] Undeliverable emails (bounced) do not crash the system; errors are logged
- [ ] No opt-out per user in MVP (all users receive notifications for their role)

## Edge Cases
- What if the same appointment is rescheduled multiple times? → Send one notification per reschedule event; don't batch or suppress.
- What if an appointment is cancelled immediately after being created? → Send the assignment email first, then the cancellation email (both are triggered).
- What if the email provider is down? → Queue the email for retry; do not block the user action that triggered it.
- What if a Trainer submits the report before the 48h reminder fires? → The cron job checks before sending; if a report exists, skip the reminder.
- What if an Admin disables all notifications? → The platform continues to work normally; no emails are sent.

## Technical Requirements
- Email provider: Resend or SendGrid (environment variable configurable)
- Scheduled jobs: Vercel Cron or Supabase Edge Functions (for the 48h/72h reminders)
- Email templates: React Email or plain HTML templates
- All email sends are async (do not block HTTP response)
- Logging: record each sent email in a `email_logs` table with status (sent / failed)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
