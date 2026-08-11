import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * PROJ-46: Tests für Tour-Start-Funktionen (vereinfacht).
 * Fokus auf Auth-Checks und Business-Logic.
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

beforeEach(() => {
  vi.clearAllMocks();
  createAdminClientMock.mockReturnValue({});
});

/** Baut einen Mock-AdminClient für die "tour_starts"-Tabelle (Insert-Ignore + Read). */
function buildMockTourStartsClient(gestartetAm: string) {
  return {
    from: vi.fn((table: string) => {
      if (table === "tour_starts") {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
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
