# PROJ-1: User Authentication & Role Management

## Status: Planned
**Created:** 2026-02-17
**Last Updated:** 2026-02-17

## Dependencies
- None (foundation for all other features)

## Overview
Secure login and signup system with three distinct roles: Admin, Trainer, and Management. Each role has different access rights to features and data throughout the platform.

## User Roles
| Role | Description | Capabilities |
|------|-------------|--------------|
| **Admin** | Backoffice staff managing the platform | Full access: manage users, customers, tours, all data |
| **Trainer** | Field trainers executing tours | View own schedule, enter session data, view own reports |
| **Management** | Executives and managers | Read-only access to all reports and analytics |

## User Stories
- As an Admin, I want to log in with email and password so that I can securely access the management platform.
- As a Trainer, I want to log in and only see my own appointments and data so that my colleagues' data is not exposed.
- As an Admin, I want to invite new users via email so that I can onboard trainers without them self-registering publicly.
- As any user, I want to reset my password via email so that I can regain access if I forget my credentials.
- As an Admin, I want to assign and change user roles so that I can control what each team member can see and do.
- As any logged-in user, I want to see my name and role displayed in the UI so that I know I'm logged in correctly.

## Acceptance Criteria
- [ ] Users can log in with email and password
- [ ] Login fails gracefully with a clear error message for wrong credentials
- [ ] Authenticated session persists across page refreshes (session cookies or JWT)
- [ ] Users are redirected to the dashboard after successful login
- [ ] Unauthenticated users accessing any protected route are redirected to the login page
- [ ] Password reset flow works via email link
- [ ] Admins can invite new users by email (invite-only registration — no public signup)
- [ ] Admins can set or change a user's role (Admin / Trainer / Management)
- [ ] Admins can deactivate a user account without deleting it
- [ ] Route guards enforce role-based access (Trainer cannot access admin-only pages)
- [ ] Management role has read-only access (no create/edit/delete actions visible)

## Edge Cases
- What if a user tries to register publicly? → Public registration is disabled; only invite-based signup is allowed.
- What if an invited user ignores the invitation email? → The invitation expires after 7 days; the Admin can resend it.
- What if an Admin deactivates their own account? → The system prevents the last Admin from being deactivated.
- What if a Trainer tries to access another Trainer's data via URL manipulation? → RLS policies on the database enforce row-level access; the request returns empty/forbidden.
- What if login fails 5 times? → Account is temporarily locked for 15 minutes (brute-force protection).

## Technical Requirements
- Authentication: Supabase Auth (email/password)
- Role storage: `user_metadata` or a separate `user_profiles` table with a `role` column
- Row Level Security must be enabled on all tables that are user-scoped
- All routes except `/login` and `/reset-password` require authentication

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Pages & Routes
```
app/
  (auth)/
    login/          ← Login form (public, redirects to /dashboard if already logged in)
    reset-password/ ← Password reset form (public)
  (app)/
    layout.tsx      ← Auth guard: reads session, redirects to /login if unauthenticated
                       Also provides UserContext (current user + role) to all child pages
    dashboard/      ← First page after login
    admin/
      users/        ← Admin-only: list of all users + invite + deactivate
```

### Component Structure
```
Login Page
+-- Logo / brand heading
+-- Email input
+-- Password input
+-- "Anmelden" button (with loading state)
+-- "Passwort vergessen?" link → /reset-password
+-- Error alert (wrong credentials)

Admin: User Management Page (/admin/users)
+-- Page header + "Benutzer einladen" button
+-- Users Table
|   +-- Name, Email, Role badge, Status (Active/Deactivated), Last login
|   +-- Per-row: Change Role dropdown, Deactivate/Reactivate button
+-- Invite User Dialog
|   +-- Email input
|   +-- Role selector (Admin / Trainer / Management)
|   +-- "Einladung senden" button
+-- Deactivate Confirmation Dialog

App Layout (shared across all protected pages)
+-- Sidebar
|   +-- Platform logo
|   +-- Nav links (filtered by role — see below)
|   +-- Current user name + role badge (from UserContext)
|   +-- Logout button
+-- Main content slot
+-- Sonner toast container

Sidebar Nav Links by Role:
  Admin:      Dashboard, Apotheken, Touren, Termine, Kalender, Berichte, Admin (Users)
  Trainer:    Dashboard, Meine Termine, Kalender, Berichte
  Management: Dashboard, Berichte
```

### Data Model
```
Supabase Auth (built-in):
  Stores email, password hash, session tokens, invite flow

user_profiles table (custom):
  id           — same UUID as auth.users.id (foreign key)
  full_name    — display name
  role         — enum: 'admin' | 'trainer' | 'management'
  is_active    — boolean (false = deactivated, cannot log in)
  created_at   — auto-timestamp
```

### How Roles Are Enforced
- **Middleware** (`middleware.ts`): Checks if a valid Supabase session exists on every request. If not, redirects to `/login`.
- **UserContext**: After login, the layout fetches the user's `user_profiles` row and makes `role` available throughout the app via React Context.
- **UI**: Nav links, buttons, and sections render conditionally based on role from UserContext.
- **Database (RLS)**: Every table has RLS policies that use `auth.uid()` and the role from `user_profiles` to enforce data access — the last line of defense even if the UI is bypassed.

### Key Technical Decisions
- **Invite-only flow**: Supabase `auth.admin.inviteUserByEmail()` sends a magic-link invite. Users cannot self-register.
- **Role in separate table**: Roles are stored in `user_profiles`, not in JWT metadata. This allows role changes to take effect immediately without requiring the user to log out and back in (the layout re-fetches the profile on each navigation).
- **Deactivation**: Setting `is_active = false` in `user_profiles` prevents the user from being shown data, even if their Supabase Auth session is still technically valid. RLS policies check `is_active`.

### Dependencies
No new packages required — Supabase Auth is already in the project via `@supabase/supabase-js`.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
