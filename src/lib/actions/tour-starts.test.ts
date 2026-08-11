import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * PROJ-46: Tests für Tour-Start-Funktionen (vereinfacht).
 * Fokus auf Auth-Checks und Business-Logic.
 * PROJ-46-Refine: Tests für standortbasierte Neuberechnung.
 */

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const getCurrentProfileMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  getCurrentProfile: () => getCurrentProfileMock(),
}));

const createAdminClientMock = vi.fn(() => ({}) as any);
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => createAdminClientMock(),
}));

const loeseNeuberechnungAusMock = vi.fn();
const leseDepotKoordinatenMock = vi.fn();
vi.mock("@/lib/routing/tour-route", () => ({
  loeseNeuberechnungAus: loeseNeuberechnungAusMock,
  leseDepotKoordinaten: leseDepotKoordinatenMock,
}));

beforeEach(() => {
  vi.clearAllMocks();
  createAdminClientMock.mockReturnValue({});
  loeseNeuberechnungAusMock.mockResolvedValue(undefined);
  leseDepotKoordinatenMock.mockReturnValue(null);
});

/** Baut einen Mock-AdminClient für die "tour_starts"-Tabelle (Insert-Ignore + Read).
 * @param insertError - Falls gesetzt, simuliert Insert-Fehler (z.B. UNIQUE-Constraint bei idempotenten Aufrufen)
 */
function buildMockTourStartsClient(gestartetAm: string, insertError: Error | null = null) {
  return {
    from: vi.fn((table: string) => {
      if (table === "tour_starts") {
        return {
          insert: vi.fn().mockResolvedValue({ error: insertError }),
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { gestartet_am: gestartetAm },
                  error: null,
                }),
              })),
            })),
          })),
        };
      }
      throw new Error(`Unmocked table: ${table}`);
    }),
  };
}

describe("tourStarten — PROJ-46", () => {
  it("verweigert Zugriff wenn Fahrer nicht eingeloggt ist", async () => {
    getCurrentProfileMock.mockResolvedValue(null);

    const { tourStarten } = await import("./fahrten");
    const ergebnis = await tourStarten("fahrer-1", "2026-08-10");

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.error).toContain("Nicht eingeloggt");
    }
  });

  it("verweigert Zugriff wenn Fahrer versucht, für einen anderen Fahrer zu starten", async () => {
    getCurrentProfileMock.mockResolvedValue({ id: "fahrer-1", roles: ["fahrer"] });

    const { tourStarten } = await import("./fahrten");
    const ergebnis = await tourStarten("fahrer-2", "2026-08-10");

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.error).toContain("Berechtigung");
    }
  });

  it("setzt einen Tour-Start-Eintrag und gibt den Zeitstempel zurück (Happy Path)", async () => {
    getCurrentProfileMock.mockResolvedValue({ id: "fahrer-1", roles: ["fahrer"] });
    const mockAdminClient = buildMockTourStartsClient("2026-08-10T06:00:00.000Z");
    createAdminClientMock.mockReturnValue(mockAdminClient);

    const { tourStarten } = await import("./fahrten");
    const ergebnis = await tourStarten("fahrer-1", "2026-08-10");

    expect(ergebnis.ok).toBe(true);
    if (ergebnis.ok) {
      expect(ergebnis.gestartetAm).toBe("2026-08-10T06:00:00.000Z");
    }
  });

  it("ist idempotent: zweiter Aufruf für bereits gestartete Tour liefert denselben Zeitstempel, kein Fehler", async () => {
    getCurrentProfileMock.mockResolvedValue({ id: "fahrer-1", roles: ["fahrer"] });
    const mockAdminClient = buildMockTourStartsClient("2026-08-10T06:00:00.000Z");
    createAdminClientMock.mockReturnValue(mockAdminClient);

    const { tourStarten } = await import("./fahrten");
    const ersterAufruf = await tourStarten("fahrer-1", "2026-08-10");
    const zweiterAufruf = await tourStarten("fahrer-1", "2026-08-10");

    expect(ersterAufruf.ok).toBe(true);
    expect(zweiterAufruf.ok).toBe(true);
    if (ersterAufruf.ok && zweiterAufruf.ok) {
      expect(zweiterAufruf.gestartetAm).toBe(ersterAufruf.gestartetAm);
    }
  });

  it("erlaubt Admin, für jeden Fahrer zu starten", async () => {
    getCurrentProfileMock.mockResolvedValue({ id: "admin-1", roles: ["admin"] });
    const mockAdminClient = buildMockTourStartsClient("2026-08-10T06:00:00.000Z");
    createAdminClientMock.mockReturnValue(mockAdminClient);

    const { tourStarten } = await import("./fahrten");
    const ergebnis = await tourStarten("fahrer-2", "2026-08-10");

    expect(ergebnis.ok).toBe(true);
  });

  // PROJ-46-Refine: Tests für standortbasierte Neuberechnung
  it("löst Neuberechnung mit übergebenem startPunkt bei echtem Erst-Start aus", async () => {
    getCurrentProfileMock.mockResolvedValue({ id: "fahrer-1", roles: ["fahrer"] });
    const mockAdminClient = buildMockTourStartsClient("2026-08-10T06:00:00.000Z", null); // kein Insert-Error = Erst-Start
    createAdminClientMock.mockReturnValue(mockAdminClient);

    const { tourStarten } = await import("./fahrten");
    const startPunkt = { lat: 51.5074, lon: -0.1278 };
    const ergebnis = await tourStarten("fahrer-1", "2026-08-10", startPunkt);

    expect(ergebnis.ok).toBe(true);
    expect(loeseNeuberechnungAusMock).toHaveBeenCalledWith(
      mockAdminClient,
      [{ fahrerId: "fahrer-1", datum: "2026-08-10" }],
      expect.objectContaining({
        startPunkt: startPunkt,
        umgeheCooldown: true,
      })
    );
  });

  it("nutzt Depot als Fallback wenn startPunkt fehlt aber Depot konfiguriert ist", async () => {
    getCurrentProfileMock.mockResolvedValue({ id: "fahrer-1", roles: ["fahrer"] });
    const mockAdminClient = buildMockTourStartsClient("2026-08-10T06:00:00.000Z", null);
    createAdminClientMock.mockReturnValue(mockAdminClient);
    const depotKoordinaten = { lat: 52.52, lon: 13.405 };
    leseDepotKoordinatenMock.mockReturnValue(depotKoordinaten);

    const { tourStarten } = await import("./fahrten");
    const ergebnis = await tourStarten("fahrer-1", "2026-08-10", null); // kein startPunkt

    expect(ergebnis.ok).toBe(true);
    expect(loeseNeuberechnungAusMock).toHaveBeenCalledWith(
      mockAdminClient,
      [{ fahrerId: "fahrer-1", datum: "2026-08-10" }],
      expect.objectContaining({
        startPunkt: depotKoordinaten,
        umgeheCooldown: true,
      })
    );
  });

  it("löst KEINE Neuberechnung aus bei idempotenten Aufruf (Tour war schon gestartet)", async () => {
    getCurrentProfileMock.mockResolvedValue({ id: "fahrer-1", roles: ["fahrer"] });
    const mockAdminClient = buildMockTourStartsClient(
      "2026-08-10T06:00:00.000Z",
      new Error("UNIQUE constraint violation") // Insert-Fehler = idempotenter Aufruf
    );
    createAdminClientMock.mockReturnValue(mockAdminClient);

    const { tourStarten } = await import("./fahrten");
    const startPunkt = { lat: 51.5074, lon: -0.1278 };
    const ergebnis = await tourStarten("fahrer-1", "2026-08-10", startPunkt);

    expect(ergebnis.ok).toBe(true);
    expect(loeseNeuberechnungAusMock).not.toHaveBeenCalled();
  });

  it("Tour-Start bleibt erfolgreich auch wenn Neuberechnung fehlschlägt", async () => {
    getCurrentProfileMock.mockResolvedValue({ id: "fahrer-1", roles: ["fahrer"] });
    const mockAdminClient = buildMockTourStartsClient("2026-08-10T06:00:00.000Z", null);
    createAdminClientMock.mockReturnValue(mockAdminClient);
    const startPunkt = { lat: 51.5074, lon: -0.1278 };
    loeseNeuberechnungAusMock.mockRejectedValue(new Error("Geoapify nicht erreichbar"));

    const { tourStarten } = await import("./fahrten");
    const ergebnis = await tourStarten("fahrer-1", "2026-08-10", startPunkt);

    // Tour-Start selbst ist erfolgreich, Neuberechnung-Fehler wird ignoriert
    expect(ergebnis.ok).toBe(true);
  });

  it("loggt Warnung wenn weder startPunkt noch Depot verfügbar", async () => {
    getCurrentProfileMock.mockResolvedValue({ id: "fahrer-1", roles: ["fahrer"] });
    const mockAdminClient = buildMockTourStartsClient("2026-08-10T06:00:00.000Z", null);
    createAdminClientMock.mockReturnValue(mockAdminClient);
    leseDepotKoordinatenMock.mockReturnValue(null); // Depot nicht konfiguriert

    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { tourStarten } = await import("./fahrten");
    const ergebnis = await tourStarten("fahrer-1", "2026-08-10", null);

    expect(ergebnis.ok).toBe(true);
    expect(loeseNeuberechnungAusMock).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Neuberechnung übersprungen")
    );

    consoleWarnSpy.mockRestore();
  });
});

describe("ladeTourStarts — PROJ-46", () => {
  it("gibt leere Mapping zurück wenn keine Daten abgefragt werden", async () => {
    getCurrentProfileMock.mockResolvedValue({ id: "fahrer-1", roles: ["fahrer"] });

    const { ladeTourStarts } = await import("./fahrten");
    const ergebnis = await ladeTourStarts([]);

    expect(ergebnis.ok).toBe(true);
    if (ergebnis.ok) {
      expect(ergebnis.data).toEqual({});
    }
  });

  it("verweigert Fahrer-Zugriff auf Daten wenn keine Rolle fahrer/admin", async () => {
    getCurrentProfileMock.mockResolvedValue({ id: "user-123", roles: ["viewer"] });

    const { ladeTourStarts } = await import("./fahrten");
    const ergebnis = await ladeTourStarts([
      { fahrerId: "fahrer-1", datum: "2026-08-10" },
    ]);

    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.error).toContain("Berechtigung");
    }
  });

  it("lädt eine Mapping von Fahrer+Datum zu Start-Zeitstempeln", async () => {
    getCurrentProfileMock.mockResolvedValue({ id: "admin-1", roles: ["admin"] });
    const mockAdminClient = {
      from: vi.fn((table: string) => {
        if (table === "tour_starts") {
          return {
            select: vi.fn(() => ({
              in: vi.fn().mockResolvedValue({
                data: [
                  { fahrer_id: "fahrer-1", datum: "2026-08-10", gestartet_am: "2026-08-10T06:00:00Z" },
                ],
                error: null,
              }),
            })),
          };
        }
        throw new Error(`Unmocked table: ${table}`);
      }),
    };
    createAdminClientMock.mockReturnValue(mockAdminClient);

    const { ladeTourStarts } = await import("./fahrten");
    const ergebnis = await ladeTourStarts([
      { fahrerId: "fahrer-1", datum: "2026-08-10" },
      { fahrerId: "fahrer-2", datum: "2026-08-10" },
    ]);

    expect(ergebnis.ok).toBe(true);
    if (ergebnis.ok) {
      expect(ergebnis.data["fahrer-1-2026-08-10"]).toBe("2026-08-10T06:00:00Z");
      expect(ergebnis.data["fahrer-2-2026-08-10"]).toBeNull();
    }
  });

  it("isoliert Fahrer-Daten: Fahrer darf nur ihre eigenen laden", async () => {
    getCurrentProfileMock.mockResolvedValue({ id: "fahrer-1", roles: ["fahrer"] });
    const mockAdminClient = {
      from: vi.fn((table: string) => {
        if (table === "tour_starts") {
          return {
            select: vi.fn(() => ({
              in: vi.fn().mockResolvedValue({
                data: [
                  { fahrer_id: "fahrer-1", datum: "2026-08-10", gestartet_am: "2026-08-10T06:00:00Z" },
                ],
                error: null,
              }),
            })),
          };
        }
        throw new Error(`Unmocked table: ${table}`);
      }),
    };
    createAdminClientMock.mockReturnValue(mockAdminClient);

    const { ladeTourStarts } = await import("./fahrten");
    const ergebnis = await ladeTourStarts([
      { fahrerId: "fahrer-1", datum: "2026-08-10" },
      { fahrerId: "fahrer-2", datum: "2026-08-10" },
    ]);

    expect(ergebnis.ok).toBe(true);
    if (ergebnis.ok) {
      // Nur die eigene Kombination wurde überhaupt angefragt
      expect(ergebnis.data["fahrer-1-2026-08-10"]).toBe("2026-08-10T06:00:00Z");
      expect(ergebnis.data["fahrer-2-2026-08-10"]).toBeUndefined();
    }
  });
});
