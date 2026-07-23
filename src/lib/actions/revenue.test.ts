import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getPartnerRevenueSummary,
  getPartnerRevenueChartData,
  getPartnerRevenueGroupChartData,
  getAvailableRevenueYears,
} from "./revenue";

/**
 * `revenue.ts` ist eine Server-Action-Datei ohne separate "helpers"-Datei
 * (anders als orders.ts/orders-helpers.ts) — die Aggregations-/Datumslogik ist
 * privat. Diese Tests mocken den Supabase-Admin-Client und testen daher über
 * die exportierten Funktionen (Black-Box), nicht die internen Hilfsfunktionen
 * direkt. Deckt trotzdem die eigentlich risikoreiche Logik ab: Kategorisierung
 * (Handel/Service/Nicht-zugeordnet), Zeitraum-/Datumsgrenzen, Monats-/
 * Jahres-Bucketing, Vorperioden-Vergleich, Partner-Isolation.
 */

interface FixtureInvoiceRow {
  partner_id: string;
  article_number: string | null;
  total_price_net: number;
  document_date: string;
}

interface FixtureProduct {
  number: string;
  type: string;
  group_id: number | null;
}

let invoiceRows: FixtureInvoiceRow[] = [];
let productRows: FixtureProduct[] = [];
let groupRows: { id: number; name: string }[] = [];

function createChain(handler: (state: any) => { data: any; error: any }) {
  const state: any = { eq: {}, in: {}, gte: {}, lte: {} };
  const chain: any = {
    select: () => chain,
    eq: (col: string, val: any) => {
      state.eq[col] = val;
      return chain;
    },
    in: (col: string, vals: any[]) => {
      state.in[col] = vals;
      return chain;
    },
    gte: (col: string, val: any) => {
      state.gte[col] = val;
      return chain;
    },
    lte: (col: string, val: any) => {
      state.lte[col] = val;
      return chain;
    },
    order: () => chain,
    range: () => chain,
    then: (resolve: any, reject: any) => {
      try {
        resolve(handler(state));
      } catch (err) {
        reject(err);
      }
    },
  };
  return chain;
}

function invoiceItemsHandler(state: any) {
  if (state.eq["invoices.partner_id"] === "ERROR_PARTNER") {
    return { data: null, error: { message: "boom" } };
  }
  let filtered = invoiceRows;
  const eqPartner = state.eq["invoices.partner_id"];
  if (eqPartner !== undefined) filtered = filtered.filter((r) => r.partner_id === eqPartner);
  const inPartner = state.in["invoices.partner_id"];
  if (inPartner !== undefined) filtered = filtered.filter((r) => inPartner.includes(r.partner_id));
  const gteDate = state.gte["invoices.document_date"];
  if (gteDate !== undefined) filtered = filtered.filter((r) => r.document_date >= gteDate);
  const lteDate = state.lte["invoices.document_date"];
  if (lteDate !== undefined) filtered = filtered.filter((r) => r.document_date <= lteDate);

  return {
    data: filtered.map((r) => ({
      article_number: r.article_number,
      total_price_net: r.total_price_net,
      invoices: { document_date: r.document_date, partner_id: r.partner_id },
    })),
    error: null,
  };
}

function productsHandler(state: any) {
  const numbers: string[] = state.in["number"] || [];
  return {
    data: productRows.filter((p) => numbers.includes(p.number)),
    error: null,
  };
}

function positionGroupsHandler(state: any) {
  const ids: number[] = state.in["id"] || [];
  return {
    data: groupRows.filter((g) => ids.includes(g.id)),
    error: null,
  };
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === "invoice_items") return createChain(invoiceItemsHandler);
      if (table === "products") return createChain(productsHandler);
      if (table === "position_groups") return createChain(positionGroupsHandler);
      throw new Error(`Unmocked table: ${table}`);
    },
  }),
}));

beforeEach(() => {
  productRows = [
    { number: "ART-1", type: "PRODUCT", group_id: 10 },
    { number: "ART-2", type: "PRODUCT", group_id: 20 },
    { number: "SRV-1", type: "SERVICE", group_id: null },
  ];
  groupRows = [
    { id: 10, name: "Sägeblätter" },
    { id: 20, name: "Bohrer" },
  ];
  invoiceRows = [
    // P1, 2026: Handel (März) 150€, Service (Juni) 20€, Nicht zugeordnet (Juni+September) 15€
    { partner_id: "P1", article_number: "ART-1", total_price_net: 10000, document_date: "2026-03-15" },
    { partner_id: "P1", article_number: "ART-2", total_price_net: 5000, document_date: "2026-03-20" },
    { partner_id: "P1", article_number: "SRV-1", total_price_net: 2000, document_date: "2026-06-01" },
    { partner_id: "P1", article_number: null, total_price_net: 1000, document_date: "2026-06-10" },
    { partner_id: "P1", article_number: "UNKNOWN", total_price_net: 500, document_date: "2026-09-05" },
    // P1, 2025 (Vorjahr für Vergleich): Handel 80€
    { partner_id: "P1", article_number: "ART-1", total_price_net: 8000, document_date: "2025-03-10" },
    // Anderer Kunde — darf NICHT in P1-Ergebnisse einfließen
    { partner_id: "P2", article_number: "ART-1", total_price_net: 99999, document_date: "2026-03-01" },
  ];
});

afterEach(() => {
  vi.useRealTimers();
});

describe("getPartnerRevenueSummary", () => {
  it("splits Kalenderjahr-Umsatz in Handel/Service/Nicht-zugeordnet und liefert Vorjahresvergleich", async () => {
    const result = await getPartnerRevenueSummary("P1", { type: "year", year: 2026 });
    expect(result.ok).toBe(true);
    expect(result.current).toEqual({ total: 185, handel: 150, service: 20, unassigned: 15 });
    expect(result.hasComparison).toBe(true);
    expect(result.previous).toEqual({ total: 80, handel: 80, service: 0, unassigned: 0 });
  });

  it("zählt Gesamtumsatz auch für Positionen ohne Artikel-Match (bewusst laut Spec 2.3)", async () => {
    const result = await getPartnerRevenueSummary("P1", { type: "year", year: 2026 });
    // 15€ Nicht-zugeordnet (Position ohne article_number + Position mit unbekannter Nummer)
    // fließen trotzdem in "total" ein, nicht nur in handel+service.
    expect(result.current.total).toBe(result.current.handel + result.current.service + result.current.unassigned);
  });

  it("isoliert Partner — Umsatz eines anderen Kunden fließt nicht ein", async () => {
    const result = await getPartnerRevenueSummary("P1", { type: "year", year: 2026 });
    expect(result.current.total).not.toBe(99999);
    expect(result.current.handel).toBeLessThan(99999);
  });

  it("hat bei 'Gesamt' keinen Vergleichszeitraum", async () => {
    const result = await getPartnerRevenueSummary("P1", { type: "all" });
    expect(result.hasComparison).toBe(false);
    expect(result.previous).toBeNull();
    expect(result.current.total).toBe(185 + 80);
  });

  it("liefert Nullwerte ohne Fehler für einen Kunden ohne Rechnungspositionen", async () => {
    const result = await getPartnerRevenueSummary("NEW-CUSTOMER", { type: "year", year: 2026 });
    expect(result.ok).toBe(true);
    expect(result.current).toEqual({ total: 0, handel: 0, service: 0, unassigned: 0 });
  });

  it("gibt ok:false zurück, wenn die Datenbank-Abfrage fehlschlägt", async () => {
    const result = await getPartnerRevenueSummary("ERROR_PARTNER", { type: "year", year: 2026 });
    expect(result.ok).toBe(false);
    expect(result.current).toEqual({ total: 0, handel: 0, service: 0, unassigned: 0 });
  });

  it("rollierendes 12-Monats-Fenster trennt aktuelle von vorheriger Periode an der Tagesgrenze", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-22T00:00:00Z"));

    invoiceRows = [
      // Genau am Fenster-Ende (heute)
      { partner_id: "P1", article_number: "ART-1", total_price_net: 10000, document_date: "2026-07-22" },
      // Genau am Fenster-Anfang (heute - 365 Tage)
      { partner_id: "P1", article_number: "ART-1", total_price_net: 20000, document_date: "2026-07-22" },
      // Einen Tag vor Fenster-Anfang -> gehört zur Vorperiode
      { partner_id: "P1", article_number: "ART-1", total_price_net: 30000, document_date: "2025-07-21" },
      // Weit außerhalb beider Fenster -> darf in keinem Ergebnis auftauchen
      { partner_id: "P1", article_number: "ART-1", total_price_net: 999999, document_date: "2020-01-01" },
    ];

    const result = await getPartnerRevenueSummary("P1", { type: "rolling365" });
    expect(result.ok).toBe(true);
    expect(result.current.total).toBe(300); // 100€ + 200€
    expect(result.previous?.total).toBe(300); // 300€ genau einen Tag davor
  });
});

describe("getPartnerRevenueChartData", () => {
  it("bucketiert nach Kalendermonat und füllt Monate ohne Umsatz mit 0", async () => {
    const result = await getPartnerRevenueChartData("P1", { type: "year", year: 2026 });
    expect(result.ok).toBe(true);
    expect(result.points).toHaveLength(12);

    const march = result.points[2];
    expect(march.handel).toBe(150);
    expect(march.service).toBe(0);

    const june = result.points[5];
    expect(june.service).toBe(20);
    expect(june.unassigned).toBe(10);

    const january = result.points[0];
    expect(january).toEqual({ label: january.label, handel: 0, service: 0, unassigned: 0 });
  });

  it("bucketiert bei 'Gesamt' nach Kalenderjahr statt Monat", async () => {
    const result = await getPartnerRevenueChartData("P1", { type: "all" });
    expect(result.points.map((p) => p.label)).toEqual(["2025", "2026"]);
    expect(result.points[0].handel).toBe(80);
    expect(result.points[1].handel).toBe(150);
  });
});

describe("getPartnerRevenueGroupChartData", () => {
  it("schlüsselt Handelsumsatz nach Rabattgruppe auf", async () => {
    const result = await getPartnerRevenueGroupChartData("P1", { type: "year", year: 2026 }, "handel");
    expect(result.ok).toBe(true);
    expect([...result.groupNames].sort()).toEqual(["Bohrer", "Sägeblätter"]);

    const march = result.points[2];
    expect(march.values["Sägeblätter"]).toBe(100);
    expect(march.values["Bohrer"]).toBe(50);
  });

  it("berücksichtigt bei Kategorie 'service' nur Service-Positionen", async () => {
    const result = await getPartnerRevenueGroupChartData("P1", { type: "year", year: 2026 }, "service");
    expect(result.ok).toBe(true);
    // SRV-1 hat keine Rabattgruppe (group_id: null) -> fällt unter "Ohne Gruppe"
    const june = result.points[5];
    expect(june.values["Ohne Gruppe"]).toBe(20);
  });
});

describe("getAvailableRevenueYears", () => {
  it("liefert die vorhandenen Kalenderjahre absteigend sortiert", async () => {
    const result = await getAvailableRevenueYears("P1");
    expect(result.ok).toBe(true);
    expect(result.years).toEqual([2026, 2025]);
  });

  it("liefert eine leere Liste für einen Kunden ohne Rechnungen", async () => {
    const result = await getAvailableRevenueYears("NEW-CUSTOMER");
    expect(result.ok).toBe(true);
    expect(result.years).toEqual([]);
  });
});
