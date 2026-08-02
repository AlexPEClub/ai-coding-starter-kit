/**
 * PROJ-42: Einmaliges Backfill für alle aktuell offenen Tourengruppen.
 * Berechnet Reihenfolge, Gesamtstrecke/-fahrzeit und Ankunftszeit je Stopp
 * über das gemeinsame Modul src/lib/routing/tour-route.ts.
 *
 * Läuft über `tsx` (statt kompiliertem Plain-JS wie scripts/update-holidays.mjs),
 * damit hier dieselbe Routing-Kernlogik wiederverwendet wird, die auch die
 * automatische Neuberechnung nutzt — kein zweites, driftendes Regelwerk.
 *
 * Pro Tourengruppe isolierte Fehlerbehandlung: eine einzelne fehlerhafte
 * Gruppe (ungültige Adresse, Geoapify kurzzeitig down) bricht den Lauf nicht
 * ab. Fehlen die Depot-Koordinaten, wird sofort abgebrochen, BEVOR
 * irgendeine Tour oder Kundenadresse angefragt wird.
 *
 * Sicher erneut ausführbar: überschreibt vorhandene Werte einfach, kein
 * Duplikat-/Idempotenz-Schutz nötig.
 *
 * Usage: npx tsx scripts/PROJ-42_backfill_routen.ts
 */

import { readFileSync } from "node:fs";
import { createAdminClient } from "../src/lib/supabase/admin";
import { berechneUndSpeichereRoute } from "../src/lib/routing/tour-route";

function loadEnvLocal() {
  let content: string;
  try {
    content = readFileSync(".env.local", "utf8");
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
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const OFFENE_STATUS = ["geplant", "unterwegs", "angekommen", "problem"];

async function main() {
  if (!process.env.GEOAPIFY_DEPOT_LAT || !process.env.GEOAPIFY_DEPOT_LON) {
    console.error(
      "Abbruch: GEOAPIFY_DEPOT_LAT/GEOAPIFY_DEPOT_LON sind nicht gesetzt — " +
        "Depot-Koordinaten sind Voraussetzung für jede Berechnung."
    );
    process.exit(1);
  }
  if (!process.env.GEOAPIFY_API_KEY) {
    console.error("Abbruch: GEOAPIFY_API_KEY ist nicht gesetzt.");
    process.exit(1);
  }

  const adminClient = createAdminClient({ schema: "tms" });

  const { data: stopps, error } = await adminClient
    .from("tours")
    .select("fahrer_id, geplantes_abholdatum")
    .in("status", OFFENE_STATUS)
    .not("fahrer_id", "is", null)
    .not("geplantes_abholdatum", "is", null);

  if (error) {
    console.error("Konnte offene Touren nicht laden:", error);
    process.exit(1);
  }

  const gruppen = new Map<string, { fahrerId: string; datum: string }>();
  for (const row of (stopps ?? []) as { fahrer_id: string; geplantes_abholdatum: string }[]) {
    gruppen.set(`${row.fahrer_id}|${row.geplantes_abholdatum}`, {
      fahrerId: row.fahrer_id,
      datum: row.geplantes_abholdatum,
    });
  }

  console.log(`${gruppen.size} offene Tourengruppe(n) gefunden.`);

  let erfolgreich = 0;
  const fehlgeschlagen: { gruppe: string; grund: string }[] = [];

  for (const gruppe of gruppen.values()) {
    const label = `${gruppe.fahrerId} / ${gruppe.datum}`;
    try {
      const ergebnis = await berechneUndSpeichereRoute(adminClient, gruppe.fahrerId, gruppe.datum);
      if (ergebnis.ok) {
        erfolgreich += 1;
        console.log(
          `✓ ${label}: ${ergebnis.stoppAnzahl} Stopp(s), ${ergebnis.distanzMeter}m, ${ergebnis.dauerSekunden}s`
        );
      } else {
        fehlgeschlagen.push({ gruppe: label, grund: ergebnis.grund });
        console.warn(`✗ ${label}: ${ergebnis.grund}`);
      }
    } catch (fehler) {
      const grund = fehler instanceof Error ? fehler.message : String(fehler);
      fehlgeschlagen.push({ gruppe: label, grund });
      console.warn(`✗ ${label}: ${grund}`);
    }
  }

  console.log("\n--- Zusammenfassung ---");
  console.log(`Gesamt: ${gruppen.size}`);
  console.log(`Erfolgreich: ${erfolgreich}`);
  console.log(`Fehlgeschlagen: ${fehlgeschlagen.length}`);
  if (fehlgeschlagen.length > 0) {
    console.log("\nFehlgeschlagene Tourengruppen:");
    for (const f of fehlgeschlagen) console.log(`  - ${f.gruppe}: ${f.grund}`);
  }
}

main();
