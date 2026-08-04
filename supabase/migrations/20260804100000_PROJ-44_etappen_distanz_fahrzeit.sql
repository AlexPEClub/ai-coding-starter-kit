-- PROJ-44: Etappen-Distanz und Etappen-Fahrzeit pro Stopp
--
-- Diese Spalten speichern die Strecke und Fahrzeit vom vorherigen Stopp zu diesem Stopp
-- (bzw. vom Depot für den ersten Stopp einer Tour), berechnet von PROJ-42 Routenberechnung.
--
-- Additiv: `ADD COLUMN IF NOT EXISTS` ist sicher gegen Produktion (No-Op dort) und
-- legt die Spalten in jeder neuen/anderen Umgebung tatsächlich an — analog zu
-- `20260802090000_PROJ-42_routenberechnung_spalten.sql`.

ALTER TABLE tms.tours
    ADD COLUMN IF NOT EXISTS leg_distance_meters INTEGER,
    ADD COLUMN IF NOT EXISTS leg_duration_seconds INTEGER;

COMMENT ON COLUMN tms.tours.leg_distance_meters IS
    'Etappen-Distanz vom vorherigen Stopp zu diesem Stopp in Metern (PROJ-42/PROJ-44) — nur befüllt, wenn Route vollständig berechnet.';
COMMENT ON COLUMN tms.tours.leg_duration_seconds IS
    'Etappen-Fahrzeit vom vorherigen Stopp zu diesem Stopp in Sekunden (PROJ-42/PROJ-44) — nur befüllt, wenn Route vollständig berechnet.';
