"use server";

import { createClient } from "@/lib/supabase/server";
import { centsToEuro, escapeOrFilterValue } from "./orders-helpers";

// Types für tms.partners (easybill Kunden)
export type Partner = {
  id: string;
  partner_number: string | null;
  easybill_customer_number: string | null;
  company_name: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  website: string | null;
  vat_identifier: string | null;
  tax_number: string | null;
  is_active: boolean | null;
  is_archived: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

export type PartnerAddress = {
  id: string;
  partner_id: string;
  address_type: string;
  is_default: boolean | null;
  company_name: string | null;
  first_name: string | null;
  last_name: string | null;
  street: string | null;
  additional_line: string | null;
  postal_code: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
};

export type PartnerContact = {
  id: string;
  partner_id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  role: string | null;
  is_primary: boolean | null;
};

export type PartnerActionResult =
  | { ok: true; data: any }
  | { ok: false; error: string };

export type PartnerWithRevenue = Partner & {
  /** Umsatz der letzten rollierenden 365 Tage in Euro (PROJ-43-Cache-Spalte). */
  revenue_365d: number;
  shipping_address?: PartnerAddress | null;
};

const LIST_LIMIT = 20;

/**
 * Kunden laden, sortiert nach Umsatz der letzten 365 Tage (höchster zuerst).
 * Liest den nächtlich vorausberechneten Cache (PROJ-43) statt wie zuvor bei
 * jeder Anfrage alle Kunden zu laden und `invoice_items` live aufzusummieren
 * (siehe features/PROJ-43-globale-kundensuche-umsatz-caching.md, Tech
 * Design) — Datenbank sortiert/begrenzt direkt, kein Vollzugriff auf alle
 * Kunden mehr nötig.
 */
export async function getPartnersWithRevenue(
  search?: string,
): Promise<{ ok: true; data: PartnerWithRevenue[] } | { ok: false; error: string }> {
  const supabase = await createClient();

  let query = supabase
    .schema("tms")
    .from("partners")
    .select("*")
    .eq("is_active", true)
    .eq("is_archived", false);

  if (search) {
    const isNumeric = /^\d+$/.test(search);
    const escaped = escapeOrFilterValue(search);
    query = isNumeric
      ? query.or(
          `company_name.ilike."%${escaped}%",display_name.ilike."%${escaped}%",first_name.ilike."%${escaped}%",last_name.ilike."%${escaped}%",email.ilike."%${escaped}%",easybill_customer_number.eq."${escaped}"`
        )
      : query.or(
          `company_name.ilike."%${escaped}%",display_name.ilike."%${escaped}%",first_name.ilike."%${escaped}%",last_name.ilike."%${escaped}%",email.ilike."%${escaped}%"`
        );
  }

  // Absteigend nach Umsatz sortiert reiht sich Umsatz=0 automatisch ans Ende
  // ein, dort alphabetisch — reproduziert exakt das bisherige zweistufige
  // Sortierverhalten, jetzt aber vollständig in der Datenbank.
  const { data, error } = await query
    .order("cached_revenue_365d", { ascending: false })
    .order("display_name", { ascending: true })
    .limit(LIST_LIMIT);

  if (error) {
    console.error("[getPartnersWithRevenue]", error);
    return { ok: false, error: "Konnte Kunden nicht laden." };
  }

  const partners = data ?? [];
  if (partners.length === 0) {
    return { ok: true, data: [] };
  }

  // Lieferadressen nur für die begrenzte Treffermenge laden
  const partnerIds = partners.map((p) => p.id);
  const { data: addressesData, error: addressesError } = await supabase
    .schema("tms")
    .from("partner_addresses")
    .select("*")
    .in("partner_id", partnerIds)
    .eq("address_type", "shipping");

  if (addressesError) {
    console.error("[getPartnersWithRevenue] Addresses:", addressesError);
  }

  const shippingAddressByPartner = new Map<string, PartnerAddress>();
  for (const addr of addressesData ?? []) {
    shippingAddressByPartner.set(addr.partner_id, addr);
  }

  const result: PartnerWithRevenue[] = partners.map((p) => ({
    ...p,
    revenue_365d: centsToEuro(p.cached_revenue_365d),
    shipping_address: shippingAddressByPartner.get(p.id) || null,
  }));

  return { ok: true, data: result };
}

/**
 * Alle Partners (Kunden) laden mit optionaler Suche
 */
export async function getPartners(
  search?: string,
  status?: "aktiv" | "inaktiv",
): Promise<{ ok: true; data: Partner[] } | { ok: false; error: string }> {
  const supabase = await createClient();

  let query = supabase
    .schema("tms")
    .from("partners")
    .select("*")
    .order("display_name", { ascending: true });

  // Status-Filter
  if (status === "aktiv") {
    query = query.eq("is_active", true).eq("is_archived", false);
  } else if (status === "inaktiv") {
    query = query.or("is_active.eq.false,is_archived.eq.true");
  }

  // Suche
  if (search) {
    const escaped = escapeOrFilterValue(search);
    query = query.or(
      `company_name.ilike."%${escaped}%",display_name.ilike."%${escaped}%",first_name.ilike."%${escaped}%",last_name.ilike."%${escaped}%",email.ilike."%${escaped}%"`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getPartners]", error);
    return { ok: false, error: "Konnte Kunden nicht laden." };
  }

  return { ok: true, data: data ?? [] };
}

export type PartnerSearchResult = {
  id: string;
  displayName: string;
  companyName: string | null;
  city: string | null;
  /** Umsatz der letzten rollierenden 365 Tage in Euro (PROJ-43-Cache-Spalte). */
  revenue365d: number;
};

const HEADER_SEARCH_LIMIT = 8;

/**
 * Schlanke globale Kundensuche für das Header-Suchfeld (PROJ-43). Liefert nur
 * die für das Ergebnis-Dropdown nötigen Felder, begrenzt auf HEADER_SEARCH_LIMIT
 * Treffer. Suchfelder/Kundennummer-Erkennung identisch zu getPartners/
 * getPartnersWithRevenue (Konsistenz laut Spec).
 */
export async function searchPartnersGlobal(
  query: string,
): Promise<{ ok: true; data: PartnerSearchResult[] } | { ok: false; error: string }> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { ok: true, data: [] };
  }

  const supabase = await createClient();
  const isNumeric = /^\d+$/.test(trimmed);

  let dbQuery = supabase
    .schema("tms")
    .from("partners")
    .select("id, display_name, company_name, cached_revenue_365d")
    .eq("is_active", true)
    .eq("is_archived", false);

  const escaped = escapeOrFilterValue(trimmed);
  dbQuery = isNumeric
    ? dbQuery.or(
        `company_name.ilike."%${escaped}%",display_name.ilike."%${escaped}%",first_name.ilike."%${escaped}%",last_name.ilike."%${escaped}%",email.ilike."%${escaped}%",easybill_customer_number.eq."${escaped}"`
      )
    : dbQuery.or(
        `company_name.ilike."%${escaped}%",display_name.ilike."%${escaped}%",first_name.ilike."%${escaped}%",last_name.ilike."%${escaped}%",email.ilike."%${escaped}%"`
      );

  const { data, error } = await dbQuery
    .order("cached_revenue_365d", { ascending: false })
    .order("display_name", { ascending: true })
    .limit(HEADER_SEARCH_LIMIT);

  if (error) {
    console.error("[searchPartnersGlobal]", error);
    return { ok: false, error: "Suche fehlgeschlagen." };
  }

  const partners = data ?? [];
  if (partners.length === 0) {
    return { ok: true, data: [] };
  }

  // Städte nur für die begrenzte Treffermenge nachladen (analog
  // getPartnersWithRevenue, das dasselbe für die Top 20 tut).
  const partnerIds = partners.map((p) => p.id);
  const { data: addresses, error: addressError } = await supabase
    .schema("tms")
    .from("partner_addresses")
    .select("partner_id, city")
    .in("partner_id", partnerIds)
    .eq("address_type", "shipping");

  if (addressError) {
    console.error("[searchPartnersGlobal] Adressen:", addressError);
  }

  const cityByPartner = new Map<string, string | null>();
  for (const addr of addresses ?? []) {
    cityByPartner.set(addr.partner_id, addr.city);
  }

  const result: PartnerSearchResult[] = partners.map((p) => ({
    id: p.id,
    displayName: p.display_name,
    companyName: p.company_name,
    city: cityByPartner.get(p.id) ?? null,
    revenue365d: centsToEuro(p.cached_revenue_365d),
  }));

  return { ok: true, data: result };
}

/**
 * Einzelnen Partner mit Adressen und Kontakten laden
 */
export async function getPartnerById(
  id: string,
): Promise<
  | { ok: true; partner: Partner; addresses: PartnerAddress[]; contacts: PartnerContact[] }
  | { ok: false; error: string }
> {
  const supabase = await createClient();

  // Partner laden
  const { data: partner, error: partnerError } = await supabase
    .schema("tms")
    .from("partners")
    .select("*")
    .eq("id", id)
    .single();

  if (partnerError || !partner) {
    console.error("[getPartnerById]", partnerError);
    return { ok: false, error: "Kunde nicht gefunden." };
  }

  // Adressen laden
  const { data: addresses, error: addrError } = await supabase
    .schema("tms")
    .from("partner_addresses")
    .select("*")
    .eq("partner_id", id)
    .order("is_default", { ascending: false });

  if (addrError) {
    console.error("[getPartnerById] Adressen:", addrError);
  }

  // Kontakte laden
  const { data: contacts, error: contactError } = await supabase
    .schema("tms")
    .from("partner_contacts")
    .select("*")
    .eq("partner_id", id)
    .order("is_primary", { ascending: false });

  if (contactError) {
    console.error("[getPartnerById] Kontakte:", contactError);
  }

  return {
    ok: true,
    partner,
    addresses: addresses ?? [],
    contacts: contacts ?? [],
  };
}

/**
 * Partner-Anzahl für Statistik
 */
export async function getPartnerCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .schema("tms")
    .from("partners")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("[getPartnerCount]", error);
    return 0;
  }

  return count ?? 0;
}
