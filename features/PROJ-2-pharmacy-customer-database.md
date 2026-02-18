# PROJ-2: Pharmacy Customer Database (Apotheken-Datenbank)

## Status: Planned
**Created:** 2026-02-17
**Last Updated:** 2026-02-17

## Dependencies
- Requires: PROJ-1 (User Authentication) — Admin role required for create/edit/delete

## Overview
Centralized database of pharmacy customers (Apotheken) that replaces the regional Excel sheets (OÖ.csv, Tirol.csv, etc.). Admins manage the master customer list; Trainers can view customers relevant to their tours.

## Data Model
| Field | Type | Notes |
|-------|------|-------|
| `name` | string | e.g. "Marien Apotheke" |
| `address` | string | Street and number |
| `plz` | string | Postal code, e.g. "6020" |
| `ort` | string | City, e.g. "Innsbruck" |
| `region` | enum | OÖ, Salzburg, Tirol, Vorarlberg |
| `priority` | enum | Normal, Top-Kunde |
| `notes` | text | Free-text field for additional info |
| `created_at` | timestamp | Auto-generated |

## User Stories
- As an Admin, I want to create a new pharmacy with name, address, region, and priority so that it can be used when scheduling appointments.
- As an Admin, I want to edit an existing pharmacy's details so that outdated information is corrected.
- As an Admin, I want to delete a pharmacy so that decommissioned customers are removed (with safeguard if it has upcoming appointments).
- As a Trainer, I want to view a list of all pharmacies so that I can look up contact details during planning.
- As any user, I want to filter the pharmacy list by region so that I can quickly find customers in a specific area.
- As any user, I want to search for a pharmacy by name or city so that I can find a specific customer quickly.
- As an Admin, I want to see how many appointments have been held at each pharmacy so that I can identify under-served customers.

## Acceptance Criteria
- [ ] Admin can create a pharmacy with all required fields (name, PLZ, Ort, Region)
- [ ] Admin can edit any field of an existing pharmacy
- [ ] Admin can delete a pharmacy; system warns if the pharmacy has future scheduled appointments
- [ ] Pharmacy list is paginated or virtualized for large datasets
- [ ] List can be filtered by Region (OÖ, Salzburg, Tirol, Vorarlberg) and Priority
- [ ] Search field filters by name, city, or PLZ in real time
- [ ] Trainers can view the pharmacy list but cannot create, edit, or delete
- [ ] Management can view the list but cannot create, edit, or delete
- [ ] Each pharmacy has a detail page showing all associated appointments (past and upcoming)
- [ ] Duplicate detection: warn Admin if a pharmacy with the same name and PLZ already exists

## Edge Cases
- What if an Admin tries to delete a pharmacy with future appointments? → Show a warning listing the affected appointments; require explicit confirmation before deletion.
- What if two pharmacies have the same name in different cities? → Allowed (different PLZ/Ort); no duplicate warning triggered.
- What if the region of a pharmacy is changed? → Existing appointments remain linked; only future reporting is affected by the new region.
- What if the pharmacy list grows very large (1000+ entries)? → Pagination and server-side search must be used.
- What if a Trainer accesses a pharmacy detail page via direct URL? → They can view it (read-only); RLS ensures no mutation is possible.

## Technical Requirements
- Security: RLS policy — Trainers/Management have SELECT only; Admins have full CRUD
- Index on: `region`, `plz`, `name` columns for fast filtering
- Soft delete preferred over hard delete (set `deleted_at` timestamp instead of removing the row)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
