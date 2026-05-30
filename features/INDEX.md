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
| PROJ-1 | Supabase Multi-Tenant Infrastructure | P0 | In Progress | [Spec](PROJ-1-supabase-multi-tenant-infrastructure.md) | None | 2026-05-28 |
| PROJ-2 | Therapeuten-Authentifizierung & Workspace | P0 | Planned | [Spec](PROJ-2-therapeuten-authentifizierung-workspace.md) | PROJ-1 | 2026-05-28 |
| PROJ-3 | Patienten-Verwaltung (CRUD) | P0 | Planned | [Spec](PROJ-3-patienten-verwaltung.md) | PROJ-2 | 2026-05-28 |
| PROJ-4 | Übungsdatenbank & Editor | P0 | Planned | [Spec](PROJ-4-uebungsdatenbank-editor.md) | PROJ-2 | 2026-05-28 |
| PROJ-5 | Trainingsplan-Builder | P0 | Planned | [Spec](PROJ-5-trainingsplan-builder.md) | PROJ-3, PROJ-4 | 2026-05-28 |
| PROJ-6 | Kunde-Portal (Basis-UI) | P0 | Planned | [Spec](PROJ-6-kunde-portal-basis.md) | PROJ-16 | 2026-05-28 |
| PROJ-7 | Tagesaufgaben & Kalender-Tracking | P0 | Planned | [Spec](PROJ-7-tagesaufgaben-kalender-tracking.md) | PROJ-5, PROJ-6 | 2026-05-28 |
| PROJ-8 | Video-Upload & Therapeuten-Review | P0 | Planned | [Spec](PROJ-8-video-upload-review.md) | PROJ-2, PROJ-6, PROJ-7 | 2026-05-28 |
| PROJ-9 | Fortschritts-Analytics (Schmerz/Steifheit) | P1 | Roadmap | — | PROJ-8 | 2026-05-28 |
| PROJ-10 | Therapeuten-Feedback-System (erweitert) | P1 | Roadmap | — | PROJ-8 | 2026-05-28 |
| PROJ-11 | Rollen & Berechtigungen (Admin, Therapeut, Kunde) | P1 | Roadmap | — | PROJ-2 | 2026-05-28 |
| PROJ-12 | Übungs-Marktplatz | P2 | Roadmap | — | PROJ-4 | 2026-05-28 |
| PROJ-13 | Messaging / In-App Chat | P2 | Roadmap | — | PROJ-2 | 2026-05-28 |
| PROJ-14 | Erweiterte Reports & Export | P2 | Roadmap | — | PROJ-9 | 2026-05-28 |
| PROJ-15 | Kundenverwaltung (Rechnungen) | P2 | Roadmap | — | PROJ-3 | 2026-05-28 |
| PROJ-16 | Terminverwaltung | P0 | Planned | [Spec](PROJ-16-terminverwaltung.md) | PROJ-3 | 2026-05-28 |

## Recommended Build Order (MVP Priority)

### Phase 1: Infrastructure & Auth (Foundation)
1. **PROJ-1** → Supabase Multi-Tenant Infrastructure
2. **PROJ-2** → Therapeuten-Authentifizierung & Workspace

### Phase 2: Patienten & Termine
3. **PROJ-3** → Patienten-Verwaltung
4. **PROJ-16** → Terminverwaltung

### Phase 3: Kunden-Portal
5. **PROJ-6** → Kunde-Portal (Basis-UI)

### Phase 4: Übungen & Trainingsplanung
6. **PROJ-4** → Übungsdatenbank & Editor
7. **PROJ-5** → Trainingsplan-Builder
8. **PROJ-7** → Tagesaufgaben & Kalender-Tracking

### Phase 5: Video
9. **PROJ-8** → Video-Upload & Therapeuten-Review

### Phase 6: Analytics & Rollen (P1 features)
10. **PROJ-11** → Rollen & Berechtigungen
11. **PROJ-9** → Fortschritts-Analytics
12. **PROJ-10** → Therapeuten-Feedback-System (erweitert)

### Phase 7: Future Expansion (P2, post-MVP)
13. **PROJ-12** → Übungs-Marktplatz
14. **PROJ-13** → Messaging / In-App Chat
15. **PROJ-14** → Erweiterte Reports & Export
16. **PROJ-15** → Kundenverwaltung (Rechnungen)

## MVP Scope (Phase 1-5)

**P0 Features (Must-Have for MVP):** PROJ-1, PROJ-2, PROJ-3, PROJ-16, PROJ-6, PROJ-4, PROJ-5, PROJ-7, PROJ-8
- Multi-tenant infrastructure with Supabase
- Therapist workspace & patient management
- Appointment scheduling (Terminverwaltung)
- Basic client portal
- Exercise library with custom drawings
- Training plan creation & calendar tracking
- Video upload & therapist review

**P1 Features (Nice-to-Have, time permitting):** PROJ-9, PROJ-10, PROJ-11
- Progress analytics with pain/stiffness curves
- Enhanced feedback system
- Role-based access control

**Estimate:** P0 (9 features) = ~14-18 weeks for solo developer
**Buffer:** 2 weeks for testing, bug fixes, beta feedback

## Next Available ID: PROJ-17
