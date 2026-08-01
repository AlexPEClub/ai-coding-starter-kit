"use server";

// PROJ-21 — Fahrer: Tourenliste (nur Anzeige)
// "Fahrt" = einzelne Abholung/Stopp (Datensatz in tms.tours).
// "Tour" = alle offenen Fahrten eines Fahrers an einem Tag, gebündelt beim Anzeigen.

import { getCurrentProfile, type Profile } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { gruppiereZuTouren, type FahrerOption, type RohFahrt, type Tour } from "./fahrten-helpers";

export type { Fahrt, Tour, FahrerOption } from "./fahrten-helpers";

const OFFENE_STATUS = ["geplant", "unterwegs", "angekommen", "problem"] as const;

export type FahrtenResult =
  | { ok: true; data: Tour[] }
  | { ok: false; error: string };

/**
 * Rollen-Check direkt in den Aktionen (nicht nur im Seiten-Gate von page.tsx) —
 * schützt auch, falls eine dieser Aktionen künftig an eine Client Component
 * durchgereicht wird (QA BUG-1, PROJ-21).
 */
async function pruefeFahrerZugriff(): Promise<
  { ok: true; profile: Profile } | { ok: false; error: string }
> {
  const profile = await getCurrentProfile();

  if (!profile) {
    return { ok: false, error: "Nicht eingeloggt." };
  }
  if (!profile.roles?.some((r) => r === "fahrer" || r === "admin")) {
    return { ok: false, error: "Keine Berechtigung." };
  }

  return { ok: true, profile };
}

/** Lädt die Abhol-("shipping"-)Adresse je Kunde nachträglich und ordnet sie zu. */
async function ladeAdressenFuerPartner(
  adminClient: ReturnType<typeof createAdminClient>,
  partnerIds: string[]
): Promise<Map<string, { strasse: string | null; plz: string | null; ort: string | null }>> {
  const adressen = new Map<
    string,
    { strasse: string | null; plz: string | null; ort: string | null }
  >();

  if (partnerIds.length === 0) return adressen;

  const { data, error } = await adminClient
    .from("partner_addresses")
    .select("partner_id, street, postal_code, city")
    .in("partner_id", partnerIds)
    .eq("address_type", "shipping");

  if (error) {
    console.error("ladeAdressenFuerPartner error:", error);
    return adressen;
  }

  for (const row of data ?? []) {
    adressen.set(row.partner_id, {
      strasse: row.street ?? null,
      plz: row.postal_code ?? null,
      ort: row.city ?? null,
    });
  }

  return adressen;
}

export async function getEigeneOffeneTouren(): Promise<FahrtenResult> {
  const zugriff = await pruefeFahrerZugriff();
  if (!zugriff.ok) return zugriff;
  const { profile } = zugriff;

  // tms.tours hat keine GRANTs für die normale (authenticated) Rolle — nur
  // service_role darf lesen. Die Einschränkung "nur eigene Fahrten" wird
  // deshalb explizit hier im Code über fahrer_id = aktueller User erzwungen.
  const adminClient = createAdminClient({ schema: "tms" });

  const { data, error } = await adminClient
    .from("tours")
    .select(
      `
      id,
      status,
      geplantes_abholdatum,
      partner_id,
      partners:partner_id ( display_name, company_name )
    `
    )
    .eq("fahrer_id", profile.id)
    .in("status", OFFENE_STATUS)
    .order("geplantes_abholdatum", { ascending: true });

  if (error) {
    console.error("getEigeneOffeneTouren error:", error);
    return { ok: false, error: "Touren konnten nicht geladen werden." };
  }

  const rows = data ?? [];
  const adressen = await ladeAdressenFuerPartner(
    adminClient,
    Array.from(new Set(rows.map((row: any) => row.partner_id).filter(Boolean)))
  );

  const fahrten: RohFahrt[] = rows.map((row: any) => {
    const adresse = adressen.get(row.partner_id) ?? { strasse: null, plz: null, ort: null };
    return {
      id: row.id,
      status: row.status,
      geplantesAbholdatum: row.geplantes_abholdatum,
      fahrerId: profile.id,
      fahrerName: null,
      kunde: {
        name: row.partners?.display_name ?? row.partners?.company_name ?? "Unbekannter Kunde",
        ...adresse,
      },
    };
  });

  return { ok: true, data: gruppiereZuTouren(fahrten) };
}

/** Für den Tab "Tourenplanung": offene Touren aller Fahrer (Fahrer + Admin dürfen das sehen). */
export async function getAlleOffeneTouren(): Promise<FahrtenResult> {
  const zugriff = await pruefeFahrerZugriff();
  if (!zugriff.ok) return zugriff;

  const adminClient = createAdminClient({ schema: "tms" });

  const { data, error } = await adminClient
    .from("tours")
    .select(
      `
      id,
      status,
      geplantes_abholdatum,
      fahrer_id,
      partner_id,
      partners:partner_id ( display_name, company_name )
    `
    )
    .in("status", OFFENE_STATUS)
    .order("geplantes_abholdatum", { ascending: true });

  if (error) {
    console.error("getAlleOffeneTouren error:", error);
    return { ok: false, error: "Touren konnten nicht geladen werden." };
  }

  const rows = data ?? [];

  const fahrerIds = Array.from(
    new Set(rows.map((row: any) => row.fahrer_id).filter(Boolean))
  );
  const fahrerNamen = new Map<string, string>();
  if (fahrerIds.length > 0) {
    const { data: profileRows, error: profileError } = await adminClient
      .schema("public")
      .from("profiles")
      .select("id, full_name, email")
      .in("id", fahrerIds);

    if (profileError) {
      console.error("getAlleOffeneTouren (Fahrernamen) error:", profileError);
    } else {
      for (const row of profileRows ?? []) {
        fahrerNamen.set(row.id, row.full_name || row.email);
      }
    }
  }

  const adressen = await ladeAdressenFuerPartner(
    adminClient,
    Array.from(new Set(rows.map((row: any) => row.partner_id).filter(Boolean)))
  );

  const fahrten: RohFahrt[] = rows.map((row: any) => {
    const adresse = adressen.get(row.partner_id) ?? { strasse: null, plz: null, ort: null };
    return {
      id: row.id,
      status: row.status,
      geplantesAbholdatum: row.geplantes_abholdatum,
      fahrerId: row.fahrer_id,
      fahrerName: row.fahrer_id ? fahrerNamen.get(row.fahrer_id) ?? "Unbekannter Fahrer" : null,
      kunde: {
        name: row.partners?.display_name ?? row.partners?.company_name ?? "Unbekannter Kunde",
        ...adresse,
      },
    };
  });

  return { ok: true, data: gruppiereZuTouren(fahrten) };
}

/** Fahrer-Liste für den Filter im Tab "Tourenplanung" (Rolle "fahrer"). */
export async function listFahrerOptionen(): Promise<
  { ok: true; data: FahrerOption[] } | { ok: false; error: string }
> {
  const zugriff = await pruefeFahrerZugriff();
  if (!zugriff.ok) return zugriff;

  const adminClient = createAdminClient({ schema: "public" });

  const { data, error } = await adminClient
    .from("profiles")
    .select("id, full_name, email")
    .contains("roles", ["fahrer"])
    .order("full_name", { ascending: true });

  if (error) {
    console.error("listFahrerOptionen error:", error);
    return { ok: false, error: "Fahrer konnten nicht geladen werden." };
  }

  return {
    ok: true,
    data: (data ?? []).map((row) => ({ id: row.id, name: row.full_name || row.email })),
  };
}
