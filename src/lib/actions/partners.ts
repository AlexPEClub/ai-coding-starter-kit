"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { centsToEuro } from "./orders-helpers";

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
  current_year_revenue: number;
  shipping_address?: PartnerAddress | null;
};

/**
 * Kunden laden, sortiert nach aktuellem Jahresumsatz (höchster zuerst).
 * Lädt ALLE aktiven Kunden (mit Paginierung, da >1000) -> Umsatz
 * in der Datenbank aufsummieren -> Top 20 zurückgeben.
 */
export async function getPartnersWithRevenue(
  search?: string,
): Promise<{ ok: true; data: PartnerWithRevenue[] } | { ok: false; error: string }> {
  const supabase = await createClient();
  const currentYear = new Date().getFullYear();

  // 1. Alle aktiven Kunden laden (mit Paginierung, da Supabase nur 1000/Zeile liefert)
  let query = supabase
    .schema("tms")
    .from("partners")
    .select("*")
    .eq("is_active", true)
    .eq("is_archived", false);

  if (search) {
    const isNumeric = /^\d+$/.test(search);
    if (isNumeric) {
      query = query.or(
        `company_name.ilike.%${search}%,display_name.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,easybill_customer_number.eq.${search}`
      );
    } else {
      query = query.or(
        `company_name.ilike.%${search}%,display_name.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
      );
    }
  }

  const PAGE = 1000;
  let partners: any[] = [];
  let from = 0;
  while (true) {
    const { data: chunk, error } = await query.range(from, from + PAGE - 1);
    if (error) {
      console.error("[getPartnersWithRevenue]", error);
      return { ok: false, error: "Konnte Kunden nicht laden." };
    }
    if (!chunk || chunk.length === 0) break;
    partners = partners.concat(chunk);
    if (chunk.length < PAGE) break;
    from += PAGE;
  }

  if (partners.length === 0) {
    return { ok: true, data: [] };
  }

  // 2. Umsatz-Daten für ALLE Partner laden (in Batches) — live aus
  // `tms.invoice_items` statt der nie in Produktion existierenden
  // `mv_partner_monthly_revenue` (siehe features/PROJ-11-kundendetailseite.md,
  // Deploy-Verlauf 2026-07-18 + Umsatz-Tab-Neubau). Läuft über den Admin-Client,
  // da `invoice_items`/`invoices`-GRANTs bisher nur für `service_role` verifiziert
  // sind (siehe revenue.ts).
  const partnerIds = partners.map((p) => p.id);
  const revenueByPartner = new Map<string, number>();
  const BATCH_SIZE = 100;
  const PAGE_REVENUE = 1000;
  const yearFrom = `${currentYear}-01-01`;
  const yearTo = `${currentYear}-12-31`;
  const adminClient = createAdminClient({ schema: "tms" });

  for (let i = 0; i < partnerIds.length; i += BATCH_SIZE) {
    const batchIds = partnerIds.slice(i, i + BATCH_SIZE);

    for (let from = 0; ; from += PAGE_REVENUE) {
      const { data: revenueData, error: revenueError } = await adminClient
        .from("invoice_items")
        .select("total_price_net, invoices!inner(document_date, partner_id)")
        .in("invoices.partner_id", batchIds)
        .gte("invoices.document_date", yearFrom)
        .lte("invoices.document_date", yearTo)
        .order("id", { ascending: true })
        .range(from, from + PAGE_REVENUE - 1);

      if (revenueError) {
        console.error("[getPartnersWithRevenue] Revenue:", revenueError);
        break;
      }

      const batch = (revenueData || []) as any[];
      for (const row of batch) {
        const partnerId = row.invoices?.partner_id;
        if (!partnerId) continue;
        const current = revenueByPartner.get(partnerId) || 0;
        revenueByPartner.set(partnerId, current + centsToEuro(row.total_price_net));
      }
      if (batch.length < PAGE_REVENUE) break;
    }
  }

  // 3. Partner mit Umsatz verknüpfen
  const partnersWithRevenue: PartnerWithRevenue[] = partners.map((p) => ({
    ...p,
    current_year_revenue: revenueByPartner.get(p.id) || 0,
    shipping_address: null,
  }));

  // 4. Sortieren: Mit Umsatz zuerst (absteigend), dann alphabetisch
  partnersWithRevenue.sort((a, b) => {
    const aHasRevenue = a.current_year_revenue > 0;
    const bHasRevenue = b.current_year_revenue > 0;
    if (aHasRevenue && !bHasRevenue) return -1;
    if (!aHasRevenue && bHasRevenue) return 1;
    if (aHasRevenue && bHasRevenue) {
      return b.current_year_revenue - a.current_year_revenue;
    }
    return (a.display_name || "").localeCompare(b.display_name || "");
  });

  // 5. Top 20 auswählen
  const sortedPartners = partnersWithRevenue.slice(0, 20);

  // 6. Lieferadressen nur für die Top 20 laden
  const top20Ids = sortedPartners.map((p) => p.id);
  const { data: addressesData, error: addressesError } = await supabase
    .schema("tms")
    .from("partner_addresses")
    .select("*")
    .in("partner_id", top20Ids)
    .eq("address_type", "shipping");

  if (addressesError) {
    console.error("[getPartnersWithRevenue] Addresses:", addressesError);
  }

  // 7. Adressen zuordnen
  const shippingAddressByPartner = new Map<string, PartnerAddress>();
  if (addressesData) {
    for (const addr of addressesData) {
      shippingAddressByPartner.set(addr.partner_id, addr);
    }
  }

  // 8. Adressen einfügen
  const result: PartnerWithRevenue[] = sortedPartners.map((p) => ({
    ...p,
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
    query = query.or(
      `company_name.ilike.%${search}%,display_name.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getPartners]", error);
    return { ok: false, error: "Konnte Kunden nicht laden." };
  }

  return { ok: true, data: data ?? [] };
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
