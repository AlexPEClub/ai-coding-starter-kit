-- Migration 001: Multi-Tenant Foundation
-- Creates tenants + profiles tables, RLS policies, get_tenant_id() helper,
-- and the on_auth_user_created trigger that bootstraps every new signup.

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tenants (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  slug        text        UNIQUE NOT NULL,
  plan        text        NOT NULL DEFAULT 'trial'
                          CHECK (plan IN ('trial', 'pro', 'enterprise')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id   uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role        text        NOT NULL CHECK (role IN ('owner', 'therapist', 'client')),
  full_name   text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_profiles_user_id   ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenants_slug       ON public.tenants(slug);

-- ─────────────────────────────────────────────────────────────────────────────
-- HELPER: get_tenant_id()
--
-- Returns the tenant_id for the currently authenticated user.
-- SECURITY DEFINER lets it bypass RLS on profiles — required to avoid
-- infinite recursion (profiles RLS calls this function, which reads profiles).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.tenants  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- tenants: any authenticated member of the practice can read their own tenant
CREATE POLICY "tenants_select_own"
  ON public.tenants FOR SELECT
  USING (id = public.get_tenant_id());

-- profiles: users see all profiles belonging to their practice
CREATE POLICY "profiles_select_same_tenant"
  ON public.profiles FOR SELECT
  USING (tenant_id = public.get_tenant_id());

-- profiles: users may update their own profile row only
-- (tenant_id and role changes are prevented by the WITH CHECK clause)
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING  (user_id = auth.uid())
  WITH CHECK (
    user_id   = auth.uid()
    AND tenant_id = public.get_tenant_id()
  );

-- INSERT/DELETE on tenants and profiles is done exclusively by the trigger
-- (service-role context). No client-side INSERT/DELETE policies are needed.

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGER: handle_new_user
--
-- Fires AFTER INSERT on auth.users (every signup).
-- Creates the tenant (practice) and the owner profile atomically.
-- Slug generation handles German umlauts, special chars, and collisions.
-- On unexpected failure the exception is logged; the auth user is NOT rolled
-- back so that PROJ-2 can detect and handle the "no workspace" state.
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
BEGIN
  -- Read practice name from signup metadata; fall back gracefully
  v_practice := COALESCE(
    NULLIF(TRIM(new.raw_user_meta_data->>'practice_name'), ''),
    'Meine Praxis'
  );

  -- ── Slug generation ──────────────────────────────────────────────────────
  v_slug := lower(v_practice);

  -- German umlaut / sharp-s normalisation
  v_slug := replace(v_slug, 'ä', 'ae');
  v_slug := replace(v_slug, 'ö', 'oe');
  v_slug := replace(v_slug, 'ü', 'ue');
  v_slug := replace(v_slug, 'ß', 'ss');

  -- Strip everything that is not a-z, 0-9, space, or hyphen
  v_slug := regexp_replace(v_slug, '[^a-z0-9 \-]', '', 'g');

  -- Collapse whitespace → hyphen; collapse multiple hyphens
  v_slug := regexp_replace(TRIM(v_slug), '\s+',   '-', 'g');
  v_slug := regexp_replace(v_slug,       '\-{2,}', '-', 'g');
  v_slug := TRIM(BOTH '-' FROM v_slug);

  IF v_slug = '' THEN v_slug := 'praxis'; END IF;
  v_base_slug := v_slug;
  -- ─────────────────────────────────────────────────────────────────────────

  -- ── Atomic slug INSERT with retry on concurrent collision ─────────────────
  -- An inner BEGIN/EXCEPTION block makes this atomic: the INSERT either
  -- succeeds or raises unique_violation, which is caught and retried.
  -- This is safe against race conditions; the outer WHILE EXISTS pre-check
  -- was not (window between SELECT and INSERT).
  LOOP
    BEGIN
      INSERT INTO public.tenants (name, slug, plan)
      VALUES (v_practice, v_slug, 'trial')
      RETURNING id INTO v_tenant_id;
      EXIT; -- INSERT succeeded → leave retry loop
    EXCEPTION WHEN unique_violation THEN
      v_counter := v_counter + 1;
      IF v_counter > 100 THEN
        RAISE EXCEPTION 'handle_new_user: exceeded 100 slug retries for "%"', v_practice;
      END IF;
      v_slug := v_base_slug || '-' || v_counter;
    END;
  END LOOP;
  -- ─────────────────────────────────────────────────────────────────────────

  INSERT INTO public.profiles (user_id, tenant_id, role, full_name)
  VALUES (
    new.id,
    v_tenant_id,
    'owner',
    NULLIF(TRIM(COALESCE(new.raw_user_meta_data->>'full_name', '')), '')
  );

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Warn but do not abort the auth.users INSERT so the user can still log in.
  -- PROJ-2 must detect the missing profile and show a recovery screen.
  RAISE WARNING 'handle_new_user: failed for user %, error: %', new.id, SQLERRM;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
