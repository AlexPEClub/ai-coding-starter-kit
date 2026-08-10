-- PROJ-30: Themenvorschläge (wöchentlich, KI) — Backend
-- Erstellt: 2026-08-04
-- Neue Tabellen für den wöchentlichen Themenvorschlag-Scan:
-- - tms.content_themen: Themenvorschläge mit Status (vorgeschlagen/freigegeben/abgelehnt)
-- - tms.content_themen_quellen: n:m zu Wissensbasis-Dokumenten (mit Fundstellen-Belegen)
-- Durchgängig idempotent (IF NOT EXISTS / ON CONFLICT) für sichere Anwendung auf
-- driftende Live-DB + frische Umgebung.

-- ============================================
-- 1) Tabelle: content_themen
-- ============================================
CREATE TABLE IF NOT EXISTS tms.content_themen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titel TEXT NOT NULL,
    begruendung TEXT NOT NULL,
    wochen_batch_datum DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'vorgeschlagen'
        CHECK (status IN ('vorgeschlagen', 'freigegeben', 'abgelehnt')),
    entschieden_von UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    entschieden_von_name TEXT,
    entschieden_am TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indizes für häufige Abfragen
CREATE INDEX IF NOT EXISTS idx_content_themen_status
    ON tms.content_themen (status);

CREATE INDEX IF NOT EXISTS idx_content_themen_wochen_batch_datum
    ON tms.content_themen (wochen_batch_datum DESC);

CREATE INDEX IF NOT EXISTS idx_content_themen_created_at
    ON tms.content_themen (created_at DESC);

-- updated_at Trigger
DROP TRIGGER IF EXISTS trg_content_themen_updated_at ON tms.content_themen;
CREATE TRIGGER trg_content_themen_updated_at
    BEFORE UPDATE ON tms.content_themen
    FOR EACH ROW
    EXECUTE FUNCTION tms.set_updated_at();

-- ============================================
-- 2) Tabelle: content_themen_quellen (n:m zu knowledge_documents)
-- ============================================
CREATE TABLE IF NOT EXISTS tms.content_themen_quellen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thema_id UUID NOT NULL REFERENCES tms.content_themen(id) ON DELETE CASCADE,
    dokument_id UUID NOT NULL REFERENCES tms.knowledge_documents(id) ON DELETE CASCADE,
    fundstelle TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index für Abfragen nach Thema
CREATE INDEX IF NOT EXISTS idx_content_themen_quellen_thema_id
    ON tms.content_themen_quellen (thema_id);

-- Index für Abfragen nach Dokument
CREATE INDEX IF NOT EXISTS idx_content_themen_quellen_dokument_id
    ON tms.content_themen_quellen (dokument_id);

-- ============================================
-- 3) Row Level Security aktivieren
-- ============================================
ALTER TABLE tms.content_themen ENABLE ROW LEVEL SECURITY;
ALTER TABLE tms.content_themen_quellen ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4) RLS Policies: Lesen für Redaktion/Admin
-- ============================================
DROP POLICY IF EXISTS "Themenvorschläge — Redaktion/Admin lesen" ON tms.content_themen;
CREATE POLICY "Themenvorschläge — Redaktion/Admin lesen"
    ON tms.content_themen
    FOR SELECT
    TO authenticated
    USING (tms.is_content_manager());

DROP POLICY IF EXISTS "Themenvorschläge-Quellen — Redaktion/Admin lesen" ON tms.content_themen_quellen;
CREATE POLICY "Themenvorschläge-Quellen — Redaktion/Admin lesen"
    ON tms.content_themen_quellen
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM tms.content_themen
            WHERE id = thema_id AND tms.is_content_manager()
        )
    );

-- ============================================
-- 5) Grants an service_role (für Admin-Client im Scan-Skript)
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER, TRUNCATE
    ON TABLE tms.content_themen TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER, TRUNCATE
    ON TABLE tms.content_themen_quellen TO service_role;

-- Grants auf Sequenzen (für die UUID-IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA tms TO service_role;
