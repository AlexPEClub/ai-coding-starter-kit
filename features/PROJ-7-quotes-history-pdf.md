# PROJ-7: Angebotshistorie + PDF-Export

**Status:** In Progress
**Created:** 2026-05-10

## User Story
Als Vertriebsmitarbeiter moechte ich erstellte Angebote speichern, in einer Liste wiederfinden und als druckbares PDF an den Kunden senden.

## Acceptance Criteria
- "Angebot speichern"-Button in der Calculator-Ansicht erfasst Kunde (Name, Firma, E-Mail), Bauteil-Bezeichnung, Notizen.
- Liste aller Angebote mit Datum, Angebotsnummer, Kunde, Verfahren, Gesamtpreis, Status (Entwurf/Versendet/Angenommen/Abgelehnt).
- Detailansicht zeigt vollstaendiges Angebot mit Breakdown.
- "Als PDF drucken"-Aktion oeffnet print-optimierte Seite, browserseitig speicherbar als PDF.
- Angebotsnummer automatisch generiert (Format: `Q-YYYY-NNNN`).

## Out of Scope
- Direkter E-Mail-Versand
- Cloud-Speicherung der PDFs (lokaler Browser-Speicher reicht im MVP)

## Implementation Notes
- PDF via `window.print()` auf `/quotes/[id]/print` route mit `@media print` CSS.
- Angebotsnummer-Generator inkrementiert pro Jahr.
