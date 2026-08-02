-- PROJ-42: Formale Übernahme der bereits live existierenden
-- Routenberechnungs-Spalten auf tms.tours.
--
-- Additiv, kein Datenverlust: diese Spalten wurden vorab direkt in der
-- Produktions-DB angelegt (siehe features/PROJ-42-routenberechnung.md),
-- aber nie per Migration erfasst. `ADD COLUMN IF NOT EXISTS` ist deshalb
-- sicher gegen Produktion (No-Op dort) und legt die Spalten in jeder
-- neuen/anderen Umgebung tatsächlich an — analog zu, wie
-- `20260722120000_PROJ-21_driver_tour_lifecycle.sql` bereits
-- `abgeschlossen_am` nachträglich formal übernommen hat.
--
-- `route_manual_override` (ebenfalls bereits live vorhanden) wird hier
-- bewusst NICHT angefasst — gehört zu einem späteren, separaten Feature
-- (manuelles Überschreiben der Reihenfolge).

ALTER TABLE tms.tours
    ADD COLUMN IF NOT EXISTS route_order INTEGER,
    ADD COLUMN IF NOT EXISTS route_calculated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS route_distance_meters INTEGER,
    ADD COLUMN IF NOT EXISTS route_duration_seconds INTEGER,
    ADD COLUMN IF NOT EXISTS berechnete_ankunftszeit TIMESTAMPTZ;

COMMENT ON COLUMN tms.tours.route_order IS
    'Position dieses Stopps in der von PROJ-42 berechneten optimierten Route (1, 2, 3, ...).';
COMMENT ON COLUMN tms.tours.route_calculated_at IS
    'Zeitpunkt der letzten erfolgreichen Routenberechnung (PROJ-42) — pro Tourengruppe (Fahrer+Datum) identisch.';
COMMENT ON COLUMN tms.tours.route_distance_meters IS
    'Gesamtstrecke der Tour in Metern (PROJ-42) — pro Tourengruppe identisch.';
COMMENT ON COLUMN tms.tours.route_duration_seconds IS
    'Geschätzte Gesamtfahrzeit der Tour in Sekunden (PROJ-42) — pro Tourengruppe identisch.';
COMMENT ON COLUMN tms.tours.berechnete_ankunftszeit IS
    'Berechnete Ankunftszeit an diesem Stopp (PROJ-42), ausgehend von 09:00 Uhr Depot-Start.';
