"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/supabase/server";
import { isAdmin, isRedaktion } from "@/lib/roles";

/* ═══════════════════════════════════════════
   Types
   ═══════════════════════════════════════════
   Hinweis: Die Tabellen `tms.content_themen` / `tms.content_themen_quellen`
   entstehen erst in /backend (siehe features/PROJ-30-themenvorschlaege.md,
   Tech Design). Diese Datei legt bereits die Ziel-Query-Shape fest, analog
   zu knowledge-documents.ts.
   ═══════════════════════════════════════════ */

export type ThemenvorschlagStatus = "vorgeschlagen" | "freigegeben" | "abgelehnt";

export type ThemenQuelle = {
  id: string;
  dokumentId: string;
  dokumentDateiname: string;
  fundstelle: string;
};

export type Themenvorschlag = {
  id: string;
  titel: string;
  begruendung: string;
  wochenBatchDatum: string;
  status: ThemenvorschlagStatus;
  entschiedenVonName: string | null;
  entschiedenAm: string | null;
  createdAt: string;
  quellen: ThemenQuelle[];
};

type ThemenvorschlagRow = {
  id: string;
  titel: string;
  begruendung: string;
  wochen_batch_datum: string;
  status: ThemenvorschlagStatus;
  entschieden_von_name: string | null;
  entschieden_am: string | null;
  created_at: string;
  content_themen_quellen: {
    id: string;
    fundstelle: string;
    knowledge_documents: { id: string; file_name: string } | null;
  }[] | null;
};

const SELECT_THEMENVORSCHLAG = `
  id, titel, begruendung, wochen_batch_datum, status,
  entschieden_von_name, entschieden_am, created_at,
  content_themen_quellen (
    id, fundstelle,
    knowledge_documents ( id, file_name )
  )
`;

/* ═══════════════════════════════════════════
   Berechtigungs-Checks
   ═══════════════════════════════════════════ */

async function requireRedaktionOderAdmin(): Promise<boolean> {
  const profile = await getCurrentProfile();
  return (
    !!profile &&
    (isRedaktion(profile.roles) || isAdmin(profile.roles)) &&
    profile.status === "aktiv"
  );
}

function revalidateThemenvorschlaege() {
  revalidatePath("/verwaltung/cms/themenvorschlaege");
}

/* ═══════════════════════════════════════════
   Mapping-Helfer (snake_case DB → camelCase UI)
   ═══════════════════════════════════════════ */

function mapThemenvorschlag(row: ThemenvorschlagRow): Themenvorschlag {
  return {
    id: row.id,
    titel: row.titel,
    begruendung: row.begruendung,
    wochenBatchDatum: row.wochen_batch_datum,
    status: row.status,
    entschiedenVonName: row.entschieden_von_name,
    entschiedenAm: row.entschieden_am,
    createdAt: row.created_at,
    quellen: (row.content_themen_quellen ?? [])
      .filter((q) => q.knowledge_documents !== null)
      .map((q) => ({
        id: q.id,
        dokumentId: q.knowledge_documents!.id,
        dokumentDateiname: q.knowledge_documents!.file_name,
        fundstelle: q.fundstelle,
      })),
  };
}

/* ═══════════════════════════════════════════
   Themenvorschläge — Lesen
   ═══════════════════════════════════════════ */

export async function getOffeneThemenvorschlaege(): Promise<
  { ok: true; data: Themenvorschlag[] } | { ok: false; error: string }
> {
  if (!(await requireRedaktionOderAdmin())) {
    return { ok: false, error: "Keine Berechtigung." };
  }

  try {
    const supabase = createAdminClient({ schema: "tms" });
    const { data, error } = await supabase
      .from("content_themen")
      .select(SELECT_THEMENVORSCHLAG)
      .eq("status", "vorgeschlagen")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { ok: true, data: ((data ?? []) as unknown as ThemenvorschlagRow[]).map(mapThemenvorschlag) };
  } catch (err) {
    console.error("Offene Themenvorschläge laden Fehler:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Fehler beim Laden der Themenvorschläge.",
    };
  }
}

export async function getArchivThemenvorschlaege(): Promise<
  { ok: true; data: Themenvorschlag[] } | { ok: false; error: string }
> {
  if (!(await requireRedaktionOderAdmin())) {
    return { ok: false, error: "Keine Berechtigung." };
  }

  try {
    const supabase = createAdminClient({ schema: "tms" });
    const { data, error } = await supabase
      .from("content_themen")
      .select(SELECT_THEMENVORSCHLAG)
      .in("status", ["freigegeben", "abgelehnt"])
      .order("wochen_batch_datum", { ascending: false })
      .order("entschieden_am", { ascending: false });

    if (error) throw error;

    return { ok: true, data: ((data ?? []) as unknown as ThemenvorschlagRow[]).map(mapThemenvorschlag) };
  } catch (err) {
    console.error("Archiv-Themenvorschläge laden Fehler:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Fehler beim Laden des Archivs.",
    };
  }
}

/* ═══════════════════════════════════════════
   Themenvorschläge — Entscheiden
   (Anlegen neuer Vorschläge läuft NICHT über Server Actions,
   sondern ausschließlich über das Service-Role-Skript aus /backend.)
   ═══════════════════════════════════════════ */

async function entscheideThemenvorschlag(
  id: string,
  status: "freigegeben" | "abgelehnt"
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await requireRedaktionOderAdmin())) {
    return { ok: false, error: "Keine Berechtigung." };
  }

  const profile = await getCurrentProfile();
  const entschiedenVonName = profile?.full_name || profile?.email || "Unbekannt";

  try {
    const supabase = createAdminClient({ schema: "tms" });
    const { data, error } = await supabase
      .from("content_themen")
      .update({
        status,
        entschieden_von: profile?.id ?? null,
        entschieden_von_name: entschiedenVonName,
        entschieden_am: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return { ok: false, error: "Themenvorschlag nicht gefunden." };
    }

    revalidateThemenvorschlaege();
    return { ok: true };
  } catch (err) {
    console.error("Themenvorschlag entscheiden Fehler:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Fehler beim Entscheiden.",
    };
  }
}

export async function freigebenThemenvorschlag(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  return entscheideThemenvorschlag(id, "freigegeben");
}

export async function ablehnenThemenvorschlag(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  return entscheideThemenvorschlag(id, "abgelehnt");
}
