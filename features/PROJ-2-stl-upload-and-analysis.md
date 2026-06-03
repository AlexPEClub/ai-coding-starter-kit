# PROJ-2: STL-Upload mit Auto-Analyse

**Status:** In Progress
**Created:** 2026-05-10

## User Story
Als Vertriebsmitarbeiter moechte ich eine STL-Datei hochladen und dass das System automatisch Volumen, Bounding Box und Oberflaeche extrahiert, damit ich diese Werte nicht manuell eingeben muss.

## Acceptance Criteria
- Drag-and-drop oder File-Picker fuer STL-Dateien (max. 100 MB).
- Parser unterstuetzt Binary- und ASCII-STL.
- Berechnete Werte: Volumen [cm^3], Bounding Box [mm] (X, Y, Z), Oberflaeche [cm^2], Dreieckszahl.
- Manuelle Ueberschreibung der Werte ist moeglich.
- Bei Parse-Fehler: klare Fehlermeldung, kein Crash.
- Dateigroessenwarnung > 50 MB.

## Out of Scope
- 3D-Vorschau / Renderer
- Reparatur von kaputten Meshes
- STEP/OBJ/3MF Support (Folge-Feature)

## Implementation Notes
- Parser laeuft im Browser (Web Worker, falls Performance noetig wird).
- Volumen ueber signierte Tetraeder-Volumina ausgehend vom Ursprung.
- Bounding Box ueber min/max der Vertices.
