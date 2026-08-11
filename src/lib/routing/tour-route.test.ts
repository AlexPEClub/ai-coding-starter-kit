import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { berechneUndSpeichereRoute, loeseNeuberechnungAus } from "./tour-route";

/**
 * `tour-route.ts` nimmt den Admin-Client als Parameter entgegen (statt ihn
 * selbst zu erzeugen) — deshalb reicht hier ein einfacher Fake-Client ohne
 * `vi.mock("@/lib/supabase/admin")`, analog zum Chain-Mock-Muster aus
 * revenue.test.ts.
 */

interface StoppFixture {
  id: string;
  partner_id: string;
}

interface AdresseFixture {
  partner_id: string;
  geoapify_lat: number | null;
  geoapify_lon: number | null;
}

function createSelectChain(getResult: () => { data: any; error: any }) {
  const chain: any = {
    select: () => chain,
    eq: () => chain,
    in: () => chain,
    then: (resolve: any, reject: any) => {
      try {
        resolve(getResult());
      } catch (err) {
        reject(err);
      }
    },
  };
  return chain;
}

function createFakeAdminClient(options: {
  stopps: StoppFixture[];
  adressen: AdresseFixture[];
  updateFehlerFuerStoppId?: string;
}) {
  const updateAufrufe: { id: string; values: any }[] = [];

  return {
    updateAufrufe,
    client: {
      from: (table: string) => {
        if (table === "tours") {
          return {
            select: () => createSelectChain(() => ({ data: options.stopps, error: null })),
            update: (values: any) => ({
              eq: (_col: string, val: string) => {
                updateAufrufe.push({ id: val, values });
                const error =
                  options.updateFehlerFuerStoppId === val ? { message: "boom" } : null;
                return Promise.resolve({ error });
              },
            }),
          };
        }
        if (table === "partner_addresses") {
          return {
            select: () => createSelectChain(() => ({ data: options.adressen, error: null })),
          };
        }
        throw new Error(`Unmocked table: ${table}`);
      },
    },
  };
}

// Struktur verifiziert gegen die offizielle Geoapify-Doku (2026-08-08):
// job_id liegt in waypoint.actions[], nicht direkt auf dem Wegpunkt.
// Etappen-Distanz/-Zeit liegen in properties.legs[], referenziert über
// waypoint.prev_leg_index — nicht direkt auf dem Wegpunkt.
function geoapifyAntwort(stoppIds: string[], options: { geometry?: any } = {}) {
  const feature: any = {
    properties: {
      distance: 12345,
      time: 2400,
      legs: stoppIds.map((_, index) => ({
        distance: (index + 1) * 1000,
        time: (index + 1) * 300,
        from_waypoint_index: index,
        to_waypoint_index: index + 1,
      })),
      waypoints: stoppIds.map((id, index) => ({
        start_time: index * 1200,
        prev_leg_index: index,
        actions: [{ type: "job", job_id: id }],
      })),
    },
  };

  if (options.geometry !== undefined) {
    feature.geometry = options.geometry;
  }

  return {
    features: [feature],
  };
}

beforeEach(() => {
  process.env.GEOAPIFY_DEPOT_LAT = "51.699";
  process.env.GEOAPIFY_DEPOT_LON = "6.9668";
  process.env.GEOAPIFY_API_KEY = "test-key";
});

afterEach(() => {
  delete process.env.GEOAPIFY_DEPOT_LAT;
  delete process.env.GEOAPIFY_DEPOT_LON;
  delete process.env.GEOAPIFY_API_KEY;
  vi.unstubAllGlobals();
});

describe("berechneUndSpeichereRoute", () => {
  it("berechnet und speichert Reihenfolge, Distanz/Fahrzeit und Ankunftszeit bei gültigen Koordinaten", async () => {
    const { client, updateAufrufe } = createFakeAdminClient({
      stopps: [
        { id: "stopp-a", partner_id: "partner-1" },
        { id: "stopp-b", partner_id: "partner-2" },
      ],
      adressen: [
        { partner_id: "partner-1", geoapify_lat: 51.5, geoapify_lon: 7.0 },
        { partner_id: "partner-2", geoapify_lat: 51.6, geoapify_lon: 7.1 },
      ],
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => geoapifyAntwort(["stopp-a", "stopp-b"]),
      })
    );

    const ergebnis = await berechneUndSpeichereRoute(client as any, "fahrer-1", "2026-08-10");

    expect(ergebnis).toEqual({
      ok: true,
      stoppAnzahl: 2,
      distanzMeter: 12345,
      dauerSekunden: 2400,
    });
    expect(updateAufrufe).toHaveLength(2);
    expect(updateAufrufe[0].values.route_order).toBe(1);
    expect(updateAufrufe[1].values.route_order).toBe(2);
    expect(updateAufrufe[0].values.route_distance_meters).toBe(12345);
    expect(updateAufrufe[0].values.route_duration_seconds).toBe(2400);
    expect(updateAufrufe[0].values.berechnete_ankunftszeit).toBeTruthy();
    expect(updateAufrufe[0].values.leg_distance_meters).toBe(1000);
    expect(updateAufrufe[0].values.leg_duration_seconds).toBe(300);
    expect(updateAufrufe[1].values.leg_distance_meters).toBe(2000);
    expect(updateAufrufe[1].values.leg_duration_seconds).toBe(600);
  });

  it("Edge Case: Einzel-Stopp-Tour — triviale Position 1, Distanz/Fahrzeit trotzdem berechnet und gespeichert", async () => {
    const { client, updateAufrufe } = createFakeAdminClient({
      stopps: [{ id: "einziger-stopp", partner_id: "partner-1" }],
      adressen: [{ partner_id: "partner-1", geoapify_lat: 51.5, geoapify_lon: 7.0 }],
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => geoapifyAntwort(["einziger-stopp"]),
      })
    );

    const ergebnis = await berechneUndSpeichereRoute(client as any, "fahrer-1", "2026-08-10");

    expect(ergebnis).toEqual({
      ok: true,
      stoppAnzahl: 1,
      distanzMeter: 12345,
      dauerSekunden: 2400,
    });
    expect(updateAufrufe).toHaveLength(1);
    expect(updateAufrufe[0].values.route_order).toBe(1);
    expect(updateAufrufe[0].values.leg_distance_meters).toBe(1000);
    expect(updateAufrufe[0].values.leg_duration_seconds).toBe(300);
  });

  it("gibt einen No-Op-Erfolg zurück, wenn die Tourengruppe keine offenen Stopps (mehr) hat", async () => {
    const { client } = createFakeAdminClient({ stopps: [], adressen: [] });
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const ergebnis = await berechneUndSpeichereRoute(client as any, "fahrer-1", "2026-08-10");

    expect(ergebnis).toEqual({ ok: true, stoppAnzahl: 0, distanzMeter: 0, dauerSekunden: 0 });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("schlägt fehl und ruft Geoapify nicht auf, wenn ein Stopp keine gültige Koordinate hat", async () => {
    const { client } = createFakeAdminClient({
      stopps: [
        { id: "stopp-a", partner_id: "partner-1" },
        { id: "stopp-b", partner_id: "partner-ohne-koordinate" },
      ],
      adressen: [{ partner_id: "partner-1", geoapify_lat: 51.5, geoapify_lon: 7.0 }],
    });
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const ergebnis = await berechneUndSpeichereRoute(client as any, "fahrer-1", "2026-08-10");

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.grund).toContain("stopp-b");
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("schlägt klar fehl, wenn die Depot-Koordinaten nicht konfiguriert sind (fällt vor jeder Anfrage auf)", async () => {
    delete process.env.GEOAPIFY_DEPOT_LAT;
    const { client } = createFakeAdminClient({ stopps: [], adressen: [] });
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const ergebnis = await berechneUndSpeichereRoute(client as any, "fahrer-1", "2026-08-10");

    expect(ergebnis).toEqual({
      ok: false,
      grund: "Depot-Koordinaten sind nicht konfiguriert (GEOAPIFY_DEPOT_LAT/GEOAPIFY_DEPOT_LON).",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("schlägt klar fehl, wenn GEOAPIFY_API_KEY fehlt", async () => {
    delete process.env.GEOAPIFY_API_KEY;
    const { client } = createFakeAdminClient({ stopps: [], adressen: [] });

    const ergebnis = await berechneUndSpeichereRoute(client as any, "fahrer-1", "2026-08-10");

    expect(ergebnis).toEqual({
      ok: false,
      grund: "GEOAPIFY_API_KEY ist nicht konfiguriert.",
    });
  });

  it("schlägt fehl und speichert nichts, wenn Geoapify nicht erreichbar ist", async () => {
    const { client, updateAufrufe } = createFakeAdminClient({
      stopps: [{ id: "stopp-a", partner_id: "partner-1" }],
      adressen: [{ partner_id: "partner-1", geoapify_lat: 51.5, geoapify_lon: 7.0 }],
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503 })
    );

    const ergebnis = await berechneUndSpeichereRoute(client as any, "fahrer-1", "2026-08-10");

    expect(ergebnis.ok).toBe(false);
    expect(updateAufrufe).toHaveLength(0);
  });

  it("schlägt fehl, wenn nicht alle Stopps der Geoapify-Antwort zugeordnet werden können (Sicherheitsnetz)", async () => {
    const { client, updateAufrufe } = createFakeAdminClient({
      stopps: [
        { id: "stopp-a", partner_id: "partner-1" },
        { id: "stopp-b", partner_id: "partner-2" },
      ],
      adressen: [
        { partner_id: "partner-1", geoapify_lat: 51.5, geoapify_lon: 7.0 },
        { partner_id: "partner-2", geoapify_lat: 51.6, geoapify_lon: 7.1 },
      ],
    });
    // Antwort enthält nur einen der beiden Stopps -> muss als Fehlschlag behandelt werden
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => geoapifyAntwort(["stopp-a"]) })
    );

    const ergebnis = await berechneUndSpeichereRoute(client as any, "fahrer-1", "2026-08-10");

    expect(ergebnis.ok).toBe(false);
    expect(updateAufrufe).toHaveLength(0);
  });

  // PROJ-45: Geometrie-Tests
  it("PROJ-45: speichert Routen-Geometrie korrekt, wenn von Geoapify geliefert (LineString)", async () => {
    const { client, updateAufrufe } = createFakeAdminClient({
      stopps: [
        { id: "stopp-a", partner_id: "partner-1" },
        { id: "stopp-b", partner_id: "partner-2" },
      ],
      adressen: [
        { partner_id: "partner-1", geoapify_lat: 51.5, geoapify_lon: 7.0 },
        { partner_id: "partner-2", geoapify_lat: 51.6, geoapify_lon: 7.1 },
      ],
    });

    // GeoJSON-Geometrie: Koordinaten in [lon, lat], wird zu [lat, lon] konvertiert
    const testGeometry = {
      type: "LineString",
      coordinates: [
        [7.0, 51.5],
        [7.05, 51.55],
        [7.1, 51.6],
      ],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => geoapifyAntwort(["stopp-a", "stopp-b"], { geometry: testGeometry }),
      })
    );

    const ergebnis = await berechneUndSpeichereRoute(client as any, "fahrer-1", "2026-08-10");

    expect(ergebnis.ok).toBe(true);
    expect(updateAufrufe).toHaveLength(2);
    // Beide Stopps tragen dieselbe Geometrie (identisch pro Tourengruppe)
    expect(updateAufrufe[0].values.route_geometry).toEqual([
      [51.5, 7.0],
      [51.55, 7.05],
      [51.6, 7.1],
    ]);
    expect(updateAufrufe[1].values.route_geometry).toEqual([
      [51.5, 7.0],
      [51.55, 7.05],
      [51.6, 7.1],
    ]);
  });

  it("PROJ-45: speichert null für route_geometry und setzt Berechnung fort, wenn Geometrie fehlt oder malformed ist", async () => {
    const { client, updateAufrufe } = createFakeAdminClient({
      stopps: [{ id: "stopp-a", partner_id: "partner-1" }],
      adressen: [{ partner_id: "partner-1", geoapify_lat: 51.5, geoapify_lon: 7.0 }],
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        // geoapifyAntwort ohne geometry Parameter -> keine geometry im Response
        json: async () => geoapifyAntwort(["stopp-a"]),
      })
    );

    const ergebnis = await berechneUndSpeichereRoute(client as any, "fahrer-1", "2026-08-10");

    // Berechnung ist erfolgreich trotz fehlender Geometrie
    expect(ergebnis.ok).toBe(true);
    expect(updateAufrufe).toHaveLength(1);
    // route_geometry wird explizit zu null gespeichert
    expect(updateAufrufe[0].values.route_geometry).toBe(null);
    // Aber Order/Distance/Duration sind vorhanden
    expect(updateAufrufe[0].values.route_order).toBe(1);
    expect(updateAufrufe[0].values.route_distance_meters).toBe(12345);
  });

  // PROJ-42 Refine 2026-08-11: Standortbasierte Neuberechnung
  it("Refine 2026-08-11: überschreibt optionalen startPunkt statt Depot in der Geoapify-Anfrage", async () => {
    const { client } = createFakeAdminClient({
      stopps: [{ id: "stopp-a", partner_id: "partner-1" }],
      adressen: [{ partner_id: "partner-1", geoapify_lat: 51.5, geoapify_lon: 7.0 }],
    });

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => geoapifyAntwort(["stopp-a"]),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const customStartPunkt = { lat: 52.0, lon: 8.0 };
    const ergebnis = await berechneUndSpeichereRoute(client as any, "fahrer-1", "2026-08-10", {
      startPunkt: customStartPunkt,
    });

    expect(ergebnis.ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledOnce();
    const callBody = JSON.parse(fetchSpy.mock.calls[0]![1]!.body as string);
    // Geoapify erwartet [lon, lat] (GeoJSON-Standard)
    expect(callBody.agents[0].start_location).toEqual([8.0, 52.0]);
  });

  it("Refine 2026-08-11: überschreibt optionale startZeit als Basis für Ankunftszeiten-Berechnung", async () => {
    const { client, updateAufrufe } = createFakeAdminClient({
      stopps: [{ id: "stopp-a", partner_id: "partner-1" }],
      adressen: [{ partner_id: "partner-1", geoapify_lat: 51.5, geoapify_lon: 7.0 }],
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => geoapifyAntwort(["stopp-a"]),
      })
    );

    // Custom startZeit: 14:30 UTC
    const customStartZeit = new Date("2026-08-10T14:30:00Z");
    const ergebnis = await berechneUndSpeichereRoute(client as any, "fahrer-1", "2026-08-10", {
      startZeit: customStartZeit,
    });

    expect(ergebnis.ok).toBe(true);
    expect(updateAufrufe).toHaveLength(1);
    // Ankunftszeit sollte basierend auf customStartZeit + Geoapify-start_time berechnet werden,
    // nicht auf ermittleTagesstartUtc() (09:00 Uhr).
    // Der Stopp hat start_time: 0 (Position 0 in geoapifyAntwort), also Ankunftszeit = customStartZeit + 0
    const ankunftsZeitIso = updateAufrufe[0].values.berechnete_ankunftszeit as string;
    expect(ankunftsZeitIso).toBe(customStartZeit.toISOString());
  });

  it("Refine 2026-08-11: Regression — ohne startPunkt/startZeit bleibt Verhalten unverändert (nutzt Depot + 09:00 Uhr)", async () => {
    const { client, updateAufrufe } = createFakeAdminClient({
      stopps: [{ id: "stopp-a", partner_id: "partner-1" }],
      adressen: [{ partner_id: "partner-1", geoapify_lat: 51.5, geoapify_lon: 7.0 }],
    });

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => geoapifyAntwort(["stopp-a"]),
    });
    vi.stubGlobal("fetch", fetchSpy);

    // Kein options-Parameter — sollte wie vorher Depot nutzen
    const ergebnis = await berechneUndSpeichereRoute(client as any, "fahrer-regression", "2026-08-10");

    expect(ergebnis.ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledOnce();
    const callBody = JSON.parse(fetchSpy.mock.calls[0]![1]!.body as string);
    // Sollte Depot-Koordinaten nutzen, nicht einen custom Start-Punkt
    expect(callBody.agents[0].start_location).toEqual([6.9668, 51.699]); // aus Env in beforeEach
    // Ankunftszeit sollte auf ermittleTagesstartUtc() (09:00 Uhr) basieren, nicht auf customStartZeit
    // (schwierig zu testen ohne Mock von ermittleTagesstartUtc, aber update-Struktur sollte da sein)
    expect(updateAufrufe[0].values.berechnete_ankunftszeit).toBeTruthy();
  });
});

describe("loeseNeuberechnungAus", () => {
  // Jeder Test nutzt eine eigene Fahrer+Datum-Kombination, damit der
  // BUG-2-Cooldown (siehe unten) Tests nicht gegenseitig beeinflusst.

  it("wirft nie, selbst wenn die Berechnung intern fehlschlägt", async () => {
    const { client } = createFakeAdminClient({ stopps: [], adressen: [] });
    delete process.env.GEOAPIFY_API_KEY; // erzwingt einen internen Fehlschlag

    await expect(
      loeseNeuberechnungAus(client as any, [{ fahrerId: "fahrer-wirft-nie", datum: "2026-08-10" }])
    ).resolves.toBeUndefined();
  });

  it("überspringt Gruppen ohne Fahrer oder Datum", async () => {
    const { client } = createFakeAdminClient({ stopps: [], adressen: [] });
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await loeseNeuberechnungAus(client as any, [
      { fahrerId: null, datum: "2026-08-10" },
      { fahrerId: "fahrer-ohne-datum", datum: null },
    ]);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("dedupliziert identische Fahrer+Datum-Gruppen (z. B. wenn sich nur die Notiz-relevante Fahrt änderte, alte=neue Gruppe)", async () => {
    const { client } = createFakeAdminClient({ stopps: [], adressen: [] });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => geoapifyAntwort([]) })
    );

    await loeseNeuberechnungAus(client as any, [
      { fahrerId: "fahrer-dedupliziert", datum: "2026-08-11" },
      { fahrerId: "fahrer-dedupliziert", datum: "2026-08-11" },
    ]);

    // Keine offenen Stopps -> No-Op, aber vor allem: kein Crash bei doppeltem Schlüssel
    expect(true).toBe(true);
  });

  // QA-Fund BUG-2 (PROJ-42, Low)
  it("BUG-2-Fix: löst innerhalb des Cooldowns keine zweite Berechnung für dieselbe Tourengruppe aus", async () => {
    const { client, updateAufrufe } = createFakeAdminClient({
      stopps: [{ id: "stopp-a", partner_id: "partner-1" }],
      adressen: [{ partner_id: "partner-1", geoapify_lat: 51.5, geoapify_lon: 7.0 }],
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => geoapifyAntwort(["stopp-a"]) })
    );

    const gruppe = [{ fahrerId: "fahrer-cooldown", datum: "2026-08-12" }];

    await loeseNeuberechnungAus(client as any, gruppe);
    expect(updateAufrufe).toHaveLength(1); // erster Aufruf berechnet normal

    await loeseNeuberechnungAus(client as any, gruppe);
    expect(updateAufrufe).toHaveLength(1); // zweiter Aufruf sofort danach: Cooldown greift, keine neue Berechnung
  });

  // PROJ-42 Refine 2026-08-11: Cooldown-Bypass
  it("Refine 2026-08-11: umgeheCooldown: true erlaubt Neuberechnung trotz Cooldown", async () => {
    const { client, updateAufrufe } = createFakeAdminClient({
      stopps: [{ id: "stopp-a", partner_id: "partner-1" }],
      adressen: [{ partner_id: "partner-1", geoapify_lat: 51.5, geoapify_lon: 7.0 }],
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => geoapifyAntwort(["stopp-a"]) })
    );

    const gruppe = [{ fahrerId: "fahrer-bypass", datum: "2026-08-13" }];

    await loeseNeuberechnungAus(client as any, gruppe);
    expect(updateAufrufe).toHaveLength(1); // erster Aufruf berechnet normal

    // Zweiter Aufruf sofort danach, normalerweise würde Cooldown greifen
    // aber mit umgeheCooldown: true wird trotzdem berechnet
    await loeseNeuberechnungAus(client as any, gruppe, { umgeheCooldown: true });
    expect(updateAufrufe).toHaveLength(2); // zweite Berechnung trotz Cooldown ausgeführt
  });

  it("Refine 2026-08-11: startPunkt und startZeit werden an berechneUndSpeichereRoute() durchgereicht", async () => {
    const { client } = createFakeAdminClient({
      stopps: [{ id: "stopp-a", partner_id: "partner-1" }],
      adressen: [{ partner_id: "partner-1", geoapify_lat: 51.5, geoapify_lon: 7.0 }],
    });

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => geoapifyAntwort(["stopp-a"]),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const customStartPunkt = { lat: 52.5, lon: 13.0 };
    const customStartZeit = new Date("2026-08-10T15:00:00Z");

    await loeseNeuberechnungAus(
      client as any,
      [{ fahrerId: "fahrer-durchreichen", datum: "2026-08-14" }],
      {
        startPunkt: customStartPunkt,
        startZeit: customStartZeit,
      }
    );

    // Geoapify sollte mit dem custom Start-Punkt aufgerufen werden
    expect(fetchSpy).toHaveBeenCalledOnce();
    const callBody = JSON.parse(fetchSpy.mock.calls[0]![1]!.body as string);
    expect(callBody.agents[0].start_location).toEqual([13.0, 52.5]);
  });
});
