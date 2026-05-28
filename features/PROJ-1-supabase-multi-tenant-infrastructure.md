# PROJ-1: Supabase Multi-Tenant Infrastructure

## Status: Planned
**Created:** 2026-05-28
**Last Updated:** 2026-05-28

## Dependencies
- None (Fundament für alle anderen Features)

## User Stories

- Als Tierphysiotherapeut möchte ich mich mit meiner Praxis registrieren, damit ich einen isolierten Workspace für meine Daten bekomme.
- Als Praxis-Besitzer möchte ich, dass meine Patienten- und Übungsdaten komplett von anderen Praxen getrennt sind, damit keine Datenschutzverletzungen entstehen.
- Als System möchte ich jeden Datenbankzugriff automatisch auf den Tenant des eingeloggten Users einschränken, damit Therapeut A niemals Daten von Therapeut B sehen kann.
- Als Entwickler möchte ich ein konsistentes `tenant_id`-Pattern auf allen Tabellen, damit ich neue Features ohne zusätzliche Isolationslogik aufbauen kann.
- Als Praxis möchte ich ein `plan`-Feld in meinem Tenant-Record, damit später ein Abrechnungsmodell (z.B. Free, Pro) ohne Schema-Änderungen ergänzt werden kann.

## Out of Scope

- **Einladungs-Flow für weitere Therapeuten** — ein Therapeut lädt Kollegen in seine Praxis ein → deferred to PROJ-11
- **Billing/Payment-Integration** — Plan-Feld wird angelegt, aber keine Zahlungslogik → P2, kein zugeordnetes PROJ
- **Tenant-Löschung / Offboarding** — was passiert mit Daten, wenn eine Praxis gekündigt wird → post-MVP
- **Supabase Storage Buckets** — Video-Storage-Setup → deferred to PROJ-8
- **Login/Auth UI** — Registrierungs- und Login-Formulare → PROJ-2
- **Detaillierte Rechteverwaltung** — Rollen-Policies über `owner/therapist/client` hinaus → PROJ-11

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

### Tenant-Erstellung
- [ ] Angenommen ein neuer Auth-User wird in Supabase angelegt, wenn der Registrierungs-Trigger feuert, dann wird automatisch ein neuer `tenants`-Datensatz mit `name`, `slug` und `plan = 'trial'` erstellt.
- [ ] Angenommen ein Therapeut registriert sich mit Praxisname "Tierphysio München", wenn der Slug "tierphysio-munchen" bereits vergeben ist, dann wird automatisch "tierphysio-munchen-2" (o.ä.) als Slug verwendet, ohne Fehlermeldung für den User.
- [ ] Angenommen ein Tenant-Record wird erstellt, wenn der Trigger abgeschlossen ist, dann existiert auch ein zugehöriger `profiles`-Datensatz mit `tenant_id`, `role = 'owner'` und `user_id`.

### Datenisolation via RLS
- [ ] Angenommen Therapeut A ist eingeloggt, wenn er eine Datenbankabfrage auf eine beliebige Tabelle mit `tenant_id` ausführt, dann liefert Supabase nur Zeilen zurück, bei denen `tenant_id` mit dem eigenen Tenant übereinstimmt.
- [ ] Angenommen Therapeut A versucht einen Datensatz von Therapeut B direkt per ID abzurufen (z.B. via Supabase Client), dann gibt die Datenbank keine Zeile zurück (kein Fehler, aber leeres Ergebnis — RLS).
- [ ] Angenommen ein unauthentifizierter Request trifft die Datenbank, wenn keine gültige Session vorliegt, dann sind keine Zeilen aus tenant-isolierten Tabellen sichtbar.

### Datenbankstruktur
- [ ] Angenommen die Migration ausgeführt wird, dann existieren die Tabellen `tenants` und `profiles` mit den definierten Pflichtfeldern (siehe Technische Anforderungen).
- [ ] Angenommen eine neue Domain-Tabelle (z.B. `patients`) wird angelegt, dann folgt sie dem etablierten Pattern: `tenant_id UUID NOT NULL REFERENCES tenants(id)` + RLS-Policy aktiviert.

### Profiles
- [ ] Angenommen ein User registriert sich, wenn sein Profil angelegt wird, dann hat `profiles.role` den Wert `'owner'` für den Ersteller einer Praxis.
- [ ] Angenommen ein Profil ohne `tenant_id` würde angelegt (Fehlerfall), dann schlägt das INSERT durch einen NOT NULL Constraint fehl.

## Edge Cases

- **Slug-Kollision:** Zwei Praxen mit identischem Namen → automatisches Suffix (`-2`, `-3`, ...) via DB-Funktion oder Trigger-Logik
- **Orphaned Auth User:** Auth-User existiert, aber Tenant-Trigger schlägt fehl → Profil-Erstellung scheitert; User hat leere Session ohne Workspace — Fehler muss geloggt werden
- **Gleichzeitige Registrierung mit gleichem Slug:** Race Condition → Unique Constraint auf `tenants.slug` + Retry-Logik im Trigger
- **User gehört zu keinem Tenant:** z.B. nach fehlgeschlagenem Trigger → RLS blockiert alle Datenzugriffe; PROJ-2 muss diesen Zustand erkennen und behandeln
- **Sonderzeichen im Praxisnamen:** "Müller & Partner Tierphysio GmbH" → Slug-Generierung muss Umlaute und Sonderzeichen normalisieren (ü→u, &→leer, etc.)

## Technical Requirements

- **Tabellen:**
  - `tenants`: `id uuid PK`, `name text NOT NULL`, `slug text UNIQUE NOT NULL`, `plan text DEFAULT 'trial'`, `created_at timestamptz`
  - `profiles`: `id uuid PK`, `user_id uuid UNIQUE REFERENCES auth.users`, `tenant_id uuid NOT NULL REFERENCES tenants(id)`, `role text NOT NULL CHECK (role IN ('owner','therapist','client'))`, `full_name text`, `created_at timestamptz`
- **RLS:** Aktiviert auf `tenants` und `profiles`; jede künftige Tabelle mit `tenant_id` muss RLS aktivieren
- **Trigger:** `on auth.users INSERT` → erstellt `tenants`-Record + `profiles`-Record atomisch (oder in einer Transaktion)
- **Helper:** DB-Funktion `get_tenant_id()` die `tenant_id` des aktuellen Users aus `profiles` zurückgibt — wird in allen RLS-Policies referenziert
- **Migrations-Konvention:** Alle Änderungen als nummerierte SQL-Migrations (z.B. `supabase/migrations/`)
- **Security:** RLS darf niemals deaktiviert sein; Service-Role-Zugriff (für Admin-Tasks) explizit dokumentieren

## Open Questions

- [ ] Wie wird der Praxisname bei der Registrierung technisch übergeben? (Supabase `user_metadata` beim Signup → lesen in PROJ-2 beim Designen des Auth-Flows)
- [ ] Soll `plan` ein Enum-Typ oder ein freier Text sein? (Enum ist sicherer, aber weniger flexibel für zukünftige Billing-Tiers)

## Decision Log

### Product Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Praxis (nicht einzelner Therapeut) = 1 Tenant | Ermöglicht spätere Multi-Therapeuten-Praxen ohne Datenmigration; passt zu echten Geschäftsabläufen | 2026-05-28 |
| Self-Registration (kein Admin-Provisioning) | 2 Beta-Therapeuten, kein Overhead durch manuellen Setup; skaliert für SaaS-Wachstum | 2026-05-28 |
| `plan`-Feld sofort einbauen | Ermöglicht spätere Billing-Integration (z.B. Stripe) ohne Schema-Änderung; kein Mehraufwand jetzt | 2026-05-28 |
| Praxisname bei Registrierung abfragen | Notwendig für Slug-Generierung; gibt dem Workspace direkt einen klaren Namen | 2026-05-28 |
| `role`-Spalte in `profiles` jetzt (nicht erst PROJ-11) | RLS-Policies benötigen grundlegende Rollenunterscheidung (Therapeut vs. Kunde) von Anfang an | 2026-05-28 |
| Automatischer Slug-Fallback (kein User-Fehler) | Slug ist intern im MVP, kein Nutzer-sichtbarer Identifier; Reibung bei Registrierung vermeiden | 2026-05-28 |
| RLS over Schema-per-Tenant | Schema-per-Tenant erst ab >1.000 Tenants sinnvoll; RLS ist der Supabase-Standard und ausreichend für ~100–200 User | 2026-05-28 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| _To be filled by /architecture_ | | |

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
