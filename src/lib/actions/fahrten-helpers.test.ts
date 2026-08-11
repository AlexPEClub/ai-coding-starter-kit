import { describe, it, expect } from "vitest";
import { berechneFahrtBadge, berechneTourKpis, gruppiereZuTouren, type RohFahrt, type Tour } from "./fahrten-helpers";

function fahrt(overrides: Partial<RohFahrt>): RohFahrt {
  return {
    id: "fahrt-1",
    status: "geplant",
    geplantesAbholdatum: "2026-08-05",
    notiz: null,
    fahrerId: "fahrer-1",
    fahrerName: "Max Mustermann",
    routeOrder: null,
    berechneteAnkunftszeit: null,
    routeCalculatedAt: null,
    routeDistanzMeter: null,
    routeDauerSekunden: null,
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

  // PROJ-42 — Routenberechnung
  it("sortiert Stopps nach routeOrder statt Anlage-Reihenfolge, wenn alle Stopps denselben routeCalculatedAt tragen", () => {
    const touren = gruppiereZuTouren([
      fahrt({
        id: "zweiter-stopp",
        fahrerId: "fahrer-1",
        geplantesAbholdatum: "2026-08-05",
        routeOrder: 2,
        routeCalculatedAt: "2026-08-02T10:00:00.000Z",
        routeDistanzMeter: 5000,
        routeDauerSekunden: 900,
      }),
      fahrt({
        id: "erster-stopp",
        fahrerId: "fahrer-1",
        geplantesAbholdatum: "2026-08-05",
        routeOrder: 1,
        routeCalculatedAt: "2026-08-02T10:00:00.000Z",
        routeDistanzMeter: 5000,
        routeDauerSekunden: 900,
      }),
    ]);

    expect(touren).toHaveLength(1);
    expect(touren[0].fahrten.map((f) => f.id)).toEqual(["erster-stopp", "zweiter-stopp"]);
    expect(touren[0].gesamtDistanzMeter).toBe(5000);
    expect(touren[0].gesamtDauerSekunden).toBe(900);
  });

  it("fällt auf Datums-/Anlage-Reihenfolge zurück und zeigt keine Distanz/Fahrzeit, wenn die Berechnung unvollständig ist", () => {
    const touren = gruppiereZuTouren([
      fahrt({
        id: "a",
        fahrerId: "fahrer-1",
        geplantesAbholdatum: "2026-08-05",
        routeOrder: 1,
        routeCalculatedAt: "2026-08-02T10:00:00.000Z",
      }),
      // Zweiter Stopp derselben Tour hat KEINE Berechnung -> Tour insgesamt "unvollständig"
      fahrt({ id: "b", fahrerId: "fahrer-1", geplantesAbholdatum: "2026-08-05" }),
    ]);

    expect(touren).toHaveLength(1);
    expect(touren[0].fahrten.map((f) => f.id)).toEqual(["a", "b"]);
    expect(touren[0].gesamtDistanzMeter).toBeNull();
    expect(touren[0].gesamtDauerSekunden).toBeNull();
  });

  it("fällt auf Datums-Reihenfolge zurück, wenn die Stopps unterschiedliche (veraltete) routeCalculatedAt-Werte tragen", () => {
    const touren = gruppiereZuTouren([
      fahrt({
        id: "a",
        fahrerId: "fahrer-1",
        geplantesAbholdatum: "2026-08-05",
        routeOrder: 2,
        routeCalculatedAt: "2026-08-01T10:00:00.000Z",
      }),
      fahrt({
        id: "b",
        fahrerId: "fahrer-1",
        geplantesAbholdatum: "2026-08-05",
        routeOrder: 1,
        routeCalculatedAt: "2026-08-02T10:00:00.000Z",
      }),
    ]);

    expect(touren[0].fahrten.map((f) => f.id)).toEqual(["a", "b"]);
    expect(touren[0].gesamtDistanzMeter).toBeNull();
  });

  it("sortiert weiterhin nach routeOrder, wenn nur ein bereits erledigter Stopp einen veralteten routeCalculatedAt trägt (Bug: erledigte Stopps werden nie neu berechnet)", () => {
    const touren = gruppiereZuTouren([
      // Bereits erledigt, VOR der letzten Neuberechnung erledigt worden ->
      // trägt bewusst einen älteren Zeitstempel, da berechneUndSpeichereRoute
      // erledigte Stopps nie mit aktualisiert.
      fahrt({
        id: "erledigt",
        status: "erledigt",
        fahrerId: "fahrer-1",
        geplantesAbholdatum: "2026-08-05",
        routeOrder: 1,
        routeCalculatedAt: "2026-08-01T09:00:00.000Z",
      }),
      // Zwei offene Stopps, beide aus der NEUESTEN Berechnung -> gemeinsamer,
      // aktueller Zeitstempel.
      fahrt({
        id: "zweiter-offener-stopp",
        fahrerId: "fahrer-1",
        geplantesAbholdatum: "2026-08-05",
        routeOrder: 2,
        routeCalculatedAt: "2026-08-02T10:00:00.000Z",
        routeDistanzMeter: 8000,
        routeDauerSekunden: 1200,
      }),
      fahrt({
        id: "erster-offener-stopp",
        fahrerId: "fahrer-1",
        geplantesAbholdatum: "2026-08-05",
        routeOrder: 1,
        routeCalculatedAt: "2026-08-02T10:00:00.000Z",
        routeDistanzMeter: 8000,
        routeDauerSekunden: 1200,
      }),
    ]);

    expect(touren).toHaveLength(1);
    // Offene Stopps zuerst (nach routeOrder sortiert), erledigter Stopp ans Ende.
    expect(touren[0].fahrten.map((f) => f.id)).toEqual([
      "erster-offener-stopp",
      "zweiter-offener-stopp",
      "erledigt",
    ]);
    expect(touren[0].gesamtDistanzMeter).toBe(8000);
    expect(touren[0].gesamtDauerSekunden).toBe(1200);
  });

  it("gibt berechneteAnkunftszeit je Stopp durch, ohne interne Routing-Felder auf Fahrt-Ebene zu leaken", () => {
    const touren = gruppiereZuTouren([
      fahrt({
        id: "a",
        fahrerId: "fahrer-1",
        geplantesAbholdatum: "2026-08-05",
        routeOrder: 1,
        routeCalculatedAt: "2026-08-02T10:00:00.000Z",
        berechneteAnkunftszeit: "2026-08-05T07:15:00.000Z",
      }),
    ]);

    expect(touren[0].fahrten[0].berechneteAnkunftszeit).toBe("2026-08-05T07:15:00.000Z");
    expect(touren[0].fahrten[0]).not.toHaveProperty("routeCalculatedAt");
    expect(touren[0].fahrten[0]).not.toHaveProperty("routeDistanzMeter");
    expect(touren[0].fahrten[0]).not.toHaveProperty("routeDauerSekunden");
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

describe("berechneTourKpis", () => {
  // PROJ-47: KPI-Berechnung für laufende Touren

  it("gibt null zurück, wenn die Tour keine Stopps hat", () => {
    const tour: Tour = {
      datum: "2026-08-05",
      fahrerId: "fahrer-1",
      fahrerName: "Max Mustermann",
      fahrten: [],
      gesamtDistanzMeter: null,
      gesamtDauerSekunden: null,
    };
    expect(berechneTourKpis(tour)).toBeNull();
  });

  it("berechnet korrekt für eine Tour mit nur offenen Stopps", () => {
    const tour: Tour = {
      datum: "2026-08-05",
      fahrerId: "fahrer-1",
      fahrerName: "Max Mustermann",
      fahrten: [
        {
          id: "a",
          status: "geplant",
          geplantesAbholdatum: "2026-08-05",
          notiz: null,
          kunde: { name: "Kunde A", strasse: null, plz: null, ort: null },
          routeOrder: 1,
          berechneteAnkunftszeit: "2026-08-05T08:00:00.000Z",
        },
        {
          id: "b",
          status: "geplant",
          geplantesAbholdatum: "2026-08-05",
          notiz: null,
          kunde: { name: "Kunde B", strasse: null, plz: null, ort: null },
          routeOrder: 2,
          berechneteAnkunftszeit: "2026-08-05T09:00:00.000Z",
        },
        {
          id: "c",
          status: "unterwegs",
          geplantesAbholdatum: "2026-08-05",
          notiz: null,
          kunde: { name: "Kunde C", strasse: null, plz: null, ort: null },
          routeOrder: 3,
          berechneteAnkunftszeit: "2026-08-05T10:00:00.000Z",
        },
      ],
      gesamtDistanzMeter: 5000,
      gesamtDauerSekunden: 900,
    };

    const kpi = berechneTourKpis(tour);
    expect(kpi).not.toBeNull();
    if (kpi) {
      expect(kpi.erledigtAnzahl).toBe(0);
      expect(kpi.gesamtAnzahl).toBe(3);
      expect(kpi.verbleibendeAnzahl).toBe(3);
      expect(kpi.fortschrittProzent).toBe(0);
      expect(kpi.naechsterStoppName).toBe("Kunde A");
      expect(kpi.naechsterStoppAnkunftszeit).toBe("2026-08-05T08:00:00.000Z");
      expect(kpi.voraussichtlichesTourendeAnkunftszeit).toBe("2026-08-05T10:00:00.000Z");
    }
  });

  it("berechnet korrekt für eine Tour mit offenen und erledigten Stopps", () => {
    const tour: Tour = {
      datum: "2026-08-05",
      fahrerId: "fahrer-1",
      fahrerName: "Max Mustermann",
      fahrten: [
        {
          id: "a",
          status: "unterwegs",
          geplantesAbholdatum: "2026-08-05",
          notiz: null,
          kunde: { name: "Kunde A", strasse: null, plz: null, ort: null },
          routeOrder: 2,
          berechneteAnkunftszeit: "2026-08-05T09:30:00.000Z",
        },
        {
          id: "b",
          status: "geplant",
          geplantesAbholdatum: "2026-08-05",
          notiz: null,
          kunde: { name: "Kunde B", strasse: null, plz: null, ort: null },
          routeOrder: 3,
          berechneteAnkunftszeit: "2026-08-05T10:30:00.000Z",
        },
        {
          id: "erledigt",
          status: "erledigt",
          geplantesAbholdatum: "2026-08-05",
          notiz: null,
          kunde: { name: "Kunde C", strasse: null, plz: null, ort: null },
          routeOrder: null,
          berechneteAnkunftszeit: "2026-08-05T08:00:00.000Z",
        },
      ],
      gesamtDistanzMeter: 5000,
      gesamtDauerSekunden: 900,
    };

    const kpi = berechneTourKpis(tour);
    expect(kpi).not.toBeNull();
    if (kpi) {
      expect(kpi.erledigtAnzahl).toBe(1);
      expect(kpi.gesamtAnzahl).toBe(3);
      expect(kpi.verbleibendeAnzahl).toBe(2);
      expect(kpi.fortschrittProzent).toBe(33);
      expect(kpi.naechsterStoppName).toBe("Kunde A");
      expect(kpi.naechsterStoppAnkunftszeit).toBe("2026-08-05T09:30:00.000Z");
      expect(kpi.voraussichtlichesTourendeAnkunftszeit).toBe("2026-08-05T10:30:00.000Z");
    }
  });

  it("zeigt keine Ankunftszeiten, wenn die Tour keine Routenberechnung hat", () => {
    const tour: Tour = {
      datum: "2026-08-05",
      fahrerId: "fahrer-1",
      fahrerName: "Max Mustermann",
      fahrten: [
        {
          id: "a",
          status: "geplant",
          geplantesAbholdatum: "2026-08-05",
          notiz: null,
          kunde: { name: "Kunde A", strasse: null, plz: null, ort: null },
          routeOrder: null,
          berechneteAnkunftszeit: null,
        },
        {
          id: "b",
          status: "geplant",
          geplantesAbholdatum: "2026-08-05",
          notiz: null,
          kunde: { name: "Kunde B", strasse: null, plz: null, ort: null },
          routeOrder: null,
          berechneteAnkunftszeit: null,
        },
      ],
      gesamtDistanzMeter: null,
      gesamtDauerSekunden: null,
    };

    const kpi = berechneTourKpis(tour);
    expect(kpi).not.toBeNull();
    if (kpi) {
      expect(kpi.erledigtAnzahl).toBe(0);
      expect(kpi.gesamtAnzahl).toBe(2);
      expect(kpi.naechsterStoppName).toBe("Kunde A");
      expect(kpi.naechsterStoppAnkunftszeit).toBeNull();
      expect(kpi.voraussichtlichesTourendeAnkunftszeit).toBeNull();
    }
  });

  it("behandelt einen einzelnen Stopp korrekt", () => {
    const tour: Tour = {
      datum: "2026-08-05",
      fahrerId: "fahrer-1",
      fahrerName: "Max Mustermann",
      fahrten: [
        {
          id: "a",
          status: "geplant",
          geplantesAbholdatum: "2026-08-05",
          notiz: null,
          kunde: { name: "Kunde A", strasse: null, plz: null, ort: null },
          routeOrder: 1,
          berechneteAnkunftszeit: "2026-08-05T08:00:00.000Z",
        },
      ],
      gesamtDistanzMeter: null,
      gesamtDauerSekunden: null,
    };

    const kpi = berechneTourKpis(tour);
    expect(kpi).not.toBeNull();
    if (kpi) {
      expect(kpi.erledigtAnzahl).toBe(0);
      expect(kpi.gesamtAnzahl).toBe(1);
      expect(kpi.verbleibendeAnzahl).toBe(1);
      expect(kpi.fortschrittProzent).toBe(0);
      expect(kpi.naechsterStoppName).toBe("Kunde A");
      expect(kpi.voraussichtlichesTourendeAnkunftszeit).toBe("2026-08-05T08:00:00.000Z");
    }
  });

  it("gibt null für voraussichtlichesTourendeAnkunftszeit zurück, wenn letzter offener Stopp keine Ankunftszeit hat", () => {
    const tour: Tour = {
      datum: "2026-08-05",
      fahrerId: "fahrer-1",
      fahrerName: "Max Mustermann",
      fahrten: [
        {
          id: "a",
          status: "geplant",
          geplantesAbholdatum: "2026-08-05",
          notiz: null,
          kunde: { name: "Kunde A", strasse: null, plz: null, ort: null },
          routeOrder: 1,
          berechneteAnkunftszeit: "2026-08-05T08:00:00.000Z",
        },
        {
          id: "b",
          status: "geplant",
          geplantesAbholdatum: "2026-08-05",
          notiz: null,
          kunde: { name: "Kunde B", strasse: null, plz: null, ort: null },
          routeOrder: 2,
          berechneteAnkunftszeit: null,
        },
      ],
      gesamtDistanzMeter: null,
      gesamtDauerSekunden: null,
    };

    const kpi = berechneTourKpis(tour);
    expect(kpi).not.toBeNull();
    if (kpi) {
      expect(kpi.naechsterStoppName).toBe("Kunde A");
      expect(kpi.naechsterStoppAnkunftszeit).toBe("2026-08-05T08:00:00.000Z");
      expect(kpi.voraussichtlichesTourendeAnkunftszeit).toBeNull();
    }
  });
});
