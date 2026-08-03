import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * QA-Ergänzung (PROJ-43): `partners.ts` hatte bisher keine Tests. Deckt die
 * neue Header-Suche (`searchPartnersGlobal`) und die auf den Umsatz-Cache
 * umgestellte `getPartnersWithRevenue` ab: Mindestlänge, numerische
 * Kundennummer-Erkennung, Sortierung/Limit, Cent→Euro-Konvertierung sowie
 * die PostgREST-`.or()`-Filter-Sicherheit (siehe QA-Fund weiter unten —
 * dasselbe Muster wie `escapeOrFilterValue` in orders-helpers.ts/PROJ-11).
 */

interface FixturePartnerRow {
  id: string;
  display_name: string;
  company_name: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  easybill_customer_number?: string | null;
  is_active?: boolean;
  is_archived?: boolean;
  cached_revenue_365d: number;
}

let partnerRows: FixturePartnerRow[] = [];
let addressRows: { partner_id: string; city: string | null; address_type: string }[] = [];

/**
 * Zählt, wie viele Top-Level-Bedingungen ein PostgREST-`.or()`-String
 * tatsächlich enthält (Komma-getrennt, außerhalb von doppelten
 * Anführungszeichen — genau wie PostgREST selbst parst). Ohne Escaping/
 * Quoting kann eine Sucheingabe mit Komma zusätzliche Bedingungen
 * einschleusen; dieser Zähler macht das unabhängig von der genauen
 * Escaping-Implementierung messbar.
 */
function countTopLevelOrConditions(orString: string): number {
  let count = 1;
  let inQuotes = false;
  for (let i = 0; i < orString.length; i++) {
    const ch = orString[i];
    if (ch === '"' && orString[i - 1] !== "\\") inQuotes = !inQuotes;
    if (ch === "," && !inQuotes) count++;
  }
  return count;
}

function createChain(table: string) {
  const state: any = { eq: {}, in: {}, orString: null };
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
    or: (orString: string) => {
      state.orString = orString;
      return chain;
    },
    order: () => chain,
    limit: () => chain,
    then: (resolve: any, reject: any) => {
      try {
        resolve(runQuery(table, state));
      } catch (err) {
        reject(err);
      }
    },
  };
  return chain;
}

function runQuery(table: string, state: any) {
  if (table === "partners") {
    let rows = partnerRows;
    if (state.eq["is_active"] !== undefined) rows = rows.filter((r) => (r.is_active ?? true) === state.eq["is_active"]);
    if (state.eq["is_archived"] !== undefined) rows = rows.filter((r) => (r.is_archived ?? false) === state.eq["is_archived"]);

    if (state.orString) {
      // Vereinfachter, aber realistischer PostgREST-OR-Parser: jede
      // Top-Level-Bedingung ist "spalte.operator.wert" (Wert ggf. in
      // Anführungszeichen). ilike-Werte werden wie echtes PostgREST als
      // Teilstring-Muster behandelt (% = Wildcard).
      const conditions = splitTopLevel(state.orString);
      rows = rows.filter((row) =>
        conditions.some((cond) => evaluateCondition(row, cond))
      );
    }

    // Sortierung/Limit spielen für die Test-Assertions keine Rolle (per
    // .sort im Test selbst geprüft) — hier nur nach cached_revenue_365d
    // absteigend, wie von der echten Query erwartet.
    rows = [...rows].sort((a, b) => b.cached_revenue_365d - a.cached_revenue_365d);
    return { data: rows, error: null };
  }
  if (table === "partner_addresses") {
    const ids: string[] = state.in["partner_id"] || [];
    return { data: addressRows.filter((a) => ids.includes(a.partner_id)), error: null };
  }
  throw new Error(`Unmocked table: ${table}`);
}

function splitTopLevel(orString: string): string[] {
  const parts: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < orString.length; i++) {
    const ch = orString[i];
    if (ch === '"' && orString[i - 1] !== "\\") inQuotes = !inQuotes;
    if (ch === "," && !inQuotes) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return parts;
}

function evaluateCondition(row: FixturePartnerRow, condition: string): boolean {
  const match = condition.match(/^([a-z_]+)\.(ilike|eq|neq)\.(.*)$/i);
  if (!match) return false;
  const [, col, op, rawValue] = match;
  const value = rawValue.startsWith('"') && rawValue.endsWith('"') ? rawValue.slice(1, -1) : rawValue;
  const fieldValue = (row as any)[col];

  if (op === "eq") {
    return String(fieldValue ?? "") === value;
  }
  if (op === "neq") {
    // Reproduziert reale PostgREST-Semantik: `spalte.neq.wert` ist wahr für
    // jede Zeile, deren Wert ungleich `wert` ist — bei leerem `wert` (z.B.
    // eingeschleust über `display_name.neq.`) praktisch für JEDE Zeile.
    return String(fieldValue ?? "") !== value;
  }
  // ilike mit %-Wildcards an den Rändern
  const pattern = value.replace(/^%/, "").replace(/%$/, "");
  return String(fieldValue ?? "").toLowerCase().includes(pattern.toLowerCase());
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    schema: () => ({
      from: (table: string) => createChain(table),
    }),
  }),
}));

beforeEach(() => {
  partnerRows = [
    { id: "P1", display_name: "Mann & Tellschow GmbH", company_name: "Mann & Tellschow GmbH", easybill_customer_number: "60002", cached_revenue_365d: 2781246 },
    { id: "P2", display_name: "Timo Brosda", company_name: null, easybill_customer_number: "60010", cached_revenue_365d: 0 },
    { id: "P3", display_name: "Anna Hofmann", company_name: null, easybill_customer_number: "60020", cached_revenue_365d: 500000 },
  ];
  addressRows = [
    { partner_id: "P1", city: "Alsdorf", address_type: "shipping" },
    { partner_id: "P3", city: "Berlin", address_type: "shipping" },
  ];
});

describe("searchPartnersGlobal", () => {
  it("liefert ein leeres Ergebnis ohne DB-Zugriff bei weniger als 2 Zeichen", async () => {
    const { searchPartnersGlobal } = await import("./partners");
    const result = await searchPartnersGlobal("a");
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("findet per Text-Teilstring über mehrere Felder", async () => {
    const { searchPartnersGlobal } = await import("./partners");
    const result = await searchPartnersGlobal("Hofmann");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].displayName).toBe("Anna Hofmann");
      expect(result.data[0].city).toBe("Berlin");
    }
  });

  it("erkennt eine rein numerische Eingabe und sucht zusätzlich exakt nach der Kundennummer", async () => {
    const { searchPartnersGlobal } = await import("./partners");
    const result = await searchPartnersGlobal("60020");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.map((p) => p.id)).toContain("P3");
    }
  });

  it("konvertiert den gecachten Cent-Wert korrekt in Euro", async () => {
    const { searchPartnersGlobal } = await import("./partners");
    const result = await searchPartnersGlobal("Mann");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data[0].revenue365d).toBe(27812.46);
    }
  });

  it("zeigt Kunden ohne Rechnungshistorie mit Umsatz 0 an, kein Fehler", async () => {
    const { searchPartnersGlobal } = await import("./partners");
    const result = await searchPartnersGlobal("Brosda");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data[0].revenue365d).toBe(0);
    }
  });

  it("SICHERHEIT: eine Suchanfrage mit Komma darf keine zusätzliche Filter-Bedingung einschleusen (PostgREST-.or()-Injection, vgl. escapeOrFilterValue/BUG-2 aus PROJ-11)", async () => {
    // Ein Angreifer haengt eine eigene Bedingung an, die (fast) immer wahr ist.
    // Ist die Suchanfrage nicht wie escapeOrFilterValue in Anführungszeichen
    // gesetzt/escaped, bricht das Komma aus der ilike-Bedingung aus und die
    // Suche liefert ALLE Kunden statt nur Treffer für "zzznomatch".
    const { searchPartnersGlobal } = await import("./partners");
    const result = await searchPartnersGlobal("zzznomatch99999,display_name.neq.");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });
});

describe("getPartnersWithRevenue", () => {
  it("liest den Umsatz aus der gecachten Spalte (revenue_365d), nicht live berechnet", async () => {
    const { getPartnersWithRevenue } = await import("./partners");
    const result = await getPartnersWithRevenue();
    expect(result.ok).toBe(true);
    if (result.ok) {
      const top = result.data.find((p) => p.id === "P1");
      expect(top?.revenue_365d).toBe(27812.46);
    }
  });

  it("sortiert absteigend nach Umsatz", async () => {
    const { getPartnersWithRevenue } = await import("./partners");
    const result = await getPartnersWithRevenue();
    expect(result.ok).toBe(true);
    if (result.ok) {
      const revenues = result.data.map((p) => p.revenue_365d);
      expect(revenues).toEqual([...revenues].sort((a, b) => b - a));
    }
  });

  it("SICHERHEIT: eine Suchanfrage mit Komma darf keine zusätzliche Filter-Bedingung einschleusen", async () => {
    const { getPartnersWithRevenue } = await import("./partners");
    const result = await getPartnersWithRevenue("zzznomatch99999,display_name.neq.");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });
});

describe("countTopLevelOrConditions (Test-Hilfsfunktion, PostgREST-OR-Parser-Verhalten)", () => {
  it("zaehlt unquotierte Kommas als zusaetzliche Bedingungen (reproduziert die reale PostgREST-Semantik)", () => {
    expect(countTopLevelOrConditions("a.ilike.%x%,b.ilike.%x%")).toBe(2);
    expect(countTopLevelOrConditions('a.ilike."%x,y%"')).toBe(1);
  });
});
