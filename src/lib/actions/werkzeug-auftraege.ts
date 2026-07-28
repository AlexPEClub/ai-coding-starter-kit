"use server";

// PROJ-34 — Werkzeug-/Auftrags-Fundament, Fahrer-Auftragserfassung & Wareneingang
//
// Echte Supabase-Anbindung gegen das tms-Schema (Migration
// 20260728120000_PROJ-34_werkzeug_auftrag_fundament.sql). Folgt dem
// bestehenden Projektmuster: Lesen über den Session-Client (RLS greift),
// Schreiben über den Admin-Client nach explizitem Rollen-Check in
// Anwendungscode (wie driver-tours.ts/order-defaults.ts).

import { revalidatePath } from "next/cache";
import { createClient, getCurrentProfile, type Profile } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/roles";
import {
  qrCodeSchema,
  gesamtgewichtSchema,
  kommissionBezeichnungSchema,
  ohneCodeNotizSchema,
  druckAnzahlSchema,
} from "@/lib/validations/werkzeug-auftrag";
import { printLabelPdf } from "@/lib/printnode/client";
import { generateQrLabelSheetPdf } from "@/lib/printnode/labels";
import { getKommissionEinstellung } from "@/lib/actions/order-defaults";
import { kommissionsPflichtFehler } from "@/lib/actions/werkzeug-auftraege-helpers";
import { escapeOrFilterValue } from "@/lib/actions/orders-helpers";

/* ────────────────────────── Typen ────────────────────────── */

export type WerkzeugCodeTyp = "laser" | "begleit";

export type Werkzeug = {
  id: string;
  qr_code: string;
  code_typ: WerkzeugCodeTyp;
  ist_gelasert: boolean;
  typ_bezeichnung: string | null;
  partner_id: string | null;
  created_at: string;
};

export type Kommission = {
  id: string;
  partner_id: string;
  bezeichnung: string;
  created_at: string;
};

export type AuftragStatus = "wird_erfasst" | "aufgenommen" | "im_wareneingang_bestaetigt";

export type Auftrag = {
  id: string;
  auftragsnummer: string;
  partner_id: string | null;
  partner_name: string | null;
  tour_id: string | null;
  kommission_id: string | null;
  kommission_freitext: string | null;
  gesamtgewicht_kg: number | null;
  lagerplatz_id: string | null;
  status: AuftragStatus;
  created_by: string | null;
  created_at: string;
};

export type WerkzeugImAuftragStatus = "erfasst" | "im_wareneingang_bestaetigt";

export type WerkzeugImAuftrag = {
  id: string;
  auftrag_id: string;
  werkzeug_id: string | null;
  ohne_code_notiz: string | null;
  status: WerkzeugImAuftragStatus;
  faelligkeit_am: string | null;
  created_at: string;
};

export type Lagerplatz = {
  id: string;
  bezeichnung: string;
  status: "frei" | "belegt";
  auftrag_id: string | null;
};

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type ResolvedQrCode =
  | { type: "werkzeug"; werkzeug: Werkzeug }
  | { type: "auftrag"; auftrag: Auftrag }
  | { type: "kunde"; partnerId: string; partnerName: string }
  | { type: "unbekannt" };

/* ────────────────────────── Rollen-Gate ────────────────────────── */

const RELEVANTE_ROLLEN: UserRole[] = ["fahrer", "wareneingang", "admin"];

async function requireRole(
  allowed: UserRole[] = RELEVANTE_ROLLEN
): Promise<{ ok: true; profile: Profile } | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Nicht eingeloggt." };
  if (profile.status !== "aktiv") return { ok: false, error: "Konto ist nicht aktiv." };
  const hatRolle = profile.roles?.some((r) => allowed.includes(r));
  if (!hatRolle) return { ok: false, error: "Keine Berechtigung für diese Aktion." };
  return { ok: true, profile };
}

/* ────────────────────────── Hilfsfunktionen ────────────────────────── */

function mapAuftragRow(row: any): Auftrag {
  return {
    id: row.id,
    auftragsnummer: row.auftragsnummer,
    partner_id: row.partner_id,
    partner_name: row.partner?.display_name ?? null,
    tour_id: row.tour_id,
    kommission_id: row.kommission_id,
    kommission_freitext: row.kommission_freitext,
    gesamtgewicht_kg: row.gesamtgewicht_kg !== null ? Number(row.gesamtgewicht_kg) : null,
    lagerplatz_id: row.lagerplatz_id,
    status: row.status,
    created_by: row.created_by,
    created_at: row.created_at,
  };
}

async function insertStatusHistorie(
  serviceClient: ReturnType<typeof createAdminClient>,
  werkzeugImAuftragId: string,
  status: string,
  geaendertVon: string | null
) {
  const { error } = await serviceClient.from("werkzeug_status_historie").insert({
    werkzeug_im_auftrag_id: werkzeugImAuftragId,
    status,
    geaendert_von: geaendertVon,
  });
  if (error) console.error("[insertStatusHistorie]", error);
}

/* ────────────────────────── Kommissionen (statische Liste je Kunde) ────────────────────────── */

export async function listKommissionen(partnerId: string): Promise<Kommission[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("tms")
    .from("kommissionen")
    .select("*")
    .eq("partner_id", partnerId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[listKommissionen]", error);
    return [];
  }
  return data ?? [];
}

export async function addKommission(
  partnerId: string,
  bezeichnung: string
): Promise<ActionResult<Kommission>> {
  const roleCheck = await requireRole();
  if (!roleCheck.ok) return roleCheck;

  const parsed = kommissionBezeichnungSchema.safeParse(bezeichnung);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültige Bezeichnung." };
  }

  const serviceClient = createAdminClient({ schema: "tms" });
  const { data, error } = await serviceClient
    .from("kommissionen")
    .insert({ partner_id: partnerId, bezeichnung: parsed.data })
    .select()
    .single();

  if (error) {
    console.error("[addKommission]", error);
    return { ok: false, error: "Kommission konnte nicht angelegt werden." };
  }
  revalidatePath(`/kunden/${partnerId}`);
  return { ok: true, data };
}

/* ────────────────────────── QR-Auflösung ────────────────────────── */

export async function resolveQrCode(code: string): Promise<ResolvedQrCode> {
  const parsed = qrCodeSchema.safeParse(code);
  if (!parsed.success) return { type: "unbekannt" };
  const trimmed = parsed.data;

  const supabase = await createClient();

  const { data: werkzeug } = await supabase
    .schema("tms")
    .from("werkzeuge")
    .select("*")
    .eq("qr_code", trimmed)
    .maybeSingle();
  if (werkzeug) return { type: "werkzeug", werkzeug };

  const { data: auftrag } = await supabase
    .schema("tms")
    .from("auftraege")
    .select("*, partner:partners(display_name)")
    .eq("auftragsnummer", trimmed)
    .maybeSingle();
  if (auftrag) return { type: "auftrag", auftrag: mapAuftragRow(auftrag) };

  // BUG-1 (QA 2026-07-28): trimmed ist Scan-/Nutzereingabe und muss vor der
  // Einbettung in einen PostgREST-`.or()`-Filter escaped UND in doppelte
  // Anführungszeichen gesetzt werden — sonst können Zeichen wie `,` weitere
  // Filterbedingungen einschleusen (siehe escapeOrFilterValue-Doku).
  const escapedCode = escapeOrFilterValue(trimmed);
  const { data: partner } = await supabase
    .schema("tms")
    .from("partners")
    .select("id, display_name")
    .or(`partner_number.eq."${escapedCode}",easybill_customer_number.eq."${escapedCode}"`)
    .maybeSingle();
  if (partner) {
    return { type: "kunde", partnerId: partner.id, partnerName: partner.display_name };
  }

  return { type: "unbekannt" };
}

/* ────────────────────────── Auftrag anlegen/laden ────────────────────────── */

export async function createLeererAuftrag(options: {
  partnerId?: string | null;
  tourId?: string | null;
}): Promise<ActionResult<Auftrag>> {
  const roleCheck = await requireRole();
  if (!roleCheck.ok) return roleCheck;

  const serviceClient = createAdminClient({ schema: "tms" });
  const { data, error } = await serviceClient
    .from("auftraege")
    .insert({
      partner_id: options.partnerId ?? null,
      tour_id: options.tourId ?? null,
      created_by: roleCheck.profile.id,
    })
    .select("*, partner:partners(display_name)")
    .single();

  if (error) {
    console.error("[createLeererAuftrag]", error);
    return { ok: false, error: "Auftrag konnte nicht angelegt werden." };
  }
  return { ok: true, data: mapAuftragRow(data) };
}

export async function getAuftrag(auftragId: string): Promise<Auftrag | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("tms")
    .from("auftraege")
    .select("*, partner:partners(display_name)")
    .eq("id", auftragId)
    .maybeSingle();

  if (error) {
    console.error("[getAuftrag]", error);
    return null;
  }
  return data ? mapAuftragRow(data) : null;
}

export async function getWerkzeugeImAuftrag(
  auftragId: string
): Promise<Array<WerkzeugImAuftrag & { werkzeug: Werkzeug | null }>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("tms")
    .from("werkzeuge_im_auftrag")
    .select("*, werkzeug:werkzeuge(*)")
    .eq("auftrag_id", auftragId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getWerkzeugeImAuftrag]", error);
    return [];
  }
  return data ?? [];
}

/** Liste "zuletzt erfasste Aufträge" für die Wareneingang-Übersicht. */
export async function listLetzteAuftraege(limit = 25): Promise<Auftrag[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("tms")
    .from("auftraege")
    .select("*, partner:partners(display_name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[listLetzteAuftraege]", error);
    return [];
  }
  return (data ?? []).map(mapAuftragRow);
}

/** Findet einen noch offenen Auftrag, der das gegebene Werkzeug schon enthält. */
async function findeOffenenAuftragFuerWerkzeug(
  werkzeugId: string,
  exceptAuftragId?: string
): Promise<Auftrag | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("tms")
    .from("werkzeuge_im_auftrag")
    .select("auftrag:auftraege(*, partner:partners(display_name))")
    .eq("werkzeug_id", werkzeugId);

  if (error || !data) return null;

  for (const row of data as any[]) {
    const auftrag = row.auftrag;
    if (!auftrag) continue;
    if (auftrag.id === exceptAuftragId) continue;
    if (auftrag.status !== "im_wareneingang_bestaetigt") {
      return mapAuftragRow(auftrag);
    }
  }
  return null;
}

/* ────────────────────────── Scannen ────────────────────────── */

export type ScanResult =
  | { ok: true; action: "werkzeug_hinzugefuegt" | "kunde_gesetzt" | "keine_aenderung" }
  | { ok: false; error: string }
  | { ok: false; resumeAuftragId: string; hinweis: string };

/**
 * Zentrale Scan-Funktion für Fahrer UND Wareneingang. Jede Regel wird SOFORT
 * geprüft — kein gesammeltes Validieren erst beim Abschluss.
 */
export async function scanCodeIntoAuftrag(auftragId: string, code: string): Promise<ScanResult> {
  const roleCheck = await requireRole();
  if (!roleCheck.ok) return roleCheck;

  const auftrag = await getAuftrag(auftragId);
  if (!auftrag) return { ok: false, error: "Auftrag nicht gefunden." };

  const resolved = await resolveQrCode(code);
  const serviceClient = createAdminClient({ schema: "tms" });

  if (resolved.type === "unbekannt") {
    return { ok: false, error: "Code nicht erkannt." };
  }

  if (resolved.type === "auftrag") {
    if (resolved.auftrag.id === auftragId) {
      return { ok: true, action: "keine_aenderung" };
    }
    if (resolved.auftrag.status !== "im_wareneingang_bestaetigt") {
      return {
        ok: false,
        resumeAuftragId: resolved.auftrag.id,
        hinweis: `Dieser Code gehört bereits zu Auftrag ${resolved.auftrag.auftragsnummer}.`,
      };
    }
    return { ok: false, error: "Dieser Auftrag ist bereits abgeschlossen." };
  }

  if (resolved.type === "kunde") {
    if (auftrag.partner_id && auftrag.partner_id !== resolved.partnerId) {
      return {
        ok: false,
        error: `Auftrag ${auftrag.auftragsnummer} hat schon einen anderen Kunden zugeordnet.`,
      };
    }
    if (!auftrag.partner_id) {
      const { error } = await serviceClient
        .from("auftraege")
        .update({ partner_id: resolved.partnerId })
        .eq("id", auftragId);
      if (error) {
        console.error("[scanCodeIntoAuftrag:kunde]", error);
        return { ok: false, error: "Kunde konnte nicht gespeichert werden." };
      }
    }
    return { ok: true, action: "kunde_gesetzt" };
  }

  // resolved.type === "werkzeug"
  const werkzeug = resolved.werkzeug;

  const supabaseRead = await createClient();
  const { data: bereitsHier } = await supabaseRead
    .schema("tms")
    .from("werkzeuge_im_auftrag")
    .select("id")
    .eq("auftrag_id", auftragId)
    .eq("werkzeug_id", werkzeug.id)
    .maybeSingle();
  if (bereitsHier) {
    return { ok: true, action: "keine_aenderung" };
  }

  const anderenOffenenAuftrag = await findeOffenenAuftragFuerWerkzeug(werkzeug.id, auftragId);
  if (anderenOffenenAuftrag) {
    return {
      ok: false,
      resumeAuftragId: anderenOffenenAuftrag.id,
      hinweis: `Dieses Werkzeug gehört bereits zu Auftrag ${anderenOffenenAuftrag.auftragsnummer}.`,
    };
  }

  if (werkzeug.partner_id && auftrag.partner_id && werkzeug.partner_id !== auftrag.partner_id) {
    const { data: bestehenderKunde } = await supabaseRead
      .schema("tms")
      .from("partners")
      .select("display_name")
      .eq("id", werkzeug.partner_id)
      .maybeSingle();
    const kundenName = bestehenderKunde?.display_name ?? "einem anderen Kunden";
    return {
      ok: false,
      error: `Dieses Werkzeug gehört bereits ${kundenName}.`,
    };
  }

  // "Leerer Auftrag wird angereichert": Werkzeug bringt seinen Kunden mit,
  // falls der Auftrag noch keinen hat. Freier Code wird umgekehrt beim
  // Zuordnen mit dem Kunden des Auftrags aktiviert.
  if (!auftrag.partner_id && werkzeug.partner_id) {
    await serviceClient.from("auftraege").update({ partner_id: werkzeug.partner_id }).eq("id", auftragId);
  } else if (!werkzeug.partner_id && auftrag.partner_id) {
    await serviceClient.from("werkzeuge").update({ partner_id: auftrag.partner_id }).eq("id", werkzeug.id);
  }

  const { data: neueZeile, error: insertError } = await serviceClient
    .from("werkzeuge_im_auftrag")
    .insert({ auftrag_id: auftragId, werkzeug_id: werkzeug.id })
    .select("id")
    .single();

  if (insertError) {
    console.error("[scanCodeIntoAuftrag:werkzeug]", insertError);
    return { ok: false, error: "Werkzeug konnte nicht hinzugefügt werden." };
  }

  await insertStatusHistorie(serviceClient, neueZeile.id, "erfasst", roleCheck.profile.id);

  return { ok: true, action: "werkzeug_hinzugefuegt" };
}

export async function addWerkzeugOhneCode(auftragId: string, notiz: string): Promise<ActionResult> {
  const roleCheck = await requireRole();
  if (!roleCheck.ok) return roleCheck;

  const parsed = ohneCodeNotizSchema.safeParse(
    notiz || "Werkzeug ohne Code — Zuordnung im Werk nachholen"
  );
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültige Notiz." };
  }

  const serviceClient = createAdminClient({ schema: "tms" });
  const { data: neueZeile, error } = await serviceClient
    .from("werkzeuge_im_auftrag")
    .insert({ auftrag_id: auftragId, ohne_code_notiz: parsed.data })
    .select("id")
    .single();

  if (error) {
    console.error("[addWerkzeugOhneCode]", error);
    return { ok: false, error: "Konnte nicht gespeichert werden." };
  }
  await insertStatusHistorie(serviceClient, neueZeile.id, "erfasst", roleCheck.profile.id);
  return { ok: true, data: undefined };
}

export async function removeWerkzeugAusAuftrag(werkzeugImAuftragId: string): Promise<ActionResult> {
  const roleCheck = await requireRole();
  if (!roleCheck.ok) return roleCheck;

  const serviceClient = createAdminClient({ schema: "tms" });
  const { error } = await serviceClient
    .from("werkzeuge_im_auftrag")
    .delete()
    .eq("id", werkzeugImAuftragId);

  if (error) {
    console.error("[removeWerkzeugAusAuftrag]", error);
    return { ok: false, error: "Konnte nicht entfernt werden." };
  }
  return { ok: true, data: undefined };
}

/** Fallback für den Wareneingang, wenn kein Kunden-Code auffindbar ist — unterliegt denselben Sofort-Regeln wie ein Scan. */
export async function setKundeManuell(
  auftragId: string,
  partnerId: string,
  partnerName: string
): Promise<ActionResult> {
  const roleCheck = await requireRole();
  if (!roleCheck.ok) return roleCheck;

  const auftrag = await getAuftrag(auftragId);
  if (!auftrag) return { ok: false, error: "Auftrag nicht gefunden." };
  if (auftrag.partner_id && auftrag.partner_id !== partnerId) {
    return {
      ok: false,
      error: `Auftrag ${auftrag.auftragsnummer} hat schon einen anderen Kunden zugeordnet.`,
    };
  }

  const serviceClient = createAdminClient({ schema: "tms" });
  const { error } = await serviceClient
    .from("auftraege")
    .update({ partner_id: partnerId })
    .eq("id", auftragId);

  if (error) {
    console.error("[setKundeManuell]", error);
    return { ok: false, error: "Kunde konnte nicht gespeichert werden." };
  }
  return { ok: true, data: undefined };
}

export async function setKommissionAmAuftrag(
  auftragId: string,
  kommission: { kommissionId?: string | null; freitext?: string | null }
): Promise<ActionResult> {
  const roleCheck = await requireRole();
  if (!roleCheck.ok) return roleCheck;

  const serviceClient = createAdminClient({ schema: "tms" });
  const { error } = await serviceClient
    .from("auftraege")
    .update({
      kommission_id: kommission.kommissionId ?? null,
      kommission_freitext: kommission.freitext ?? null,
    })
    .eq("id", auftragId);

  if (error) {
    console.error("[setKommissionAmAuftrag]", error);
    return { ok: false, error: "Kommission konnte nicht gespeichert werden." };
  }
  return { ok: true, data: undefined };
}

/* ────────────────────────── Aufnehmen (Fahrer) ────────────────────────── */

async function pruefeKommissionsPflicht(auftrag: Auftrag): Promise<string | null> {
  if (!auftrag.partner_id) return null;
  const einstellung = await getKommissionEinstellung(auftrag.partner_id);
  return kommissionsPflichtFehler(einstellung, auftrag);
}

export async function aufnehmenAuftrag(auftragId: string): Promise<ActionResult> {
  const roleCheck = await requireRole();
  if (!roleCheck.ok) return roleCheck;

  const auftrag = await getAuftrag(auftragId);
  if (!auftrag) return { ok: false, error: "Auftrag nicht gefunden." };

  if (!auftrag.partner_id) {
    return { ok: false, error: "Auftrag braucht einen Kunden." };
  }

  const zeilen = await getWerkzeugeImAuftrag(auftragId);
  if (zeilen.length === 0) {
    return { ok: false, error: "Mindestens ein Werkzeug erforderlich." };
  }

  const kommissionFehler = await pruefeKommissionsPflicht(auftrag);
  if (kommissionFehler) return { ok: false, error: kommissionFehler };

  const serviceClient = createAdminClient({ schema: "tms" });
  const { error } = await serviceClient
    .from("auftraege")
    .update({ status: "aufgenommen" })
    .eq("id", auftragId);

  if (error) {
    console.error("[aufnehmenAuftrag]", error);
    return { ok: false, error: "Auftrag konnte nicht aufgenommen werden." };
  }

  revalidatePath("/fahrer");
  revalidatePath("/wareneingang");
  return { ok: true, data: undefined };
}

/* ────────────────────────── Wareneingang-Abschluss ────────────────────────── */

export async function setGesamtgewicht(auftragId: string, kg: number): Promise<ActionResult> {
  const roleCheck = await requireRole();
  if (!roleCheck.ok) return roleCheck;

  const parsed = gesamtgewichtSchema.safeParse(kg);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültiges Gewicht." };
  }

  const serviceClient = createAdminClient({ schema: "tms" });
  const { error } = await serviceClient
    .from("auftraege")
    .update({ gesamtgewicht_kg: parsed.data })
    .eq("id", auftragId);

  if (error) {
    console.error("[setGesamtgewicht]", error);
    return { ok: false, error: "Gewicht konnte nicht gespeichert werden." };
  }
  return { ok: true, data: undefined };
}

export async function vorschlagFreienLagerplatz(): Promise<Lagerplatz | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("tms")
    .from("lagerplaetze")
    .select("*")
    .eq("status", "frei")
    .order("bezeichnung", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[vorschlagFreienLagerplatz]", error);
    return null;
  }
  return data ?? null;
}

export async function abschliessenWareneingang(
  auftragId: string,
  lagerplatzId: string | null
): Promise<ActionResult> {
  const roleCheck = await requireRole();
  if (!roleCheck.ok) return roleCheck;

  const auftrag = await getAuftrag(auftragId);
  if (!auftrag) return { ok: false, error: "Auftrag nicht gefunden." };

  if (!auftrag.partner_id) {
    return { ok: false, error: "Auftrag braucht einen Kunden." };
  }
  const zeilen = await getWerkzeugeImAuftrag(auftragId);
  if (zeilen.length === 0) {
    return { ok: false, error: "Mindestens ein Werkzeug erforderlich." };
  }
  if (!auftrag.gesamtgewicht_kg) {
    return { ok: false, error: "Gesamtgewicht ist Pflicht vor dem Abschluss." };
  }

  const kommissionFehler = await pruefeKommissionsPflicht(auftrag);
  if (kommissionFehler) return { ok: false, error: kommissionFehler };

  const serviceClient = createAdminClient({ schema: "tms" });

  if (lagerplatzId) {
    const { data: lagerplatz } = await serviceClient
      .from("lagerplaetze")
      .select("id, status")
      .eq("id", lagerplatzId)
      .maybeSingle();

    if (lagerplatz && lagerplatz.status === "frei") {
      await serviceClient
        .from("lagerplaetze")
        .update({ status: "belegt", auftrag_id: auftragId })
        .eq("id", lagerplatzId);
      await serviceClient.from("auftraege").update({ lagerplatz_id: lagerplatzId }).eq("id", auftragId);
    }
  }

  for (const zeile of zeilen) {
    await serviceClient
      .from("werkzeuge_im_auftrag")
      .update({ status: "im_wareneingang_bestaetigt" })
      .eq("id", zeile.id);
    await insertStatusHistorie(
      serviceClient,
      zeile.id,
      "im_wareneingang_bestaetigt",
      roleCheck.profile.id
    );
  }

  const { error } = await serviceClient
    .from("auftraege")
    .update({ status: "im_wareneingang_bestaetigt" })
    .eq("id", auftragId);

  if (error) {
    console.error("[abschliessenWareneingang]", error);
    return { ok: false, error: "Auftrag konnte nicht abgeschlossen werden." };
  }

  revalidatePath("/wareneingang");
  return { ok: true, data: undefined };
}

/* ────────────────────────── PrintNode (Etiketten drucken) ────────────────────────── */

/**
 * Erzeugt eine neue Charge freier QR-Codes, rendert sie als Etikettenblatt
 * und sendet den Druckauftrag über PrintNode. Freie Codes werden bewusst
 * erst NACH erfolgreichem Druck angelegt — kein Code ohne gedrucktes Etikett.
 */
export async function printQrCodeLabels(
  count: number
): Promise<ActionResult<{ created: number }>> {
  const roleCheck = await requireRole();
  if (!roleCheck.ok) return roleCheck;

  const parsed = druckAnzahlSchema.safeParse(count);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültige Anzahl." };
  }

  const codes = Array.from(
    { length: parsed.data },
    () => `WZ-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
  );

  try {
    const pdfBase64 = await generateQrLabelSheetPdf(codes);
    await printLabelPdf(pdfBase64, `TMS Werkzeug-QR-Codes (${parsed.data})`);
  } catch (err) {
    console.error("[printQrCodeLabels] PrintNode-Fehler:", err);
    return {
      ok: false,
      error: "Druckauftrag konnte nicht gesendet werden. Es wurden keine neuen Codes angelegt.",
    };
  }

  const serviceClient = createAdminClient({ schema: "tms" });
  const { error } = await serviceClient
    .from("werkzeuge")
    .insert(codes.map((qr_code) => ({ qr_code, created_by: roleCheck.profile.id })));

  if (error) {
    console.error("[printQrCodeLabels] DB-Fehler nach Druck:", error);
    return {
      ok: false,
      error: "Etiketten wurden gedruckt, aber die Codes konnten nicht gespeichert werden.",
    };
  }

  revalidatePath("/fahrer");
  revalidatePath("/wareneingang");
  return { ok: true, data: { created: parsed.data } };
}

export async function getFreieCodesAnzahl(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .schema("tms")
    .from("werkzeuge")
    .select("id", { count: "exact", head: true })
    .is("partner_id", null);

  if (error) {
    console.error("[getFreieCodesAnzahl]", error);
    return 0;
  }
  return count ?? 0;
}
