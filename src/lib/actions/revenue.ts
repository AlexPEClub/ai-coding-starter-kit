"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { chunk, centsToEuro } from "./orders-helpers";

export type RevenuePeriod =
  | { type: "rolling365" }
  | { type: "year"; year: number }
  | { type: "all" };

export interface RevenueCategoryTotals {
  total: number;
  handel: number;
  service: number;
  unassigned: number;
}

export interface RevenueSummaryResult {
  ok: boolean;
  current: RevenueCategoryTotals;
  previous: RevenueCategoryTotals | null;
  hasComparison: boolean;
  error?: string;
}

export interface RevenueChartPoint {
  label: string;
  handel: number;
  service: number;
  unassigned: number;
}

export interface RevenueChartResult {
  ok: boolean;
  points: RevenueChartPoint[];
  error?: string;
}

export interface RevenueGroupChartPoint {
  label: string;
  values: Record<string, number>;
}

export interface RevenueGroupChartResult {
  ok: boolean;
  points: RevenueGroupChartPoint[];
  groupNames: string[];
  error?: string;
}

interface InvoiceRevenueRow {
  article_number: string | null;
  total_price_net: number | null;
  document_date: string;
}

interface ArticleInfo {
  type: string;
  group_id: number | null;
  group_name: string | null;
}

type Category = "handel" | "service" | "unassigned";

// PostgREST liefert pro Anfrage maximal ~1000 Zeilen — daher `.range()`-Pagination,
// gleiches Muster wie `fetchCustomerTradeRows` in orders.ts.
const PAGE = 1000;
// Chunk-Größe für `.in(...)`-Lookups gegen den Produktstamm, hält die Query-URL
// kurz genug (BUG-5-Vermeidung, siehe orders.ts).
const LOOKUP_CHUNK = 150;

/**
 * Holt ALLE Rechnungspositionen eines Kunden im gewählten Datumsbereich —
 * bewusst ohne Artikel-Match-Filter, da „Gesamtumsatz" laut Spec jede Position
 * zählt, unabhängig davon ob sie einem Artikel-Stammdatensatz zugeordnet werden
 * kann. `dateFrom`/`dateTo` filtern auf `invoices.document_date` (Embedded-
 * Resource-Filter, wie `invoices.partner_id` bereits in orders.ts genutzt).
 */
async function fetchPartnerRevenueRows(
  supabase: ReturnType<typeof createAdminClient>,
  partnerId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<InvoiceRevenueRow[]> {
  const all: InvoiceRevenueRow[] = [];
  for (let from = 0; ; from += PAGE) {
    let query = supabase
      .from("invoice_items")
      .select("article_number, total_price_net, invoices!inner(document_date, partner_id)")
      .eq("invoices.partner_id", partnerId)
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);

    if (dateFrom) query = query.gte("invoices.document_date", dateFrom);
    if (dateTo) query = query.lte("invoices.document_date", dateTo);

    const { data, error } = await query;
    if (error) throw error;
    const batch = (data || []) as any[];
    for (const row of batch) {
      all.push({
        article_number: row.article_number,
        total_price_net: row.total_price_net,
        document_date: row.invoices?.document_date,
      });
    }
    if (batch.length < PAGE) break;
  }
  return all;
}

/** Wie oben, aber nur das Rechnungsdatum — für die Ermittlung verfügbarer Jahre. */
async function fetchPartnerInvoiceDates(
  supabase: ReturnType<typeof createAdminClient>,
  partnerId: string
): Promise<string[]> {
  const dates: string[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("invoice_items")
      .select("invoices!inner(document_date, partner_id)")
      .eq("invoices.partner_id", partnerId)
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    const batch = (data || []) as any[];
    for (const row of batch) {
      if (row.invoices?.document_date) dates.push(row.invoices.document_date);
    }
    if (batch.length < PAGE) break;
  }
  return dates;
}

/**
 * Baut die Map article_number -> { type, group_id, group_name } — nur für die
 * übergebenen (bereits kunden-bezogenen) Artikelnummern, analog
 * `buildNumberToGroupMap` in orders.ts. Anders als dort wird hier NICHT auf
 * `type='PRODUCT'` gefiltert, da Umsatz sowohl Handelsware (`PRODUCT`) als auch
 * Service (`SERVICE`) unterscheiden muss.
 */
async function buildArticleInfoMap(
  supabase: ReturnType<typeof createAdminClient>,
  articleNumbers: (string | null)[]
): Promise<Map<string, ArticleInfo>> {
  const distinct = [...new Set(articleNumbers.filter((n): n is string => !!n))];
  const map = new Map<string, ArticleInfo>();
  if (distinct.length === 0) return map;

  const products: { number: string; type: string; group_id: number | null }[] = [];
  for (const block of chunk(distinct, LOOKUP_CHUNK)) {
    const { data, error } = await supabase
      .from("products")
      .select("number, type, group_id")
      .in("number", block);
    if (error) throw error;
    for (const p of data || []) products.push(p);
  }

  const groupIds = [...new Set(products.map((p) => p.group_id).filter((id): id is number => !!id))];
  const groupNames = new Map<number, string>();
  for (const block of chunk(groupIds, LOOKUP_CHUNK)) {
    const { data, error } = await supabase
      .from("position_groups")
      .select("id, name")
      .in("id", block);
    if (error) throw error;
    for (const g of data || []) groupNames.set(g.id, g.name);
  }

  for (const p of products) {
    map.set(p.number, {
      type: p.type,
      group_id: p.group_id ?? null,
      group_name: p.group_id ? groupNames.get(p.group_id) ?? null : null,
    });
  }
  return map;
}

function categorize(articleNumber: string | null, map: Map<string, ArticleInfo>): Category {
  const info = map.get(articleNumber || "");
  if (!info) return "unassigned";
  if (info.type === "PRODUCT") return "handel";
  if (info.type === "SERVICE") return "service";
  return "unassigned";
}

function emptyTotals(): RevenueCategoryTotals {
  return { total: 0, handel: 0, service: 0, unassigned: 0 };
}

function addRow(totals: RevenueCategoryTotals, row: InvoiceRevenueRow, map: Map<string, ArticleInfo>) {
  const value = centsToEuro(row.total_price_net);
  totals.total += value;
  totals[categorize(row.article_number, map)] += value;
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

/**
 * Löst einen `RevenuePeriod` in Datumsbereiche auf. „Letzte 12 Monate" ist
 * bewusst ein rollierendes 365-Tage-Fenster (heute - 365 bis heute), nicht ein
 * Kalenderjahr — siehe Spec 2.3. Die Vorperiode für den Vergleichs-Badge ist
 * bei „Gesamt" nicht definiert (kein sinnvolles „Davor").
 */
function resolvePeriodRanges(period: RevenuePeriod): {
  current: { from?: string; to?: string };
  previous: { from?: string; to?: string } | null;
} {
  if (period.type === "year") {
    return {
      current: { from: `${period.year}-01-01`, to: `${period.year}-12-31` },
      previous: { from: `${period.year - 1}-01-01`, to: `${period.year - 1}-12-31` },
    };
  }
  if (period.type === "rolling365") {
    const today = new Date();
    const from = addDays(today, -365);
    const prevTo = addDays(from, -1);
    const prevFrom = addDays(prevTo, -365);
    return {
      current: { from: toIsoDate(from), to: toIsoDate(today) },
      previous: { from: toIsoDate(prevFrom), to: toIsoDate(prevTo) },
    };
  }
  return { current: {}, previous: null };
}

function monthLabel(year: number, month: number): string {
  const months = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
  return `${months[month - 1]} ${year.toString().slice(-2)}`;
}

function enumerateMonths(from: string, to: string): { year: number; month: number }[] {
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  const out: { year: number; month: number }[] = [];
  let y = start.getUTCFullYear();
  let m = start.getUTCMonth() + 1;
  while (y < end.getUTCFullYear() || (y === end.getUTCFullYear() && m <= end.getUTCMonth() + 1)) {
    out.push({ year: y, month: m });
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return out;
}

function documentYearMonth(documentDate: string): { year: number; month: number } {
  const d = new Date(`${documentDate}T00:00:00Z`);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

export async function getPartnerRevenueSummary(
  partnerId: string,
  period: RevenuePeriod
): Promise<RevenueSummaryResult> {
  try {
    const supabase = createAdminClient({ schema: "tms" });
    const { current, previous } = resolvePeriodRanges(period);

    const currentRows = await fetchPartnerRevenueRows(supabase, partnerId, current.from, current.to);
    const previousRows = previous
      ? await fetchPartnerRevenueRows(supabase, partnerId, previous.from, previous.to)
      : [];

    const articleMap = await buildArticleInfoMap(
      supabase,
      [...currentRows, ...previousRows].map((r) => r.article_number)
    );

    const currentTotals = emptyTotals();
    for (const row of currentRows) addRow(currentTotals, row, articleMap);

    const previousTotals = previous ? emptyTotals() : null;
    if (previousTotals) {
      for (const row of previousRows) addRow(previousTotals, row, articleMap);
    }

    return {
      ok: true,
      current: currentTotals,
      previous: previousTotals,
      hasComparison: !!previous,
    };
  } catch (err) {
    console.error("Unexpected error computing revenue summary:", err);
    return {
      ok: false,
      current: emptyTotals(),
      previous: null,
      hasComparison: false,
      error: "Unerwarteter Fehler",
    };
  }
}

export async function getPartnerRevenueChartData(
  partnerId: string,
  period: RevenuePeriod
): Promise<RevenueChartResult> {
  try {
    const supabase = createAdminClient({ schema: "tms" });
    const { current } = resolvePeriodRanges(period);
    const rows = await fetchPartnerRevenueRows(supabase, partnerId, current.from, current.to);
    const articleMap = await buildArticleInfoMap(supabase, rows.map((r) => r.article_number));

    // "Gesamt" hat keinen Datumsbereich zum Aufzählen der Monate — bei
    // potenziell mehrjähriger Historie wird deshalb pro Kalenderjahr
    // gebündelt statt pro Monat (analog der bisherigen Jahresansicht).
    if (period.type === "all") {
      const buckets = new Map<number, RevenueCategoryTotals>();
      for (const row of rows) {
        const { year } = documentYearMonth(row.document_date);
        if (!buckets.has(year)) buckets.set(year, emptyTotals());
        addRow(buckets.get(year)!, row, articleMap);
      }
      const points = [...buckets.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([year, totals]) => ({
          label: year.toString(),
          handel: totals.handel,
          service: totals.service,
          unassigned: totals.unassigned,
        }));
      return { ok: true, points };
    }

    const months = current.from && current.to ? enumerateMonths(current.from, current.to) : [];
    const buckets = new Map<string, RevenueCategoryTotals>();
    for (const { year, month } of months) buckets.set(`${year}-${month}`, emptyTotals());

    for (const row of rows) {
      const { year, month } = documentYearMonth(row.document_date);
      const bucket = buckets.get(`${year}-${month}`);
      if (!bucket) continue;
      addRow(bucket, row, articleMap);
    }

    const points = months.map(({ year, month }) => {
      const totals = buckets.get(`${year}-${month}`)!;
      return {
        label: monthLabel(year, month),
        handel: totals.handel,
        service: totals.service,
        unassigned: totals.unassigned,
      };
    });

    return { ok: true, points };
  } catch (err) {
    console.error("Unexpected error computing revenue chart data:", err);
    return { ok: false, points: [], error: "Unerwarteter Fehler" };
  }
}

/**
 * Aufschlüsselung nach Rabattgruppe für genau eine Kategorie (Handel oder
 * Service) — wird angezeigt, wenn der Nutzer auf die entsprechende KPI-Kachel
 * klickt (Spec 2.3, gleiches Toggle-Muster wie das Donut-Chart der
 * Bestellhistorie).
 */
export async function getPartnerRevenueGroupChartData(
  partnerId: string,
  period: RevenuePeriod,
  category: "handel" | "service"
): Promise<RevenueGroupChartResult> {
  try {
    const supabase = createAdminClient({ schema: "tms" });
    const { current } = resolvePeriodRanges(period);
    const rows = await fetchPartnerRevenueRows(supabase, partnerId, current.from, current.to);
    const articleMap = await buildArticleInfoMap(supabase, rows.map((r) => r.article_number));

    const targetType = category === "handel" ? "PRODUCT" : "SERVICE";
    const relevantRows = rows.filter(
      (r) => articleMap.get(r.article_number || "")?.type === targetType
    );

    const isAll = period.type === "all";
    const bucketKeys: { key: string; label: string }[] = isAll
      ? [...new Set(relevantRows.map((r) => documentYearMonth(r.document_date).year))]
          .sort((a, b) => a - b)
          .map((year) => ({ key: `${year}`, label: `${year}` }))
      : current.from && current.to
        ? enumerateMonths(current.from, current.to).map(({ year, month }) => ({
            key: `${year}-${month}`,
            label: monthLabel(year, month),
          }))
        : [];

    const pointValues = new Map<string, Record<string, number>>();
    for (const b of bucketKeys) pointValues.set(b.key, {});

    for (const row of relevantRows) {
      const { year, month } = documentYearMonth(row.document_date);
      const key = isAll ? `${year}` : `${year}-${month}`;
      const values = pointValues.get(key);
      if (!values) continue;
      const groupName = articleMap.get(row.article_number || "")?.group_name || "Ohne Gruppe";
      values[groupName] = (values[groupName] || 0) + centsToEuro(row.total_price_net);
    }

    const groupNames = new Set<string>();
    for (const values of pointValues.values()) {
      for (const name of Object.keys(values)) groupNames.add(name);
    }

    const points = bucketKeys.map((b) => ({ label: b.label, values: pointValues.get(b.key) || {} }));

    return { ok: true, points, groupNames: [...groupNames].sort() };
  } catch (err) {
    console.error("Unexpected error computing revenue group chart data:", err);
    return { ok: false, points: [], groupNames: [], error: "Unerwarteter Fehler" };
  }
}

export async function getAvailableRevenueYears(
  partnerId: string
): Promise<{ ok: boolean; years: number[]; error?: string }> {
  try {
    const supabase = createAdminClient({ schema: "tms" });
    const dates = await fetchPartnerInvoiceDates(supabase, partnerId);
    const years = [...new Set(dates.map((d) => documentYearMonth(d).year))].sort((a, b) => b - a);
    return { ok: true, years };
  } catch (err) {
    console.error("Unexpected error fetching available revenue years:", err);
    return { ok: false, years: [], error: "Unerwarteter Fehler" };
  }
}
