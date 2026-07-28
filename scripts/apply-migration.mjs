#!/usr/bin/env node
// Führt eine SQL-Migrationsdatei über die bestehende `exec_sql`-RPC aus.
// Liest Zugangsdaten aus .env.local (nie hartcodiert) statt wie das ältere
// scripts/db-crud.js einen Service-Role-Key im Quellcode zu committen.
//
// Usage: node scripts/apply-migration.mjs <pfad-zur-sql-datei>

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  let content;
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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY fehlen (siehe .env.local)."
  );
  process.exit(1);
}

const sqlPath = process.argv[2];
if (!sqlPath) {
  console.error("Usage: node scripts/apply-migration.mjs <pfad-zur-sql-datei>");
  process.exit(1);
}

const sql = readFileSync(sqlPath, "utf8");
const supabase = createClient(url, serviceKey, { db: { schema: "public" } });

const { data, error } = await supabase.rpc("exec_sql", { query: sql });

if (error) {
  console.error("Fehler:", JSON.stringify(error, null, 2));
  process.exit(1);
}

console.log("Migration angewendet:", sqlPath);
if (data) console.log(JSON.stringify(data, null, 2));
