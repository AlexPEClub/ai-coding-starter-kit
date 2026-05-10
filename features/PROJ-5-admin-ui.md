# PROJ-5: Admin-UI fuer Materialien, Drucker, Formeln und Mengenstaffeln

**Status:** In Progress
**Created:** 2026-05-10

## User Story
Als Admin moechte ich ein Web-Interface, ueber das ich Materialien, Drucker, Preisformeln und Mengenrabatte ohne Code-Aenderung pflegen kann.

## Acceptance Criteria
- Tabs/Subseiten fuer **Materialien**, **Drucker**, **Preisformeln** und **Mengenstaffeln**.
- Materialien: pro Verfahren aktivierbar, Felder: Name, Dichte (g/cm^3), Preis pro kg (EUR/kg), Farbe (optional), Notizen.
- Drucker: Name, Verfahren, Bauraum (X/Y/Z in mm), Aktiv ja/nein.
- Preisformeln: Editor pro Verfahren, alle Parameter aus PROJ-3 editierbar.
- Mengenstaffeln: Liste je Verfahren mit `minQty` und `discountPercent`.
- Aenderungen werden sofort persistiert (localStorage) und in der Calculator-Ansicht reflektiert.
- "Zuruecksetzen auf Defaults"-Button mit Bestaetigung.

## Out of Scope
- Mehrbenutzerfaehige Pflege mit Konflikt-Resolution
- Audit-Trail

## Implementation Notes
- Formulare via react-hook-form + zod-Validierung.
- Tabellen via shadcn `Table`, Forms in `Sheet` oder Inline-Cards.
