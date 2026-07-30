"use server";

import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/roles";
import { getProducts } from "@/lib/actions/manufacturers";
import { ueberschneidetSichMitBestehenden } from "@/lib/actions/werkzeugkategorien-helpers";

/**
 * PROJ-35 — Werkzeugkategorien & Pfade (Stammdaten)
 *
 * Echte Supabase-Persistenz im `tms`-Schema (Migration
 * 20260729150000_PROJ-35_werkzeugkategorien_pfade_stammdaten.sql).
 * Lesen über den Session-Client (RLS: jeder authentifizierte Nutzer),
 * Schreiben über den Admin-Client nach explizitem Rollen-Check — exakt das
 * Muster aus PROJ-34 (`werkzeug-auftraege.ts`).
 */

/* ═══════════════════════════════════════════
   Types
   ═══════════════════════════════════════════ */

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type Oberkategorie = {
  id: string;
  name: string;
  ist_aktiv: boolean;
};

export type ParameterTyp = "dropdown" | "freitext";

export type GeometrieParameter = {
  id: string;
  name: string;
  typ: ParameterTyp;
  einheit: string | null;
  dropdown_werte: string[];
  in_benutzung: boolean;
  ist_aktiv: boolean;
};

export type Serviceartikel = {
  id: string;
  number: string;
  description: string;
  sale_price: number | null;
};

export type Preisstufe = {
  id: string;
  serviceartikel_id: string;
  von: number | null; // null = frisch angehakter Kandidat, Bereich noch nicht konfiguriert
  bis: number | null;
};

export type PfadOrt = "im_betrieb" | "extern";

export type PfadSchritt = {
  id: string;
  reihenfolge: number;
  name: string;
  ort: PfadOrt;
  dienstleister_id: string | null;
};

export type Pfad = {
  id: string;
  name: string;
  schritte: PfadSchritt[];
};

export type Unterkategorie = {
  id: string;
  oberkategorie_id: string;
  name: string;
  ist_aktiv: boolean;
  parameter_ids: string[];
  preis_parameter_id: string | null;
  standard_pfad_id: string | null;
};

export type UnterkategorieDetail = Unterkategorie & {
  preisstufen: Preisstufe[];
  einsatzbereit: boolean;
};

export type Dienstleister = {
  id: string;
  display_name: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  street: string | null;
  postal_code: string | null;
  city: string | null;
  partner_number: string;
};

/* ═══════════════════════════════════════════
   Auth Guard
   ═══════════════════════════════════════════ */

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!profile?.roles || !isAdmin(profile.roles)) {
    return { ok: false, error: "Nur Admin darf diese Stammdaten bearbeiten." };
  }
  return { ok: true };
}

function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === "23505";
}

/* ═══════════════════════════════════════════
   Oberkategorien
   ═══════════════════════════════════════════ */

export async function listOberkategorien(): Promise<ActionResult<Oberkategorie[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("tms")
    .from("werkzeug_oberkategorien")
    .select("id, name, ist_aktiv")
    .order("name");

  if (error) {
    console.error("[listOberkategorien]", error);
    return { ok: false, error: "Oberkategorien konnten nicht geladen werden." };
  }
  return { ok: true, data: data ?? [] };
}

export async function createOberkategorie(name: string): Promise<ActionResult<Oberkategorie>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Name darf nicht leer sein." };

  const admin = createAdminClient({ schema: "tms" });
  const { data, error } = await admin
    .from("werkzeug_oberkategorien")
    .insert({ name: trimmed })
    .select("id, name, ist_aktiv")
    .single();

  if (error) {
    if (isUniqueViolation(error)) {
      return { ok: false, error: `Oberkategorie "${trimmed}" existiert bereits.` };
    }
    console.error("[createOberkategorie]", error);
    return { ok: false, error: "Oberkategorie konnte nicht angelegt werden." };
  }
  return { ok: true, data };
}

export async function toggleOberkategorieAktiv(id: string): Promise<ActionResult<Oberkategorie>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const admin = createAdminClient({ schema: "tms" });
  const { data: bestehend, error: selectError } = await admin
    .from("werkzeug_oberkategorien")
    .select("id, name, ist_aktiv")
    .eq("id", id)
    .maybeSingle();
  if (selectError || !bestehend) return { ok: false, error: "Oberkategorie nicht gefunden." };

  const { data, error } = await admin
    .from("werkzeug_oberkategorien")
    .update({ ist_aktiv: !bestehend.ist_aktiv })
    .eq("id", id)
    .select("id, name, ist_aktiv")
    .single();

  if (error) {
    console.error("[toggleOberkategorieAktiv]", error);
    return { ok: false, error: "Status konnte nicht geändert werden." };
  }
  return { ok: true, data };
}

/* ═══════════════════════════════════════════
   Geometrie-Parameter-Register
   ═══════════════════════════════════════════ */

export async function listParameter(): Promise<ActionResult<GeometrieParameter[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("tms")
    .from("geometrie_parameter")
    .select("id, name, typ, einheit, dropdown_werte, in_benutzung, ist_aktiv")
    .order("name");

  if (error) {
    console.error("[listParameter]", error);
    return { ok: false, error: "Parameter konnten nicht geladen werden." };
  }
  return { ok: true, data: data ?? [] };
}

export async function createParameter(input: {
  name: string;
  typ: ParameterTyp;
  einheit?: string;
  dropdown_werte?: string[];
}): Promise<ActionResult<GeometrieParameter>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const name = input.name.trim();
  if (!name) return { ok: false, error: "Name darf nicht leer sein." };
  if (input.typ === "dropdown" && (!input.dropdown_werte || input.dropdown_werte.length === 0)) {
    return { ok: false, error: "Ein Dropdown-Parameter braucht mindestens einen Wert." };
  }

  const admin = createAdminClient({ schema: "tms" });
  const { data, error } = await admin
    .from("geometrie_parameter")
    .insert({
      name,
      typ: input.typ,
      einheit: input.typ === "freitext" ? input.einheit?.trim() || null : null,
      dropdown_werte: input.typ === "dropdown" ? input.dropdown_werte! : [],
    })
    .select("id, name, typ, einheit, dropdown_werte, in_benutzung, ist_aktiv")
    .single();

  if (error) {
    if (isUniqueViolation(error)) {
      return { ok: false, error: `Parameter "${name}" existiert bereits.` };
    }
    console.error("[createParameter]", error);
    return { ok: false, error: "Parameter konnte nicht angelegt werden." };
  }
  return { ok: true, data };
}

export async function updateParameterTyp(
  id: string,
  typ: ParameterTyp,
): Promise<ActionResult<GeometrieParameter>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const admin = createAdminClient({ schema: "tms" });
  const { data: bestehend, error: selectError } = await admin
    .from("geometrie_parameter")
    .select("id, name, typ, einheit, dropdown_werte, in_benutzung, ist_aktiv")
    .eq("id", id)
    .maybeSingle();
  if (selectError || !bestehend) return { ok: false, error: "Parameter nicht gefunden." };
  if (bestehend.in_benutzung) {
    return {
      ok: false,
      error: "Typ kann nicht geändert werden — der Parameter wird bereits verwendet.",
    };
  }

  const { data, error } = await admin
    .from("geometrie_parameter")
    .update({
      typ,
      einheit: typ === "freitext" ? bestehend.einheit : null,
      dropdown_werte: typ === "dropdown" ? bestehend.dropdown_werte : [],
    })
    .eq("id", id)
    .select("id, name, typ, einheit, dropdown_werte, in_benutzung, ist_aktiv")
    .single();

  if (error) {
    console.error("[updateParameterTyp]", error);
    return { ok: false, error: "Typ konnte nicht geändert werden." };
  }
  return { ok: true, data };
}

export async function addDropdownWert(id: string, wert: string): Promise<ActionResult<GeometrieParameter>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const trimmed = wert.trim();
  if (!trimmed) return { ok: false, error: "Wert darf nicht leer sein." };

  const admin = createAdminClient({ schema: "tms" });
  const { data: bestehend, error: selectError } = await admin
    .from("geometrie_parameter")
    .select("id, typ, dropdown_werte")
    .eq("id", id)
    .maybeSingle();
  if (selectError || !bestehend) return { ok: false, error: "Parameter nicht gefunden." };
  if (bestehend.typ !== "dropdown") return { ok: false, error: "Kein Dropdown-Parameter." };
  if (bestehend.dropdown_werte.includes(trimmed)) {
    return { ok: false, error: "Wert existiert bereits." };
  }

  const { data, error } = await admin
    .from("geometrie_parameter")
    .update({ dropdown_werte: [...bestehend.dropdown_werte, trimmed] })
    .eq("id", id)
    .select("id, name, typ, einheit, dropdown_werte, in_benutzung, ist_aktiv")
    .single();

  if (error) {
    console.error("[addDropdownWert]", error);
    return { ok: false, error: "Wert konnte nicht hinzugefügt werden." };
  }
  return { ok: true, data };
}

export async function toggleParameterAktiv(id: string): Promise<ActionResult<GeometrieParameter>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const admin = createAdminClient({ schema: "tms" });
  const { data: bestehend, error: selectError } = await admin
    .from("geometrie_parameter")
    .select("id, ist_aktiv")
    .eq("id", id)
    .maybeSingle();
  if (selectError || !bestehend) return { ok: false, error: "Parameter nicht gefunden." };

  const { data, error } = await admin
    .from("geometrie_parameter")
    .update({ ist_aktiv: !bestehend.ist_aktiv })
    .eq("id", id)
    .select("id, name, typ, einheit, dropdown_werte, in_benutzung, ist_aktiv")
    .single();

  if (error) {
    console.error("[toggleParameterAktiv]", error);
    return { ok: false, error: "Status konnte nicht geändert werden." };
  }
  return { ok: true, data };
}

/* ═══════════════════════════════════════════
   Unterkategorien
   ═══════════════════════════════════════════ */

type UnterkategorieRow = {
  id: string;
  oberkategorie_id: string;
  name: string;
  ist_aktiv: boolean;
  preis_parameter_id: string | null;
  standard_pfad_id: string | null;
};

async function ladeDetails(rows: UnterkategorieRow[]): Promise<UnterkategorieDetail[]> {
  if (rows.length === 0) return [];
  const admin = createAdminClient({ schema: "tms" });
  const ids = rows.map((r) => r.id);

  const [{ data: parameterRows }, { data: preisstufenRows }] = await Promise.all([
    admin
      .from("unterkategorie_parameter")
      .select("unterkategorie_id, parameter_id, reihenfolge")
      .in("unterkategorie_id", ids)
      .order("reihenfolge"),
    admin
      .from("preisstufen")
      .select("id, unterkategorie_id, serviceartikel_id, von, bis")
      .in("unterkategorie_id", ids),
  ]);

  const parameterMap = new Map<string, string[]>();
  for (const row of parameterRows ?? []) {
    const liste = parameterMap.get(row.unterkategorie_id) ?? [];
    liste.push(row.parameter_id);
    parameterMap.set(row.unterkategorie_id, liste);
  }

  const preisstufenMap = new Map<string, Preisstufe[]>();
  for (const row of preisstufenRows ?? []) {
    const liste = preisstufenMap.get(row.unterkategorie_id) ?? [];
    liste.push({
      id: row.id,
      serviceartikel_id: String(row.serviceartikel_id),
      von: row.von === null ? null : Number(row.von),
      bis: row.bis === null ? null : Number(row.bis),
    });
    preisstufenMap.set(row.unterkategorie_id, liste);
  }

  return rows.map((r) => {
    const preisstufen = preisstufenMap.get(r.id) ?? [];
    return {
      ...r,
      parameter_ids: parameterMap.get(r.id) ?? [],
      preisstufen,
      // von === null bedeutet: Kandidat angehakt, aber Bereich noch nicht
      // konfiguriert (Platzhalter) — zählt nicht als vollständige Preisstufe.
      einsatzbereit: r.ist_aktiv && preisstufen.some((p) => p.von !== null),
    };
  });
}

export async function listUnterkategorien(
  oberkategorieId?: string,
): Promise<ActionResult<UnterkategorieDetail[]>> {
  const supabase = await createClient();
  let query = supabase
    .schema("tms")
    .from("werkzeug_unterkategorien")
    .select("id, oberkategorie_id, name, ist_aktiv, preis_parameter_id, standard_pfad_id")
    .order("name");
  if (oberkategorieId) query = query.eq("oberkategorie_id", oberkategorieId);

  const { data, error } = await query;
  if (error) {
    console.error("[listUnterkategorien]", error);
    return { ok: false, error: "Unterkategorien konnten nicht geladen werden." };
  }
  return { ok: true, data: await ladeDetails(data ?? []) };
}

export async function getUnterkategorieDetail(id: string): Promise<ActionResult<UnterkategorieDetail>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("tms")
    .from("werkzeug_unterkategorien")
    .select("id, oberkategorie_id, name, ist_aktiv, preis_parameter_id, standard_pfad_id")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return { ok: false, error: "Unterkategorie nicht gefunden." };
  const [detail] = await ladeDetails([data]);
  return { ok: true, data: detail };
}

export async function createUnterkategorie(input: {
  oberkategorie_id: string;
  name: string;
}): Promise<ActionResult<Unterkategorie>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const name = input.name.trim();
  if (!name) return { ok: false, error: "Name darf nicht leer sein." };

  const admin = createAdminClient({ schema: "tms" });
  const { data, error } = await admin
    .from("werkzeug_unterkategorien")
    .insert({ oberkategorie_id: input.oberkategorie_id, name })
    .select("id, oberkategorie_id, name, ist_aktiv, preis_parameter_id, standard_pfad_id")
    .single();

  if (error) {
    if (isUniqueViolation(error)) {
      return { ok: false, error: `Unterkategorie "${name}" existiert bereits in dieser Oberkategorie.` };
    }
    console.error("[createUnterkategorie]", error);
    return { ok: false, error: "Unterkategorie konnte nicht angelegt werden." };
  }
  return { ok: true, data: { ...data, parameter_ids: [] } };
}

export async function toggleUnterkategorieAktiv(id: string): Promise<ActionResult<Unterkategorie>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const admin = createAdminClient({ schema: "tms" });
  const { data: bestehend, error: selectError } = await admin
    .from("werkzeug_unterkategorien")
    .select("id, ist_aktiv")
    .eq("id", id)
    .maybeSingle();
  if (selectError || !bestehend) return { ok: false, error: "Unterkategorie nicht gefunden." };

  const { data, error } = await admin
    .from("werkzeug_unterkategorien")
    .update({ ist_aktiv: !bestehend.ist_aktiv })
    .eq("id", id)
    .select("id, oberkategorie_id, name, ist_aktiv, preis_parameter_id, standard_pfad_id")
    .single();

  if (error) {
    console.error("[toggleUnterkategorieAktiv]", error);
    return { ok: false, error: "Status konnte nicht geändert werden." };
  }
  return { ok: true, data: { ...data, parameter_ids: [] } };
}

export async function setUnterkategorieParameter(
  id: string,
  parameterIds: string[],
): Promise<ActionResult<Unterkategorie>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const admin = createAdminClient({ schema: "tms" });
  const { data: bestehend, error: selectError } = await admin
    .from("werkzeug_unterkategorien")
    .select("id, oberkategorie_id, name, ist_aktiv, preis_parameter_id, standard_pfad_id")
    .eq("id", id)
    .maybeSingle();
  if (selectError || !bestehend) return { ok: false, error: "Unterkategorie nicht gefunden." };

  const { count: stufenCount } = await admin
    .from("preisstufen")
    .select("id", { count: "exact", head: true })
    .eq("unterkategorie_id", id);

  if (
    (stufenCount ?? 0) > 0 &&
    bestehend.preis_parameter_id &&
    !parameterIds.includes(bestehend.preis_parameter_id)
  ) {
    return {
      ok: false,
      error: "Der Preis-Parameter kann nicht entfernt werden, solange Preisstufen existieren.",
    };
  }

  const { error: deleteError } = await admin
    .from("unterkategorie_parameter")
    .delete()
    .eq("unterkategorie_id", id);
  if (deleteError) {
    console.error("[setUnterkategorieParameter:delete]", deleteError);
    return { ok: false, error: "Parameter-Zuordnung konnte nicht gespeichert werden." };
  }

  if (parameterIds.length > 0) {
    const { error: insertError } = await admin.from("unterkategorie_parameter").insert(
      parameterIds.map((parameterId, index) => ({
        unterkategorie_id: id,
        parameter_id: parameterId,
        reihenfolge: index + 1,
      })),
    );
    if (insertError) {
      console.error("[setUnterkategorieParameter:insert]", insertError);
      return { ok: false, error: "Parameter-Zuordnung konnte nicht gespeichert werden." };
    }
  }

  return { ok: true, data: { ...bestehend, parameter_ids: parameterIds } };
}

export async function setPreisParameter(
  unterkategorieId: string,
  parameterId: string,
): Promise<ActionResult<Unterkategorie>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const admin = createAdminClient({ schema: "tms" });
  const { data: bestehend, error: selectError } = await admin
    .from("werkzeug_unterkategorien")
    .select("id, oberkategorie_id, name, ist_aktiv, preis_parameter_id, standard_pfad_id")
    .eq("id", unterkategorieId)
    .maybeSingle();
  if (selectError || !bestehend) return { ok: false, error: "Unterkategorie nicht gefunden." };

  const { data: param, error: paramError } = await admin
    .from("geometrie_parameter")
    .select("id, typ")
    .eq("id", parameterId)
    .maybeSingle();
  if (paramError || !param) return { ok: false, error: "Parameter nicht gefunden." };
  if (param.typ !== "freitext") {
    return { ok: false, error: "Der Preis-Parameter muss numerisch (Freitext+Einheit) sein." };
  }

  const { data: zuordnung } = await admin
    .from("unterkategorie_parameter")
    .select("parameter_id")
    .eq("unterkategorie_id", unterkategorieId)
    .eq("parameter_id", parameterId)
    .maybeSingle();
  if (!zuordnung) return { ok: false, error: "Parameter ist der Unterkategorie noch nicht zugeordnet." };

  const { count: stufenCount } = await admin
    .from("preisstufen")
    .select("id", { count: "exact", head: true })
    .eq("unterkategorie_id", unterkategorieId);

  if ((stufenCount ?? 0) > 0 && bestehend.preis_parameter_id !== parameterId) {
    return {
      ok: false,
      error: "Preis-Parameter kann nicht mehr geändert werden, solange Preisstufen existieren.",
    };
  }

  const { data, error } = await admin
    .from("werkzeug_unterkategorien")
    .update({ preis_parameter_id: parameterId })
    .eq("id", unterkategorieId)
    .select("id, oberkategorie_id, name, ist_aktiv, preis_parameter_id, standard_pfad_id")
    .single();

  if (error) {
    console.error("[setPreisParameter]", error);
    return { ok: false, error: "Preis-Parameter konnte nicht gespeichert werden." };
  }
  return { ok: true, data: { ...data, parameter_ids: [] } };
}

export async function assignStandardPfad(
  unterkategorieId: string,
  pfadId: string | null,
): Promise<ActionResult<Unterkategorie>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const admin = createAdminClient({ schema: "tms" });
  const { data, error } = await admin
    .from("werkzeug_unterkategorien")
    .update({ standard_pfad_id: pfadId })
    .eq("id", unterkategorieId)
    .select("id, oberkategorie_id, name, ist_aktiv, preis_parameter_id, standard_pfad_id")
    .single();

  if (error) {
    console.error("[assignStandardPfad]", error);
    return { ok: false, error: "Standard-Pfad konnte nicht gespeichert werden." };
  }
  return { ok: true, data: { ...data, parameter_ids: [] } };
}

/* ═══════════════════════════════════════════
   Serviceartikel (echte tms.products, type=SERVICE)
   ═══════════════════════════════════════════ */

export async function listServiceartikelKandidaten(search?: string): Promise<ActionResult<Serviceartikel[]>> {
  const result = await getProducts({ type: "SERVICE", pageSize: 200, search });
  if (!result.ok) return { ok: false, error: result.error };

  return {
    ok: true,
    data: result.data.map((p) => ({
      id: String(p.id),
      number: p.number,
      description: p.description,
      sale_price: p.sale_price,
    })),
  };
}

export async function createServiceartikel(input: {
  number: string;
  description: string;
  sale_price: number;
}): Promise<ActionResult<Serviceartikel>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const number = input.number.trim();
  const description = input.description.trim();
  if (!number || !description) {
    return { ok: false, error: "Nummer und Bezeichnung sind Pflicht." };
  }

  const admin = createAdminClient({ schema: "tms" });
  const { data, error } = await admin
    .from("products")
    .insert({ number, description, type: "SERVICE", sale_price: input.sale_price })
    .select("id, number, description, sale_price")
    .single();

  if (error) {
    console.error("[createServiceartikel]", error);
    return { ok: false, error: "Serviceartikel konnte nicht angelegt werden." };
  }
  return { ok: true, data: { ...data, id: String(data.id) } };
}

/* ═══════════════════════════════════════════
   Preisstaffel (zweistufig: Kandidaten-Checkbox, dann Bereich)
   ═══════════════════════════════════════════ */

export async function setPreisstaffelKandidaten(
  unterkategorieId: string,
  serviceartikelIds: string[],
): Promise<ActionResult<Preisstufe[]>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const admin = createAdminClient({ schema: "tms" });
  const { data: bestehende, error: selectError } = await admin
    .from("preisstufen")
    .select("id, serviceartikel_id, von, bis")
    .eq("unterkategorie_id", unterkategorieId);
  if (selectError) {
    console.error("[setPreisstaffelKandidaten:select]", selectError);
    return { ok: false, error: "Preisstaffel konnte nicht geladen werden." };
  }

  const zuEntfernen = (bestehende ?? [])
    .filter((s) => !serviceartikelIds.includes(String(s.serviceartikel_id)))
    .map((s) => s.id);
  const bereitsVorhandenIds = new Set((bestehende ?? []).map((s) => String(s.serviceartikel_id)));
  const neueArtikelIds = serviceartikelIds.filter((a) => !bereitsVorhandenIds.has(a));

  if (zuEntfernen.length > 0) {
    const { error } = await admin.from("preisstufen").delete().in("id", zuEntfernen);
    if (error) {
      console.error("[setPreisstaffelKandidaten:delete]", error);
      return { ok: false, error: "Preisstaffel konnte nicht aktualisiert werden." };
    }
  }

  if (neueArtikelIds.length > 0) {
    const { error } = await admin.from("preisstufen").insert(
      neueArtikelIds.map((artikelId) => ({
        unterkategorie_id: unterkategorieId,
        serviceartikel_id: artikelId,
        von: null,
        bis: null,
      })),
    );
    if (error) {
      if (isUniqueViolation(error)) {
        return {
          ok: false,
          error: "Mindestens einer der ausgewählten Serviceartikel ist bereits einer anderen Unterkategorie zugeordnet.",
        };
      }
      console.error("[setPreisstaffelKandidaten:insert]", error);
      return { ok: false, error: "Preisstaffel konnte nicht aktualisiert werden." };
    }
  }

  const { data: aktuelle, error: reloadError } = await admin
    .from("preisstufen")
    .select("id, serviceartikel_id, von, bis")
    .eq("unterkategorie_id", unterkategorieId);
  if (reloadError) return { ok: false, error: "Preisstaffel konnte nicht geladen werden." };

  return {
    ok: true,
    data: (aktuelle ?? []).map((s) => ({
      id: s.id,
      serviceartikel_id: String(s.serviceartikel_id),
      von: s.von === null ? null : Number(s.von),
      bis: s.bis === null ? null : Number(s.bis),
    })),
  };
}

export async function setPreisstufeBereich(
  unterkategorieId: string,
  preisstufeId: string,
  von: number,
  bis: number | null,
): Promise<ActionResult<Preisstufe[]>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  if (bis !== null && bis <= von) {
    return { ok: false, error: '"Bis" muss größer als "Von" sein.' };
  }

  const admin = createAdminClient({ schema: "tms" });
  const { data: alleStufen, error: selectError } = await admin
    .from("preisstufen")
    .select("id, serviceartikel_id, von, bis")
    .eq("unterkategorie_id", unterkategorieId);
  if (selectError) return { ok: false, error: "Preisstaffel konnte nicht geladen werden." };
  if (!alleStufen?.some((s) => s.id === preisstufeId)) {
    return { ok: false, error: "Preisstufe nicht gefunden." };
  }

  const andere = alleStufen
    .filter((s) => s.id !== preisstufeId && s.von !== null)
    .map((s) => ({ von: Number(s.von), bis: s.bis === null ? null : Number(s.bis) }));

  if (ueberschneidetSichMitBestehenden(andere, { von, bis })) {
    return {
      ok: false,
      error: "Der Wertebereich überschneidet sich mit einer bestehenden Preisstufe.",
    };
  }

  const { error: updateError } = await admin
    .from("preisstufen")
    .update({ von, bis })
    .eq("id", preisstufeId);
  if (updateError) {
    console.error("[setPreisstufeBereich]", updateError);
    return { ok: false, error: "Bereich konnte nicht gespeichert werden." };
  }

  const { data: aktuelle, error: reloadError } = await admin
    .from("preisstufen")
    .select("id, serviceartikel_id, von, bis")
    .eq("unterkategorie_id", unterkategorieId);
  if (reloadError) return { ok: false, error: "Preisstaffel konnte nicht geladen werden." };

  return {
    ok: true,
    data: (aktuelle ?? []).map((s) => ({
      id: s.id,
      serviceartikel_id: String(s.serviceartikel_id),
      von: s.von === null ? null : Number(s.von),
      bis: s.bis === null ? null : Number(s.bis),
    })),
  };
}

/* ═══════════════════════════════════════════
   Pfade
   ═══════════════════════════════════════════ */

async function ladePfadMitSchritten(pfadId: string): Promise<Pfad | null> {
  const supabase = await createClient();
  const [{ data: pfad }, { data: schritte }] = await Promise.all([
    supabase.schema("tms").from("pfade").select("id, name").eq("id", pfadId).maybeSingle(),
    supabase
      .schema("tms")
      .from("pfad_schritte")
      .select("id, reihenfolge, name, ort, dienstleister_id")
      .eq("pfad_id", pfadId)
      .order("reihenfolge"),
  ]);
  if (!pfad) return null;
  return { ...pfad, schritte: schritte ?? [] };
}

export async function listPfade(): Promise<ActionResult<Pfad[]>> {
  const supabase = await createClient();
  const { data: pfade, error } = await supabase.schema("tms").from("pfade").select("id, name").order("name");
  if (error) {
    console.error("[listPfade]", error);
    return { ok: false, error: "Pfade konnten nicht geladen werden." };
  }
  if (!pfade || pfade.length === 0) return { ok: true, data: [] };

  const { data: schritte, error: schritteError } = await supabase
    .schema("tms")
    .from("pfad_schritte")
    .select("id, pfad_id, reihenfolge, name, ort, dienstleister_id")
    .in(
      "pfad_id",
      pfade.map((p) => p.id),
    )
    .order("reihenfolge");
  if (schritteError) {
    console.error("[listPfade:schritte]", schritteError);
    return { ok: false, error: "Pfad-Schritte konnten nicht geladen werden." };
  }

  const schritteMap = new Map<string, PfadSchritt[]>();
  for (const s of schritte ?? []) {
    const liste = schritteMap.get(s.pfad_id) ?? [];
    liste.push({
      id: s.id,
      reihenfolge: s.reihenfolge,
      name: s.name,
      ort: s.ort,
      dienstleister_id: s.dienstleister_id,
    });
    schritteMap.set(s.pfad_id, liste);
  }

  return {
    ok: true,
    data: pfade.map((p) => ({ ...p, schritte: schritteMap.get(p.id) ?? [] })),
  };
}

export async function createPfad(name: string): Promise<ActionResult<Pfad>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Name darf nicht leer sein." };

  const admin = createAdminClient({ schema: "tms" });
  const { data, error } = await admin.from("pfade").insert({ name: trimmed }).select("id, name").single();

  if (error) {
    console.error("[createPfad]", error);
    return { ok: false, error: "Pfad konnte nicht angelegt werden." };
  }
  return { ok: true, data: { ...data, schritte: [] } };
}

export async function addPfadSchritt(
  pfadId: string,
  input: { name: string; ort: PfadOrt; dienstleister_id?: string | null },
): Promise<ActionResult<Pfad>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const name = input.name.trim();
  if (!name) return { ok: false, error: "Name darf nicht leer sein." };
  if (input.ort === "extern" && !input.dienstleister_id) {
    return { ok: false, error: 'Bei Ort „extern" muss ein Dienstleister ausgewählt werden.' };
  }

  const admin = createAdminClient({ schema: "tms" });
  const { data: bestehendeSchritte, error: countError } = await admin
    .from("pfad_schritte")
    .select("reihenfolge")
    .eq("pfad_id", pfadId)
    .order("reihenfolge", { ascending: false })
    .limit(1);
  if (countError) {
    console.error("[addPfadSchritt:count]", countError);
    return { ok: false, error: "Schritt konnte nicht hinzugefügt werden." };
  }
  const naechsteReihenfolge = (bestehendeSchritte?.[0]?.reihenfolge ?? 0) + 1;

  const { error } = await admin.from("pfad_schritte").insert({
    pfad_id: pfadId,
    reihenfolge: naechsteReihenfolge,
    name,
    ort: input.ort,
    dienstleister_id: input.ort === "extern" ? input.dienstleister_id! : null,
  });
  if (error) {
    console.error("[addPfadSchritt]", error);
    return { ok: false, error: "Schritt konnte nicht hinzugefügt werden." };
  }

  const aktualisiert = await ladePfadMitSchritten(pfadId);
  if (!aktualisiert) return { ok: false, error: "Pfad nicht gefunden." };
  return { ok: true, data: aktualisiert };
}

export async function removePfadSchritt(pfadId: string, schrittId: string): Promise<ActionResult<Pfad>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const admin = createAdminClient({ schema: "tms" });
  const { error: deleteError } = await admin.from("pfad_schritte").delete().eq("id", schrittId);
  if (deleteError) {
    console.error("[removePfadSchritt]", deleteError);
    return { ok: false, error: "Schritt konnte nicht entfernt werden." };
  }

  const { data: uebrig, error: selectError } = await admin
    .from("pfad_schritte")
    .select("id, reihenfolge")
    .eq("pfad_id", pfadId)
    .order("reihenfolge");
  if (selectError) return { ok: false, error: "Pfad konnte nicht aktualisiert werden." };

  for (let i = 0; i < (uebrig?.length ?? 0); i++) {
    const neueReihenfolge = i + 1;
    if (uebrig![i].reihenfolge !== neueReihenfolge) {
      await admin.from("pfad_schritte").update({ reihenfolge: neueReihenfolge }).eq("id", uebrig![i].id);
    }
  }

  const aktualisiert = await ladePfadMitSchritten(pfadId);
  if (!aktualisiert) return { ok: false, error: "Pfad nicht gefunden." };
  return { ok: true, data: aktualisiert };
}

export async function movePfadSchritt(
  pfadId: string,
  schrittId: string,
  richtung: "auf" | "ab",
): Promise<ActionResult<Pfad>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const admin = createAdminClient({ schema: "tms" });
  const { data: schritte, error: selectError } = await admin
    .from("pfad_schritte")
    .select("id, reihenfolge")
    .eq("pfad_id", pfadId)
    .order("reihenfolge");
  if (selectError || !schritte) return { ok: false, error: "Pfad nicht gefunden." };

  const index = schritte.findIndex((s) => s.id === schrittId);
  if (index === -1) return { ok: false, error: "Schritt nicht gefunden." };

  const zielIndex = richtung === "auf" ? index - 1 : index + 1;
  if (zielIndex < 0 || zielIndex >= schritte.length) {
    const unveraendert = await ladePfadMitSchritten(pfadId);
    return { ok: true, data: unveraendert! };
  }

  const a = schritte[index];
  const b = schritte[zielIndex];

  // Temp-Wert vermeidet Kollision mit UNIQUE(pfad_id, reihenfolge)
  await admin.from("pfad_schritte").update({ reihenfolge: -1 }).eq("id", a.id);
  await admin.from("pfad_schritte").update({ reihenfolge: a.reihenfolge }).eq("id", b.id);
  const { error: finalError } = await admin
    .from("pfad_schritte")
    .update({ reihenfolge: b.reihenfolge })
    .eq("id", a.id);
  if (finalError) {
    console.error("[movePfadSchritt]", finalError);
    return { ok: false, error: "Reihenfolge konnte nicht geändert werden." };
  }

  const aktualisiert = await ladePfadMitSchritten(pfadId);
  if (!aktualisiert) return { ok: false, error: "Pfad nicht gefunden." };
  return { ok: true, data: aktualisiert };
}

/* ═══════════════════════════════════════════
   Externe Dienstleister (tms.partners, partner_type='supplier')
   ═══════════════════════════════════════════ */

export async function listDienstleister(): Promise<ActionResult<Dienstleister[]>> {
  const supabase = await createClient();
  const { data: partners, error } = await supabase
    .schema("tms")
    .from("partners")
    .select("id, display_name, company_name, email, phone, partner_number")
    .eq("partner_type", "supplier")
    .eq("is_active", true)
    .order("display_name");

  if (error) {
    console.error("[listDienstleister]", error);
    return { ok: false, error: "Dienstleister konnten nicht geladen werden." };
  }
  if (!partners || partners.length === 0) return { ok: true, data: [] };

  const ids = partners.map((p) => p.id);
  const [{ data: addresses }, { data: contacts }] = await Promise.all([
    supabase
      .schema("tms")
      .from("partner_addresses")
      .select("partner_id, street, postal_code, city")
      .in("partner_id", ids),
    supabase.schema("tms").from("partner_contacts").select("partner_id, display_name").in("partner_id", ids),
  ]);

  const addressByPartner = new Map((addresses ?? []).map((a) => [a.partner_id, a]));
  const contactByPartner = new Map((contacts ?? []).map((c) => [c.partner_id, c.display_name]));

  return {
    ok: true,
    data: partners.map((p) => {
      const addr = addressByPartner.get(p.id);
      return {
        id: p.id,
        display_name: p.display_name,
        company_name: p.company_name || p.display_name,
        contact_name: contactByPartner.get(p.id) ?? null,
        email: p.email,
        phone: p.phone,
        street: addr?.street ?? null,
        postal_code: addr?.postal_code ?? null,
        city: addr?.city ?? null,
        partner_number: p.partner_number ?? "",
      };
    }),
  };
}

export async function createDienstleister(input: {
  company_name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  street?: string;
  postal_code?: string;
  city?: string;
}): Promise<ActionResult<Dienstleister>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const company = input.company_name.trim();
  if (!company) return { ok: false, error: "Firmenname ist Pflicht." };

  const admin = createAdminClient({ schema: "tms" });
  const { data: partner, error } = await admin
    .from("partners")
    .insert({
      display_name: company,
      company_name: company,
      partner_type: "supplier",
      source_system: "manual",
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
    })
    .select("id, display_name, company_name, email, phone, partner_number")
    .single();

  if (error) {
    console.error("[createDienstleister]", error);
    return { ok: false, error: "Dienstleister konnte nicht angelegt werden." };
  }

  if (input.street || input.postal_code || input.city) {
    const { error: addressError } = await admin.from("partner_addresses").insert({
      partner_id: partner.id,
      address_type: "default",
      is_default: true,
      company_name: company,
      street: input.street?.trim() || null,
      postal_code: input.postal_code?.trim() || null,
      city: input.city?.trim() || null,
    });
    if (addressError) console.error("[createDienstleister:address]", addressError);
  }

  if (input.contact_name?.trim()) {
    const { error: contactError } = await admin.from("partner_contacts").insert({
      partner_id: partner.id,
      display_name: input.contact_name.trim(),
      is_primary: true,
    });
    if (contactError) console.error("[createDienstleister:contact]", contactError);
  }

  return {
    ok: true,
    data: {
      id: partner.id,
      display_name: partner.display_name,
      company_name: partner.company_name || company,
      contact_name: input.contact_name?.trim() || null,
      email: partner.email,
      phone: partner.phone,
      street: input.street?.trim() || null,
      postal_code: input.postal_code?.trim() || null,
      city: input.city?.trim() || null,
      partner_number: partner.partner_number ?? "",
    },
  };
}
