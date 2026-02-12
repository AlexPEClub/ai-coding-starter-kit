-- ============================================================
-- PROJ-2: E-Mail-Adresse optional machen
-- ============================================================
-- E-Mail ist kein Pflichtfeld mehr für Stützpunkte.
-- Nicht jeder Stützpunkt hat eine eigene E-Mail-Adresse.

ALTER TABLE stuetzpunkte ALTER COLUMN email DROP NOT NULL;
