-- PROJ-45: Routen-Geometrie für Tour-Kartenansicht
--
-- Speichert die GeoJSON-Geometrie (Polyline) für jede berechnete Tour.
-- Wird zusammen mit den übrigen Routenbeschreibungen (Reihenfolge, Distanz,
-- Fahrzeit) bei der PROJ-42-Berechnung geschrieben.
--
-- `route_geometry JSONB` trägt für jeden Stopp derselben Tour denselben Wert:
-- ein Array von [lat, lon]-Paaren, das den Straßenverlauf beschreibt.
-- Bei keiner/ungültiger Berechnung: NULL.

ALTER TABLE tms.tours
    ADD COLUMN IF NOT EXISTS route_geometry JSONB;

COMMENT ON COLUMN tms.tours.route_geometry IS
    'Koordinaten-Array [[lat,lon], [lat,lon], ...] des berechneten Straßenverlaufs (PROJ-45) — pro Tourengruppe identisch.';
