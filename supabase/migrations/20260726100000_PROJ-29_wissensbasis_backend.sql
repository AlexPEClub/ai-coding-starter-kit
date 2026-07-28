-- PROJ-29: Wissensbasis (KI-Content-Fundament) — Backend
-- Erstellt: 2026-07-26
-- Versöhnt die (undokumentiert direkt auf der Live-DB gebauten) Teilobjekte mit
-- der Git-Historie. Durchgängig idempotent (IF EXISTS / IF NOT EXISTS / ON CONFLICT),
-- damit die Migration sowohl gegen die driftende Live-DB als auch gegen eine
-- frische Umgebung sicher läuft.
--
--  1) Rolle „redaktion" im user_role-Enum sicherstellen
--  2) Obsolete Tabellen (knowledge_entries / knowledge_chunks) entfernen
--  3) Helper tms.is_content_manager() härten (SET search_path)
--  4) knowledge_documents umbauen (Spalten, Status, Volltextsuche, Trigger)
--  5) knowledge_categories: Constraints + Schreib-Policy auf Admin einschränken
--  6) Join-Tabelle knowledge_document_categories + RLS
--  7) Storage-Bucket wissensbasis + Policies auf storage.objects
--  8) Suchfunktion tms.search_knowledge_documents(...)
--  9) Seed der 6 Basis-Kategorien (idempotent)
-- 10) tms.set_document_categories(...) — atomarer Tag-Austausch

-- ============================================
-- 1) Rolle „redaktion" im Enum
-- ============================================
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'redaktion';

-- ============================================
-- 2) Obsolete Tabellen entfernen
--    (Leftover eines verworfenen „strukturierter Eintrag + OCR-Chunking"-Designs,
--     abgelöst durch die Spec-Vereinfachung 2026-07-22 / „kein OCR" 2026-07-23.
--     Beide Tabellen sind leer.)
-- ============================================
DROP TABLE IF EXISTS tms.knowledge_chunks CASCADE;
DROP TABLE IF EXISTS tms.knowledge_entries CASCADE;

-- ============================================
-- 3) Helper: is_content_manager() härten
--    (bestehende Funktion — gleiche Semantik, zusätzlich search_path fixiert)
-- ============================================
CREATE OR REPLACE FUNCTION tms.is_content_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND status = 'aktiv'
          AND (roles::text[] && ARRAY['admin', 'redaktion'])
    );
$$;

-- ============================================
-- 4) knowledge_documents umbauen
-- ============================================

-- 4a) Neue Spalten (idempotent via DEFAULT, Default danach entfernen wo nicht gewünscht)
ALTER TABLE tms.knowledge_documents
    ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT '';
ALTER TABLE tms.knowledge_documents
    ALTER COLUMN source DROP DEFAULT;

ALTER TABLE tms.knowledge_documents
    ADD COLUMN IF NOT EXISTS full_text TEXT NOT NULL DEFAULT '';

ALTER TABLE tms.knowledge_documents
    ADD COLUMN IF NOT EXISTS uploaded_by_name TEXT NOT NULL DEFAULT '';
ALTER TABLE tms.knowledge_documents
    ALTER COLUMN uploaded_by_name DROP DEFAULT;

-- 4b) Obsolete Spalten entfernen
ALTER TABLE tms.knowledge_documents DROP COLUMN IF EXISTS page_count;
ALTER TABLE tms.knowledge_documents DROP COLUMN IF EXISTS chunk_count;
ALTER TABLE tms.knowledge_documents DROP COLUMN IF EXISTS ki_fallback_count;

-- 4c) Status-Constraint + Default korrigieren
--     (technischer Verarbeitungsstatus, KEIN inhaltlicher Freigabe-Status)
ALTER TABLE tms.knowledge_documents
    DROP CONSTRAINT IF EXISTS knowledge_documents_status_check;
ALTER TABLE tms.knowledge_documents
    ALTER COLUMN status SET DEFAULT 'verarbeitung';
ALTER TABLE tms.knowledge_documents
    ADD CONSTRAINT knowledge_documents_status_check
    CHECK (status IN ('verarbeitung', 'aktiv', 'fehler'));

-- 4d) Generierte tsvector-Spalte für Volltextsuche (Deutsch) + GIN-Index
ALTER TABLE tms.knowledge_documents
    ADD COLUMN IF NOT EXISTS full_text_search tsvector
    GENERATED ALWAYS AS (to_tsvector('german', coalesce(full_text, ''))) STORED;

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_fts
    ON tms.knowledge_documents USING GIN (full_text_search);

-- 4e) Index für Sortierung nach Upload-Datum
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_created_at
    ON tms.knowledge_documents (created_at DESC);

-- 4f) updated_at-Trigger (nutzt die vorhandene generische Funktion)
DROP TRIGGER IF EXISTS trg_knowledge_documents_updated_at ON tms.knowledge_documents;
CREATE TRIGGER trg_knowledge_documents_updated_at
    BEFORE UPDATE ON tms.knowledge_documents
    FOR EACH ROW
    EXECUTE FUNCTION tms.set_updated_at();

-- ============================================
-- 5) knowledge_categories: Constraints + Schreib-Policy
-- ============================================

-- 5a) kind-Check absichern (idempotent neu anlegen)
ALTER TABLE tms.knowledge_categories
    DROP CONSTRAINT IF EXISTS knowledge_categories_kind_check;
ALTER TABLE tms.knowledge_categories
    ADD CONSTRAINT knowledge_categories_kind_check
    CHECK (kind IN ('werkzeugart', 'material'));

-- 5b) Case-insensitive Unique-Index (Ziel für ON CONFLICT beim Seed)
CREATE UNIQUE INDEX IF NOT EXISTS knowledge_categories_kind_lower_name_unique
    ON tms.knowledge_categories (kind, lower(name));

-- 5c) Schreib-Policy von „Redaktion/Admin" auf „nur Admin" verschärfen.
--     (Lesen bleibt für Redaktion+Admin über die SELECT-Policy erhalten.)
DROP POLICY IF EXISTS "Kategorien schreiben — Redaktion/Admin" ON tms.knowledge_categories;
DROP POLICY IF EXISTS "Kategorien schreiben — nur Admin" ON tms.knowledge_categories;
CREATE POLICY "Kategorien schreiben — nur Admin"
    ON tms.knowledge_categories
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND status = 'aktiv'
              AND 'admin'::user_role = ANY(roles)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND status = 'aktiv'
              AND 'admin'::user_role = ANY(roles)
        )
    );

-- ============================================
-- 6) Join-Tabelle Dokument ↔ Kategorie (n:m) + RLS
-- ============================================
CREATE TABLE IF NOT EXISTS tms.knowledge_document_categories (
    document_id UUID NOT NULL REFERENCES tms.knowledge_documents(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES tms.knowledge_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (document_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_document_categories_category
    ON tms.knowledge_document_categories (category_id);

ALTER TABLE tms.knowledge_document_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Dokument-Tags — Redaktion/Admin" ON tms.knowledge_document_categories;
CREATE POLICY "Dokument-Tags — Redaktion/Admin"
    ON tms.knowledge_document_categories
    FOR ALL
    TO authenticated
    USING (tms.is_content_manager())
    WITH CHECK (tms.is_content_manager());

-- ============================================
-- 7) Storage-Bucket + Policies auf storage.objects
--    (Bucket existiert bereits privat, aber ohne jede Policy → hier nachgeholt)
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('wissensbasis', 'wissensbasis', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Wissensbasis lesen — Redaktion/Admin" ON storage.objects;
CREATE POLICY "Wissensbasis lesen — Redaktion/Admin"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'wissensbasis' AND tms.is_content_manager());

DROP POLICY IF EXISTS "Wissensbasis schreiben — Redaktion/Admin" ON storage.objects;
CREATE POLICY "Wissensbasis schreiben — Redaktion/Admin"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'wissensbasis' AND tms.is_content_manager());

DROP POLICY IF EXISTS "Wissensbasis löschen — Redaktion/Admin" ON storage.objects;
CREATE POLICY "Wissensbasis löschen — Redaktion/Admin"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'wissensbasis' AND tms.is_content_manager());

-- ============================================
-- 8) Suchfunktion: Dokumente + zugeordnete Kategorie-IDs
--    - ILIKE auf Dateiname/Quelle
--    - Volltext via websearch_to_tsquery('german', ...)
--    - Kategorie-Filter: Dokument muss ALLE übergebenen Kategorien tragen
--    - Sortierung: neueste zuerst
-- ============================================
CREATE OR REPLACE FUNCTION tms.search_knowledge_documents(
    p_search TEXT DEFAULT NULL,
    p_category_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    file_name TEXT,
    source TEXT,
    status TEXT,
    full_text TEXT,
    uploaded_by_name TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    category_ids UUID[]
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        d.id,
        d.file_name,
        d.source,
        d.status,
        d.full_text,
        d.uploaded_by_name,
        d.error_message,
        d.created_at,
        d.updated_at,
        COALESCE(
            (
                SELECT array_agg(dc.category_id)
                FROM tms.knowledge_document_categories dc
                WHERE dc.document_id = d.id
            ),
            ARRAY[]::UUID[]
        ) AS category_ids
    FROM tms.knowledge_documents d
    WHERE
        (
            p_search IS NULL
            OR btrim(p_search) = ''
            OR d.file_name ILIKE '%' || p_search || '%'
            OR d.source ILIKE '%' || p_search || '%'
            OR d.full_text_search @@ websearch_to_tsquery('german', p_search)
        )
        AND (
            p_category_ids IS NULL
            OR array_length(p_category_ids, 1) IS NULL
            OR d.id IN (
                SELECT dc.document_id
                FROM tms.knowledge_document_categories dc
                WHERE dc.category_id = ANY(p_category_ids)
                GROUP BY dc.document_id
                HAVING COUNT(DISTINCT dc.category_id) = array_length(p_category_ids, 1)
            )
        )
    ORDER BY d.created_at DESC;
$$;

-- ============================================
-- 9) Seed der 6 Basis-Kategorien (idempotent)
-- ============================================
INSERT INTO tms.knowledge_categories (kind, name) VALUES
    ('werkzeugart', 'Säge'),
    ('werkzeugart', 'Fräser'),
    ('werkzeugart', 'Bohrer'),
    ('material', 'Holz'),
    ('material', 'Kunststoff'),
    ('material', 'Aluminium')
ON CONFLICT (kind, lower(name)) DO NOTHING;

-- ============================================
-- 10) Atomarer Tag-Austausch eines Dokuments (+ updated_at bumpen)
--     Ein Funktionsaufruf = eine Anweisung → kein Fenster mit „null Tags"
--     für gleichzeitig lesende Prozesse.
-- ============================================
CREATE OR REPLACE FUNCTION tms.set_document_categories(
    p_document_id UUID,
    p_category_ids UUID[]
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM tms.knowledge_document_categories
    WHERE document_id = p_document_id;

    IF p_category_ids IS NOT NULL AND array_length(p_category_ids, 1) IS NOT NULL THEN
        INSERT INTO tms.knowledge_document_categories (document_id, category_id)
        SELECT p_document_id, unnest(p_category_ids)
        ON CONFLICT DO NOTHING;
    END IF;

    UPDATE tms.knowledge_documents
    SET updated_at = now()
    WHERE id = p_document_id;
END;
$$;
