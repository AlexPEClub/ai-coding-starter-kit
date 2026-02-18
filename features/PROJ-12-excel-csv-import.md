# PROJ-12: Excel / CSV Import (Datenmigration)

## Status: Planned
**Created:** 2026-02-17
**Last Updated:** 2026-02-17

## Dependencies
- Requires: PROJ-1 (User Authentication) — Admin only
- Requires: PROJ-2 (Pharmacy Customer Database) — imports populate the Apotheken table
- Requires: PROJ-3 (Tour & Appointment Scheduling) — imports populate the Termine table
- Requires: PROJ-4 (Training Session Data Entry) — imports populate the Berichte table

## Overview
One-time (and repeatable) import of the existing Excel/CSV data files into the new system. This is the data migration tool that allows the team to switch to the platform without losing historical data. The import is Admin-only and designed to be run multiple times safely (idempotent).

## Source Files
Based on the existing Excel structure:
| Source File | Target Table | Notes |
|-------------|-------------|-------|
| `OÖ.csv`, `Tirol.csv`, etc. | `apotheken` | Pharmacy master data by region |
| `Fixiert von Sebastian.csv`, `Gesamt.csv` | `termine` | Appointment history and planned appointments |
| `Auswertung 2025.csv` | `berichte` | Session report data (TN, ratings) |

## User Stories
- As an Admin, I want to upload a CSV file of pharmacies and have them imported into the system so that I don't have to enter them manually one by one.
- As an Admin, I want to import historical appointment data from Excel so that the new system has a complete history from day one.
- As an Admin, I want to import past session reports (Auswertungen) so that analytics and reporting are accurate from the start.
- As an Admin, I want to preview the import before committing it so that I can catch mapping errors.
- As an Admin, I want duplicate records to be handled gracefully (skip or update) so that I can safely re-run an import if data changed.

## Acceptance Criteria
- [ ] Admin can upload a CSV file via the import UI page
- [ ] The system displays a preview of the first 10 rows with column mapping before the user confirms the import
- [ ] Admin can map source CSV columns to target database columns (e.g. map "Name" → `name`, "Bundesland" → `region`)
- [ ] Duplicate detection: if a pharmacy with the same name + PLZ already exists, it is skipped (with a count shown in the import summary)
- [ ] Import summary is shown after completion: rows imported, rows skipped (duplicate), rows failed (validation error)
- [ ] Rows with validation errors (e.g. invalid region value) are listed in an error report; the rest are imported
- [ ] Import is transactional: if > 50% of rows fail, the entire import is rolled back and the Admin is alerted
- [ ] Import is Admin-only; no other role can access the import page
- [ ] Import history is logged (which file, when, how many rows, by whom)

## Edge Cases
- What if the CSV file uses a semicolon delimiter instead of comma? → Auto-detect delimiter; fall back to asking the user.
- What if the CSV file has the wrong encoding (e.g. Windows-1252 instead of UTF-8)? → Attempt auto-detection; show an encoding warning if special characters appear garbled.
- What if an appointment in the import references a pharmacy that doesn't exist in the database? → Create the pharmacy with minimal data (name only, region inferred from context), or flag as an unresolved reference in the error report.
- What if the import file has 10,000+ rows? → Process in chunks server-side; show a progress indicator.
- What if the Admin refreshes the page during the import? → The import continues server-side; show the last import status on next load.

## Technical Requirements
- File upload: multipart form via API route; max file size 10 MB
- CSV parsing: `papaparse` library (browser-side preview) + server-side validation
- Import runs in a background job (Supabase Edge Function or Next.js API route) for large files
- All imports are logged in an `import_logs` table
- Admin-only: enforced in the API route

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
