import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getTourKarteDaten } from "./tour-karte";
import * as tourRouteModule from "@/lib/routing/tour-route";

// Mock getCurrentProfile
vi.mock("@/lib/supabase/server", () => ({
  getCurrentProfile: vi.fn(),
}));

// Mock createAdminClient
const mockAdminClient = {
  from: vi.fn(),
};

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => mockAdminClient),
}));

// Mock berechneUndSpeichereRoute
vi.mock("@/lib/routing/tour-route", async () => {
  const actual = await vi.importActual("@/lib/routing/tour-route");
  return {
    ...actual,
    berechneUndSpeichereRoute: vi.fn(),
  };
});

import { getCurrentProfile } from "@/lib/supabase/server";

// Mock chain helper removed - each test sets up its own mocks directly

describe("getTourKarteDaten", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("schlägt fehl wenn nicht eingeloggt", async () => {
    const getCurrentProfileMock = getCurrentProfile as any;
    getCurrentProfileMock.mockResolvedValue(null);

    const result = await getTourKarteDaten("fahrer-1", "2026-08-10");

    expect(result).toEqual({ ok: false, error: "Nicht eingeloggt." });
  });

  it("schlägt fehl wenn Nutzer weder fahrer noch admin ist", async () => {
    const getCurrentProfileMock = getCurrentProfile as any;
    getCurrentProfileMock.mockResolvedValue({
      id: "user-1",
      roles: ["redakteur"], // keine fahrer oder admin Rolle
    });

    const result = await getTourKarteDaten("fahrer-1", "2026-08-10");

    expect(result).toEqual({ ok: false, error: "Keine Berechtigung." });
  });

  it("schlägt fehl wenn Fahrer eine andere Fahrer-Tour anfordert (Ownership-Check)", async () => {
    const getCurrentProfileMock = getCurrentProfile as any;
    getCurrentProfileMock.mockResolvedValue({
      id: "fahrer-1",
      roles: ["fahrer"],
    });

    const result = await getTourKarteDaten("fahrer-2", "2026-08-10"); // andere Fahrer-ID

    expect(result).toEqual({ ok: false, error: "Keine Berechtigung." });
  });

  it("erlaubt Admin jede Tour zu sehen (Ownership-Check)", async () => {
    const getCurrentProfileMock = getCurrentProfile as any;
    getCurrentProfileMock.mockResolvedValue({
      id: "admin-user",
      roles: ["admin"],
    });

    // Mock der DB responses
    const mockClient = mockAdminClient as any;
    mockClient.from.mockImplementation((table: string) => {
      if (table === "tours") {
        return {
          select: () => ({
            eq: (field: string, value: string) => ({
              eq: (field2: string, value2: string) => ({
                in: (field3: string, values: string[]) => Promise.resolve({
                  data: [
                    {
                      id: "stopp-1",
                      status: "geplant",
                      partner_id: "partner-1",
                      route_order: 1,
                      berechnete_ankunftszeit: "2026-08-10T10:00:00Z",
                      route_geometry: [[51.5, 7.0], [51.55, 7.05]],
                      route_calculated_at: "2026-08-10T08:00:00Z",
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === "partners") {
        return {
          select: () => ({
            in: () => Promise.resolve({
              data: [{ id: "partner-1", display_name: "Kunde A", company_name: null }],
              error: null,
            }),
          }),
        };
      }
      if (table === "partner_addresses") {
        return {
          select: () => ({
            in: () => ({
              eq: () => Promise.resolve({
                data: [
                  {
                    partner_id: "partner-1",
                    street: "Musterstr. 1",
                    postal_code: "12345",
                    city: "Musterstadt",
                    geoapify_lat: 51.5,
                    geoapify_lon: 7.0,
                  },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });

    // Mock leseDepotKoordinaten
    vi.spyOn(tourRouteModule, "leseDepotKoordinaten").mockReturnValue({
      lat: 51.699,
      lon: 6.9668,
    });

    const result = await getTourKarteDaten("fahrer-2", "2026-08-10");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.stopps).toHaveLength(1);
    }
  });

  it("schlägt fehl wenn tourDatum null ist", async () => {
    const getCurrentProfileMock = getCurrentProfile as any;
    getCurrentProfileMock.mockResolvedValue({
      id: "fahrer-1",
      roles: ["fahrer"],
    });

    const result = await getTourKarteDaten("fahrer-1", null);

    expect(result).toEqual({
      ok: false,
      error: "Tour ohne Datum kann nicht auf der Karte angezeigt werden.",
    });
  });

  it("gibt Fehler zurück wenn keine Stopps für die Tour gefunden werden", async () => {
    const getCurrentProfileMock = getCurrentProfile as any;
    getCurrentProfileMock.mockResolvedValue({
      id: "fahrer-1",
      roles: ["fahrer"],
    });

    const mockClient = mockAdminClient as any;
    mockClient.from.mockImplementation((table: string) => {
      if (table === "tours") {
        return {
          select: () => ({
            eq: (field: string) => ({
              eq: () => ({
                in: () => Promise.resolve({ data: [], error: null }), // Keine Stopps
              }),
            }),
          }),
        };
      }
      return {};
    });

    const result = await getTourKarteDaten("fahrer-1", "2026-08-10");

    expect(result).toEqual({ ok: false, error: "Keine Tour gefunden." });
  });

  it("triggert berechneUndSpeichereRoute wenn keine aktuelle Berechnung existiert", async () => {
    const getCurrentProfileMock = getCurrentProfile as any;
    getCurrentProfileMock.mockResolvedValue({
      id: "fahrer-1",
      roles: ["fahrer"],
    });

    const mockBerechne = vi.spyOn(tourRouteModule, "berechneUndSpeichereRoute");
    mockBerechne.mockResolvedValue({
      ok: true,
      stoppAnzahl: 1,
      distanzMeter: 1000,
      dauerSekunden: 600,
    });

    const mockClient = mockAdminClient as any;
    let callCount = 0;
    mockClient.from.mockImplementation((table: string) => {
      if (table === "tours") {
        return {
          select: () => ({
            eq: (field: string, value: string) => ({
              eq: (field2: string, value2: string) => ({
                in: (field3: string, values: string[]) => {
                  // Erste Abfrage: keine Berechnung
                  if (callCount === 0) {
                    callCount++;
                    return Promise.resolve({
                      data: [
                        {
                          id: "stopp-1",
                          status: "geplant",
                          partner_id: "partner-1",
                          route_order: null, // Keine Berechnung
                          berechnete_ankunftszeit: null,
                          route_geometry: null,
                          route_calculated_at: null,
                        },
                      ],
                      error: null,
                    });
                  }
                  // Zweite Abfrage nach berechneUndSpeichereRoute: jetzt mit Berechnung
                  return Promise.resolve({
                    data: [
                      {
                        id: "stopp-1",
                        status: "geplant",
                        partner_id: "partner-1",
                        route_order: 1,
                        berechnete_ankunftszeit: "2026-08-10T10:00:00Z",
                        route_geometry: null,
                        route_calculated_at: "2026-08-10T08:00:00Z",
                      },
                    ],
                    error: null,
                  });
                },
              }),
            }),
          }),
        };
      }
      if (table === "partners") {
        return {
          select: () => ({
            in: () => Promise.resolve({
              data: [{ id: "partner-1", display_name: "Kunde A", company_name: null }],
              error: null,
            }),
          }),
        };
      }
      if (table === "partner_addresses") {
        return {
          select: () => ({
            in: () => ({
              eq: () => Promise.resolve({
                data: [
                  {
                    partner_id: "partner-1",
                    street: "Musterstr. 1",
                    postal_code: "12345",
                    city: "Musterstadt",
                    geoapify_lat: 51.5,
                    geoapify_lon: 7.0,
                  },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });

    vi.spyOn(tourRouteModule, "leseDepotKoordinaten").mockReturnValue({
      lat: 51.699,
      lon: 6.9668,
    });

    const result = await getTourKarteDaten("fahrer-1", "2026-08-10");

    expect(mockBerechne).toHaveBeenCalledWith(expect.any(Object), "fahrer-1", "2026-08-10");
    expect(result.ok).toBe(true);
  });

  it("triggert berechneUndSpeichereRoute wenn route_order/route_calculated_at gesetzt sind, aber route_geometry fehlt (Bugfix Refine 2026-08-08)", async () => {
    const getCurrentProfileMock = getCurrentProfile as any;
    getCurrentProfileMock.mockResolvedValue({
      id: "fahrer-1",
      roles: ["fahrer"],
    });

    const mockBerechne = vi.spyOn(tourRouteModule, "berechneUndSpeichereRoute");
    mockBerechne.mockResolvedValue({
      ok: true,
      stoppAnzahl: 1,
      distanzMeter: 1000,
      dauerSekunden: 600,
    });

    const mockClient = mockAdminClient as any;
    let callCount = 0;
    mockClient.from.mockImplementation((table: string) => {
      if (table === "tours") {
        return {
          select: () => ({
            eq: (field: string, value: string) => ({
              eq: (field2: string, value2: string) => ({
                in: (field3: string, values: string[]) => {
                  // Erste Abfrage: route_order/route_calculated_at gesetzt,
                  // aber route_geometry fehlt (z. B. Tour vor Migration
                  // 20260806120000 berechnet) — muss als ungültig gelten.
                  if (callCount === 0) {
                    callCount++;
                    return Promise.resolve({
                      data: [
                        {
                          id: "stopp-1",
                          status: "geplant",
                          partner_id: "partner-1",
                          route_order: 1,
                          berechnete_ankunftszeit: "2026-08-10T10:00:00Z",
                          route_geometry: null,
                          route_calculated_at: "2026-08-05T08:00:00Z",
                        },
                      ],
                      error: null,
                    });
                  }
                  // Zweite Abfrage nach Neuberechnung: jetzt mit Geometrie
                  return Promise.resolve({
                    data: [
                      {
                        id: "stopp-1",
                        status: "geplant",
                        partner_id: "partner-1",
                        route_order: 1,
                        berechnete_ankunftszeit: "2026-08-10T10:00:00Z",
                        route_geometry: [[51.5, 7.0], [51.55, 7.05]],
                        route_calculated_at: "2026-08-10T08:00:00Z",
                      },
                    ],
                    error: null,
                  });
                },
              }),
            }),
          }),
        };
      }
      if (table === "partners") {
        return {
          select: () => ({
            in: () => Promise.resolve({
              data: [{ id: "partner-1", display_name: "Kunde A", company_name: null }],
              error: null,
            }),
          }),
        };
      }
      if (table === "partner_addresses") {
        return {
          select: () => ({
            in: () => ({
              eq: () => Promise.resolve({
                data: [
                  {
                    partner_id: "partner-1",
                    street: "Musterstr. 1",
                    postal_code: "12345",
                    city: "Musterstadt",
                    geoapify_lat: 51.5,
                    geoapify_lon: 7.0,
                  },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });

    vi.spyOn(tourRouteModule, "leseDepotKoordinaten").mockReturnValue({
      lat: 51.699,
      lon: 6.9668,
    });

    const result = await getTourKarteDaten("fahrer-1", "2026-08-10");

    expect(mockBerechne).toHaveBeenCalledWith(expect.any(Object), "fahrer-1", "2026-08-10");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.routenGeometrie).toEqual([[51.5, 7.0], [51.55, 7.05]]);
    }
  });

  it("schlägt fehl wenn beliebiger Stopp Koordinaten fehlen (All-or-Nothing)", async () => {
    const getCurrentProfileMock = getCurrentProfile as any;
    getCurrentProfileMock.mockResolvedValue({
      id: "fahrer-1",
      roles: ["fahrer"],
    });

    const mockClient = mockAdminClient as any;
    mockClient.from.mockImplementation((table: string) => {
      if (table === "tours") {
        return {
          select: () => ({
            eq: (field: string) => ({
              eq: () => ({
                in: () => Promise.resolve({
                  data: [
                    {
                      id: "stopp-1",
                      status: "geplant",
                      partner_id: "partner-1",
                      route_order: 1,
                      berechnete_ankunftszeit: "2026-08-10T10:00:00Z",
                      route_geometry: null,
                      route_calculated_at: "2026-08-10T08:00:00Z",
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === "partners") {
        return {
          select: () => ({
            in: () => Promise.resolve({
              data: [{ id: "partner-1", display_name: "Kunde A", company_name: null }],
              error: null,
            }),
          }),
        };
      }
      if (table === "partner_addresses") {
        return {
          select: () => ({
            in: () => ({
              eq: () => Promise.resolve({
                data: [
                  {
                    partner_id: "partner-1",
                    street: "Musterstr. 1",
                    postal_code: "12345",
                    city: "Musterstadt",
                    geoapify_lat: null, // Fehlende Koordinaten
                    geoapify_lon: 7.0,
                  },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });

    const result = await getTourKarteDaten("fahrer-1", "2026-08-10");

    expect(result).toEqual({
      ok: false,
      error: expect.stringContaining("Adress-Koordinaten"),
    });
  });

  it("gibt erfolgreiche Antwort mit allen Kartendaten zurück", async () => {
    const getCurrentProfileMock = getCurrentProfile as any;
    getCurrentProfileMock.mockResolvedValue({
      id: "fahrer-1",
      roles: ["fahrer"],
    });

    const mockClient = mockAdminClient as any;
    mockClient.from.mockImplementation((table: string) => {
      if (table === "tours") {
        return {
          select: () => ({
            eq: (field: string) => ({
              eq: () => ({
                in: () => Promise.resolve({
                  data: [
                    {
                      id: "stopp-1",
                      status: "geplant",
                      partner_id: "partner-1",
                      route_order: 1,
                      berechnete_ankunftszeit: "2026-08-10T09:00:00Z",
                      route_geometry: [[51.5, 7.0], [51.55, 7.05]],
                      route_calculated_at: "2026-08-10T08:00:00Z",
                    },
                    {
                      id: "stopp-2",
                      status: "geplant",
                      partner_id: "partner-2",
                      route_order: 2,
                      berechnete_ankunftszeit: "2026-08-10T10:00:00Z",
                      route_geometry: [[51.5, 7.0], [51.55, 7.05]],
                      route_calculated_at: "2026-08-10T08:00:00Z",
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === "partners") {
        return {
          select: () => ({
            in: () => Promise.resolve({
              data: [
                { id: "partner-1", display_name: "Kunde A", company_name: null },
                { id: "partner-2", display_name: null, company_name: "Unternehmen B" },
              ],
              error: null,
            }),
          }),
        };
      }
      if (table === "partner_addresses") {
        return {
          select: () => ({
            in: () => ({
              eq: () => Promise.resolve({
                data: [
                  {
                    partner_id: "partner-1",
                    street: "Musterstr. 1",
                    postal_code: "12345",
                    city: "Musterstadt",
                    geoapify_lat: 51.5,
                    geoapify_lon: 7.0,
                  },
                  {
                    partner_id: "partner-2",
                    street: "Teststr. 2",
                    postal_code: "54321",
                    city: "Teststadt",
                    geoapify_lat: 51.55,
                    geoapify_lon: 7.05,
                  },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });

    vi.spyOn(tourRouteModule, "leseDepotKoordinaten").mockReturnValue({
      lat: 51.699,
      lon: 6.9668,
    });

    const result = await getTourKarteDaten("fahrer-1", "2026-08-10");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.depot).toEqual({
        name: "Gudel Werkzeuge",
        breitengrad: 51.699,
        laengengrad: 6.9668,
      });
      expect(result.data.stopps).toHaveLength(2);
      expect(result.data.stopps[0].name).toBe("Kunde A");
      expect(result.data.stopps[1].name).toBe("Unternehmen B");
      expect(result.data.routenGeometrie).toEqual([[51.5, 7.0], [51.55, 7.05]]);
      expect(result.data.berechnungsDatum).toBe("2026-08-10T08:00:00Z");
    }
  });

  // NOTE: Timeout-Test skipped wegen Test-Runner-Timeout.
  // Die Timeout-Logik ist im Code implementiert (Promise.race mit 10s),
  // wird aber durch Integration Tests verifiziert (siehe /qa).
  // Unit Test würde hier den Test Runner selbst auf >10s bringen.
});
