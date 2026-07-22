-- PROJ-21: Driver-Tour-Lifecycle
-- Additiv: neue Status-Werte + Abschluss-Zeitstempel. Keine destruktiven Änderungen.

-- 1) Neue Lifecycle-Status-Werte (append an bestehendes Enum)
--    Hinweis: der Enum-Typ liegt in Schema public (public.order_status),
--    die tours-Tabelle in Schema tms — tms.tours.status referenziert public.order_status.
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'unterwegs';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'angekommen';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'problem';

-- 2) Abschluss-Zeitstempel der Tour
ALTER TABLE tms.tours
    ADD COLUMN IF NOT EXISTS abgeschlossen_am TIMESTAMPTZ;

COMMENT ON COLUMN tms.tours.abgeschlossen_am IS
    'Zeitpunkt, zu dem der Fahrer die Tour vollständig abgeschlossen hat.';
