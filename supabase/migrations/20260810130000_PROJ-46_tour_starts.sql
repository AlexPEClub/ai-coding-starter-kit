-- PROJ-46: Fahrer — Tour starten (Status-Wechsel)
--
-- Neue Tabelle tms.tour_starts zur Speicherung von Tour-Start-Zeitstempeln.
-- Genau ein Eintrag pro Fahrer und Kalendertag (UNIQUE constraint auf DB-Ebene).
-- Start-Aktion ist idempotent: ein zweiter Aufruf liefert den bestehenden Zeitstempel
-- zurück, wirft keinen Fehler.

CREATE TABLE tms.tour_starts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fahrer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  datum DATE NOT NULL,
  gestartet_am TIMESTAMPTZ NOT NULL DEFAULT now(),
  erstellt_von uuid REFERENCES public.profiles(id),
  CONSTRAINT unique_fahrer_datum UNIQUE (fahrer_id, datum)
);

COMMENT ON TABLE tms.tour_starts IS
  'Tour-Start-Einträge: Ein Eintrag pro Fahrer und Kalendertag, wenn dieser Fahrer seine Tour explizit gestartet hat. Enthält den Zeitstempel des Starts (gestartet_am) und wer den Eintrag angelegt hat (erstellt_von).';

COMMENT ON COLUMN tms.tour_starts.fahrer_id IS
  'Verweis auf den Fahrer (profiles.id), dessen Tour gestartet wurde.';

COMMENT ON COLUMN tms.tour_starts.datum IS
  'Kalendertag (DATE), für den die Tour gestartet wurde.';

COMMENT ON COLUMN tms.tour_starts.gestartet_am IS
  'Zeitstempel (TIMESTAMPTZ), zu dem die Tour tatsächlich gestartet wurde (standardmäßig now() beim Eintrag).';

COMMENT ON COLUMN tms.tour_starts.erstellt_von IS
  'Profil-ID des Nutzers, der den Start-Eintrag angelegt hat (im Normalfall identisch mit fahrer_id). Dient der Nachvollziehbarkeit.';

-- Index auf fahrer_id für häufige Abfragen (z. B. "gib mir alle Starts für diesen Fahrer")
CREATE INDEX idx_tour_starts_fahrer_id ON tms.tour_starts(fahrer_id);

-- Index auf datum für Abfragen nach Datum (z. B. "gib mir alle Starts für heute")
CREATE INDEX idx_tour_starts_datum ON tms.tour_starts(datum);

-- Index auf (fahrer_id, datum) für die häufigste Abfrage: "hat dieser Fahrer am diesem Datum bereits gestartet?"
CREATE INDEX idx_tour_starts_fahrer_datum ON tms.tour_starts(fahrer_id, datum);

-- RLS aktivieren (Muster wie tms.tour_aenderungen: keine Policies für normale Nutzer,
-- Zugriff nur über geprüften Server-Code mit service_role)
ALTER TABLE tms.tour_starts ENABLE ROW LEVEL SECURITY;
