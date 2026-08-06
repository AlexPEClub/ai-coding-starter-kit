// PROJ-45 — Fahrer: Tour-Kartenansicht
// Reine Hilfslogik ohne Server-Client-Import, damit sie testbar bleibt.
// Alle Typen für den Kartendaten-Abruf und die Visualisierung.

/**
 * Ein Stopp mit allen Informationen für die Kartendarstellung.
 * Wird vom Backend als Teil von `TourKarteDaten` geliefert.
 */
export interface KartenStopp {
  id: string;
  name: string; // Kundenname
  adresse: string; // "Straße, PLZ Ort"
  breitengrad: number; // geoapify_lat
  laengengrad: number; // geoapify_lon
  status: string; // "geplant", "unterwegs", "angekommen", "problem", "erledigt"
  routeOrder: number; // 1, 2, 3, ... (Position in der berechneten Tour)
  berechneteAnkunftszeit: string; // ISO, z. B. "2026-08-06T09:15:00Z"
}

/**
 * Das Depot (Ausgangspunkt einer Tour).
 * Wird vom Backend als konstante Konfiguration geliefert (z. B. Gudel-Werkzeuge Adresse).
 */
export interface Depot {
  name: string; // Z.B. "Gudel Werkzeuge"
  breitengrad: number;
  laengengrad: number;
}

/**
 * Routenverlauf als Array von Koordinatenpunkten [lat, lon].
 * Beschreibt den tatsächlichen Straßenverlauf von PROJ-42-Berechnung.
 * Wird als GeoJSON-LineString oder einfach als Coordinate-Array persistiert.
 */
export type RoutenGeometrie = Array<[number, number]>; // [[lat, lon], [lat, lon], ...]

/**
 * Gebündelte Kartendaten für eine Tour — ein einziger Abruf vom Backend.
 * Enthält alles, was die Kartenkomponente braucht.
 * Wird von einer neuen Server Action `getTourKarteDaten(fahrerId, tourDatum)`
 * geliefert.
 */
export interface TourKarteDaten {
  depot: Depot;
  stopps: KartenStopp[];
  routenGeometrie: RoutenGeometrie | null; // null, wenn noch keine Berechnung vorliegt
  // Metadaten für optionale Fehlerbehandlung/Logging
  berechnungsDatum: string | null; // ISO, null wenn nicht berechnet
}

/**
 * Result-Typ für den Backend-Abruf (analog zu FahrtenResult).
 */
export type TourKarteDatenResult =
  | { ok: true; data: TourKarteDaten }
  | { ok: false; error: string };
