import { describe, it, expect } from "vitest";
import { berechneFahrtBadge, gruppiereZuTouren, type RohFahrt } from "./fahrten-helpers";

function fahrt(overrides: Partial<RohFahrt>): RohFahrt {
  return {
    id: "fahrt-1",
    status: "geplant",
    geplantesAbholdatum: "2026-08-05",
    fahrerId: "fahrer-1",
    fahrerName: "Max Mustermann",
    kunde: { name: "Kunde GmbH", strasse: null, plz: null, ort: null },
    ...overrides,
  };
}

describe("gruppiereZuTouren", () => {
  it("bündelt mehrere Fahrten desselben Fahrers am selben Datum in eine Tour", () => {
    const touren = gruppiereZuTouren([
      fahrt({ id: "a", fahrerId: "fahrer-1", geplantesAbholdatum: "2026-08-05" }),
      fahrt({ id: "b", fahrerId: "fahrer-1", geplantesAbholdatum: "2026-08-05" }),
    ]);

    expect(touren).toHaveLength(1);
    expect(touren[0].fahrten.map((f) => f.id)).toEqual(["a", "b"]);
  });

  it("trennt Fahrten unterschiedlicher Fahrer bzw. unterschiedlicher Daten in separate Touren", () => {
    const touren = gruppiereZuTouren([
      fahrt({ id: "a", fahrerId: "fahrer-1", geplantesAbholdatum: "2026-08-05" }),
      fahrt({ id: "b", fahrerId: "fahrer-2", geplantesAbholdatum: "2026-08-05" }),
      fahrt({ id: "c", fahrerId: "fahrer-1", geplantesAbholdatum: "2026-08-06" }),
    ]);

    expect(touren).toHaveLength(3);
  });

  it("gruppiert Fahrten ohne zugewiesenen Fahrer unter sich, nicht mit zugewiesenen Fahrten vermischt", () => {
    const touren = gruppiereZuTouren([
      fahrt({ id: "a", fahrerId: null, geplantesAbholdatum: "2026-08-05" }),
      fahrt({ id: "b", fahrerId: null, geplantesAbholdatum: "2026-08-05" }),
      fahrt({ id: "c", fahrerId: "fahrer-1", geplantesAbholdatum: "2026-08-05" }),
    ]);

    expect(touren).toHaveLength(2);
    const ohneFahrerTour = touren.find((t) => t.fahrerId === null);
    expect(ohneFahrerTour?.fahrten.map((f) => f.id)).toEqual(["a", "b"]);
  });

  it("sortiert Touren mit Datum aufsteigend zuerst, Touren ohne Datum ans Ende", () => {
    const touren = gruppiereZuTouren([
      fahrt({ id: "spaeter", fahrerId: "fahrer-1", geplantesAbholdatum: "2026-08-10" }),
      fahrt({ id: "ohne-datum", fahrerId: "fahrer-2", geplantesAbholdatum: null }),
      fahrt({ id: "frueher", fahrerId: "fahrer-3", geplantesAbholdatum: "2026-08-01" }),
    ]);

    expect(touren.map((t) => t.fahrten[0].id)).toEqual(["frueher", "spaeter", "ohne-datum"]);
  });
});

describe("berechneFahrtBadge", () => {
  const HEUTE = "2026-08-01";

  it("zeigt 'Fällig' (warning) für geplante Fahrten mit heutigem Datum", () => {
    expect(berechneFahrtBadge("geplant", "2026-08-01", HEUTE)).toEqual({
      label: "Fällig",
      variant: "warning",
    });
  });

  it("zeigt 'Überfällig' (destructive) für geplante Fahrten mit vergangenem Datum", () => {
    expect(berechneFahrtBadge("geplant", "2026-07-06", HEUTE)).toEqual({
      label: "Überfällig",
      variant: "destructive",
    });
  });

  it("lässt geplante Fahrten mit zukünftigem Datum unverändert (Geplant/secondary)", () => {
    expect(berechneFahrtBadge("geplant", "2026-08-05", HEUTE)).toEqual({
      label: "Geplant",
      variant: "secondary",
    });
  });

  it("lässt geplante Fahrten ohne Datum unverändert (Geplant/secondary)", () => {
    expect(berechneFahrtBadge("geplant", null, HEUTE)).toEqual({
      label: "Geplant",
      variant: "secondary",
    });
  });

  it("lässt Status ungleich 'geplant' unabhängig vom Datum unverändert", () => {
    expect(berechneFahrtBadge("unterwegs", "2026-07-06", HEUTE)).toEqual({
      label: "Unterwegs",
      variant: "default",
    });
    expect(berechneFahrtBadge("angekommen", "2026-07-06", HEUTE)).toEqual({
      label: "Angekommen",
      variant: "default",
    });
    expect(berechneFahrtBadge("problem", "2026-07-06", HEUTE)).toEqual({
      label: "Problem",
      variant: "destructive",
    });
  });
});
