-- PROJ-43: Umsatz-Cache-Spalten auf tms.partners.
--
-- Ersetzt die bisherige Live-Berechnung (bei jeder Anfrage alle
-- Rechnungspositionen neu aufsummieren, siehe getPartnersWithRevenue vor
-- diesem Feature) durch einen nächtlichen Job
-- (scripts/PROJ-43_cache_umsatz.mjs), der diese Spalten für jeden aktiven
-- Kunden vorausberechnet. Genutzt von der /kunden-Liste und der globalen
-- Header-Kundensuche (features/PROJ-43-globale-kundensuche-umsatz-caching.md).
--
-- Definition "Umsatz": rollierende 365 Tage, jede Rechnungsposition zählt
-- unabhängig von Artikel-Zuordnung — identisch zur bisherigen
-- Live-Definition in src/lib/actions/revenue.ts (resolvePeriodRanges,
-- period.type === "rolling365"). Der Umsatz-Tab der Kundendetailseite
-- (PROJ-11) bleibt bewusst vollständig live berechnet (siehe Tech Design)
-- und liest diese Spalten nicht — dort werden zusätzlich Kategorien-
-- Aufschlüsselung und Vorperiode-Vergleich aus derselben Momentaufnahme
-- gebraucht, die eine gecachte Gesamtzahl allein nicht konsistent liefern
-- könnte.
--
-- Gespeichert in Cent (wie tms.invoice_items.total_price_net), nicht in
-- Euro — Umrechnung passiert wie überall im Projekt erst bei der Anzeige
-- (centsToEuro). `ADD COLUMN IF NOT EXISTS` ist sicher gegen Wiederholung.

ALTER TABLE tms.partners
    ADD COLUMN IF NOT EXISTS cached_revenue_365d BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cached_revenue_updated_at TIMESTAMPTZ;

COMMENT ON COLUMN tms.partners.cached_revenue_365d IS
    'Vorausberechneter Umsatz der letzten rollierenden 365 Tage in Cent (PROJ-43) — befüllt vom nächtlichen Cache-Job (scripts/PROJ-43_cache_umsatz.mjs), nicht live berechnet.';
COMMENT ON COLUMN tms.partners.cached_revenue_updated_at IS
    'Zeitpunkt der letzten erfolgreichen Umsatz-Cache-Berechnung (PROJ-43) für diesen Kunden.';

-- Macht "sortiert nach Umsatz, die ersten N" performant unabhängig von der
-- Kundenanzahl (Kundenliste + Header-Suche sortieren beide danach).
CREATE INDEX IF NOT EXISTS idx_partners_cached_revenue_365d
    ON tms.partners (cached_revenue_365d DESC);
