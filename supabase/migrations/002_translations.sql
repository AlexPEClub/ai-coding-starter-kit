-- ============================================================
-- PROJ-10: Übersetzungssystem - translations Tabelle
-- ============================================================
-- Generische Übersetzungstabelle für datenbankbasierte Inhalte.
-- DE bleibt immer der Originaltext in der Quelltabelle.
-- FR und IT werden hier gespeichert.

CREATE TABLE IF NOT EXISTS translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  row_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('fr', 'it')),
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Eindeutigkeit: Pro Tabelle/Zeile/Feld/Sprache nur eine Übersetzung
ALTER TABLE translations
  ADD CONSTRAINT translations_unique
  UNIQUE (table_name, row_id, field_name, language);

-- Index für performante Lookups
CREATE INDEX idx_translations_lookup
  ON translations (table_name, row_id, field_name, language);

-- RLS aktivieren
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

-- Öffentlich lesbar (für Widget-APIs)
CREATE POLICY "Public read translations" ON translations
  FOR SELECT USING (true);

-- Admins können alles (CRUD)
CREATE POLICY "Admins manage translations" ON translations
  FOR ALL USING (auth.role() = 'authenticated');

-- Updated_at Trigger
CREATE TRIGGER update_translations_updated_at
  BEFORE UPDATE ON translations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Aufräumen: Wenn ein Service-Typ gelöscht wird, Übersetzungen mitlöschen
CREATE OR REPLACE FUNCTION delete_translations_on_source_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM translations
  WHERE table_name = TG_ARGV[0]
    AND row_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER delete_service_typen_translations
  AFTER DELETE ON service_typen
  FOR EACH ROW
  EXECUTE FUNCTION delete_translations_on_source_delete('service_typen');
