-- PROJ-41: Fahrer — Fahrt bearbeiten (Fahrer/Datum/Notiz + Änderungsverlauf)
--
-- Neue, generische Notiz-Spalte auf tms.tours (nicht reschedule_notiz/
-- problem_notiz wiederverwenden, die zweckgebunden für andere Features sind).
-- Neue Änderungsverlauf-Tabelle, explizit aus der Server Action befüllt
-- (nicht per Trigger), damit geaendert_von den tatsächlich handelnden
-- Nutzer trägt statt auth.uid() (der bei Schreibungen über den Admin-Client
-- leer wäre) — gleiches Muster wie tms.werkzeug_status_historie (PROJ-34).

ALTER TABLE tms.tours
  ADD COLUMN notiz text CHECK (char_length(notiz) <= 500);

CREATE TABLE tms.tour_aenderungen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid NOT NULL REFERENCES tms.tours(id) ON DELETE CASCADE,
  feld text NOT NULL,
  alter_wert text,
  neuer_wert text,
  geaendert_von uuid REFERENCES public.profiles(id),
  geaendert_am timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tour_aenderungen_tour_id ON tms.tour_aenderungen(tour_id);

-- Kein Zugriff für die normale (authenticated) Rolle — gleiches Muster wie
-- tms.tours selbst (nur service_role liest/schreibt, Rechteprüfung sitzt
-- vollständig im Anwendungscode über pruefeFahrerZugriff()).
ALTER TABLE tms.tour_aenderungen ENABLE ROW LEVEL SECURITY;
