-- ============================================================
-- NORA — Nexora AI BizDev Agent
-- Datenbankschema für Supabase (PROJ-1)
--
-- Ausführen in: Supabase Dashboard → SQL Editor → New Query
-- Dieses Skript ist idempotent — es kann gefahrlos mehrfach
-- ausgeführt werden (DROP POLICY IF EXISTS + IF NOT EXISTS).
-- ============================================================

-- ─── suggestions ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suggestions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  report_date DATE NOT NULL,
  category    TEXT NOT NULL CHECK (category IN ('marketing', 'product', 'operations')),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  insight     TEXT,
  source      TEXT,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at TIMESTAMPTZ
);

ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Eingeloggte Nutzer können Vorschläge lesen" ON suggestions;
CREATE POLICY "Eingeloggte Nutzer können Vorschläge lesen"
  ON suggestions FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Eingeloggte Nutzer können Vorschläge anlegen" ON suggestions;
CREATE POLICY "Eingeloggte Nutzer können Vorschläge anlegen"
  ON suggestions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Eingeloggte Nutzer können Vorschläge aktualisieren" ON suggestions;
CREATE POLICY "Eingeloggte Nutzer können Vorschläge aktualisieren"
  ON suggestions FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_suggestions_report_date ON suggestions(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions(status);
CREATE INDEX IF NOT EXISTS idx_suggestions_category ON suggestions(category);

-- ─── implementations ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS implementations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  suggestion_id    UUID NOT NULL REFERENCES suggestions(id) ON DELETE CASCADE,
  monday_task_id   TEXT,
  monday_task_url  TEXT,
  notion_page_id   TEXT,
  notion_page_url  TEXT,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'failed')),
  error_message    TEXT
);

ALTER TABLE implementations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Eingeloggte Nutzer können Umsetzungen lesen" ON implementations;
CREATE POLICY "Eingeloggte Nutzer können Umsetzungen lesen"
  ON implementations FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Eingeloggte Nutzer können Umsetzungen anlegen" ON implementations;
CREATE POLICY "Eingeloggte Nutzer können Umsetzungen anlegen"
  ON implementations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Eingeloggte Nutzer können Umsetzungen aktualisieren" ON implementations;
CREATE POLICY "Eingeloggte Nutzer können Umsetzungen aktualisieren"
  ON implementations FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_implementations_suggestion_id ON implementations(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_implementations_status ON implementations(status);

-- ─── daily_reports ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  report_date       DATE NOT NULL UNIQUE,
  suggestions_count INT NOT NULL DEFAULT 0,
  email_sent_at     TIMESTAMPTZ,
  email_status      TEXT NOT NULL DEFAULT 'pending' CHECK (email_status IN ('pending', 'sent', 'failed'))
);

ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Eingeloggte Nutzer können Reports lesen" ON daily_reports;
CREATE POLICY "Eingeloggte Nutzer können Reports lesen"
  ON daily_reports FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Eingeloggte Nutzer können Reports anlegen" ON daily_reports;
CREATE POLICY "Eingeloggte Nutzer können Reports anlegen"
  ON daily_reports FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Eingeloggte Nutzer können Reports aktualisieren" ON daily_reports;
CREATE POLICY "Eingeloggte Nutzer können Reports aktualisieren"
  ON daily_reports FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_daily_reports_report_date ON daily_reports(report_date DESC);

-- ─── PROJ-2: Generierungs-Status ────────────────────────────
-- Separate Spalte für den Status des Vorschlags-Generierungslaufs.
-- (email_status bleibt für das spätere E-Mail-Report-Feature reserviert.)
ALTER TABLE daily_reports
  ADD COLUMN IF NOT EXISTS generation_status TEXT NOT NULL DEFAULT 'pending'
  CHECK (generation_status IN ('pending', 'sent', 'failed'));

-- ─── PROJ-4: app_config ─────────────────────────────────────
-- Key-Value-Store für Laufzeitkonfiguration (z.B. monday_board_id).
CREATE TABLE IF NOT EXISTS app_config (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Eingeloggte Nutzer können Config lesen" ON app_config;
CREATE POLICY "Eingeloggte Nutzer können Config lesen"
  ON app_config FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Eingeloggte Nutzer können Config schreiben" ON app_config;
CREATE POLICY "Eingeloggte Nutzer können Config schreiben"
  ON app_config FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Eingeloggte Nutzer können Config aktualisieren" ON app_config;
CREATE POLICY "Eingeloggte Nutzer können Config aktualisieren"
  ON app_config FOR UPDATE
  USING (auth.uid() IS NOT NULL);
