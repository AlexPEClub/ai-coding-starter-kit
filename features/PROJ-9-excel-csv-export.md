# PROJ-9: Excel / CSV Export (Datenexport)

## Status: Planned
**Created:** 2026-02-17
**Last Updated:** 2026-02-17

## Dependencies
- Requires: PROJ-1 (User Authentication)
- Requires: PROJ-3 (Tour & Appointment Scheduling)
- Requires: PROJ-4 (Training Session Data Entry)
- Optional: PROJ-7 (Reporting & Analytics) — export of aggregated reports

## Overview
Allows Admins to export appointment and session data to Excel/CSV format for use in external tools or for compliance purposes. Ensures the new system does not break existing downstream Excel-based workflows while the team transitions.

## Export Types

### 1. Appointments Export
- All or filtered appointments with: Date, Time, Pharmacy, Region, Trainer, Status, Notes
- Matches the structure of the legacy "Fixiert von Sebastian.csv" and "Gesamt.csv"

### 2. Session Reports Export
- All or filtered Bericht data: Date, Pharmacy, Trainer, TN count, Duration, ratings
- Matches the structure of "Auswertung 2025.csv"

### 3. Aggregated Analytics Export
- Weekly/monthly summary data (as shown in PROJ-7 reports)
- Matches "Analyse.csv" structure

## User Stories
- As an Admin, I want to export all appointments for a date range to Excel so that I can share them with stakeholders who use Excel.
- As an Admin, I want to export session reports filtered by trainer or region so that I can create the annual performance review document.
- As an Admin, I want the exported file to have clear column headers in German so that it matches the existing Excel template expectations.
- As a Management user, I want to export the aggregated analytics data to Excel so that I can incorporate it into external presentations.

## Acceptance Criteria
- [ ] "Export" button is available on the Appointment List, Session Reports page, and Analytics page
- [ ] The user can select the export format: Excel (.xlsx) or CSV (.csv)
- [ ] The user can filter before exporting: by date range, trainer, region, and status
- [ ] Exported files use German column headers that match the legacy Excel file conventions
- [ ] Appointments export includes: Datum, Uhrzeit Start, Uhrzeit Ende, Apotheke, PLZ, Ort, Region, Trainer, Status, Notiz
- [ ] Session reports export includes: Datum, Apotheke, Trainer, TN, Dauer (h), Verständlichkeit, Nutzbarkeit, Kompetenz, Themen
- [ ] Large exports (up to 5000 rows) complete without timeout (use streaming or background job if needed)
- [ ] Admin and Management roles can export; Trainers can export only their own data
- [ ] Exported file is named with the date range (e.g. `Termine_2025-01-01_2025-12-31.xlsx`)

## Edge Cases
- What if the filtered dataset is empty? → Export an Excel file with headers but no data rows; do not show an error.
- What if the export contains 10,000+ rows? → Use server-side streaming to avoid memory issues; inform the user the download may take a moment.
- What if a cell contains special characters (e.g. commas in notes)? → CSV export must properly quote fields; Excel export handles this natively.
- What if the user navigates away before the download starts? → The download link should open in a new tab so navigation doesn't interrupt it.

## Technical Requirements
- Excel generation library: `xlsx` (SheetJS) — runs server-side in an API route
- CSV generation: native (no library needed for simple CSVs)
- Export is generated on-demand via an API route (`/api/export/...`) that streams the file
- No persistent storage of export files (generate and stream in memory)
- Access control enforced in the API route (same RLS logic as the underlying data)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
