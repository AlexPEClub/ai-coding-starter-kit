"use server";

// PROJ-45 — Fahrer: Tour-Kartenansicht
// Server Action für gebündelten Kartendaten-Abruf.

import { getCurrentProfile } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  berechneUndSpeichereRoute,
  leseDepotKoordinaten,
  type RoutenGeometrie,
} from "@/lib/routing/tour-route";
import type { TourKarteDatenResult } from "./tour-karte-helpers";
import type { KartenStopp, Depot, TourKarteDaten } from "./tour-karte-helpers";

const GELAD_STATUS = ["geplant", "unterwegs", "angekommen", "problem", "erledigt"] as const;

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
  // 1. Rollen-Check: fahrer oder admin erforderlich
  const profile = await getCurrentProfile();
  if (!profile) {
    return { ok: false, error: "Nicht eingeloggt." };
  }
  if (!profile.roles?.some((r) => r === "fahrer" || r === "admin")) {
    return { ok: false, error: "Keine Berechtigung." };
  }

  // Ownership-Check: fahrer darf nur eigene Touren sehen (PROJ-42 BUG-1 Vermeidung)
  const istFahrer = profile.roles.some((r) => r === "fahrer");
  const istAdmin = profile.roles.some((r) => r === "admin");

  if (istFahrer && !istAdmin && fahrerId !== profile.id) {
    return { ok: false, error: "Keine Berechtigung." };
  }

  // 2. tourDatum darf nicht null sein
  if (tourDatum === null) {
    return { ok: false, error: "Tour ohne Datum kann nicht auf der Karte angezeigt werden." };
  }

  // 3. Deduplication: Falls bereits ein Request für diese Tour läuft, warten statt Duplicate
  const dedupeKey = `${fahrerId}|${tourDatum}`;
  if (inFlightRequests.has(dedupeKey)) {
    return await inFlightRequests.get(dedupeKey)!;
  }

  // 4. Wrap alles in 10s Timeout + Deduplication
  const promise = getTourKarteDatenImpl(fahrerId, tourDatum);
  inFlightRequests.set(dedupeKey, promise);

  const result = await Promise.race([
    promise,
    new Promise<TourKarteDatenResult>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 10000)
    ),
  ]).catch((err) => {
    if (err?.message === "timeout") {
      return {
        ok: false,
        error: "Zeitüberschreitung beim Laden der Kartendaten.",
      } as TourKarteDatenResult;
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Fehler beim Laden der Kartendaten.",
    } as TourKarteDatenResult;
  });

  inFlightRequests.delete(dedupeKey);
  return result;
}

/**
 * Module-level Map für Deduplication von In-Flight-Requests.
 * Verhindert parallele Berechnungen für dieselbe Tour.
 */
const inFlightRequests = new Map<string, Promise<TourKarteDatenResult>>();

/**
 * Eigentliche Implementierung (nach Deduplication + Timeout-Wrapping).
 */
async function getTourKarteDatenImpl(
  fahrerId: string,
  tourDatum: string
): Promise<TourKarteDatenResult> {
  const adminClient = createAdminClient({ schema: "tms" });

  // Lade die Stopps der Tour
  const { data: stopps, error: stoppsFehler } = await adminClient
    .from("tours")
    .select("id, status, partner_id, route_order, berechnete_ankunftszeit, route_geometry, route_calculated_at")
    .eq("fahrer_id", fahrerId)
    .eq("geplantes_abholdatum", tourDatum)
    .in("status", GELAD_STATUS);

  if (stoppsFehler) {
    console.error("getTourKarteDaten (Stopps laden) error:", stoppsFehler);
    return { ok: false, error: "Stopps konnten nicht geladen werden." };
  }

  if (!stopps || stopps.length === 0) {
    return { ok: false, error: "Keine Tour gefunden." };
  }

  // Prüfe, ob eine aktuelle Berechnung existiert (alle offenen Stopps haben
  // route_order + route_geometry + gleicher route_calculated_at).
  // Bugfix (Refine 2026-08-08): route_geometry wurde hier bisher NICHT
  // geprüft — Touren, die vor der Migration 20260806120000 (Einführung der
  // route_geometry-Spalte) berechnet wurden, galten trotz fehlender
  // Geometrie als "gültig" und wurden nie neu berechnet, wodurch die
  // Routenlinie auf der Karte für immer fehlte. Ohne separates
  // Backfill-Skript: der nächste Kartenaufruf für eine betroffene Tour löst
  // jetzt automatisch die Neuberechnung aus.
  const finaleStatus = ["erledigt", "abgeschlossen", "archiviert"];
  const offeneStopps = stopps.filter((s: any) => !finaleStatus.includes(s.status));

  const berechnungGueltig =
    offeneStopps.length > 0 &&
    offeneStopps.every(
      (s: any) =>
        s.route_order !== null && s.route_calculated_at !== null && s.route_geometry !== null
    ) &&
    new Set(offeneStopps.map((s: any) => s.route_calculated_at)).size === 1;

  // Falls keine gültige Berechnung existiert, löse synchrone Neuberechnung aus
  if (!berechnungGueltig) {
    const berechnungsErgebnis = await berechneUndSpeichereRoute(adminClient, fahrerId, tourDatum);
    if (!berechnungsErgebnis.ok) {
      return { ok: false, error: berechnungsErgebnis.grund };
    }

    // Neu-Laden der Stopps nach Berechnung
    const { data: stopppsNeu, error: fehlerNeu } = await adminClient
      .from("tours")
      .select("id, status, partner_id, route_order, berechnete_ankunftszeit, route_geometry, route_calculated_at")
      .eq("fahrer_id", fahrerId)
      .eq("geplantes_abholdatum", tourDatum)
      .in("status", GELAD_STATUS);

    if (fehlerNeu || !stopppsNeu || stopppsNeu.length === 0) {
      return { ok: false, error: "Stopps nach Berechnung nicht auffindbar." };
    }
    stopps.splice(0, stopps.length, ...stopppsNeu);
  }

  // Lade Partner-Daten (Name + Koordinaten)
  const partnerIds = Array.from(
    new Set(
      stopps
        .map((s: any) => s.partner_id)
        .filter((id: string | null) => id !== null)
    )
  );

  const { data: partners, error: partnersFehler } = await adminClient
    .from("partners")
    .select("id, display_name, company_name")
    .in("id", partnerIds);

  if (partnersFehler) {
    console.error("getTourKarteDaten (Partner laden) error:", partnersFehler);
    return { ok: false, error: "Partnerdaten konnten nicht geladen werden." };
  }

  const partnerMap = new Map<string, { display_name: string | null; company_name: string | null }>();
  for (const p of partners ?? []) {
    partnerMap.set(p.id, { display_name: p.display_name, company_name: p.company_name });
  }

  // Lade Adressen (shipping) mit Koordinaten
  const { data: adressen, error: adressenFehler } = await adminClient
    .from("partner_addresses")
    .select("partner_id, street, postal_code, city, geoapify_lat, geoapify_lon")
    .in("partner_id", partnerIds)
    .eq("address_type", "shipping");

  if (adressenFehler) {
    console.error("getTourKarteDaten (Adressen laden) error:", adressenFehler);
    return { ok: false, error: "Kundenadressen konnten nicht geladen werden." };
  }

  const adressenMap = new Map<
    string,
    { strasse: string | null; plz: string | null; ort: string | null; lat: number | null; lon: number | null }
  >();
  for (const a of adressen ?? []) {
    adressenMap.set(a.partner_id, {
      strasse: a.street ?? null,
      plz: a.postal_code ?? null,
      ort: a.city ?? null,
      lat: a.geoapify_lat ?? null,
      lon: a.geoapify_lon ?? null,
    });
  }

  // All-or-Nothing: alle Stopps müssen gültige Koordinaten haben
  for (const stopp of stopps) {
    const addr = adressenMap.get(stopp.partner_id);
    if (!addr || addr.lat === null || addr.lon === null) {
      return { ok: false, error: `Fehlende Adress-Koordinaten für Stopp ${stopp.id}.` };
    }
  }

  // Depot bauen
  const depotKoord = leseDepotKoordinaten();
  if (!depotKoord) {
    return { ok: false, error: "Depot-Koordinaten sind nicht konfiguriert." };
  }
  const depot: Depot = {
    name: "Gudel Werkzeuge",
    breitengrad: depotKoord.lat,
    laengengrad: depotKoord.lon,
  };

  // Stopps in KartenStopp-Format umwandeln, sortiert nach routeOrder
  const kartenStopps: KartenStopp[] = stopps
    .map((stopp: any) => {
      const partner = partnerMap.get(stopp.partner_id);
      const adresse = adressenMap.get(stopp.partner_id);

      const kundenname = partner?.display_name || partner?.company_name || "Unbekannt";
      const adresseFormatiert = adresse
        ? `${adresse.strasse || ""}, ${adresse.plz || ""} ${adresse.ort || ""}`.replace(/,\s*$/, "")
        : "";

      return {
        id: stopp.id,
        name: kundenname,
        adresse: adresseFormatiert,
        breitengrad: adresse!.lat!,
        laengengrad: adresse!.lon!,
        status: stopp.status,
        routeOrder: stopp.route_order,
        berechneteAnkunftszeit: stopp.berechnete_ankunftszeit,
      };
    })
    .sort((a, b) => (a.routeOrder ?? 999) - (b.routeOrder ?? 999));

  // Routen-Geometrie (identisch für alle Stopps einer Gruppe, kann null sein)
  let routenGeometrie: RoutenGeometrie | null = null;
  let berechnungsDatum: string | null = null;

  if (stopps.length > 0) {
    const firstStopp = stopps[0];
    if (firstStopp.route_geometry) {
      routenGeometrie = firstStopp.route_geometry as RoutenGeometrie;
    }
    berechnungsDatum = firstStopp.route_calculated_at;
  }

  const data: TourKarteDaten = {
    depot,
    stopps: kartenStopps,
    routenGeometrie,
    berechnungsDatum,
  };

  return { ok: true, data };
}
