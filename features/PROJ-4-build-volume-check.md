# PROJ-4: Bauraum-Check

**Status:** In Progress
**Created:** 2026-05-10

## User Story
Als Vertriebsmitarbeiter moechte ich vor Abgabe eines Angebots gewarnt werden, wenn das Bauteil nicht in den Bauraum unserer Drucker passt.

## Acceptance Criteria
- Pro Verfahren werden alle hinterlegten Drucker mit ihrem Bauraum (X/Y/Z in mm) verglichen.
- Bauteil passt, wenn die Bounding Box (in einer der 6 Achsen-Permutationen) in den Bauraum mindestens eines Druckers passt.
- UI zeigt fuer jedes Verfahren klar an: "passt in Drucker X" oder "uebersteigt max. Bauraum (XxYxZ)".
- Wenn kein Drucker passt, wird Preisberechnung nicht blockiert, aber als **Warnung** mit klarem Hinweis markiert.

## Out of Scope
- Mehrteilige Aufteilung grosser Bauteile (Splitting)
- Orientierungsoptimierung im Bauraum

## Implementation Notes
- Helper `findFittingPrinter(boundingBox, printers)` testet alle 6 Achsenpermutationen.
- Toleranz von 1 mm pro Achse (konfigurierbar).
