/**
 * Cron-Script: Umsatz-Cache für alle aktiven Kunden neu berechnen (PROJ-43).
 * Läuft nächtlich via crontab auf dem Server (gleiches Muster wie
 * update-holidays.mjs). Dasselbe Skript dient auch als einmaliges Backfill
 * direkt nach dem Deploy (`npm run cache:umsatz`) — ein nächtlicher Lauf und
 * das Backfill sind identisch, da beide einfach ALLE aktiven Kunden neu
 * berechnen (idempotent, überschreibt vorhandene Werte, kein
 * Duplikat-Schutz nötig).
 *
 * Definition "Umsatz": rollierende 365 Tage, jede Rechnungsposition zählt
 * unabhängig von Artikel-Zuordnung — identisch zur bisherigen Live-Logik in
 * src/lib/actions/revenue.ts (resolvePeriodRanges, period.type ===
 * "rolling365"). Gespeichert in Cent (wie invoice_items.total_price_net),
 * nicht in Euro — Umrechnung passiert wie überall im Projekt erst bei der
 * Anzeige.
 *
 * Kein Live-Fallback bei Ausfall (siehe Spec): schlägt dieser Job einmal
 * fehl, bleibt einfach der zuletzt geschriebene Cache-Wert stehen, bis der
 * nächste Lauf wieder greift.
 */

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Plain node-Ausführung (Crontab/manuelles Backfill) lädt .env* nicht
// automatisch wie Next.js es tut — gleiches Muster wie
// scripts/PROJ-42_backfill_routen.ts (spätere Datei überschreibt frühere,
// identische Priorität zu docker-compose.yml env_file-Reihenfolge).
function loadEnvDatei(pfad) {
  let content;
  try {
    content = readFileSync(pfad, "utf8");
  } catch {
    return;
  }
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvDatei(".env.production");
loadEnvDatei(".env.local");

const SUPABASE_URL =
  process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://supabase.gudel-werkzeuge.de";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SCHEMA = "tms";
const PAGE = 1000;
const UPDATE_CONCURRENCY = 20;

function toIsoDate(d) {
  return d.toISOString().slice(0, 10);
}

async function ladeAktivePartnerIds(supabase) {
  const ids = [];
  for (let start = 0; ; start += PAGE) {
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from("partners")
      .select("id")
      .eq("is_active", true)
      .eq("is_archived", false)
      .order("id", { ascending: true })
      .range(start, start + PAGE - 1);
    if (error) throw new Error(`Konnte aktive Kunden nicht laden: ${error.message}`);
    const batch = data ?? [];
    for (const p of batch) ids.push(p.id);
    if (batch.length < PAGE) break;
  }
  return ids;
}

async function summiereUmsatzProKunde(supabase, dateFrom, dateTo) {
  const revenueByPartner = new Map();
  for (let start = 0; ; start += PAGE) {
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from("invoice_items")
      .select("total_price_net, invoices!inner(document_date, partner_id)")
      .gte("invoices.document_date", dateFrom)
      .lte("invoices.document_date", dateTo)
      .order("id", { ascending: true })
      .range(start, start + PAGE - 1);
    if (error) throw new Error(`Konnte Rechnungspositionen nicht laden: ${error.message}`);
    const batch = data ?? [];
    for (const row of batch) {
      const partnerId = row.invoices?.partner_id;
      if (!partnerId) continue;
      const cents = Number(row.total_price_net) || 0;
      revenueByPartner.set(partnerId, (revenueByPartner.get(partnerId) || 0) + cents);
    }
    if (batch.length < PAGE) break;
  }
  return revenueByPartner;
}

async function schreibeCache(supabase, partnerIds, revenueByPartner) {
  // Bewusst einzelne .update()-Aufrufe statt .upsert(): ein Upsert mit nur
  // den beiden Cache-Spalten würde Postgres dazu bringen, für den
  // (hier nie eintretenden) Insert-Zweig eine volle Zeile zu prüfen — das
  // scheitert an NOT-NULL-Spalten wie display_name, obwohl die Zeile längst
  // existiert und nur aktualisiert werden soll. .update() betrifft
  // ausschließlich bereits vorhandene Zeilen, kein Insert-Zweig möglich.
  const now = new Date().toISOString();
  let written = 0;
  let failed = 0;

  for (let i = 0; i < partnerIds.length; i += UPDATE_CONCURRENCY) {
    const batch = partnerIds.slice(i, i + UPDATE_CONCURRENCY);
    const results = await Promise.all(
      batch.map((id) =>
        supabase
          .schema(SCHEMA)
          .from("partners")
          .update({
            cached_revenue_365d: revenueByPartner.get(id) || 0,
            cached_revenue_updated_at: now,
          })
          .eq("id", id)
      )
    );
    for (const { error } of results) {
      if (error) {
        failed += 1;
        console.error("  Update-Fehler:", error.message);
      } else {
        written += 1;
      }
    }
  }

  return { written, failed };
}

async function main() {
  if (!SERVICE_ROLE_KEY) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY fehlt");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const today = new Date();
  const from = new Date(today);
  from.setUTCDate(from.getUTCDate() - 365);
  const dateFrom = toIsoDate(from);
  const dateTo = toIsoDate(today);

  console.log(`Berechne Umsatz-Cache für Zeitraum ${dateFrom} bis ${dateTo}...`);

  try {
    const partnerIds = await ladeAktivePartnerIds(supabase);
    console.log(`${partnerIds.length} aktive Kunde(n) gefunden.`);

    const revenueByPartner = await summiereUmsatzProKunde(supabase, dateFrom, dateTo);
    console.log(`Rechnungspositionen für ${revenueByPartner.size} Kunde(n) im Zeitfenster gefunden.`);

    const { written, failed } = await schreibeCache(supabase, partnerIds, revenueByPartner);
    console.log(`\n✅ Fertig: Umsatz-Cache für ${written} Kunde(n) aktualisiert.`);
    if (failed > 0) {
      console.warn(`⚠️  ${failed} Kunde(n) konnten nicht aktualisiert werden (siehe Fehler oben).`);
    }
  } catch (err) {
    console.error("❌", err.message);
    process.exit(1);
  }
}

main();
