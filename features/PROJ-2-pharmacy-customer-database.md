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

### Pages & Routes
```
app/(app)/
  apotheken/
    page.tsx      ← Pharmacy list (server-rendered, paginated)
    [id]/
      page.tsx    ← Pharmacy detail + appointment history
```

### Component Structure
```
Apotheken Page (List View)
+-- Page header: "Apotheken" + "Neue Apotheke" Button (Admin only)
+-- Filter bar
|   +-- Search input (name, PLZ, Ort — real-time)
|   +-- Region Select (OÖ / Salzburg / Tirol / Vorarlberg / Alle)
|   +-- Priority Select (Alle / Normal / Top-Kunde)
+-- Apotheken Table (shadcn Table, 25 rows/page)
|   +-- Columns: Name, Region, PLZ, Ort, Priority Badge, # Termine, Actions
|   +-- Actions (Admin only): Edit icon, Delete icon
|   +-- Row click → Pharmacy Detail Sheet or navigate to [id] page
+-- Pagination controls (shadcn Pagination)
+-- Empty state (when no results match filters)

Add / Edit Apotheke Dialog (Admin only)
+-- Name input (required)
+-- Address input
+-- PLZ input
+-- Ort input (required)
+-- Region Select (required)
+-- Priority Select (required)
+-- Notes Textarea
+-- "Speichern" + "Abbrechen" buttons
+-- Duplicate warning banner (same name + PLZ already exists)

Delete Confirmation Dialog (Admin only)
+-- Warning: "Diese Apotheke hat X bevorstehende Termine"
+-- Affected appointments list (up to 5 shown)
+-- "Trotzdem löschen" (confirm) + "Abbrechen" buttons

Pharmacy Detail Page ([id])
+-- Back breadcrumb → Apotheken list
+-- Info Card: all fields + Edit button (Admin only)
+-- Appointment History Table
|   +-- Columns: Date, Trainer, Status Badge, TN (if Bericht exists)
|   +-- Sorted: upcoming first, then past
+-- Empty state for appointments
```

### Data Model
```
apotheken table:
  id          — UUID (primary key, auto-generated)
  name        — text, required
  address     — text
  plz         — text, required
  ort         — text, required
  region      — enum: 'OÖ' | 'Salzburg' | 'Tirol' | 'Vorarlberg'
  priority    — enum: 'normal' | 'top_kunde'
  notes       — text
  deleted_at  — timestamp (null = active; non-null = soft-deleted)
  created_at  — auto-timestamp
  created_by  — UUID (FK to auth.users)

Indexes: region, plz, name (for fast filtering)
```

### How Data Flows
1. Page loads → Server Component fetches filtered pharmacy list from Supabase (server-side, respects RLS)
2. User types in search → client-side debounced filter updates URL params → page re-fetches (or client-side filter for small datasets)
3. Admin clicks "Add" → Dialog opens → form submits via Server Action → table revalidates
4. Admin clicks "Delete" → check for upcoming termine → show warning dialog → Server Action marks `deleted_at` → row disappears from list

### Key Technical Decisions
- **Soft delete**: `deleted_at` timestamp instead of removing the row. This preserves historical appointment links and allows accidental deletions to be recovered by an Admin directly in the database if needed.
- **Server-side pagination**: For lists that could grow to 1000+ entries, the query uses `LIMIT` + `OFFSET` with filters applied in Supabase (not in JavaScript).
- **No custom search API**: Supabase's `.ilike()` filter on `name`, `ort`, and `plz` is sufficient for MVP without needing a full-text search engine.

### Dependencies
No new packages required.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
