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

import { getCurrentProfile } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

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

  /** Baut einen Mock-AdminClient, der sowohl "tours" (Lesen + Update) als auch
   * "tour_starts" (PROJ-46-Gating) und "tour_aenderungen" (Chronologie) bedient. */
  function buildMockAdminClient(options: {
    tour: { id: string; status: string; fahrer_id?: string; geplantes_abholdatum?: string } | null;
    tourGestartet: boolean;
    updateError?: Error | null;
    verlaufError?: Error | null;
  }) {
    const { tour, tourGestartet, updateError = null, verlaufError = null } = options;
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
      },
      tourGestartet: true,
    });

    (getCurrentProfile as any).mockResolvedValue({
      id: "user-123",
      roles: ["fahrer"],
    });

    (createAdminClient as any).mockReturnValue(mockAdminClient);

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
      },
      tourGestartet: true,
    });

    (getCurrentProfile as any).mockResolvedValue({
      id: "user-123",
      roles: ["admin"],
    });

    (createAdminClient as any).mockReturnValue(mockAdminClient);

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
});
