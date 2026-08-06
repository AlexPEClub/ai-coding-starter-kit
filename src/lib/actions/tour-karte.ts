"use server";

// PROJ-45 — Fahrer: Tour-Kartenansicht
// Server Action für gebündelten Kartendaten-Abruf.
// Implementierung folgt in /backend — hier nur die Schnittstelle.

import type { TourKarteDatenResult } from "./tour-karte-helpers";

/**
 * Lädt alle Kartendaten für eine spezifische Tour eines Fahrers.
 *
 * Backend-Anforderungen (laut PROJ-45 Tech Design):
 * 1. Rollen-Check: nur fahrer/admin, und:
 *    - fahrer darf nur eigene Touren sehen
 *    - admin darf alle Touren sehen
 * 2. Liefert Depot-Koordinaten (aus Konfiguration)
 * 3. Liefert alle Stopps der Tour mit:
 *    - ID, Name, Adresse
 *    - Koordinaten (geoapify_lat/geoapify_lon aus partner_addresses)
 *    - Status, routeOrder, berechneteAnkunftszeit
 * 4. Liefert Routen-Geometrie (Polyline) aus tms.tours.route_geometry
 *    (wird bei PROJ-42-Berechnung persistiert)
 * 5. 10-Sekunden-Timeout: falls Datenbankabfrage länger dauert,
 *    wird ein Timeout-Fehler zurückgegeben (damit Client einen
 *    klaren "Erneut versuchen"-Button zeigen kann)
 * 6. Alles-oder-nichts: Falls irgendein Stopp fehlende Koordinaten
 *    hat, wird ein Fehler zurückgegeben statt Partial-Daten.
 */
export async function getTourKarteDaten(
  fahrerId: string,
  tourDatum: string | null
): Promise<TourKarteDatenResult> {
  // TODO: Backend-Implementierung folgt
  // Für jetzt: Return a placeholder error so frontend can compile
  return {
    ok: false,
    error: "Backend-Implementierung noch nicht abgeschlossen (PROJ-45, /backend)",
  };
}
