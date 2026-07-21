-- PROJ-33: Löschschutz für Partners (Hotfix)
-- Erstellt: 2026-07-21
-- Regel: Partners dürfen niemals gelöscht werden, maximal auf inaktiv
-- gesetzt werden (is_active = false). Ein BEFORE DELETE Trigger blockiert
-- jeden DELETE-Versuch auf tms.partners unabhängig von Rolle/Client
-- (auch service_role / Superuser, da Trigger nicht durch RLS umgangen werden).

CREATE OR REPLACE FUNCTION tms.prevent_partner_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Partners dürfen nicht gelöscht werden — stattdessen is_active = false setzen (Partner-ID: %).', OLD.id
        USING ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_partners_prevent_delete ON tms.partners;
CREATE TRIGGER trg_partners_prevent_delete
    BEFORE DELETE ON tms.partners
    FOR EACH ROW
    EXECUTE FUNCTION tms.prevent_partner_delete();
