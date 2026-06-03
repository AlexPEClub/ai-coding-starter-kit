# PROJ-6: Vergleichsansicht FDM/SLS/DLP

**Status:** In Progress
**Created:** 2026-05-10

## User Story
Als Vertriebsmitarbeiter moechte ich fuer dasselbe Bauteil Preise aller drei Druckverfahren nebeneinander sehen, um dem Kunden die beste Option vorzuschlagen.

## Acceptance Criteria
- Nach STL-Analyse zeigt die Vergleichsseite eine Karte/Spalte pro Verfahren.
- Pro Verfahren: Default-Material, Stueckpreis, Gesamtpreis, geschaetzte Druckzeit, Bauraum-Status (passt/passt nicht).
- Verfahren, in das das Bauteil nicht passt, werden klar markiert.
- Material und Menge sind pro Spalte unabhaengig waehlbar.
- "Als Angebot uebernehmen"-Button uebernimmt eine Spalte ins Angebot.

## Out of Scope
- Diff-Ansicht der Kostenstrukturen unterhalb der Karten (Folge-Feature)

## Implementation Notes
- Wiederverwendung der Pricing-Engine und der STL-Analyse.
- Layout: Drei-Spalten-Grid (md:grid-cols-3, mobil gestapelt).
