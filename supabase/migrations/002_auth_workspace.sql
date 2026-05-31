-- Migration 002: Auth Workspace (PROJ-2)
-- Adds first_name / last_name / phone / avatar_url to profiles,
-- logo_url to tenants, an owner-only UPDATE policy on tenants,
-- Supabase Storage buckets for profile avatars and workspace logos,
-- and updates the handle_new_user() trigger to populate the new columns.

-- ─────────────────────────────────────────────────────────────────────────────
-- SCHEMA ADDITIONS
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name  text,
  ADD COLUMN IF NOT EXISTS last_name   text,
  ADD COLUMN IF NOT EXISTS phone       text,
  ADD COLUMN IF NOT EXISTS avatar_url  text;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS logo_url text;

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS: tenants UPDATE (owners only)
-- ─────────────────────────────────────────────────────────────────────────────

-- Only the workspace owner may update the tenant record.
-- get_tenant_id() (SECURITY DEFINER) is safe to call here.
CREATE POLICY "tenants_update_owner_only"
  ON public.tenants FOR UPDATE
  USING (
    id = public.get_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  )
  WITH CHECK (id = public.get_tenant_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- STORAGE BUCKETS
-- Note: bucket creation requires the storage schema to be present.
-- If running locally via supabase start, this is available automatically.
-- ─────────────────────────────────────────────────────────────────────────────

-- Buckets are public so getPublicUrl() works for displaying avatars and logos.
-- Write access is still controlled by RLS policies below.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-avatars',
  'profile-avatars',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'workspace-logos',
  'workspace-logos',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ─────────────────────────────────────────────────────────────────────────────
-- STORAGE RLS — profile-avatars
-- Path convention: {user_id}/avatar.{ext}
-- Read is open (public bucket). Write is own-user only.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE POLICY "profile_avatars_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "profile_avatars_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'profile-avatars' AND owner_id = auth.uid()::text);

CREATE POLICY "profile_avatars_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'profile-avatars' AND owner_id = auth.uid()::text);

-- ─────────────────────────────────────────────────────────────────────────────
-- STORAGE RLS — workspace-logos
-- Path convention: {tenant_id}/logo.{ext}
-- Read is open (public bucket). Owner role is validated in the API layer.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE POLICY "workspace_logos_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'workspace-logos'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "workspace_logos_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'workspace-logos' AND owner_id = auth.uid()::text);

CREATE POLICY "workspace_logos_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'workspace-logos' AND owner_id = auth.uid()::text);

-- ─────────────────────────────────────────────────────────────────────────────
-- UPDATE TRIGGER: handle_new_user
-- Now also populates first_name and last_name from signup metadata.
-- Signup must pass: { practice_name, first_name, last_name } in user_metadata.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id  uuid;
  v_practice   text;
  v_slug       text;
  v_base_slug  text;
  v_counter    int := 1;
  v_first_name text;
  v_last_name  text;
  v_full_name  text;
BEGIN
  v_practice := COALESCE(
    NULLIF(TRIM(new.raw_user_meta_data->>'practice_name'), ''),
    'Meine Praxis'
  );

  v_first_name := NULLIF(TRIM(COALESCE(new.raw_user_meta_data->>'first_name', '')), '');
  v_last_name  := NULLIF(TRIM(COALESCE(new.raw_user_meta_data->>'last_name',  '')), '');
  v_full_name  := NULLIF(TRIM(CONCAT_WS(' ', v_first_name, v_last_name)), '');

  -- Slug generation (same logic as before)
  v_slug := lower(v_practice);
  v_slug := replace(v_slug, 'ä', 'ae');
  v_slug := replace(v_slug, 'ö', 'oe');
  v_slug := replace(v_slug, 'ü', 'ue');
  v_slug := replace(v_slug, 'ß', 'ss');
  v_slug := regexp_replace(v_slug, '[^a-z0-9 \-]', '', 'g');
  v_slug := regexp_replace(TRIM(v_slug), '\s+',   '-', 'g');
  v_slug := regexp_replace(v_slug,       '\-{2,}', '-', 'g');
  v_slug := TRIM(BOTH '-' FROM v_slug);

  IF v_slug = '' THEN v_slug := 'praxis'; END IF;
  v_base_slug := v_slug;

  LOOP
    BEGIN
      INSERT INTO public.tenants (name, slug, plan)
      VALUES (v_practice, v_slug, 'trial')
      RETURNING id INTO v_tenant_id;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      v_counter := v_counter + 1;
      IF v_counter > 100 THEN
        RAISE EXCEPTION 'handle_new_user: exceeded 100 slug retries for "%"', v_practice;
      END IF;
      v_slug := v_base_slug || '-' || v_counter;
    END;
  END LOOP;

  INSERT INTO public.profiles (user_id, tenant_id, role, full_name, first_name, last_name)
  VALUES (new.id, v_tenant_id, 'owner', v_full_name, v_first_name, v_last_name);

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user: failed for user %, error: %', new.id, SQLERRM;
  RETURN new;
END;
$$;
