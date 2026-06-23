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

| ID | Feature | Priority | Dependencies | Status | Spec | Created |
|----|---------|----------|--------------|--------|------|---------|
| PROJ-1 | Supabase Infrastructure Setup | P0 | None | Approved | [spec](PROJ-1-supabase-infrastructure-setup.md) | 2026-06-21 |
| PROJ-2 | Authentifizierung & User Accounts | P0 | PROJ-1 | Deployed | [spec](PROJ-2-authentifizierung-user-accounts.md) | 2026-06-21 |
| PROJ-3 | Gruppe & Mitglieder-Management | P0 | PROJ-1, PROJ-2 | Deployed | [spec](PROJ-3-gruppe-mitglieder-management.md) | 2026-06-21 |
| PROJ-4 | Aktivitäts-Vorschläge & Voting | P0 | PROJ-3 | Deployed | [spec](PROJ-4-aktivitaets-vorschlaege-voting.md) | 2026-06-21 |
| PROJ-5 | Kanban-Board | P0 | PROJ-4 | Deployed | [spec](PROJ-5-kanban-board.md) | 2026-06-21 |
| PROJ-6 | Aktivitäts-Detail | P0 | PROJ-5 | Deployed | [spec](PROJ-6-aktivitaets-detail.md) | 2026-06-21 |
| PROJ-7 | Terminfindung & Kalender-Export | P0 | PROJ-5, PROJ-6, PROJ-8 | Deployed | [spec](PROJ-7-terminfindung-kalender-export.md) | 2026-06-21 |
| PROJ-8 | Nutzerprofil & Archiv | P0 | PROJ-2, PROJ-6 | Deployed | [spec](PROJ-8-nutzerprofil-archiv.md) | 2026-06-21 |
| PROJ-9 | Capacitor Native Apps (iOS + Android) | P1 | PROJ-1..PROJ-8 | Roadmap | — | 2026-06-21 |
| PROJ-10 | Push-Benachrichtigungen (FCM/APNs) | P1 | PROJ-9 | Roadmap | — | 2026-06-21 |
| PROJ-11 | OTA-Updates via Capgo | P2 | PROJ-9 | Roadmap | — | 2026-06-21 |
| PROJ-12 | Benachrichtigungen & Einstellungen (In-App + E-Mail) | P1 | PROJ-2, PROJ-8 | Roadmap | — | 2026-06-22 |

## Next Available ID: PROJ-13
