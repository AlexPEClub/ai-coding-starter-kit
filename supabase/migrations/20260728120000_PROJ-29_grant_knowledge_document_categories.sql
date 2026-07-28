-- PROJ-29 Hotfix: die Migration 20260726100000 hat die neue Join-Tabelle
-- tms.knowledge_document_categories angelegt, aber (anders als knowledge_documents/
-- knowledge_categories) keine expliziten GRANTs an service_role vergeben — die
-- ALTER DEFAULT PRIVILEGES der ursprünglichen Migrationen griffen hier nicht, weil
-- diese Migration direkt als "postgres" ausgeführt wurde. Folge: jeder Zugriff über
-- den Admin-Client (SELECT/INSERT/DELETE) auf diese Tabelle schlug live mit
-- "permission denied for table knowledge_document_categories" (Postgres 42501) fehl —
-- brach damit Dokumente-Laden, Upload-Tagging und Tag-Bearbeiten komplett.

GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER, TRUNCATE
  ON TABLE tms.knowledge_document_categories TO service_role;
