import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * PROJ-42 QA-Ergänzung: `bearbeiteFahrt()` selbst hatte bisher keine Tests
 * (nur die reine Hilfsfunktion `gruppiereZuTouren` in fahrten-helpers.test.ts
 * ist getestet). Deckt genau die neu verdrahtete Trigger-Logik ab: löst
 * Fahrer/Datum-Änderungen die Neuberechnung für BEIDE Gruppen aus, bleibt
 * eine Notiz-only-Änderung unangetastet, und bleibt der Rückgabewert (also
 * der eigentliche Speicher-Erfolg) unabhängig davon immer `ok: true`.
 */

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const getCurrentProfileMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  getCurrentProfile: () => getCurrentProfileMock(),
}));

const loeseNeuberechnungAusMock = vi.fn();
vi.mock("@/lib/routing/tour-route", () => ({
  loeseNeuberechnungAus: (...args: unknown[]) => loeseNeuberechnungAusMock(...args),
}));

let fakeAdminClient: any;
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => fakeAdminClient,
}));

function createFakeAdminClient(options: {
  aktuelleFahrt: { fahrer_id: string | null; geplantes_abholdatum: string | null; notiz: string | null };
  fahrerProfilGefunden?: boolean;
}) {
  return {
    schema: (_schemaName: string) => ({
      from: (table: string) => {
        if (table === "profiles") {
          return {
            select: () => ({
              eq: () => ({
                contains: () => ({
                  maybeSingle: async () => ({
                    data: options.fahrerProfilGefunden === false ? null : { id: "irrelevant" },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        throw new Error(`Unmocked schema-table: ${table}`);
      },
    }),
    from: (table: string) => {
      if (table === "tours") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: options.aktuelleFahrt, error: null }),
            }),
          }),
          update: () => ({
            eq: async () => ({ error: null }),
          }),
        };
      }
      if (table === "tour_aenderungen") {
        return { insert: async () => ({ error: null }) };
      }
      throw new Error(`Unmocked table: ${table}`);
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentProfileMock.mockResolvedValue({ id: "profile-1", roles: ["fahrer"] });
});

describe("bearbeiteFahrt — PROJ-42 Neuberechnungs-Trigger", () => {
  it("löst die Neuberechnung für alte UND neue Tourengruppe aus, wenn sich der Fahrer ändert", async () => {
    fakeAdminClient = createFakeAdminClient({
      aktuelleFahrt: { fahrer_id: "fahrer-alt", geplantes_abholdatum: "2026-08-05", notiz: null },
    });

    const { bearbeiteFahrt } = await import("./fahrten");
    const ergebnis = await bearbeiteFahrt("fahrt-1", {
      fahrerId: "fahrer-neu",
      datum: "2026-08-05",
      notiz: null,
    });

    expect(ergebnis).toEqual({ ok: true });
    expect(loeseNeuberechnungAusMock).toHaveBeenCalledTimes(1);
    expect(loeseNeuberechnungAusMock.mock.calls[0][1]).toEqual([
      { fahrerId: "fahrer-alt", datum: "2026-08-05" },
      { fahrerId: "fahrer-neu", datum: "2026-08-05" },
    ]);
  });

  it("löst die Neuberechnung für alte UND neue Tourengruppe aus, wenn sich das Datum ändert", async () => {
    fakeAdminClient = createFakeAdminClient({
      aktuelleFahrt: { fahrer_id: "fahrer-1", geplantes_abholdatum: "2026-08-05", notiz: null },
    });

    const { bearbeiteFahrt } = await import("./fahrten");
    const ergebnis = await bearbeiteFahrt("fahrt-1", {
      fahrerId: "fahrer-1",
      datum: "2026-08-12",
      notiz: null,
    });

    expect(ergebnis).toEqual({ ok: true });
    expect(loeseNeuberechnungAusMock).toHaveBeenCalledTimes(1);
    expect(loeseNeuberechnungAusMock.mock.calls[0][1]).toEqual([
      { fahrerId: "fahrer-1", datum: "2026-08-05" },
      { fahrerId: "fahrer-1", datum: "2026-08-12" },
    ]);
  });

  it("löst KEINE Neuberechnung aus, wenn nur die Notiz geändert wird", async () => {
    fakeAdminClient = createFakeAdminClient({
      aktuelleFahrt: { fahrer_id: "fahrer-1", geplantes_abholdatum: "2026-08-05", notiz: null },
    });

    const { bearbeiteFahrt } = await import("./fahrten");
    const ergebnis = await bearbeiteFahrt("fahrt-1", {
      fahrerId: "fahrer-1",
      datum: "2026-08-05",
      notiz: "Kunde erst ab 14 Uhr erreichbar",
    });

    expect(ergebnis).toEqual({ ok: true });
    expect(loeseNeuberechnungAusMock).not.toHaveBeenCalled();
  });

  it("löst KEINE Neuberechnung aus, wenn sich gar nichts ändert (identisches Resubmit)", async () => {
    fakeAdminClient = createFakeAdminClient({
      aktuelleFahrt: { fahrer_id: "fahrer-1", geplantes_abholdatum: "2026-08-05", notiz: null },
    });

    const { bearbeiteFahrt } = await import("./fahrten");
    const ergebnis = await bearbeiteFahrt("fahrt-1", {
      fahrerId: "fahrer-1",
      datum: "2026-08-05",
      notiz: null,
    });

    expect(ergebnis).toEqual({ ok: true });
    expect(loeseNeuberechnungAusMock).not.toHaveBeenCalled();
  });
});
