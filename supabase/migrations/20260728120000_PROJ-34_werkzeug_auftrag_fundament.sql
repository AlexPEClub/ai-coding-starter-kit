-- PROJ-34: Werkzeug-/Auftrags-Fundament, Fahrer-Auftragserfassung & Wareneingang
--
-- Legt das Datenmodell für das Kernstück von TMS 2.0 an: Werkzeug-Stammdaten,
-- die neue Auftrags-Entität (referenziert `tms.tours` nur optional, siehe
-- Decision Log in features/PROJ-34-werkzeug-auftrag-fundament.md), Kommission
-- pro Kunde, ein einfacher Lagerplatz-Vorschlag für die Verpackung, und die
-- Erweiterung der bestehenden Auftrags-Standardeinstellungen um die
-- Kommissions-Konfiguration.
--
-- Alle neuen Tabellen liegen bewusst im `tms`-Schema (wie tms.partners,
-- tms.tours), NICHT im alten, toten `public.tools`/`public.orders`-Prototyp.

-- ────────────────────────── Hilfsfunktionen ──────────────────────────

CREATE OR REPLACE FUNCTION tms.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ────────────────────────── tms.werkzeuge ──────────────────────────

CREATE TABLE tms.werkzeuge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code text NOT NULL UNIQUE,
  code_typ text NOT NULL DEFAULT 'laser' CHECK (code_typ IN ('laser', 'begleit')),
  ist_gelasert boolean NOT NULL DEFAULT false,
  typ_bezeichnung text,
  partner_id uuid REFERENCES tms.partners(id),
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_werkzeuge_partner_id ON tms.werkzeuge(partner_id);
CREATE INDEX idx_werkzeuge_qr_code ON tms.werkzeuge(qr_code);

CREATE TRIGGER trg_werkzeuge_updated_at
  BEFORE UPDATE ON tms.werkzeuge
  FOR EACH ROW EXECUTE FUNCTION tms.set_updated_at();

ALTER TABLE tms.werkzeuge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "werkzeuge_select_authenticated" ON tms.werkzeuge
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND status = 'aktiv'
  ));

CREATE POLICY "werkzeuge_write_fahrer_wareneingang_admin" ON tms.werkzeuge
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND status = 'aktiv'
      AND (roles && ARRAY['fahrer', 'wareneingang', 'admin']::user_role[])
  ));

CREATE POLICY "werkzeuge_update_fahrer_wareneingang_admin" ON tms.werkzeuge
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND status = 'aktiv'
      AND (roles && ARRAY['fahrer', 'wareneingang', 'admin']::user_role[])
  ));

-- ────────────────────────── tms.lagerplaetze ──────────────────────────

CREATE TABLE tms.lagerplaetze (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bezeichnung text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'frei' CHECK (status IN ('frei', 'belegt')),
  auftrag_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lagerplaetze_status ON tms.lagerplaetze(status);

INSERT INTO tms.lagerplaetze (bezeichnung)
SELECT 'Fach ' || lpad(n::text, 2, '0')
FROM generate_series(1, 20) AS n;

ALTER TABLE tms.lagerplaetze ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lagerplaetze_select_authenticated" ON tms.lagerplaetze
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'aktiv'
  ));

CREATE POLICY "lagerplaetze_update_wareneingang_admin" ON tms.lagerplaetze
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND status = 'aktiv'
      AND (roles && ARRAY['wareneingang', 'admin']::user_role[])
  ));

CREATE POLICY "lagerplaetze_insert_admin" ON tms.lagerplaetze
  FOR INSERT TO authenticated
  WITH CHECK (public.is_active_admin());

-- ────────────────────────── tms.auftraege ──────────────────────────

CREATE TABLE tms.auftraege (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auftragsnummer text NOT NULL UNIQUE,
  partner_id uuid REFERENCES tms.partners(id),
  tour_id uuid REFERENCES tms.tours(id),
  kommission_id uuid,
  kommission_freitext text,
  gesamtgewicht_kg numeric(8, 2) CHECK (gesamtgewicht_kg IS NULL OR gesamtgewicht_kg > 0),
  lagerplatz_id uuid REFERENCES tms.lagerplaetze(id),
  status text NOT NULL DEFAULT 'wird_erfasst'
    CHECK (status IN ('wird_erfasst', 'aufgenommen', 'im_wareneingang_bestaetigt')),
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_auftraege_partner_id ON tms.auftraege(partner_id);
CREATE INDEX idx_auftraege_tour_id ON tms.auftraege(tour_id);
CREATE INDEX idx_auftraege_status ON tms.auftraege(status);
CREATE INDEX idx_auftraege_created_at ON tms.auftraege(created_at DESC);

CREATE OR REPLACE FUNCTION tms.generate_werkstattauftragsnummer()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  next_num integer;
  max_num integer;
BEGIN
  IF NEW.auftragsnummer IS NULL OR NEW.auftragsnummer = '' THEN
    SELECT COALESCE(MAX(REGEXP_REPLACE(auftragsnummer, '[^0-9]', '', 'g')::integer), 0)
    INTO max_num
    FROM tms.auftraege;

    next_num := max_num + 1;
    NEW.auftragsnummer := 'WA-' || LPAD(next_num::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auftraege_auftragsnummer
  BEFORE INSERT ON tms.auftraege
  FOR EACH ROW EXECUTE FUNCTION tms.generate_werkstattauftragsnummer();

CREATE TRIGGER trg_auftraege_updated_at
  BEFORE UPDATE ON tms.auftraege
  FOR EACH ROW EXECUTE FUNCTION tms.set_updated_at();

ALTER TABLE tms.auftraege ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auftraege_select_authenticated" ON tms.auftraege
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'aktiv'
  ));

CREATE POLICY "auftraege_write_fahrer_wareneingang_admin" ON tms.auftraege
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND status = 'aktiv'
      AND (roles && ARRAY['fahrer', 'wareneingang', 'admin']::user_role[])
  ));

CREATE POLICY "auftraege_update_fahrer_wareneingang_admin" ON tms.auftraege
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND status = 'aktiv'
      AND (roles && ARRAY['fahrer', 'wareneingang', 'admin']::user_role[])
  ));

-- ────────────────────────── tms.kommissionen ──────────────────────────

CREATE TABLE tms.kommissionen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES tms.partners(id) ON DELETE CASCADE,
  bezeichnung text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Bewusst KEIN UNIQUE(partner_id, bezeichnung): Duplikate sind laut Spec
-- fachlich unkritisch (siehe Edge Cases in der Feature-Spec).
CREATE INDEX idx_kommissionen_partner_id ON tms.kommissionen(partner_id);

ALTER TABLE tms.auftraege
  ADD CONSTRAINT auftraege_kommission_id_fkey
  FOREIGN KEY (kommission_id) REFERENCES tms.kommissionen(id);

ALTER TABLE tms.kommissionen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kommissionen_select_authenticated" ON tms.kommissionen
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'aktiv'
  ));

CREATE POLICY "kommissionen_insert_fahrer_wareneingang_admin" ON tms.kommissionen
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND status = 'aktiv'
      AND (roles && ARRAY['fahrer', 'wareneingang', 'admin']::user_role[])
  ));

-- ────────────────────────── tms.werkzeuge_im_auftrag ──────────────────────────

CREATE TABLE tms.werkzeuge_im_auftrag (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auftrag_id uuid NOT NULL REFERENCES tms.auftraege(id) ON DELETE CASCADE,
  werkzeug_id uuid REFERENCES tms.werkzeuge(id),
  ohne_code_notiz text,
  status text NOT NULL DEFAULT 'erfasst'
    CHECK (status IN ('erfasst', 'im_wareneingang_bestaetigt')),
  faelligkeit_am date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (auftrag_id, werkzeug_id)
);

CREATE INDEX idx_wia_auftrag_id ON tms.werkzeuge_im_auftrag(auftrag_id);
CREATE INDEX idx_wia_werkzeug_id ON tms.werkzeuge_im_auftrag(werkzeug_id);

ALTER TABLE tms.werkzeuge_im_auftrag ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wia_select_authenticated" ON tms.werkzeuge_im_auftrag
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'aktiv'
  ));

CREATE POLICY "wia_write_fahrer_wareneingang_admin" ON tms.werkzeuge_im_auftrag
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND status = 'aktiv'
      AND (roles && ARRAY['fahrer', 'wareneingang', 'admin']::user_role[])
  ));

CREATE POLICY "wia_update_fahrer_wareneingang_admin" ON tms.werkzeuge_im_auftrag
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND status = 'aktiv'
      AND (roles && ARRAY['fahrer', 'wareneingang', 'admin']::user_role[])
  ));

CREATE POLICY "wia_delete_fahrer_wareneingang_admin" ON tms.werkzeuge_im_auftrag
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND status = 'aktiv'
      AND (roles && ARRAY['fahrer', 'wareneingang', 'admin']::user_role[])
  ));

-- ────────────────────────── tms.werkzeug_status_historie ──────────────────────────
-- Rohdaten-Protokoll für das spätere Dashboard (PROJ-7). Wird explizit von den
-- Server Actions befüllt (nicht per Trigger), damit `geaendert_von` den
-- tatsächlich handelnden Nutzer trägt statt `auth.uid()` (der bei Schreibungen
-- über den Admin-Client leer wäre).

CREATE TABLE tms.werkzeug_status_historie (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  werkzeug_im_auftrag_id uuid NOT NULL REFERENCES tms.werkzeuge_im_auftrag(id) ON DELETE CASCADE,
  status text NOT NULL,
  geaendert_von uuid REFERENCES public.profiles(id),
  geaendert_am timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_wsh_wia_id ON tms.werkzeug_status_historie(werkzeug_im_auftrag_id);

ALTER TABLE tms.werkzeug_status_historie ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wsh_select_authenticated" ON tms.werkzeug_status_historie
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'aktiv'
  ));

CREATE POLICY "wsh_insert_fahrer_wareneingang_admin" ON tms.werkzeug_status_historie
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND status = 'aktiv'
      AND (roles && ARRAY['fahrer', 'wareneingang', 'admin']::user_role[])
  ));

-- ────────────────────────── tms.lagerplaetze: FK zu Aufträgen nachtragen ──────────────────────────
-- (tms.auftraege existiert erst ab hier, daher FK nachträglich ergänzt statt
-- zirkulärer Abhängigkeit bei der Tabellenerstellung)

ALTER TABLE tms.lagerplaetze
  ADD CONSTRAINT lagerplaetze_auftrag_id_fkey
  FOREIGN KEY (auftrag_id) REFERENCES tms.auftraege(id);

CREATE INDEX idx_lagerplaetze_auftrag_id ON tms.lagerplaetze(auftrag_id);

-- ────────────────────────── Kommissions-Einstellung pro Kunde ──────────────────────────
-- Erweitert die bestehenden Auftrags-Standardeinstellungen (dieselbe Stelle
-- wie Fahrer/Zugangsart/Rückführungsart) statt einer neuen, verstreuten Tabelle.

ALTER TABLE tms.partner_order_defaults
  ADD COLUMN kommission_pflicht boolean NOT NULL DEFAULT false,
  ADD COLUMN kommission_typ text NOT NULL DEFAULT 'dynamisch'
    CHECK (kommission_typ IN ('statisch', 'dynamisch'));

-- Bestehende Lücke schließen: partner_order_defaults hatte bisher keine RLS.
ALTER TABLE tms.partner_order_defaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partner_order_defaults_select_authenticated" ON tms.partner_order_defaults
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'aktiv'
  ));

CREATE POLICY "partner_order_defaults_write_admin" ON tms.partner_order_defaults
  FOR ALL TO authenticated
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());
