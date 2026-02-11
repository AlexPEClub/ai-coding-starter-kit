-- ============================================================
-- PROJ-1: Admin-Authentifizierung - Database Setup
-- ============================================================
-- Admins werden über Supabase Auth verwaltet (auth.users Tabelle).
-- Dieses Script erstellt die Tabellen für spätere Features
-- und setzt grundlegende RLS-Policies.

-- ============================================================
-- Service-Typen Tabelle (PROJ-3, hier erstellt für FK-Referenzen)
-- ============================================================
CREATE TABLE IF NOT EXISTS service_typen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL DEFAULT 'circle',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE service_typen ENABLE ROW LEVEL SECURITY;

-- Admins können alles
CREATE POLICY "Admins manage service_typen" ON service_typen
  FOR ALL USING (auth.role() = 'authenticated');

-- Öffentlich lesbar (für Widget)
CREATE POLICY "Public read service_typen" ON service_typen
  FOR SELECT USING (true);

-- ============================================================
-- Stützpunkte Tabelle (PROJ-2, hier erstellt für Vollständigkeit)
-- ============================================================
CREATE TABLE IF NOT EXISTS stuetzpunkte (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  strasse TEXT NOT NULL,
  hausnummer TEXT NOT NULL,
  plz TEXT NOT NULL,
  ort TEXT NOT NULL,
  land TEXT NOT NULL DEFAULT 'CH',
  telefon TEXT NOT NULL,
  email TEXT NOT NULL,
  website TEXT,
  bild_url TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status TEXT NOT NULL CHECK (status IN ('aktiv', 'temporaer_geschlossen')) DEFAULT 'aktiv',
  oeffnungszeiten_typ TEXT NOT NULL CHECK (oeffnungszeiten_typ IN ('tagsueber', '24h')) DEFAULT 'tagsueber',
  oeffnungszeiten_von TIME,
  oeffnungszeiten_bis TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stuetzpunkte ENABLE ROW LEVEL SECURITY;

-- Admins können alles
CREATE POLICY "Admins manage stuetzpunkte" ON stuetzpunkte
  FOR ALL USING (auth.role() = 'authenticated');

-- Öffentlich lesbar (für Widget)
CREATE POLICY "Public read stuetzpunkte" ON stuetzpunkte
  FOR SELECT USING (true);

-- Index für PLZ-Suche und Geo-Queries
CREATE INDEX idx_stuetzpunkte_plz ON stuetzpunkte(plz);
CREATE INDEX idx_stuetzpunkte_status ON stuetzpunkte(status);
CREATE INDEX idx_stuetzpunkte_coords ON stuetzpunkte(latitude, longitude);

-- ============================================================
-- Stützpunkt-Services Verknüpfung (N:M)
-- ============================================================
CREATE TABLE IF NOT EXISTS stuetzpunkt_services (
  stuetzpunkt_id UUID REFERENCES stuetzpunkte(id) ON DELETE CASCADE,
  service_typ_id UUID REFERENCES service_typen(id) ON DELETE CASCADE,
  PRIMARY KEY (stuetzpunkt_id, service_typ_id)
);

ALTER TABLE stuetzpunkt_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage stuetzpunkt_services" ON stuetzpunkt_services
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public read stuetzpunkt_services" ON stuetzpunkt_services
  FOR SELECT USING (true);

-- ============================================================
-- Widget-Konfiguration (Singleton)
-- ============================================================
CREATE TABLE IF NOT EXISTS widget_config (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  map_provider TEXT NOT NULL CHECK (map_provider IN ('openstreetmap', 'google_maps')) DEFAULT 'openstreetmap',
  google_maps_api_key TEXT,
  default_language TEXT NOT NULL CHECK (default_language IN ('de', 'fr', 'it')) DEFAULT 'de',
  primary_color TEXT NOT NULL DEFAULT '#E30613',
  default_radius_km INTEGER NOT NULL DEFAULT 50,
  default_center_lat DOUBLE PRECISION NOT NULL DEFAULT 46.9480,
  default_center_lng DOUBLE PRECISION NOT NULL DEFAULT 7.4474,
  default_zoom INTEGER NOT NULL DEFAULT 8,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE widget_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage widget_config" ON widget_config
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public read widget_config" ON widget_config
  FOR SELECT USING (true);

-- Initial Widget-Config einfügen
INSERT INTO widget_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Initial Service-Typen einfügen
-- ============================================================
INSERT INTO service_typen (name, icon, sort_order) VALUES
  ('Hydraulikleitungen', 'wrench', 1),
  ('Antriebstechnik', 'cog', 2),
  ('Technische Schläuche', 'cable', 3),
  ('Fluidtechnik', 'droplet', 4),
  ('Mobile Werkstatt', 'truck', 5)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- Updated_at Trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stuetzpunkte_updated_at
  BEFORE UPDATE ON stuetzpunkte
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_widget_config_updated_at
  BEFORE UPDATE ON widget_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Supabase Storage Bucket für Stützpunkt-Bilder
-- ============================================================
-- HINWEIS: Storage Buckets müssen über das Supabase Dashboard
-- oder die Supabase CLI erstellt werden:
-- Bucket Name: stuetzpunkt-bilder
-- Public: true (Bilder sind im Widget öffentlich sichtbar)
-- Max File Size: 5MB
-- Allowed MIME Types: image/jpeg, image/png, image/webp
