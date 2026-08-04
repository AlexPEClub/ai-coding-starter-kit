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

  it("sollte erfolgreich Status auf 'erledigt' setzen für nicht-finalen Status", async () => {
    const mockAdminClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: "fahrt-123", status: "geplant" },
        error: null,
      }),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    };

    (getCurrentProfile as any).mockResolvedValue({
      id: "user-123",
      roles: ["fahrer"],
    });

    (createAdminClient as any).mockReturnValue(mockAdminClient);

    const result = await markiereFahrtAlsErledigt("fahrt-123");

    expect(result.ok).toBe(true);
    expect(mockAdminClient.update).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/fahrer");
  });

  it("sollte fehlschlagen, wenn Fahrt bereits in finalem Status ist", async () => {
    const mockAdminClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: "fahrt-123", status: "erledigt" },
        error: null,
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

  it("sollte einen Chronologie-Eintrag erstellen", async () => {
    const mockAdminClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: "fahrt-123", status: "unterwegs" },
        error: null,
      }),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    };

    (getCurrentProfile as any).mockResolvedValue({
      id: "user-123",
      roles: ["admin"],
    });

    (createAdminClient as any).mockReturnValue(mockAdminClient);

    const result = await markiereFahrtAlsErledigt("fahrt-123");

    expect(result.ok).toBe(true);
    expect(mockAdminClient.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        tour_id: "fahrt-123",
        feld: "status",
        alter_wert: "unterwegs",
        neuer_wert: "erledigt",
        geaendert_von: "user-123",
      })
    );
  });

  it("sollte fehlschlagen, wenn Fahrt nicht gefunden wird", async () => {
    const mockAdminClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: new Error("Not found"),
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
