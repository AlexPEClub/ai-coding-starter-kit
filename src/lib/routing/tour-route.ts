import type { createAdminClient } from "@/lib/supabase/admin";

// PROJ-42 — Routenberechnung für Touren (Geoapify)
// Gemeinsames Berechnungsmodul: wird sowohl von den drei automatischen
// Auslösern (bearbeiteFahrt, updatePickupTour, createPickupTour) als auch
// vom einmaligen Backfill-Skript genutzt, damit es nur eine einzige Stelle
// mit dieser Logik gibt (kein Drift-Risiko zwischen den Aufrufstellen).

export type AdminClient = ReturnType<typeof createAdminClient>;

const OFFENE_STATUS = ["geplant", "unterwegs", "angekommen", "problem"] as const;
const TAGESSTART_STUNDE = 9; // Feste Start-Uhrzeit 09:00 Uhr (MVP-Annahme, siehe Spec)
const VERWEILZEIT_PRO_STOPP_SEKUNDEN = 15 * 60; // Feste Verweilzeit beim Kunden (MVP-Annahme, siehe Spec)
const GEOAPIFY_ROUTEPLANNER_URL = "https://api.geoapify.com/v1/routeplanner";

export type RouteBerechnungErgebnis =
  | { ok: true; stoppAnzahl: number; distanzMeter: number; dauerSekunden: number }
  | { ok: false; grund: string };

interface Koordinate {
  lat: number;
  lon: number;
}

function leseDepotKoordinaten(): Koordinate | null {
  const lat = Number(process.env.GEOAPIFY_DEPOT_LAT);
  const lon = Number(process.env.GEOAPIFY_DEPOT_LON);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
}

/**
 * Berechnet die Route für eine Tourengruppe (ein Fahrer + ein Datum) neu und
 * schreibt das Ergebnis auf die betroffenen tms.tours-Zeilen zurück.
 *
 * Bei Erfolg werden IMMER alle Zeilen der Gruppe neu geschrieben (überschreibt
 * eine evtl. vorherige Berechnung); bei jedem Fehlschlag wird NICHTS
 * geschrieben und eine vorherige Berechnung bleibt unverändert stehen
 * (kein Teil-/Rateergebnis).
 */
export async function berechneUndSpeichereRoute(
  adminClient: AdminClient,
  fahrerId: string,
  datum: string
): Promise<RouteBerechnungErgebnis> {
  const depot = leseDepotKoordinaten();
  if (!depot) {
    return {
      ok: false,
      grund: "Depot-Koordinaten sind nicht konfiguriert (GEOAPIFY_DEPOT_LAT/GEOAPIFY_DEPOT_LON).",
    };
  }

  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) {
    return { ok: false, grund: "GEOAPIFY_API_KEY ist nicht konfiguriert." };
  }

  const { data: stopps, error: ladeFehler } = await adminClient
    .from("tours")
    .select("id, partner_id")
    .eq("fahrer_id", fahrerId)
    .eq("geplantes_abholdatum", datum)
    .in("status", OFFENE_STATUS);

  if (ladeFehler) {
    console.error("berechneUndSpeichereRoute (Stopps laden) error:", ladeFehler);
    return { ok: false, grund: "Stopps konnten nicht geladen werden." };
  }

  if (!stopps || stopps.length === 0) {
    // Gruppe existiert nicht (mehr) — z. B. weil der einzige Stopp gerade
    // in eine andere Gruppe verschoben wurde. Kein Fehler, nichts zu tun.
    return { ok: true, stoppAnzahl: 0, distanzMeter: 0, dauerSekunden: 0 };
  }

  const partnerIds = Array.from(
    new Set(stopps.map((s: { partner_id: string }) => s.partner_id).filter(Boolean))
  );

  const { data: adressen, error: adressFehler } = await adminClient
    .from("partner_addresses")
    .select("partner_id, geoapify_lat, geoapify_lon")
    .in("partner_id", partnerIds)
    .eq("address_type", "shipping");

  if (adressFehler) {
    console.error("berechneUndSpeichereRoute (Adressen laden) error:", adressFehler);
    return { ok: false, grund: "Kundenadressen konnten nicht geladen werden." };
  }

  const koordinatenNachPartner = new Map<string, Koordinate>();
  for (const row of (adressen ?? []) as {
    partner_id: string;
    geoapify_lat: number | null;
    geoapify_lon: number | null;
  }[]) {
    if (typeof row.geoapify_lat === "number" && typeof row.geoapify_lon === "number") {
      koordinatenNachPartner.set(row.partner_id, { lat: row.geoapify_lat, lon: row.geoapify_lon });
    }
  }

  const stoppListe = stopps as { id: string; partner_id: string }[];
  const stoppMitKoordinaten = stoppListe.map((stopp) => ({
    id: stopp.id,
    koordinate: koordinatenNachPartner.get(stopp.partner_id) ?? null,
  }));

  // Alles-oder-nichts: fehlt bei EINEM Stopp eine gültige Koordinate, wird
  // für die ganze Tour nichts berechnet/gespeichert — keine Teil-Reihenfolge.
  const ungueltigerStopp = stoppMitKoordinaten.find((s) => !s.koordinate);
  if (ungueltigerStopp) {
    return {
      ok: false,
      grund: `Ungültige oder fehlende Adress-Koordinaten bei Stopp ${ungueltigerStopp.id}.`,
    };
  }

  const validierteStopps = stoppMitKoordinaten as { id: string; koordinate: Koordinate }[];

  let antwort: GeoapifyRoutePlannerAntwort;
  try {
    antwort = await rufeGeoapifyRoutePlanner(depot, validierteStopps, apiKey);
  } catch (fehler) {
    console.error("berechneUndSpeichereRoute (Geoapify) error:", fehler);
    const grund = fehler instanceof Error ? fehler.message : "Unbekannter Fehler bei Geoapify.";
    return { ok: false, grund: `Geoapify Route Planner nicht erreichbar oder fehlerhaft: ${grund}` };
  }

  const berechnetAm = new Date().toISOString();
  const schreibFehler: string[] = [];

  await Promise.all(
    validierteStopps.map(async (stopp) => {
      const { error } = await adminClient
        .from("tours")
        .update({
          route_order: antwort.reihenfolge.get(stopp.id) ?? null,
          route_calculated_at: berechnetAm,
          route_distance_meters: antwort.gesamtDistanzMeter,
          route_duration_seconds: antwort.gesamtDauerSekunden,
          berechnete_ankunftszeit: antwort.ankunftszeiten.get(stopp.id) ?? null,
          leg_distance_meters: antwort.etappenDistanzMeter.get(stopp.id) ?? null, // PROJ-44
          leg_duration_seconds: antwort.etappenDauerSekunden.get(stopp.id) ?? null, // PROJ-44
        })
        .eq("id", stopp.id);

      if (error) schreibFehler.push(stopp.id);
    })
  );

  if (schreibFehler.length > 0) {
    console.error(
      "berechneUndSpeichereRoute (Schreiben) fehlgeschlagen für Stopps:",
      schreibFehler
    );
    return { ok: false, grund: "Ergebnis konnte nicht vollständig gespeichert werden." };
  }

  return {
    ok: true,
    stoppAnzahl: validierteStopps.length,
    distanzMeter: antwort.gesamtDistanzMeter,
    dauerSekunden: antwort.gesamtDauerSekunden,
  };
}

interface GeoapifyRoutePlannerAntwort {
  reihenfolge: Map<string, number>;
  ankunftszeiten: Map<string, string>;
  gesamtDistanzMeter: number;
  gesamtDauerSekunden: number;
  etappenDistanzMeter: Map<string, number>; // PROJ-44
  etappenDauerSekunden: Map<string, number>; // PROJ-44
}

/**
 * Bestimmt den UTC-Offset (in Minuten) einer Zeitzone für einen gegebenen
 * Zeitpunkt. DST-sicher (liefert im Sommer +120, im Winter +60 für
 * Europe/Berlin), im Gegensatz zu einem hartkodierten Offset.
 */
function ermittleZeitzonenOffsetMinuten(zeitpunkt: Date, zeitzone: string): number {
  const teile = new Intl.DateTimeFormat("en-US", {
    timeZone: zeitzone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
    .formatToParts(zeitpunkt)
    .reduce((akkumulator, teil) => {
      akkumulator[teil.type] = teil.value;
      return akkumulator;
    }, {} as Record<string, string>);

  const alsUtcInterpretiert = Date.UTC(
    Number(teile.year),
    Number(teile.month) - 1,
    Number(teile.day),
    Number(teile.hour),
    Number(teile.minute),
    Number(teile.second)
  );

  return (alsUtcInterpretiert - zeitpunkt.getTime()) / 60_000;
}

/**
 * Liefert den heutigen Tagesstart (TAGESSTART_STUNDE Uhr Europe/Berlin) als
 * korrekten UTC-Zeitpunkt. Vermeidet den Bug von `new Date().setHours(...)`,
 * das in der lokalen Zeitzone des Node-Prozesses rechnet — der Server läuft
 * in Etc/UTC, wodurch 09:00 Uhr sonst faktisch 09:00 UTC (= 11:00 Uhr
 * Europe/Berlin im Sommer) statt der gewünschten 09:00 Uhr Berlin ergäbe.
 */
function ermittleTagesstartUtc(): Date {
  const jetzt = new Date();
  const heuteBerlin = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(
    jetzt
  );
  const [jahr, monat, tag] = heuteBerlin.split("-").map(Number);

  const naiverUtcZeitpunkt = new Date(Date.UTC(jahr, monat - 1, tag, TAGESSTART_STUNDE, 0, 0));
  const offsetMinuten = ermittleZeitzonenOffsetMinuten(naiverUtcZeitpunkt, "Europe/Berlin");

  return new Date(naiverUtcZeitpunkt.getTime() - offsetMinuten * 60_000);
}

/**
 * Ruft Geoapifys Route-Planner-API mit dem festen Depot als Start und den
 * validierten Stopp-Koordinaten als Wegpunkten auf. Ein Fahrzeug, kein
 * Rückweg zum Depot (kein `end_location` gesetzt), Modus "drive". Jeder Job
 * trägt eine feste Verweilzeit (`duration`), die Geoapify automatisch in
 * `waypoint.start_time` der nachfolgenden Stopps einrechnet.
 *
 * Feldnamen anhand eines echten Testaufrufs verifiziert (2026-08-03): jeder
 * Wegpunkt (`properties.waypoints[]`) trägt `start_time` direkt, aber die
 * Job-Zuordnung liegt NICHT direkt auf dem Wegpunkt, sondern eine Ebene
 * tiefer in `waypoint.actions[]` (Einträge mit `type: "job"` tragen
 * `job_id`) — der Depot-Wegpunkt hat stattdessen eine Aktion `type: "start"`
 * ohne `job_id` und wird dadurch automatisch übersprungen.
 */
async function rufeGeoapifyRoutePlanner(
  depot: Koordinate,
  stopps: { id: string; koordinate: Koordinate }[],
  apiKey: string
): Promise<GeoapifyRoutePlannerAntwort> {
  const body = {
    mode: "drive",
    agents: [
      {
        start_location: [depot.lon, depot.lat],
        time_windows: [[0, 12 * 60 * 60]],
      },
    ],
    jobs: stopps.map((stopp) => ({
      id: stopp.id,
      location: [stopp.koordinate.lon, stopp.koordinate.lat],
      duration: VERWEILZEIT_PRO_STOPP_SEKUNDEN,
    })),
  };

  const response = await fetch(`${GEOAPIFY_ROUTEPLANNER_URL}?apiKey=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Geoapify antwortete mit Status ${response.status}`);
  }

  const json = await response.json();
  const agentFeature = json?.features?.[0];
  const waypoints = agentFeature?.properties?.waypoints;

  if (!Array.isArray(waypoints) || waypoints.length === 0) {
    throw new Error("Geoapify lieferte keine gültige Wegpunkt-Reihenfolge.");
  }

  const start = ermittleTagesstartUtc();

  const reihenfolge = new Map<string, number>();
  const ankunftszeiten = new Map<string, string>();
  const etappenDistanzMeter = new Map<string, number>(); // PROJ-44
  const etappenDauerSekunden = new Map<string, number>(); // PROJ-44

  let position = 1;
  for (const waypoint of waypoints) {
    const jobAction = Array.isArray(waypoint.actions)
      ? waypoint.actions.find((a: { type?: string; job_id?: string }) => a.type === "job")
      : undefined;
    const jobId: string | undefined = jobAction?.job_id;
    if (!jobId) continue; // Depot-/Start-Wegpunkt (actions[].type "start") ohne Job-Bezug überspringen

    reihenfolge.set(jobId, position);
    const ankunftSekunden: number = waypoint.start_time ?? 0;
    ankunftszeiten.set(jobId, new Date(start.getTime() + ankunftSekunden * 1000).toISOString());

    // PROJ-44: Etappen-Distanz und Fahrzeit pro Stoppp (vom vorherigen Stoppp)
    const etappenDistanz: number = Math.round(waypoint.distance ?? 0);
    const etappenDauer: number = Math.round(waypoint.time ?? 0);
    etappenDistanzMeter.set(jobId, etappenDistanz);
    etappenDauerSekunden.set(jobId, etappenDauer);

    position += 1;
  }

  // Sicherheitsnetz gegen Feldnamen-Mismatch: lieber klar fehlschlagen als
  // ein unvollständiges/falsch zugeordnetes Ergebnis speichern.
  if (reihenfolge.size !== stopps.length) {
    throw new Error("Nicht alle Stopps konnten der Geoapify-Antwort zugeordnet werden.");
  }

  return {
    reihenfolge,
    ankunftszeiten,
    gesamtDistanzMeter: agentFeature?.properties?.distance ?? 0,
    gesamtDauerSekunden: agentFeature?.properties?.time ?? 0,
    etappenDistanzMeter, // PROJ-44
    etappenDauerSekunden, // PROJ-44
  };
}

export interface Tourengruppe {
  fahrerId: string | null;
  datum: string | null;
}

// QA-Fund BUG-2 (PROJ-42, Low): schnelles wiederholtes Ändern von Fahrer/Datum
// an derselben Fahrt löste bisher jedes Mal einen neuen (kostenpflichtigen)
// Geoapify-Aufruf aus. Einfacher In-Memory-Cooldown pro Tourengruppe
// verhindert das — bewusst simpel gehalten (kein Redis/DB nötig), da der
// Next.js-Server als einzelner, dauerhaft laufender Docker-Container betrieben
// wird (kein Serverless/Multi-Instanz-Betrieb, siehe docker-compose.yml).
// Betrifft nur die ereignisbasierten Trigger — das Backfill-Skript ruft
// berechneUndSpeichereRoute() bewusst direkt auf, ohne Cooldown.
const NEUBERECHNUNG_COOLDOWN_MS = 30_000;
const letzteAusloesung = new Map<string, number>();

/**
 * Löst die Neuberechnung für eine oder mehrere Tourengruppen aus (z. B. alte
 * + neue Gruppe bei einer Fahrer/Datum-Änderung). Ein Fehlschlag wird hier
 * NUR protokolliert, nie geworfen — der Aufrufer (eine Fahrt-Speicherung)
 * darf davon unter keinen Umständen beeinträchtigt werden. Pro Tourengruppe
 * gilt zusätzlich ein kurzer Cooldown (siehe BUG-2), um Geoapify-Kosten bei
 * schnellem wiederholtem Ändern zu begrenzen.
 */
export async function loeseNeuberechnungAus(
  adminClient: AdminClient,
  gruppen: Tourengruppe[]
): Promise<void> {
  const eindeutigeGruppen = new Map<string, { fahrerId: string; datum: string }>();
  for (const gruppe of gruppen) {
    if (!gruppe.fahrerId || !gruppe.datum) continue;
    eindeutigeGruppen.set(`${gruppe.fahrerId}|${gruppe.datum}`, {
      fahrerId: gruppe.fahrerId,
      datum: gruppe.datum,
    });
  }

  await Promise.all(
    Array.from(eindeutigeGruppen.entries()).map(async ([schluessel, { fahrerId, datum }]) => {
      const zuletztAusgeloest = letzteAusloesung.get(schluessel);
      if (zuletztAusgeloest !== undefined && Date.now() - zuletztAusgeloest < NEUBERECHNUNG_COOLDOWN_MS) {
        console.warn(
          `Routenberechnung übersprungen für Fahrer ${fahrerId} / ${datum}: Cooldown aktiv (zuletzt vor ${Math.round(
            (Date.now() - zuletztAusgeloest) / 1000
          )}s ausgelöst).`
        );
        return;
      }
      letzteAusloesung.set(schluessel, Date.now());

      try {
        const ergebnis = await berechneUndSpeichereRoute(adminClient, fahrerId, datum);
        if (!ergebnis.ok) {
          console.warn(
            `Routenberechnung übersprungen für Fahrer ${fahrerId} / ${datum}: ${ergebnis.grund}`
          );
        }
      } catch (fehler) {
        console.error(
          `Routenberechnung fehlgeschlagen für Fahrer ${fahrerId} / ${datum}:`,
          fehler
        );
      }
    })
  );
}
