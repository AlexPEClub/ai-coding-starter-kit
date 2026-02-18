# PROJ-7: Reporting & Analytics (Automatisches Reporting)

## Status: Planned
**Created:** 2026-02-17
**Last Updated:** 2026-02-17

## Dependencies
- Requires: PROJ-1 (User Authentication)
- Requires: PROJ-3 (Tour & Appointment Scheduling)
- Requires: PROJ-4 (Training Session Data Entry) — reports are based on Bericht data

## Overview
Replaces the manual "Analyse.csv" and "Auswertung 2025.csv" Excel files with automated, interactive reports. Provides aggregated views by week (KW), month, trainer, and region. Management and Admin can drill down into performance data without manual calculations.

## Report Types

### 1. Weekly / Monthly Summary (KW-Auswertung)
- Total TN per KW / month
- Total sessions per KW / month
- Comparison to previous year (2024 vs 2025 vs 2026)

### 2. Trainer Performance Report
- Sessions per trainer (count)
- Average TN per session per trainer
- Average ratings (Verständlichkeit, Nutzbarkeit, Kompetenz) per trainer
- Trend over time

### 3. Regional Report
- Sessions per region (OÖ, Salzburg, Tirol, Vorarlberg)
- TN count per region
- Quality ratings per region

### 4. Quality Overview
- Average of all three ratings across all sessions
- Distribution chart (e.g. how many sessions scored 8+ vs below 5)

## User Stories
- As a Management user, I want to see the total TN count per calendar week so that I can track growth over time.
- As an Admin, I want to see a per-trainer breakdown of sessions, TN, and average ratings so that I can assess individual trainer performance.
- As a Management user, I want to compare current year data with the previous year so that I can identify trends.
- As an Admin, I want to filter all reports by date range, trainer, and region so that I can slice the data flexibly.
- As any user, I want to see chart visualizations (bar charts, line charts) alongside the raw numbers so that trends are immediately visible.
- As an Admin, I want to see a report of sessions where quality ratings were below a threshold so that I can identify training quality issues.

## Acceptance Criteria
- [ ] Weekly summary report shows: KW number, total sessions, total TN, average ratings for each KW in the selected period
- [ ] Trainer performance report is filterable by date range and shows per-trainer aggregates
- [ ] Regional report shows per-region aggregates with the same filters
- [ ] Year-over-year comparison is available for the weekly summary (current year vs previous year)
- [ ] All reports support date range filter (from / to date picker)
- [ ] All reports are accessible to Management (read-only) and Admin
- [ ] Trainers can access only their own performance report (personal view)
- [ ] Charts use bar and line chart types (no pie charts for MVP)
- [ ] Reports load in under 3 seconds for a full-year date range

## Edge Cases
- What if there are no completed sessions in the selected date range? → Show zero-state with clear messaging: "No data for this period."
- What if a Bericht was submitted but then the appointment was cancelled? → Exclude cancelled appointments from all aggregations (only "Durchgeführt" status counts).
- What if ratings data is missing for some sessions? → Show the averages for available data; indicate "N sessions excluded (missing data)" in a footnote.
- What if the date range spans more than 2 years? → Allow it; performance must still meet the 3-second requirement via proper database indexing.
- What if a Trainer with no completed sessions is included in the trainer report? → Show a row with 0 sessions and N/A for all metrics.

## Technical Requirements
- Use database aggregation queries (GROUP BY) rather than computing in application code
- Index on: `termine.datum`, `termine.trainer_id`, `termine.status`, `berichte.submitted_at`
- Chart library: Recharts (already in many Next.js projects) or Chart.js
- Cache report queries with `unstable_cache` (revalidate when new Bericht is submitted)
- Access control: Admins see all data; Trainers see only their own; Management sees all (read-only)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
