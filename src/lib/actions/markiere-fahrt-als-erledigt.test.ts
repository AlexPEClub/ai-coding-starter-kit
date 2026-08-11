import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { markiereFahrtAlsErledigt } from "./fahrten";

// Mock der Server-Funktionen
vi.mock("@/lib/supabase/server", () => ({
  getCurrentProfile: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/routing/tour-route", () => ({
  loeseNeuberechnungAus: vi.fn(),
}));

import { getCurrentProfile } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { loeseNeuberechnungAus } from "@/lib/routing/tour-route";

describe("markiereFahrtAlsErledigt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("sollte fehlschlagen, wenn Nutzer nicht eingeloggt ist", async () => {
    (getCurrentProfile as any).mockResolvedValue(null);

    const result = await markiereFahrtAlsErledigt("fahrt-123");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Nicht eingeloggt");
  });

  it("sollte fehlschlagen, wenn Nutzer keine Fahrer/Admin-Rolle hat", async () => {
    (getCurrentProfile as any).mockResolvedValue({
      id: "user-123",
      roles: ["viewer"],
    });

    const result = await markiereFahrtAlsErledigt("fahrt-123");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Berechtigung");
  });

  /** Baut einen Mock-AdminClient, der "tours", "tour_starts", "tour_aenderungen",
   * und "partner_addresses" bedient. */
  function buildMockAdminClient(options: {
    tour: {
      id: string;
      status: string;
      fahrer_id?: string;
      geplantes_abholdatum?: string;
      partner_id?: string;
    } | null;
    tourGestartet: boolean;
    updateError?: Error | null;
    verlaufError?: Error | null;
    stoppAdresse?: { geoapify_lat: number; geoapify_lon: number } | null;
  }) {
    const {
      tour,
      tourGestartet,
      updateError = null,
      verlaufError = null,
      stoppAdresse = null,
    } = options;
    return {
      from: vi.fn((table: string) => {
        if (table === "tours") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: tour,
                  error: tour ? null : new Error("Not found"),
                }),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({ error: updateError }),
            })),
          };
        }
        if (table === "tour_starts") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: tourGestartet ? { id: "start-1" } : null,
                    error: tourGestartet ? null : new Error("Not found"),
                  }),
                })),
              })),
            })),
          };
        }
        if (table === "tour_aenderungen") {
          return {
            insert: vi.fn().mockResolvedValue({ error: verlaufError }),
          };
        }
        if (table === "partner_addresses") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  limit: vi.fn().mockResolvedValue({
                    data: stoppAdresse ? [stoppAdresse] : [],
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

  it("sollte erfolgreich Status auf 'erledigt' setzen, wenn die Tour bereits gestartet wurde", async () => {
    const mockAdminClient = buildMockAdminClient({
      tour: {
        id: "fahrt-123",
        status: "geplant",
        fahrer_id: "fahrer-1",
        geplantes_abholdatum: "2026-08-10",
        partner_id: "partner-1",
      },
      tourGestartet: true,
    });

    (getCurrentProfile as any).mockResolvedValue({
      id: "user-123",
      roles: ["fahrer"],
    });

    (createAdminClient as any).mockReturnValue(mockAdminClient);
    (loeseNeuberechnungAus as any).mockResolvedValue({ ok: true });

    const result = await markiereFahrtAlsErledigt("fahrt-123");

    expect(result.ok).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith("/fahrer");
  });

  it("sollte einen Chronologie-Eintrag erstellen", async () => {
    const mockAdminClient = buildMockAdminClient({
      tour: {
        id: "fahrt-123",
        status: "unterwegs",
        fahrer_id: "fahrer-1",
        geplantes_abholdatum: "2026-08-10",
        partner_id: "partner-1",
      },
      tourGestartet: true,
    });

    (getCurrentProfile as any).mockResolvedValue({
      id: "user-123",
      roles: ["admin"],
    });

    (createAdminClient as any).mockReturnValue(mockAdminClient);
    (loeseNeuberechnungAus as any).mockResolvedValue({ ok: true });

    const result = await markiereFahrtAlsErledigt("fahrt-123");

    expect(result.ok).toBe(true);
    const tourAenderungenCall = mockAdminClient.from.mock.results.find(
      (_, i) => mockAdminClient.from.mock.calls[i][0] === "tour_aenderungen"
    );
    expect(tourAenderungenCall).toBeDefined();
    expect(tourAenderungenCall!.value.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        tour_id: "fahrt-123",
        feld: "status",
        alter_wert: "unterwegs",
        neuer_wert: "erledigt",
        geaendert_von: "user-123",
      })
    );
  });

  it("sollte fehlschlagen (PROJ-46-Gating), wenn die Tour noch nicht gestartet wurde", async () => {
    const mockAdminClient = buildMockAdminClient({
      tour: {
        id: "fahrt-123",
        status: "geplant",
        fahrer_id: "fahrer-1",
        geplantes_abholdatum: "2026-08-10",
        partner_id: "partner-1",
      },
      tourGestartet: false,
    });

    (getCurrentProfile as any).mockResolvedValue({
      id: "user-123",
      roles: ["fahrer"],
    });

    (createAdminClient as any).mockReturnValue(mockAdminClient);

    const result = await markiereFahrtAlsErledigt("fahrt-123");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("noch nicht gestartet");
  });

  it("sollte fehlschlagen, wenn Fahrt bereits in finalem Status ist", async () => {
    const mockAdminClient = {
      from: vi.fn((table: string) => {
        if (table === "tours") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { id: "fahrt-123", status: "erledigt" },
                  error: null,
                }),
              })),
            })),
          };
        }
        throw new Error(`Unmocked table: ${table}`);
      }),
    };

    (getCurrentProfile as any).mockResolvedValue({
      id: "user-123",
      roles: ["fahrer"],
    });

    (createAdminClient as any).mockReturnValue(mockAdminClient);

    const result = await markiereFahrtAlsErledigt("fahrt-123");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("finalen Status");
  });

  it("sollte fehlschlagen, wenn Fahrt nicht gefunden wird", async () => {
    const mockAdminClient = {
      from: vi.fn((table: string) => {
        if (table === "tours") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: new Error("Not found"),
                }),
              })),
            })),
          };
        }
        throw new Error(`Unmocked table: ${table}`);
      }),
    };

    (getCurrentProfile as any).mockResolvedValue({
      id: "user-123",
      roles: ["fahrer"],
    });

    (createAdminClient as any).mockReturnValue(mockAdminClient);

    const result = await markiereFahrtAlsErledigt("fahrt-123");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("nicht gefunden");
  });

  // PROJ-44-Refine Tests: standortbasierte Neuberechnung mit Fallback-Kette

  it("sollte loeseNeuberechnungAus mit übergeben startPunkt aufrufen", async () => {
    const mockAdminClient = buildMockAdminClient({
      tour: {
        id: "fahrt-123",
        status: "angekommen",
        fahrer_id: "fahrer-1",
        geplantes_abholdatum: "2026-08-10",
        partner_id: "partner-1",
      },
      tourGestartet: true,
    });

    (getCurrentProfile as any).mockResolvedValue({
      id: "user-123",
      roles: ["fahrer"],
    });

    (createAdminClient as any).mockReturnValue(mockAdminClient);
    (loeseNeuberechnungAus as any).mockResolvedValue({ ok: true });

    const geraeteStandort = { lat: 52.52, lon: 13.405 };
    const result = await markiereFahrtAlsErledigt("fahrt-123", geraeteStandort);

    expect(result.ok).toBe(true);
    expect(loeseNeuberechnungAus).toHaveBeenCalledWith(
      mockAdminClient,
      [
        {
          fahrerId: "fahrer-1",
          datum: "2026-08-10",
        },
      ],
      expect.objectContaining({
        startPunkt: geraeteStandort,
        startZeit: expect.any(Date),
        // umgeheCooldown sollte NICHT gesetzt sein (undefined oder falsy)
      })
    );
    // Sicherstellen, dass umgeheCooldown nicht übertragen wurde
    const call = (loeseNeuberechnungAus as any).mock.calls[0][2];
    expect(call.umgeheCooldown).toBeUndefined();
  });

  it("sollte Stopp-Koordinate als Fallback verwenden, wenn kein startPunkt übergeben", async () => {
    const mockAdminClient = buildMockAdminClient({
      tour: {
        id: "fahrt-123",
        status: "angekommen",
        fahrer_id: "fahrer-1",
        geplantes_abholdatum: "2026-08-10",
        partner_id: "partner-1",
      },
      tourGestartet: true,
      stoppAdresse: { geoapify_lat: 48.8566, geoapify_lon: 2.3522 }, // Paris
    });

    (getCurrentProfile as any).mockResolvedValue({
      id: "user-123",
      roles: ["fahrer"],
    });

    (createAdminClient as any).mockReturnValue(mockAdminClient);
    (loeseNeuberechnungAus as any).mockResolvedValue({ ok: true });

    // Kein startPunkt übergeben
    const result = await markiereFahrtAlsErledigt("fahrt-123");

    expect(result.ok).toBe(true);
    expect(loeseNeuberechnungAus).toHaveBeenCalledWith(
      mockAdminClient,
      [
        {
          fahrerId: "fahrer-1",
          datum: "2026-08-10",
        },
      ],
      expect.objectContaining({
        startPunkt: { lat: 48.8566, lon: 2.3522 },
        startZeit: expect.any(Date),
      })
    );
  });

  it("sollte keine Neuberechnung auslösen, wenn weder startPunkt noch Stopp-Koordinate verfügbar", async () => {
    const mockAdminClient = buildMockAdminClient({
      tour: {
        id: "fahrt-123",
        status: "angekommen",
        fahrer_id: "fahrer-1",
        geplantes_abholdatum: "2026-08-10",
        partner_id: "partner-1",
      },
      tourGestartet: true,
      stoppAdresse: null, // Keine Adresse vorhanden
    });

    (getCurrentProfile as any).mockResolvedValue({
      id: "user-123",
      roles: ["fahrer"],
    });

    (createAdminClient as any).mockReturnValue(mockAdminClient);
    (loeseNeuberechnungAus as any).mockResolvedValue({ ok: true });

    const result = await markiereFahrtAlsErledigt("fahrt-123", null);

    expect(result.ok).toBe(true);
    // loeseNeuberechnungAus sollte NICHT aufgerufen worden sein
    expect(loeseNeuberechnungAus).not.toHaveBeenCalled();
  });

  it("sollte Status-Wechsel erfolgreich abschließen, auch wenn Neuberechnung fehlschlägt", async () => {
    const mockAdminClient = buildMockAdminClient({
      tour: {
        id: "fahrt-123",
        status: "problem",
        fahrer_id: "fahrer-1",
        geplantes_abholdatum: "2026-08-10",
        partner_id: "partner-1",
      },
      tourGestartet: true,
      stoppAdresse: { geoapify_lat: 48.8566, geoapify_lon: 2.3522 },
    });

    (getCurrentProfile as any).mockResolvedValue({
      id: "user-123",
      roles: ["fahrer"],
    });

    (createAdminClient as any).mockReturnValue(mockAdminClient);
    // Neuberechnung schlägt fehl
    (loeseNeuberechnungAus as any).mockRejectedValue(
      new Error("Neuberechnung fehlgeschlagen")
    );

    const result = await markiereFahrtAlsErledigt("fahrt-123");

    // Status-Wechsel sollte trotzdem erfolgreich sein
    expect(result.ok).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith("/fahrer");
  });

  it("sollte startPunkt-Parameter an loeseNeuberechnungAus übergeben ohne umgeheCooldown", async () => {
    const mockAdminClient = buildMockAdminClient({
      tour: {
        id: "fahrt-123",
        status: "geplant",
        fahrer_id: "fahrer-abc",
        geplantes_abholdatum: "2026-08-11",
        partner_id: "partner-xyz",
      },
      tourGestartet: true,
    });

    (getCurrentProfile as any).mockResolvedValue({
      id: "user-123",
      roles: ["admin"],
    });

    (createAdminClient as any).mockReturnValue(mockAdminClient);
    (loeseNeuberechnungAus as any).mockResolvedValue({ ok: true });

    const geraeteStandort = { lat: 51.5074, lon: -0.1278 }; // London
    await markiereFahrtAlsErledigt("fahrt-123", geraeteStandort);

    // Verifiziere, dass der Call die richtige Struktur hat
    const [, gruppen, options] = (loeseNeuberechnungAus as any).mock.calls[0];
    expect(gruppen).toEqual([
      {
        fahrerId: "fahrer-abc",
        datum: "2026-08-11",
      },
    ]);
    expect(options.startPunkt).toEqual(geraeteStandort);
    expect(options.umgeheCooldown).toBeUndefined(); // Nicht gesetzt = Standard-Cooldown
  });
});
