-- PROJ-35 Bugfix-Runde 1 (QA-Runde 1, 2026-07-29):
--
-- BUG-1 (High): tms.products.id hatte keinen Default/Sequence, dadurch
-- schlug jede manuelle Serviceartikel-Neuanlage mit "null value in column
-- id" fehl. Easybill-Sync liefert immer eine explizite (positive) ID, daher
-- bekommen manuell angelegte Artikel jetzt automatisch eine NEGATIVE ID aus
-- einer eigenen Sequenz — kollisionsfrei mit jeder zukünftigen Easybill-ID,
-- ohne den Easybill-Sync selbst anzufassen.
CREATE SEQUENCE tms.products_manual_id_seq START 1;
ALTER TABLE tms.products ALTER COLUMN id SET DEFAULT -nextval('tms.products_manual_id_seq');
-- Sequenzen erben (anders als Tabellen) keine ALTER DEFAULT PRIVILEGES im
-- tms-Schema — ohne dieses GRANT scheitert jeder Insert ohne explizite id
-- serverseitig mit "permission denied for sequence" (live verifiziert).
GRANT USAGE, SELECT ON SEQUENCE tms.products_manual_id_seq TO anon, authenticated, service_role;

-- BUG-3 (Medium): Eine frisch angehakte Preisstaffel-Kandidatin bekam einen
-- Platzhalter-Bereich (von=0, bis=offen), der bereits als "einsatzbereit"
-- zählte, obwohl der Admin ihn noch nie bearbeitet hat — PROJ-40 hätte dann
-- jeden gemessenen Wert automatisch (und falsch) diesem einen Artikel
-- zugeordnet. `von` wird deshalb nullable: NULL bedeutet jetzt explizit
-- "noch nicht konfiguriert" und zählt nicht als vollständige Preisstufe.
ALTER TABLE tms.preisstufen ALTER COLUMN von DROP DEFAULT;
ALTER TABLE tms.preisstufen ALTER COLUMN von DROP NOT NULL;
ALTER TABLE tms.preisstufen DROP CONSTRAINT preisstufen_check;
ALTER TABLE tms.preisstufen ADD CONSTRAINT preisstufen_check
  CHECK (von IS NULL OR bis IS NULL OR bis > von);

-- BUG-6 (Medium): Die Spec sieht vor, dass ein Geometrie-Parameter analog zu
-- Kategorien nur deaktiviert, nicht gelöscht werden kann — die Spalte fehlte
-- bisher komplett.
ALTER TABLE tms.geometrie_parameter ADD COLUMN ist_aktiv boolean NOT NULL DEFAULT true;
