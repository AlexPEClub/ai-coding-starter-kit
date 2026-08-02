-- PROJ-41 Hotfix: 20260802070000 hat tms.tour_aenderungen angelegt, aber wie
-- schon einmal bei tms.knowledge_document_categories (siehe PROJ-29-Hotfix
-- 20260728120000) keine expliziten GRANTs an service_role vergeben, weil die
-- Migration direkt als "postgres" ausgeführt wurde und die ALTER DEFAULT
-- PRIVILEGES der ursprünglichen tms-Migrationen hier nicht griffen. Folge:
-- jeder Zugriff über den Admin-Client auf diese Tabelle schlug mit
-- "permission denied for table tour_aenderungen" (Postgres 42501) fehl.

GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER, TRUNCATE
  ON TABLE tms.tour_aenderungen TO service_role;
