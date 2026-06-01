-- Migration 003: Patienten-Verwaltung (PROJ-3)
-- Adds owners (Tierbesitzer) + patients (Tiere) tables, both tenant-isolated
-- via get_tenant_id() RLS, a patient-photos storage bucket, and an updated_at
-- trigger on patients. No hard-delete: patients are archived via status.

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: owners (Tierbesitzer)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.owners (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  first_name  text        NOT NULL,
  last_name   text        NOT NULL,
  email       text,
  phone       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  -- At least one contact channel is required (mirrors the form rule).
  CONSTRAINT owners_contact_required CHECK (
    COALESCE(NULLIF(TRIM(email), ''), NULLIF(TRIM(phone), '')) IS NOT NULL
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: patients (Tiere)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.patients (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  owner_id    uuid        NOT NULL REFERENCES public.owners(id) ON DELETE RESTRICT,
  name        text        NOT NULL,
  species     text        NOT NULL,
  breed       text,
  birth_date  date,
  sex         text        CHECK (sex IN ('male', 'female', 'male_neutered', 'female_spayed', 'unknown')),
  weight_kg   numeric(6,2) CHECK (weight_kg IS NULL OR (weight_kg > 0 AND weight_kg <= 2000)),
  anamnesis   text,
  photo_url   text,
  status      text        NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'archived')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_owners_tenant_id    ON public.owners(tenant_id);
CREATE INDEX IF NOT EXISTS idx_patients_tenant_id  ON public.patients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_patients_owner_id   ON public.patients(owner_id);
-- Standard list query filters by tenant + status and orders by name.
CREATE INDEX IF NOT EXISTS idx_patients_tenant_status ON public.patients(tenant_id, status);

-- ─────────────────────────────────────────────────────────────────────────────
-- updated_at TRIGGER (patients)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS patients_set_updated_at ON public.patients;
CREATE TRIGGER patients_set_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- Both tables are strictly tenant-isolated through get_tenant_id() (PROJ-1).
-- No DELETE policy: deletion is intentionally impossible (archive instead).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.owners   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- owners ----------------------------------------------------------------------
CREATE POLICY "owners_select_same_tenant"
  ON public.owners FOR SELECT
  USING (tenant_id = public.get_tenant_id());

CREATE POLICY "owners_insert_same_tenant"
  ON public.owners FOR INSERT
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE POLICY "owners_update_same_tenant"
  ON public.owners FOR UPDATE
  USING (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

-- patients --------------------------------------------------------------------
CREATE POLICY "patients_select_same_tenant"
  ON public.patients FOR SELECT
  USING (tenant_id = public.get_tenant_id());

CREATE POLICY "patients_insert_same_tenant"
  ON public.patients FOR INSERT
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE POLICY "patients_update_same_tenant"
  ON public.patients FOR UPDATE
  USING (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- STORAGE BUCKET — patient-photos
-- Path convention: {tenant_id}/{patient_id}.{ext}
-- Public read (like profile-avatars). Write is kept to a simple "authenticated"
-- check — path-based folder checks proved brittle in this project, so tenant
-- isolation for the row data (RLS above) is the source of truth.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'patient-photos',
  'patient-photos',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "patient_photos_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'patient-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "patient_photos_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'patient-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "patient_photos_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'patient-photos' AND auth.uid() IS NOT NULL);
