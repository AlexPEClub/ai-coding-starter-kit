# Product Requirements Document

## Vision
Der Nexora AI BizDev Agent ist ein täglicher KI-Assistent, der den aktuellen Stand von Nexora AI analysiert und konkrete Verbesserungsvorschläge in drei Bereichen generiert: Content & Marketing, Produktentwicklung und Operations. Stefan prüft und bestätigt die Vorschläge — der Agent setzt sie dann selbständig als Monday.com-Tasks und Notion-Dokumente um.

## Target Users
**Stefan Billich** — Solo-Gründer von Nexora AI, GMP Qualification Specialist. Baut KI-Lösungen für Pharma & Healthcare (erstes Produkt: QualiPilot). Problem: Zeit ist knapp, er entwickelt allein, und Business Development wird leicht zugunsten von Produktarbeit vernachlässigt. Braucht einen strukturierten täglichen Workflow, der BizDev automatisch vorantreibt.

## Core Features (Roadmap)

| Priority | Feature | Status |
|----------|---------|--------|
| P0 (MVP) | Supabase Infrastructure Setup | Planned ✓ |
| P0 (MVP) | Daily Suggestion Engine | Planned ✓ |
| P0 (MVP) | Review & Approval Dashboard | Planned ✓ |
| P1 | Monday.com Task Auto-Creation | Planned |
| P1 | Notion Document Auto-Creation | Deployed ✓ |
| P1 | Notion-Dokument-Ausarbeitung | Planned ✓ |
| P1 | Implementation Tracking & History | Planned |
| P2 | Context-Aware Suggestions (Live-Daten) | Planned ✓ |

## Success Metrics
- ≥5 Vorschläge pro Woche von Stefan geprüft
- ≥3 bestätigte Vorschläge pro Woche als Monday.com-Task angelegt
- ≥1 Notion-Dokument pro Woche automatisch erstellt
- Tägliche Vorschlagsgenerierung zuverlässig verfügbar

## Constraints
- Solo-Gründer: Review-UI muss in < 2 Minuten täglich bedienbar sein
- Design: Nexora AI Brand Guide — Dark Premium, Sora Font, #0078FF Primary, Gradient Cyan→Violet auf Navy #070B1E
- Design system: see `docs/design-system.md`
- Stack: Next.js 16, Supabase, Monday.com API, Notion API, Claude API
- MVP ohne bezahlte externe Datenquellen

## Non-Goals
- Kein Auto-Posting auf LinkedIn (Vorschläge bleiben Entwürfe)
- Kein Ersatz für Monday.com oder Notion — nur Inhalte darin erstellen
- Kein allgemeiner KI-Assistent — nur Nexora AI BizDev
