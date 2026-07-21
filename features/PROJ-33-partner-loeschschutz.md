# PROJ-33: Löschschutz für Partners

**Status:** 🟠 In Review — Code/Migration fertig & gepusht (Branch `claude/session-yomvzd`), Deploy steht noch aus (wartet auf Server-Zugriff)
**Projekt:** TMS 2.0 / Kundenverwaltung
**Priorität:** Hoch
**Typ:** Hotfix (Ausnahme vom vollen Workflow, explizit vom User angefordert)
**Datum:** 2026-07-21

---

## 1. Regel

Partners (Kunden, Tabelle `tms.partners`) dürfen **niemals gelöscht** werden.
Maximal darf ein Partner auf **inaktiv** gesetzt werden (`is_active = false`).

**Werkstatt-Vergleich:** Eine Kunden-Karteikarte wird nie vernichtet — sie
wandert höchstens ins Archiv. So bleibt die komplette Historie (Bestellungen,
Umsätze, Rechnungen) immer nachvollziehbar, auch wenn ein Kunde nicht mehr
aktiv ist.

## 2. Umsetzung

- Neue Migration: `supabase/migrations/20260721120000_PROJ-33_partners_no_delete.sql`
- `BEFORE DELETE`-Trigger `trg_partners_prevent_delete` auf `tms.partners`,
  der jeden Löschversuch mit einer Exception abbricht.
- Der Trigger greift unabhängig vom aufrufenden Client/Rolle (auch
  `service_role`), da Trigger — anders als RLS-Policies — nicht umgangen
  werden können.
- Keine Änderung an RLS-Policies nötig, daher kein Risiko für bestehende
  Lese-/Schreibzugriffe.
- Im Anwendungscode (`src/lib/actions/partners.ts`) existierte bereits
  keine Lösch-Funktion für Partners — es gab also nichts zu entfernen.

## 3. Akzeptanzkriterien

- [ ] `DELETE FROM tms.partners WHERE id = ...` schlägt mit Fehlermeldung fehl
- [ ] `UPDATE tms.partners SET is_active = false WHERE id = ...` funktioniert weiterhin normal
- [ ] Bestehende Lese-/Bearbeiten-Funktionen für Partners sind unverändert

## 4. Offene Punkte

- Es gibt aktuell keine UI-Funktion zum Inaktiv-Setzen eines Partners — falls
  gewünscht, separates Feature (`/write-spec`) für "Partner deaktivieren"-Button.

## 5. Deploy-Anleitung (für die Session mit Server-Zugriff)

Diese Session hatte keinen Zugriff auf den Hetzner-Host (kein Docker-Daemon,
kein SSH) — der Code ist fertig und gepusht, aber noch **nicht live**.

1. Branch `claude/session-yomvzd` auf dem Hetzner-Host pullen (oder zuvor
   nach `main` mergen, je nach Vorgehen).
2. Migration auf die self-hosted Supabase-Instanz anwenden — entweder über
   die normale Migrations-Pipeline oder direkt:
   `supabase/migrations/20260721120000_PROJ-33_partners_no_delete.sql`
3. Deploy + automatische Verifikation:
   ```bash
   ./scripts/deploy.sh PROJ-33
   ```
4. Nach erfolgreichem Deploy: Status hier und in `features/INDEX.md` auf
   **✅ Deployed** setzen (Datum ergänzen).
