import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * PROJ-42 QA-Ergänzung: `pickup-tours.ts` hatte bisher keine Tests. Deckt die
 * neu verdrahtete Trigger-Logik ab: `updatePickupTour()` (jetzt mit
 * Vorher-Lesen von Fahrer/Datum) und `createPickupTour()` müssen die
 * Neuberechnung genau dann auslösen, wenn sich Fahrer/Datum tatsächlich
 * ändern bzw. eine neue Abholung mit Fahrer+Datum entsteht — und NICHT bei
 * reinen Titel-Änderungen oder fehlendem Fahrer.
 */

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const getCurrentProfileMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) },
  }),
  getCurrentProfile: () => getCurrentProfileMock(),
}));

const loeseNeuberechnungAusMock = vi.fn();
vi.mock("@/lib/routing/tour-route", () => ({
  loeseNeuberechnungAus: (...args: unknown[]) => loeseNeuberechnungAusMock(...args),
}));

let fakeServiceClient: any;
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => fakeServiceClient,
}));

function createFakeServiceClient(options: {
  aktuelleTour?: { fahrer_id: string | null; geplantes_abholdatum: string | null } | null;
  defaults?: Record<string, unknown> | null;
}) {
  const inserts: any[] = [];
  return {
    inserts,
    client: {
      from: (table: string) => {
        if (table === "tours") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: options.aktuelleTour ?? null, error: null }),
              }),
            }),
            update: () => ({
              eq: async () => ({ error: null }),
            }),
            delete: () => ({
              eq: async () => ({ error: null }),
            }),
            insert: async (payload: any) => {
              inserts.push(payload);
              return { error: null };
            },
          };
        }
        if (table === "partner_order_defaults") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: options.defaults ?? null, error: null }),
              }),
            }),
          };
        }
        throw new Error(`Unmocked table: ${table}`);
      },
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentProfileMock.mockResolvedValue({ id: "admin-1", roles: ["admin"], status: "aktiv" });
});

describe("Autorisierung — QA-Fund BUG-1 (PROJ-42)", () => {
  it("createPickupTour lehnt nicht eingeloggte Nutzer ab", async () => {
    getCurrentProfileMock.mockResolvedValue(null);
    const { client, inserts } = createFakeServiceClient({ defaults: null });
    fakeServiceClient = client;

    const { createPickupTour } = await import("./pickup-tours");
    const ergebnis = await createPickupTour("partner-1", {
      geplantes_abholdatum: "2026-08-10",
      fahrer_id: "fahrer-1",
    });

    expect(ergebnis).toEqual({ ok: false, error: "Nicht eingeloggt." });
    expect(inserts).toHaveLength(0);
  });

  it("createPickupTour/updatePickupTour/deletePickupTour lehnen Nutzer ohne Admin-Rolle ab", async () => {
    getCurrentProfileMock.mockResolvedValue({ id: "user-1", roles: ["werker"], status: "aktiv" });
    const { client, inserts } = createFakeServiceClient({
      defaults: null,
      aktuelleTour: { fahrer_id: "fahrer-1", geplantes_abholdatum: "2026-08-05" },
    });
    fakeServiceClient = client;

    const { createPickupTour, updatePickupTour, deletePickupTour } = await import("./pickup-tours");

    const erstellenErgebnis = await createPickupTour("partner-1", {
      geplantes_abholdatum: "2026-08-10",
      fahrer_id: "fahrer-1",
    });
    const aendernErgebnis = await updatePickupTour("tour-1", { fahrer_id: "fahrer-neu" });
    const loeschenErgebnis = await deletePickupTour("tour-1");

    expect(erstellenErgebnis).toEqual({ ok: false, error: "Keine Berechtigung." });
    expect(aendernErgebnis).toEqual({ ok: false, error: "Keine Berechtigung." });
    expect(loeschenErgebnis).toEqual({ ok: false, error: "Keine Berechtigung." });
    expect(inserts).toHaveLength(0);
    expect(loeseNeuberechnungAusMock).not.toHaveBeenCalled();
  });

  it("lehnt deaktivierte Admin-Accounts ab", async () => {
    getCurrentProfileMock.mockResolvedValue({ id: "admin-1", roles: ["admin"], status: "deaktiviert" });
    const { client } = createFakeServiceClient({ defaults: null });
    fakeServiceClient = client;

    const { createPickupTour } = await import("./pickup-tours");
    const ergebnis = await createPickupTour("partner-1", {
      geplantes_abholdatum: "2026-08-10",
      fahrer_id: "fahrer-1",
    });

    expect(ergebnis).toEqual({ ok: false, error: "Konto ist nicht aktiv." });
  });

  it("erlaubt aktiven Admin-Accounts alle drei Aktionen", async () => {
    const { client, inserts } = createFakeServiceClient({
      defaults: null,
      aktuelleTour: { fahrer_id: "fahrer-1", geplantes_abholdatum: "2026-08-05" },
    });
    fakeServiceClient = client;

    const { createPickupTour, updatePickupTour, deletePickupTour } = await import("./pickup-tours");

    await expect(
      createPickupTour("partner-1", { geplantes_abholdatum: "2026-08-10", fahrer_id: "fahrer-1" })
    ).resolves.toEqual({ ok: true });
    await expect(updatePickupTour("tour-1", { titel: "Neu" })).resolves.toEqual({ ok: true });
    await expect(deletePickupTour("tour-1")).resolves.toEqual({ ok: true });
    expect(inserts).toHaveLength(1);
  });
});

describe("updatePickupTour — PROJ-42 Neuberechnungs-Trigger", () => {
  it("löst die Neuberechnung für alte UND neue Tourengruppe aus, wenn sich der Fahrer ändert", async () => {
    const { client } = createFakeServiceClient({
      aktuelleTour: { fahrer_id: "fahrer-alt", geplantes_abholdatum: "2026-08-05" },
    });
    fakeServiceClient = client;

    const { updatePickupTour } = await import("./pickup-tours");
    const ergebnis = await updatePickupTour("tour-1", { fahrer_id: "fahrer-neu" });

    expect(ergebnis).toEqual({ ok: true });
    expect(loeseNeuberechnungAusMock).toHaveBeenCalledTimes(1);
    expect(loeseNeuberechnungAusMock.mock.calls[0][1]).toEqual([
      { fahrerId: "fahrer-alt", datum: "2026-08-05" },
      { fahrerId: "fahrer-neu", datum: "2026-08-05" },
    ]);
  });

  it("löst die Neuberechnung aus, wenn sich das Datum ändert", async () => {
    const { client } = createFakeServiceClient({
      aktuelleTour: { fahrer_id: "fahrer-1", geplantes_abholdatum: "2026-08-05" },
    });
    fakeServiceClient = client;

    const { updatePickupTour } = await import("./pickup-tours");
    const ergebnis = await updatePickupTour("tour-1", { geplantes_abholdatum: "2026-08-12" });

    expect(ergebnis).toEqual({ ok: true });
    expect(loeseNeuberechnungAusMock).toHaveBeenCalledTimes(1);
    expect(loeseNeuberechnungAusMock.mock.calls[0][1]).toEqual([
      { fahrerId: "fahrer-1", datum: "2026-08-05" },
      { fahrerId: "fahrer-1", datum: "2026-08-12" },
    ]);
  });

  it("löst KEINE Neuberechnung aus, wenn nur der Titel geändert wird", async () => {
    const { client } = createFakeServiceClient({
      aktuelleTour: { fahrer_id: "fahrer-1", geplantes_abholdatum: "2026-08-05" },
    });
    fakeServiceClient = client;

    const { updatePickupTour } = await import("./pickup-tours");
    const ergebnis = await updatePickupTour("tour-1", { titel: "Neuer Titel" });

    expect(ergebnis).toEqual({ ok: true });
    expect(loeseNeuberechnungAusMock).not.toHaveBeenCalled();
  });

  it("löst KEINE Neuberechnung aus, wenn das Vorher-Lesen fehlschlägt (Update selbst bleibt trotzdem erfolgreich)", async () => {
    const { client } = createFakeServiceClient({ aktuelleTour: null });
    fakeServiceClient = client;

    const { updatePickupTour } = await import("./pickup-tours");
    const ergebnis = await updatePickupTour("tour-1", { fahrer_id: "fahrer-neu" });

    expect(ergebnis).toEqual({ ok: true });
    expect(loeseNeuberechnungAusMock).not.toHaveBeenCalled();
  });
});

describe("createPickupTour — PROJ-42 Neuberechnungs-Trigger", () => {
  it("löst die Neuberechnung für die neue Tourengruppe aus, wenn Fahrer+Datum gesetzt sind", async () => {
    const { client, inserts } = createFakeServiceClient({ defaults: null });
    fakeServiceClient = client;

    const { createPickupTour } = await import("./pickup-tours");
    const ergebnis = await createPickupTour("partner-1", {
      geplantes_abholdatum: "2026-08-10",
      fahrer_id: "fahrer-1",
    });

    expect(ergebnis).toEqual({ ok: true });
    expect(inserts).toHaveLength(1);
    expect(loeseNeuberechnungAusMock).toHaveBeenCalledTimes(1);
    expect(loeseNeuberechnungAusMock.mock.calls[0][1]).toEqual([
      { fahrerId: "fahrer-1", datum: "2026-08-10" },
    ]);
  });

  it("löst KEINE Neuberechnung aus, wenn kein Fahrer zugewiesen ist", async () => {
    const { client } = createFakeServiceClient({ defaults: null });
    fakeServiceClient = client;

    const { createPickupTour } = await import("./pickup-tours");
    const ergebnis = await createPickupTour("partner-1", {
      geplantes_abholdatum: "2026-08-10",
    });

    expect(ergebnis).toEqual({ ok: true });
    expect(loeseNeuberechnungAusMock).not.toHaveBeenCalled();
  });
});

describe("deletePickupTour — Neuberechnungs-Trigger (Bugfix)", () => {
  it("löst die Neuberechnung für die verbleibende Tourengruppe aus, wenn Fahrer+Datum bekannt sind", async () => {
    const { client } = createFakeServiceClient({
      aktuelleTour: { fahrer_id: "fahrer-1", geplantes_abholdatum: "2026-08-05" },
    });
    fakeServiceClient = client;

    const { deletePickupTour } = await import("./pickup-tours");
    const ergebnis = await deletePickupTour("tour-1");

    expect(ergebnis).toEqual({ ok: true });
    expect(loeseNeuberechnungAusMock).toHaveBeenCalledTimes(1);
    expect(loeseNeuberechnungAusMock.mock.calls[0][1]).toEqual([
      { fahrerId: "fahrer-1", datum: "2026-08-05" },
    ]);
  });

  it("löst KEINE Neuberechnung aus, wenn die gelöschte Tour keinen Fahrer/kein Datum hatte", async () => {
    const { client } = createFakeServiceClient({
      aktuelleTour: { fahrer_id: null, geplantes_abholdatum: null },
    });
    fakeServiceClient = client;

    const { deletePickupTour } = await import("./pickup-tours");
    const ergebnis = await deletePickupTour("tour-1");

    expect(ergebnis).toEqual({ ok: true });
    expect(loeseNeuberechnungAusMock).not.toHaveBeenCalled();
  });
});
