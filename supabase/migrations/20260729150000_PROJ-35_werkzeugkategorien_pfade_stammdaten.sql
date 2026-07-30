-- PROJ-35: Werkzeugkategorien & Pfade — Stammdaten
-- Werkzeug-Ober-/Unterkategorien, globales Geometrie-Parameter-Register,
-- automatische Serviceartikel-Zuordnung über eine Preisstaffel, wiederver-
-- wendbare Bearbeitungspfade + Dienstleister-Partnernummer-Generator.
--
-- Reuse: tms.set_updated_at() (aus PROJ-34), tms.products (Serviceartikel,
-- type='SERVICE'), tms.partners (Dienstleister, partner_type='supplier').

-- ────────────────────────── tms.werkzeug_oberkategorien ──────────────────────────

CREATE TABLE tms.werkzeug_oberkategorien (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  ist_aktiv boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_oberkategorien_name_lower ON tms.werkzeug_oberkategorien (lower(name));

CREATE TRIGGER trg_oberkategorien_updated_at
  BEFORE UPDATE ON tms.werkzeug_oberkategorien
  FOR EACH ROW EXECUTE FUNCTION tms.set_updated_at();

ALTER TABLE tms.werkzeug_oberkategorien ENABLE ROW LEVEL SECURITY;

CREATE POLICY "oberkategorien_select_authenticated" ON tms.werkzeug_oberkategorien
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "oberkategorien_write_admin" ON tms.werkzeug_oberkategorien
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND status = 'aktiv' AND 'admin' = ANY(roles)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND status = 'aktiv' AND 'admin' = ANY(roles)
  ));

-- ────────────────────────── tms.geometrie_parameter ──────────────────────────

CREATE TABLE tms.geometrie_parameter (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  typ text NOT NULL CHECK (typ IN ('dropdown', 'freitext')),
  einheit text,
  dropdown_werte text[] NOT NULL DEFAULT '{}',
  in_benutzung boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_parameter_name_lower ON tms.geometrie_parameter (lower(name));

CREATE TRIGGER trg_parameter_updated_at
  BEFORE UPDATE ON tms.geometrie_parameter
  FOR EACH ROW EXECUTE FUNCTION tms.set_updated_at();

ALTER TABLE tms.geometrie_parameter ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parameter_select_authenticated" ON tms.geometrie_parameter
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "parameter_write_admin" ON tms.geometrie_parameter
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND status = 'aktiv' AND 'admin' = ANY(roles)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND status = 'aktiv' AND 'admin' = ANY(roles)
  ));

-- ────────────────────────── tms.pfade ──────────────────────────

CREATE TABLE tms.pfade (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_pfade_updated_at
  BEFORE UPDATE ON tms.pfade
  FOR EACH ROW EXECUTE FUNCTION tms.set_updated_at();

ALTER TABLE tms.pfade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pfade_select_authenticated" ON tms.pfade
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "pfade_write_admin" ON tms.pfade
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND status = 'aktiv' AND 'admin' = ANY(roles)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND status = 'aktiv' AND 'admin' = ANY(roles)
  ));

-- ────────────────────────── tms.pfad_schritte ──────────────────────────

CREATE TABLE tms.pfad_schritte (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pfad_id uuid NOT NULL REFERENCES tms.pfade(id) ON DELETE CASCADE,
  reihenfolge int NOT NULL,
  name text NOT NULL,
  ort text NOT NULL CHECK (ort IN ('im_betrieb', 'extern')),
  dienstleister_id uuid REFERENCES tms.partners(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (ort = 'extern' AND dienstleister_id IS NOT NULL) OR
    (ort = 'im_betrieb' AND dienstleister_id IS NULL)
  ),
  UNIQUE (pfad_id, reihenfolge)
);

CREATE INDEX idx_pfad_schritte_pfad_id ON tms.pfad_schritte(pfad_id);

ALTER TABLE tms.pfad_schritte ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pfad_schritte_select_authenticated" ON tms.pfad_schritte
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "pfad_schritte_write_admin" ON tms.pfad_schritte
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND status = 'aktiv' AND 'admin' = ANY(roles)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND status = 'aktiv' AND 'admin' = ANY(roles)
  ));

-- ────────────────────────── tms.werkzeug_unterkategorien ──────────────────────────

CREATE TABLE tms.werkzeug_unterkategorien (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oberkategorie_id uuid NOT NULL REFERENCES tms.werkzeug_oberkategorien(id),
  name text NOT NULL,
  ist_aktiv boolean NOT NULL DEFAULT true,
  preis_parameter_id uuid REFERENCES tms.geometrie_parameter(id),
  standard_pfad_id uuid REFERENCES tms.pfade(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Name eindeutig nur je Oberkategorie (Product Decision, siehe Spec)
CREATE UNIQUE INDEX idx_unterkategorien_name_lower
  ON tms.werkzeug_unterkategorien (oberkategorie_id, lower(name));
CREATE INDEX idx_unterkategorien_oberkategorie ON tms.werkzeug_unterkategorien(oberkategorie_id);

CREATE TRIGGER trg_unterkategorien_updated_at
  BEFORE UPDATE ON tms.werkzeug_unterkategorien
  FOR EACH ROW EXECUTE FUNCTION tms.set_updated_at();

ALTER TABLE tms.werkzeug_unterkategorien ENABLE ROW LEVEL SECURITY;

CREATE POLICY "unterkategorien_select_authenticated" ON tms.werkzeug_unterkategorien
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "unterkategorien_write_admin" ON tms.werkzeug_unterkategorien
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND status = 'aktiv' AND 'admin' = ANY(roles)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND status = 'aktiv' AND 'admin' = ANY(roles)
  ));

-- ────────────────────────── tms.unterkategorie_parameter ──────────────────────────
-- Zuordnung Parameter <-> Unterkategorie inkl. Anzeige-Reihenfolge

CREATE TABLE tms.unterkategorie_parameter (
  unterkategorie_id uuid NOT NULL REFERENCES tms.werkzeug_unterkategorien(id) ON DELETE CASCADE,
  parameter_id uuid NOT NULL REFERENCES tms.geometrie_parameter(id),
  reihenfolge int NOT NULL,
  PRIMARY KEY (unterkategorie_id, parameter_id)
);

ALTER TABLE tms.unterkategorie_parameter ENABLE ROW LEVEL SECURITY;

CREATE POLICY "unterkategorie_parameter_select_authenticated" ON tms.unterkategorie_parameter
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "unterkategorie_parameter_write_admin" ON tms.unterkategorie_parameter
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND status = 'aktiv' AND 'admin' = ANY(roles)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND status = 'aktiv' AND 'admin' = ANY(roles)
  ));

-- ────────────────────────── tms.preisstufen ──────────────────────────
-- Zweistufige Preisstaffel: Kandidat (Serviceartikel) + Wertebereich.
-- "bis IS NULL" = offene Obergrenze. Überschneidungsprüfung erfolgt in der
-- Server Action (Anwendungslogik), siehe Tech Design — eine offene
-- Obergrenze lässt sich nicht sauber als DB-Exclusion-Constraint abbilden.
-- Strikt 1:1 Serviceartikel<->Unterkategorie (Product Decision): ein
-- Serviceartikel kann global nur einer einzigen Preisstaffel angehören.

CREATE TABLE tms.preisstufen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unterkategorie_id uuid NOT NULL REFERENCES tms.werkzeug_unterkategorien(id) ON DELETE CASCADE,
  serviceartikel_id bigint NOT NULL REFERENCES tms.products(id),
  von numeric NOT NULL DEFAULT 0,
  bis numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (bis IS NULL OR bis > von)
);

CREATE INDEX idx_preisstufen_unterkategorie ON tms.preisstufen(unterkategorie_id);
CREATE UNIQUE INDEX idx_preisstufen_serviceartikel_unique ON tms.preisstufen(serviceartikel_id);

ALTER TABLE tms.preisstufen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "preisstufen_select_authenticated" ON tms.preisstufen
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "preisstufen_write_admin" ON tms.preisstufen
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND status = 'aktiv' AND 'admin' = ANY(roles)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND status = 'aktiv' AND 'admin' = ANY(roles)
  ));

-- ────────────────────────── Dienstleister-Partnernummer ──────────────────────────
-- Manuell angelegte Partner (source_system='manual', z.B. externe
-- Dienstleister aus PROJ-35) bekommen keine Easybill-Kundennummer — analog
-- zur Werkstattauftragsnummer aus PROJ-34 wird stattdessen eine einfache,
-- fortlaufende Nummer "L-0001" vergeben.

CREATE OR REPLACE FUNCTION tms.generate_dienstleister_partner_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  next_num integer;
  max_num integer;
BEGIN
  IF NEW.source_system = 'manual' AND (NEW.partner_number IS NULL OR NEW.partner_number = '') THEN
    SELECT COALESCE(MAX(REGEXP_REPLACE(partner_number, '[^0-9]', '', 'g')::integer), 0)
    INTO max_num
    FROM tms.partners
    WHERE partner_number LIKE 'L-%';

    next_num := max_num + 1;
    NEW.partner_number := 'L-' || LPAD(next_num::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_partners_dienstleister_number
  BEFORE INSERT ON tms.partners
  FOR EACH ROW EXECUTE FUNCTION tms.generate_dienstleister_partner_number();
