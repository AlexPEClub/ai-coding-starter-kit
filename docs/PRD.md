# Product Requirements Document

## Vision
TierPhysio ist eine Multi-Tenant-Plattform für Tierphysiotherapeuten und Tierbesitzer, die es Therapeuten ermöglicht, personalisierte Rehabilitationspläne zu erstellen und ihre Kunden (Tierbesitzer) bei der Durchführung von Übungen mit Video-gestütztem Feedback zu unterstützen. Das Ziel ist, die Qualität der tierphysiotherapeutischen Betreuung durch bessere Kommunikation, Dokumentation und Fortschrittsüberwachung zu verbessern.

## Target Users

### Primär: Tierphysiotherapeuten
- **Wer:** Physiotherapeuten und Trainer, die mit Tieren (Hunde, Katzen, Pferde, etc.) arbeiten
- **Schmerzen:**
  - Schwer, Patienten-Compliance zu überwachen (wissen nicht, ob Übungen richtig durchgeführt werden)
  - Manuelle, zeitaufwändige Dokumentation von Trainingsfortschritt
  - Keine Möglichkeit, Video-Feedback zu geben, ohne dass Patienten zur Praxis kommen müssen
  - Patienten vergessen Übungen oder führen sie falsch durch

### Sekundär: Tierbesitzer (Kunden)
- **Wer:** Hundebesitzer, Katzen- und Pferdehalter, deren Tiere Rehabilitation benötigen
- **Schmerzen:**
  - Unsicherheit, ob sie die Übungen richtig machen
  - Keine Anleitung zu Hause (müssen zur Praxis für Videos/Anweisungen)
  - Schwer, Fortschritt zu messen und zu sehen, ob die Therapie funktioniert
  - Keine Kommunikation mit Therapeut zwischen Terminen

## Core Features (Roadmap)

| Priority | Feature | Status |
|----------|---------|--------|
| P0 (MVP) | Multi-Tenant Infrastruktur (Supabase) | Planned |
| P0 (MVP) | Therapeuten-Authentifizierung & Workspace | Planned |
| P0 (MVP) | Patienten-Verwaltung (CRUD) | Planned |
| P0 (MVP) | Übungsdatenbank & Editor | Planned |
| P0 (MVP) | Trainingsplan-Builder | Planned |
| P0 (MVP) | Kunde-Portal (Basis) | Planned |
| P0 (MVP) | Tagesaufgaben & Kalender-Tracking | Planned |
| P0 (MVP) | Video-Upload & Review | Planned |
| P1 | Fortschritts-Analytics (Schmerz/Steifheit-Kurven) | Planned |
| P1 | Therapeuten-Feedback-System (erweitert) | Planned |
| P1 | Rollen & Berechtigungen (Admin, Therapeut, Kunde) | Planned |
| P2 | Übungs-Marktplatz (Therapeuten teilen) | Planned |
| P2 | Messaging / In-App Chat | Planned |
| P2 | Erweiterte Reports & Export | Planned |
| P2 | Wearables Integration | Planned |
| P2 | Kundenverwaltung (Rechnungen, Termine) | Planned |

## Success Metrics

1. **Adoption:** Die 2 Beta-Therapeuten verwalten aktiv jeweils mindestens 1-2 Patienten in der App
2. **Data Persistence:** Alle Daten (Patienten, Übungen, Trainingspläne, Videos) überleben einen Neustart; Multi-Tenant-Isolation funktioniert
3. **Video Workflow:** Vollständiger Zyklus funktioniert — Upload, Abspielen, Therapeuten-Feedback, Kunde sieht Feedback
4. **Stability:** Keine kritischen Bugs, die Therapeuten am Arbeiten hindern
5. **User Feedback:** Die 2 Therapeuten können mindestens 2 Wochen ohne Support-Anfragen damit arbeiten

## Constraints

- **Timeline:** MVP in 3-4 Monaten (single developer)
- **Team:** 1 Developer (du), 2 Beta-Therapeuten für Feedback
- **Tech Stack:** Next.js 16, TypeScript, Tailwind + shadcn/ui, Supabase (PostgreSQL + Auth + Storage)
- **Design System:** Sage Green Primary (#1E3F20), Orange & Blue Accents, Light/Dark Mode (siehe `docs/design-system.md`)
- **Storage:** Supabase Storage für Videos (no external CDN initially)
- **Scale (MVP):** ~100-200 total users (2 therapeuten × multiple customers), <100 videos

## Non-Goals (MVP)

- ❌ Zahlungssystem / Billing (nur Admin-Setup)
- ❌ Native Mobile Apps (nur responsive Web)
- ❌ Video-Transcodierung / Adaptive Streaming
- ❌ Erweiterte Analytics & Machine Learning
- ❌ Übungs-Marktplatz
- ❌ Community Features / Messaging
- ❌ Kundenverwaltungs-Funktionen (Rechnungen, Terminplanung)
- ❌ Wearables / Third-party API Integration

---

**Next Steps:** Verwende `/write-spec` um die erste Feature zu spezifizieren, oder `/architecture` um die Tech-Details zu planen.
