# Feature Index

> Central tracking for all features. Updated by skills automatically.

## Status Legend
- **Roadmap** - `/init` done, feature identified in feature map, no spec file yet
- **Planned** - `/write-spec` done, full spec written, architecture not yet designed
- **Architected** - `/architecture` done, tech design approved, ready to build
- **In Progress** - `/frontend` or `/backend` active or completed, not yet in QA
- **In Review** - `/qa` active, testing in progress
- **Approved** - `/qa` passed, no critical/high bugs, ready to deploy
- **Deployed** - `/deploy` done, live in production

## Features

| ID | Feature | Priority | Status | Spec | Dependencies | Created |
|----|---------|----------|--------|------|--------------|---------|
| PROJ-1 | Supabase Multi-Tenant Infrastructure | P0 | Roadmap | — | None | 2026-05-28 |
| PROJ-2 | Therapeuten-Authentifizierung & Workspace | P0 | Roadmap | — | PROJ-1 | 2026-05-28 |
| PROJ-3 | Patienten-Verwaltung (CRUD) | P0 | Roadmap | — | PROJ-2 | 2026-05-28 |
| PROJ-4 | Übungsdatenbank & Editor | P0 | Roadmap | — | PROJ-2 | 2026-05-28 |
| PROJ-5 | Trainingsplan-Builder | P0 | Roadmap | — | PROJ-3, PROJ-4 | 2026-05-28 |
| PROJ-6 | Kunde-Portal (Basis-UI) | P0 | Roadmap | — | PROJ-5 | 2026-05-28 |
| PROJ-7 | Tagesaufgaben & Kalender-Tracking | P0 | Roadmap | — | PROJ-6 | 2026-05-28 |
| PROJ-8 | Video-Upload & Therapeuten-Review | P0 | Roadmap | — | PROJ-6 | 2026-05-28 |
| PROJ-9 | Fortschritts-Analytics (Schmerz/Steifheit) | P1 | Roadmap | — | PROJ-8 | 2026-05-28 |
| PROJ-10 | Therapeuten-Feedback-System (erweitert) | P1 | Roadmap | — | PROJ-8 | 2026-05-28 |
| PROJ-11 | Rollen & Berechtigungen (Admin, Therapeut, Kunde) | P1 | Roadmap | — | PROJ-2 | 2026-05-28 |
| PROJ-12 | Übungs-Marktplatz | P2 | Roadmap | — | PROJ-4 | 2026-05-28 |
| PROJ-13 | Messaging / In-App Chat | P2 | Roadmap | — | PROJ-2 | 2026-05-28 |
| PROJ-14 | Erweiterte Reports & Export | P2 | Roadmap | — | PROJ-9 | 2026-05-28 |
| PROJ-15 | Kundenverwaltung (Rechnungen, Termine) | P2 | Roadmap | — | PROJ-3 | 2026-05-28 |

## Recommended Build Order (MVP Priority)

### Phase 1: Infrastructure & Auth (Foundation)
1. **PROJ-1** → Supabase Multi-Tenant Infrastructure
2. **PROJ-2** → Therapeuten-Authentifizierung & Workspace
3. **PROJ-11** → Rollen & Berechtigungen (enables role-based features)

### Phase 2: Core Therapeut Features
4. **PROJ-3** → Patienten-Verwaltung
5. **PROJ-4** → Übungsdatenbank & Editor

### Phase 3: Plan & Tracking
6. **PROJ-5** → Trainingsplan-Builder
7. **PROJ-7** → Tagesaufgaben & Kalender-Tracking

### Phase 4: Client Portal & Video
8. **PROJ-6** → Kunde-Portal (Basis-UI)
9. **PROJ-8** → Video-Upload & Review

### Phase 5: Analytics & Polish (P1 features)
10. **PROJ-9** → Fortschritts-Analytics
11. **PROJ-10** → Therapeuten-Feedback-System (erweitert)

### Phase 6: Future Expansion (P2, post-MVP)
12. **PROJ-12** → Übungs-Marktplatz
13. **PROJ-13** → Messaging / In-App Chat
14. **PROJ-14** → Erweiterte Reports & Export
15. **PROJ-15** → Kundenverwaltung

## MVP Scope (Phase 1-5)

**P0 Features (Must-Have for MVP):** PROJ-1 through PROJ-8
- Multi-tenant infrastructure with Supabase
- Therapist workspace & patient management
- Exercise library with custom drawings
- Training plan creation & calendar tracking
- Basic client portal with daily tasks
- Video upload & therapist review

**P1 Features (Nice-to-Have, time permitting):** PROJ-9, PROJ-10, PROJ-11
- Progress analytics with pain/stiffness curves
- Enhanced feedback system
- Role-based access control

**Estimate:** P0 (PROJ-1 to PROJ-8) = ~12-16 weeks for solo developer
**Buffer:** 2 weeks for testing, bug fixes, beta feedback

## Next Available ID: PROJ-16
