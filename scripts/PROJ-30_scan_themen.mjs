/**
 * Cron-Script: Wöchentliche Themenvorschläge scannen (PROJ-30).
 * Läuft montags 05:00 Uhr via crontab auf dem Server (gleiche Muster wie
 * update-holidays.mjs, PROJ-43_cache_umsatz.mjs). Schlägt bis zu 3 neue
 * Content-Themen vor, indem er:
 *
 * 1. Prüft, ob seit dem letzten Lauf ≥7 Tage vergangen sind (Idempotenz-Sicherung)
 * 2. Claude Sonnet 5 mit Wissensbasis-Metadaten + sperrenden Titeln fragt
 * 3. Für jede Kandidaten-Idee echte Fundstellen via search_knowledge_documents() sucht
 * 4. Kandidaten ohne Fundstellen verwirft
 * 5. Finale Begründungen formuliert
 * 6. Alles-oder-nichts abspeichert (0-3 Themen pro Lauf)
 *
 * Abbruch-Sicherungen:
 * - Kein API-Aufruf, wenn < 7 Tage seit letztem Lauf
 * - Kein Speichern bei KI-Ausfällen oder Validierungsfehlern
 * - Sauberer Fehlschlag mit process.exit(1), sichtbar in Logs
 */

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

// ============================================
// Environment-Loading (analog PROJ-43)
// ============================================
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
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const SCHEMA = "tms";

// ============================================
// Helfer: Datum
// ============================================
function toIsoDate(d) {
  return d.toISOString().slice(0, 10);
}

function daysAgo(d, days) {
  const result = new Date(d);
  result.setUTCDate(result.getUTCDate() - days);
  return result;
}

// ============================================
// Schritt 0: Abstandsprüfung (7 Tage)
// ============================================
async function pruefeAbstand(supabase) {
  const { data, error } = await supabase
    .schema(SCHEMA)
    .from("content_themen")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Konnte letzten Scan-Zeitpunkt nicht prüfen: ${error.message}`);

  if (!data) {
    console.log("✓ Keine vorherigen Themenvorschläge → Scan wird ausgeführt");
    return true; // Erste Ausführung
  }

  const lastRunDate = new Date(data.created_at);
  const sevenDaysAgo = daysAgo(new Date(), 7);

  if (lastRunDate < sevenDaysAgo) {
    console.log(`✓ Letzter Lauf: ${toIsoDate(lastRunDate)} (> 7 Tage) → Scan wird ausgeführt`);
    return true;
  }

  console.log(`⏭️  Letzter Lauf war erst vor ${Math.floor((new Date() - lastRunDate) / (1000 * 60 * 60 * 24))} Tagen → überspringen`);
  return false;
}

// ============================================
// Schritt 1: Lade Wissensbasis-Metadaten + sperrende Titel
// ============================================
async function ladeWissensbasisUndSperrliste(supabase) {
  console.log("Lade Wissensbasis-Metadaten...");

  const { data: dokumente, error: docsError } = await supabase
    .schema(SCHEMA)
    .from("knowledge_documents")
    .select("id, file_name, source, full_text")
    .eq("status", "aktiv");

  if (docsError) throw new Error(`Konnte Wissensbasis nicht laden: ${docsError.message}`);

  const docs = (dokumente || []).map((d) => ({
    id: d.id,
    dateiname: d.file_name,
    quelle: d.source,
    textProbe: d.full_text ? d.full_text.slice(0, 500) : "",
  }));

  console.log(`✓ ${docs.length} aktive Wissensbasis-Dokumente gefunden`);

  // Sperrende Titel: Status vorgeschlagen/freigegeben ODER abgelehnt < 3 Monate
  console.log("Lade sperrende Themenvorschläge...");
  const threeMonthsAgo = daysAgo(new Date(), 90);

  const { data: sperrend, error: sperrError } = await supabase
    .schema(SCHEMA)
    .from("content_themen")
    .select("titel")
    .or(`status.eq.vorgeschlagen,status.eq.freigegeben,and(status.eq.abgelehnt,entschieden_am.gt.${threeMonthsAgo.toISOString()})`);

  if (sperrError) throw new Error(`Konnte sperrende Titel nicht laden: ${sperrError.message}`);

  const sperrTitel = (sperrend || []).map((t) => t.titel);
  console.log(`✓ ${sperrTitel.length} sperrende Titel`);

  return { docs, sperrTitel };
}

// ============================================
// Schritt 1b: Claude schlägt Kandidaten vor
// ============================================
async function frageClaudeNachKandidaten(client, docs, sperrTitel) {
  console.log("Frage Claude nach Kandidaten-Themen...");

  const docsText = docs
    .map((d) => `- ${d.dateiname} (Quelle: ${d.quelle})\n  Probe: ${d.textProbe || "(keine)"}`)
    .join("\n");

  const sperrText = sperrTitel.length > 0 ? `\n\nAktuell sperrend (nicht vorschlagen): ${sperrTitel.join(", ")}` : "";

  const prompt = `Du bist ein Wissensbasis-Analyst. Analysiere folgende Dokumente und schlage bis zu 3 neue, noch nicht erstellte Content-Themen vor:

${docsText}${sperrText}

Für jedes Thema gib folgendes Format aus:
TITEL: <prägnanter, 5-10 Worte Titel>
SUCHBEGRIFFE: <kommagetrennte Stichworte zur Volltextsuche, 5-10 Begriffe>

Beispiel:
TITEL: Richtige Kalibrierung von Hochpräzisions-Messwerkzeugen
SUCHBEGRIFFE: Kalibrierung, Messwerkzeug, Toleranz, Justage, Präzision

Wichtige Regeln:
- Maximal 3 Themen
- Jedes Thema soll eine echte Informationslücke in der Wissensbasis füllen
- Keine generischen Themen
- Keine doppelten Titel zu den sperrenden oben
- Ignoriere sperrende Titel komplett

Antworte nur mit den Themen, ein Thema pro Block, keine zusätzliche Erklärung.`;

  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  // Parse Kandidaten
  const candidates = [];
  const blocks = text.split(/(?=TITEL:)/);
  for (const block of blocks) {
    const titelMatch = block.match(/TITEL:\s*(.+?)(?:\n|$)/);
    const suchMatch = block.match(/SUCHBEGRIFFE:\s*(.+?)(?:\n|$)/);
    if (titelMatch && suchMatch) {
      candidates.push({
        titel: titelMatch[1].trim(),
        suchbegriffe: suchMatch[1].trim(),
      });
    }
  }

  console.log(`✓ Claude schlug ${candidates.length} Kandidaten vor`);
  return candidates;
}

// ============================================
// Schritt 2: Für jeden Kandidaten Fundstellen suchen
// ============================================
async function sucheBewerteteFundstellen(supabase, kandidaten) {
  console.log("Suche Fundstellen für Kandidaten...");

  const bewertet = [];

  for (const k of kandidaten) {
    const { data: treffer, error } = await supabase.rpc("search_knowledge_documents", {
      p_search: k.suchbegriffe,
    });

    if (error) {
      console.warn(`  ⚠️  Kandidat "${k.titel}": Suche fehlgeschlagen (${error.message}) → verworfen`);
      continue;
    }

    const treffer_liste = treffer || [];
    if (treffer_liste.length === 0) {
      console.log(`  ⊘ Kandidat "${k.titel}": Keine Fundstellen → verworfen`);
      continue;
    }

    console.log(`  ✓ Kandidat "${k.titel}": ${treffer_liste.length} Dokument(e) gefunden`);
    bewertet.push({
      ...k,
      treffer: treffer_liste,
    });
  }

  console.log(`✓ ${bewertet.length} von ${kandidaten.length} Kandidaten mit Fundstellen`);
  return bewertet;
}

// ============================================
// Schritt 3: Claude formuliert Begründungen
// ============================================
async function frageClaudeNachBegruendungen(client, bewertetKandidaten) {
  console.log("Hole Begründungen von Claude...");

  const results = [];

  for (const k of bewertetKandidaten) {
    const trefferText = k.treffer
      .slice(0, 3) // max 3 Treffer pro Kandidat
      .map((t) => `- ${t.file_name}: ${t.full_text.slice(0, 300)}`)
      .join("\n");

    const prompt = `Du analysierst, warum ein neues Content-Thema in die Wissensbasis gehört.

Thema: ${k.titel}
Belegende Dokumente:
${trefferText}

Formuliere in 2-3 Sätzen, warum dieses Thema für einen Content-Artikel wertvoll wäre. Wer würde davon profitieren? Was ist die Lücke in der bestehenden Wissensbasis?

Antworte nur mit der Begründung, keine Zusätze.`;

    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const begruendung = response.content[0].type === "text" ? response.content[0].text.trim() : "";

    results.push({
      titel: k.titel,
      begruendung,
      treffer: k.treffer,
    });
  }

  return results;
}

// ============================================
// Schritt 4: Sicherheitsnetz + Speicherung (alles-oder-nichts)
// ============================================
async function speichereThemenBatchAtomarOderNicht(supabase, themenMitBeleg, wochen_batch_datum) {
  console.log(`Speichere ${themenMitBeleg.length} Thema(ta) ab...`);

  // Sicherheitsnetz: Exact-Match-Check gegen sperrend
  const { data: sperrend } = await supabase.schema(SCHEMA).from("content_themen").select("titel");
  const sperrTitel = (sperrend || []).map((t) => t.titel.toLowerCase());

  const zuSpeichern = [];
  for (const t of themenMitBeleg) {
    if (sperrTitel.includes(t.titel.toLowerCase())) {
      console.log(`  ⚠️  "${t.titel}" existiert bereits (case-insensitive) → übersprungen`);
      continue;
    }
    zuSpeichern.push(t);
  }

  if (zuSpeichern.length === 0) {
    console.log("✓ Keine Themen zu speichern (alle durch Duplikat-Check gefiltert)");
    return 0;
  }

  // Alles-oder-nichts: PostgREST kennt keine Client-Transaktion über mehrere
  // Insert-Aufrufe hinweg, daher merken wir uns jede bereits eingefügte
  // thema_id und räumen bei einem Fehler mittendrin explizit wieder auf
  // (ON DELETE CASCADE entfernt die zugehörigen Quellen automatisch mit),
  // statt einen halben Wochen-Batch stehen zu lassen.
  const eingefuegteThemaIds = [];

  try {
    for (const thema of zuSpeichern) {
      const { data: inserted, error: insertErr } = await supabase
        .schema(SCHEMA)
        .from("content_themen")
        .insert({
          titel: thema.titel,
          begruendung: thema.begruendung,
          wochen_batch_datum,
          status: "vorgeschlagen",
        })
        .select("id")
        .single();

      if (insertErr || !inserted) {
        throw new Error(`Fehler beim Insert von "${thema.titel}": ${insertErr?.message || "Kein ID zurück"}`);
      }

      const thema_id = inserted.id;
      eingefuegteThemaIds.push(thema_id);

      // Füge Quellen ein (maximal 5 Treffer)
      const quellen = thema.treffer.slice(0, 5).map((t) => ({
        thema_id,
        dokument_id: t.id,
        fundstelle: `Aus "${t.file_name}"`,
      }));

      if (quellen.length > 0) {
        const { error: quellenErr } = await supabase
          .schema(SCHEMA)
          .from("content_themen_quellen")
          .insert(quellen);

        if (quellenErr) {
          throw new Error(`Fehler beim Insert von Quellen für "${thema.titel}": ${quellenErr.message}`);
        }
      }

      console.log(`  ✓ "${thema.titel}" gespeichert (${quellen.length} Quellen)`);
    }

    console.log(`✅ ${zuSpeichern.length} Thema(ta) erfolgreich gespeichert`);
    return zuSpeichern.length;
  } catch (err) {
    console.error(`❌ Fehler beim Speichern: ${err.message}`);

    if (eingefuegteThemaIds.length > 0) {
      console.error(`  Räume ${eingefuegteThemaIds.length} bereits eingefügte Thema(ta) wieder auf...`);
      const { error: rollbackErr } = await supabase
        .schema(SCHEMA)
        .from("content_themen")
        .delete()
        .in("id", eingefuegteThemaIds);

      if (rollbackErr) {
        console.error(
          `  ❌ Rollback fehlgeschlagen (${rollbackErr.message}) — manuelle Bereinigung nötig für IDs: ${eingefuegteThemaIds.join(", ")}`
        );
      } else {
        console.error(`  ✓ Rollback erfolgreich, Wochen-Batch bleibt leer.`);
      }
    }

    throw err;
  }
}

// ============================================
// Main
// ============================================
async function main() {
  // Validierungen
  if (!SERVICE_ROLE_KEY) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY fehlt");
    process.exit(1);
  }

  if (!ANTHROPIC_API_KEY) {
    console.error("❌ ANTHROPIC_API_KEY fehlt");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: SCHEMA },
  });

  const anthropic = new Anthropic({
    apiKey: ANTHROPIC_API_KEY,
  });

  try {
    console.log(`\n════════════════════════════════════════`);
    console.log(`PROJ-30: Wöchentlicher Themenvorschlag-Scan`);
    console.log(`${new Date().toISOString()}`);
    console.log(`════════════════════════════════════════\n`);

    // Schritt 0: Abstandsprüfung
    const sollScannen = await pruefeAbstand(supabase);
    if (!sollScannen) {
      console.log("\n✅ Scan übersprungen (< 7 Tage seit letztem Lauf)\n");
      process.exit(0);
    }

    // Schritt 1: Lade Wissensbasis + sperrende Titel
    const { docs, sperrTitel } = await ladeWissensbasisUndSperrliste(supabase);
    if (docs.length === 0) {
      console.log("\n⊘ Wissensbasis ist leer → keine Themenvorschläge möglich\n");
      process.exit(0);
    }

    // Schritt 1b: Claude schlägt vor
    const kandidaten = await frageClaudeNachKandidaten(anthropic, docs, sperrTitel);
    if (kandidaten.length === 0) {
      console.log("\n⊘ Claude schlug keine Kandidaten vor\n");
      process.exit(0);
    }

    // Schritt 2: Fundstellen suchen
    const bewertet = await sucheBewerteteFundstellen(supabase, kandidaten);
    if (bewertet.length === 0) {
      console.log("\n⊘ Keine Kandidaten mit Fundstellen gefunden\n");
      process.exit(0);
    }

    // Schritt 3: Begründungen holen
    const themenMitBeleg = await frageClaudeNachBegruendungen(anthropic, bewertet);

    // Schritt 4: Speichern (alles-oder-nichts)
    const wochenDatum = toIsoDate(new Date());
    const gespeichert = await speichereThemenBatchAtomarOderNicht(supabase, themenMitBeleg, wochenDatum);

    console.log(`\n════════════════════════════════════════`);
    console.log(`✅ Scan abgeschlossen: ${gespeichert} Thema(ta) gespeichert`);
    console.log(`════════════════════════════════════════\n`);
  } catch (err) {
    console.error(`\n════════════════════════════════════════`);
    console.error(`❌ Scan fehlgeschlagen`);
    console.error(`${err.message}`);
    console.error(`════════════════════════════════════════\n`);
    process.exit(1);
  }
}

main();
