-- ============================================================
-- Apo-Schulungs-Manager — Initial Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'trainer', 'management');
CREATE TYPE region_enum AS ENUM ('OÖ', 'Salzburg', 'Tirol', 'Vorarlberg');
CREATE TYPE priority_enum AS ENUM ('normal', 'top_kunde');
CREATE TYPE termin_status_enum AS ENUM ('geplant', 'fixiert', 'durchgefuehrt', 'abgesagt');

-- ============================================================
-- TABLES
-- ============================================================

-- user_profiles: extends Supabase Auth users with role + display name
CREATE TABLE user_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL DEFAULT '',
  role        user_role NOT NULL DEFAULT 'trainer',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create a user_profile row when a new auth user is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'trainer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- apotheken: pharmacy customer database
CREATE TABLE apotheken (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  address     TEXT NOT NULL DEFAULT '',
  plz         TEXT NOT NULL DEFAULT '',
  ort         TEXT NOT NULL DEFAULT '',
  region      region_enum NOT NULL,
  priority    priority_enum NOT NULL DEFAULT 'normal',
  notes       TEXT NOT NULL DEFAULT '',
  deleted_at  TIMESTAMPTZ DEFAULT NULL,  -- soft delete
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by  UUID NOT NULL REFERENCES auth.users(id)
);

CREATE INDEX idx_apotheken_region ON apotheken(region) WHERE deleted_at IS NULL;
CREATE INDEX idx_apotheken_plz ON apotheken(plz) WHERE deleted_at IS NULL;
CREATE INDEX idx_apotheken_name ON apotheken USING gin(to_tsvector('german', name)) WHERE deleted_at IS NULL;

-- touren: training tours (groups of appointments)
CREATE TABLE touren (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  trainer_id  UUID NOT NULL REFERENCES auth.users(id),
  region      region_enum NOT NULL,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT end_after_start CHECK (end_date >= start_date)
);

CREATE INDEX idx_touren_trainer_id ON touren(trainer_id);
CREATE INDEX idx_touren_start_date ON touren(start_date);

-- termine: individual appointments
CREATE TABLE termine (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id       UUID REFERENCES touren(id) ON DELETE SET NULL,  -- nullable
  apotheke_id   UUID NOT NULL REFERENCES apotheken(id) ON DELETE RESTRICT,
  trainer_id    UUID NOT NULL REFERENCES auth.users(id),
  datum         DATE NOT NULL,
  zeit_start    TIME NOT NULL,
  zeit_ende     TIME NOT NULL,
  status        termin_status_enum NOT NULL DEFAULT 'geplant',
  notiz         TEXT NOT NULL DEFAULT '',
  cancel_reason TEXT DEFAULT NULL,
  created_by    UUID NOT NULL REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT end_after_start CHECK (zeit_ende > zeit_start)
);

CREATE INDEX idx_termine_datum ON termine(datum);
CREATE INDEX idx_termine_trainer_id ON termine(trainer_id);
CREATE INDEX idx_termine_status ON termine(status);
CREATE INDEX idx_termine_apotheke_id ON termine(apotheke_id);
CREATE INDEX idx_termine_tour_id ON termine(tour_id);

-- berichte: session reports (one per appointment)
CREATE TABLE berichte (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  termin_id                 UUID NOT NULL UNIQUE REFERENCES termine(id) ON DELETE CASCADE,
  teilnehmer_anzahl         INTEGER,
  dauer_stunden             NUMERIC(4,1),
  rating_verstaendlichkeit  SMALLINT CHECK (rating_verstaendlichkeit BETWEEN 1 AND 10),
  rating_nutzbarkeit        SMALLINT CHECK (rating_nutzbarkeit BETWEEN 1 AND 10),
  rating_kompetenz          SMALLINT CHECK (rating_kompetenz BETWEEN 1 AND 10),
  themen                    TEXT NOT NULL DEFAULT '',
  interne_notiz             TEXT NOT NULL DEFAULT '',
  is_draft                  BOOLEAN NOT NULL DEFAULT TRUE,
  submitted_at              TIMESTAMPTZ DEFAULT NULL,
  submitted_by              UUID NOT NULL REFERENCES auth.users(id),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_berichte_termin_id ON berichte(termin_id);
CREATE INDEX idx_berichte_submitted_by ON berichte(submitted_by);
CREATE INDEX idx_berichte_submitted_at ON berichte(submitted_at);
CREATE INDEX idx_berichte_is_draft ON berichte(is_draft);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE apotheken ENABLE ROW LEVEL SECURITY;
ALTER TABLE touren ENABLE ROW LEVEL SECURITY;
ALTER TABLE termine ENABLE ROW LEVEL SECURITY;
ALTER TABLE berichte ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid() AND is_active = TRUE
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- RLS: user_profiles
-- ============================================================

-- All authenticated users can read all active profiles (needed for trainer dropdowns etc.)
CREATE POLICY "user_profiles: authenticated users can read"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (TRUE);

-- Users can update their own full_name; admins can update anything
CREATE POLICY "user_profiles: users update own, admins update all"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR get_my_role() = 'admin')
  WITH CHECK (id = auth.uid() OR get_my_role() = 'admin');

-- Only admins can insert (handled by trigger, but just in case)
CREATE POLICY "user_profiles: admins insert"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (get_my_role() = 'admin');

-- ============================================================
-- RLS: apotheken
-- ============================================================

-- All authenticated users can read non-deleted pharmacies
CREATE POLICY "apotheken: authenticated users can read"
  ON apotheken FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- Only admins can create pharmacies
CREATE POLICY "apotheken: admins can insert"
  ON apotheken FOR INSERT
  TO authenticated
  WITH CHECK (get_my_role() = 'admin');

-- Only admins can update pharmacies
CREATE POLICY "apotheken: admins can update"
  ON apotheken FOR UPDATE
  TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- Only admins can hard-delete (soft delete is done via UPDATE)
CREATE POLICY "apotheken: admins can delete"
  ON apotheken FOR DELETE
  TO authenticated
  USING (get_my_role() = 'admin');

-- ============================================================
-- RLS: touren
-- ============================================================

-- All authenticated users can read tours
CREATE POLICY "touren: authenticated users can read"
  ON touren FOR SELECT
  TO authenticated
  USING (TRUE);

-- Only admins can create/update/delete tours
CREATE POLICY "touren: admins can insert"
  ON touren FOR INSERT
  TO authenticated
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "touren: admins can update"
  ON touren FOR UPDATE
  TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "touren: admins can delete"
  ON touren FOR DELETE
  TO authenticated
  USING (get_my_role() = 'admin');

-- ============================================================
-- RLS: termine
-- ============================================================

-- Admins see all; trainers see only their own; management sees all
CREATE POLICY "termine: select by role"
  ON termine FOR SELECT
  TO authenticated
  USING (
    get_my_role() = 'admin'
    OR get_my_role() = 'management'
    OR trainer_id = auth.uid()
  );

-- Only admins can create appointments
CREATE POLICY "termine: admins can insert"
  ON termine FOR INSERT
  TO authenticated
  WITH CHECK (get_my_role() = 'admin');

-- Admins can update any; trainers can update status on their own appointments
CREATE POLICY "termine: update by role"
  ON termine FOR UPDATE
  TO authenticated
  USING (
    get_my_role() = 'admin'
    OR (get_my_role() = 'trainer' AND trainer_id = auth.uid())
  )
  WITH CHECK (
    get_my_role() = 'admin'
    OR (get_my_role() = 'trainer' AND trainer_id = auth.uid())
  );

-- Only admins can delete
CREATE POLICY "termine: admins can delete"
  ON termine FOR DELETE
  TO authenticated
  USING (get_my_role() = 'admin');

-- ============================================================
-- RLS: berichte
-- ============================================================

-- Admins and management see all; trainers see only their own
CREATE POLICY "berichte: select by role"
  ON berichte FOR SELECT
  TO authenticated
  USING (
    get_my_role() IN ('admin', 'management')
    OR submitted_by = auth.uid()
  );

-- Trainers can insert their own reports; admins can insert any
CREATE POLICY "berichte: insert by role"
  ON berichte FOR INSERT
  TO authenticated
  WITH CHECK (
    get_my_role() = 'admin'
    OR (get_my_role() = 'trainer' AND submitted_by = auth.uid())
  );

-- Trainers can update their own (draft) reports; admins can update any
CREATE POLICY "berichte: update by role"
  ON berichte FOR UPDATE
  TO authenticated
  USING (
    get_my_role() = 'admin'
    OR (get_my_role() = 'trainer' AND submitted_by = auth.uid())
  )
  WITH CHECK (
    get_my_role() = 'admin'
    OR (get_my_role() = 'trainer' AND submitted_by = auth.uid())
  );

-- Only admins can delete reports
CREATE POLICY "berichte: admins can delete"
  ON berichte FOR DELETE
  TO authenticated
  USING (get_my_role() = 'admin');
