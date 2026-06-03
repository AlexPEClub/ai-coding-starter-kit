# PROJ-1: Datenmodell, Defaults und Speicher-Layer

**Status:** In Progress
**Created:** 2026-05-10
**Owner:** AI Coding Starter Kit

## User Story
Als Entwickler/Admin moechte ich ein klares, typsicheres Datenmodell fuer Druckverfahren, Drucker, Materialien, Preisformeln und Mengenstaffeln, damit alle Module der App die gleichen Datenstrukturen nutzen und Defaults fuer einen sofort lauffaehigen Zustand bereitstehen.

## Acceptance Criteria
- TypeScript-Typen fuer Process, Printer, Material, FormulaConfig, DiscountTier, Quote, AnalyzedPart liegen in `src/lib/types.ts`.
- Sinnvolle Defaults fuer FDM, SLS, DLP (inkl. typischer Drucker-Bauraeume und Materialien) liegen in `src/lib/defaults.ts`.
- `src/lib/storage.ts` kapselt Lesen/Schreiben aus `localStorage` mit Schema-Versionierung und Fallback auf Defaults.
- Daten werden serverseitig sicher gerendert (kein localStorage waehrend SSR-Hydration).

## Out of Scope
- Supabase-Persistenz (separates Folge-Feature)
- Migration zwischen Schema-Versionen ueber V1 hinaus

## Implementation Notes
- Storage-Layer exportiert `useConfig()` Hook mit reaktivem Status.
- Defaults-Datei enthaelt klar kommentierte realistische Beispielwerte, vom Admin editierbar.
