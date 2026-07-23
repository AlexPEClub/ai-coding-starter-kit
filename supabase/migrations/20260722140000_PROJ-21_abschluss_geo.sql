-- PROJ-21: Abschluss-Standort (Navi-Start-Standort nutzt bereits tour_start_lat/lon).
-- Additiv: zwei nullable Geo-Spalten für den Ort, an dem der Fahrer "Erledigt" bestätigt.

ALTER TABLE tms.tours
    ADD COLUMN IF NOT EXISTS abschluss_lat NUMERIC;
ALTER TABLE tms.tours
    ADD COLUMN IF NOT EXISTS abschluss_lon NUMERIC;

COMMENT ON COLUMN tms.tours.abschluss_lat IS
    'Breitengrad des Fahrers beim Bestätigen von "Erledigt" (best-effort, kann NULL sein).';
COMMENT ON COLUMN tms.tours.abschluss_lon IS
    'Längengrad des Fahrers beim Bestätigen von "Erledigt" (best-effort, kann NULL sein).';
