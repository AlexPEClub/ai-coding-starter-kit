"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/roles";
import { escapeOrFilterValue } from "@/lib/actions/orders-helpers";

/* ═══════════════════════════════════════════
   Types
   ═══════════════════════════════════════════ */

export type Manufacturer = {
  id: string;
  name: string;
  notes: string | null;
  product_count: number;
  created_at: string;
  updated_at: string;
};

export type ProductWithManufacturer = {
  id: string;
  number: string;
  description: string;
  manufacturer_id: string | null;
  manufacturer_name: string | null;
  type: string;
  group_id: number | null;
  group_name: string | null;
  group_number: string | null;
  cost_price: number | null;
  sale_price: number | null;
  vat_percent: number | null;
  unit: string | null;
  archived: boolean;
  created_at: string;
};

export type PositionGroup = {
  id: number;
  name: string;
  number: string | null;
  display_name: string | null;
};

export type ProductStatsByType = {
  type: string;
  count: number;
};

export type ImportResult = {
  manufacturers_created: number;
  manufacturers_skipped: number;
  products_linked: number;
  products_without_manufacturer: number;
};

/* ═══════════════════════════════════════════
   Admin-Check
   ═══════════════════════════════════════════ */

async function requireAdmin(): Promise<boolean> {
  const profile = await getCurrentProfile();
  return !!profile && isAdmin(profile.roles) && profile.status === "aktiv";
}

/* ═══════════════════════════════════════════
   1) Hersteller importieren (einmalig)
   Nutzt DB-Funktion für zuverlässiges DISTINCT
   ═══════════════════════════════════════════ */

export async function importManufacturers(): Promise<
  { ok: true; data: ImportResult } | { ok: false; error: string }
> {
  if (!(await requireAdmin())) {
    return { ok: false, error: "Keine Berechtigung." };
  }

  try {
    const supabase = createAdminClient({ schema: "tms" });

    // Nutze die DB-Funktion (verwendet DISTINCT + Filter)
    const { data, error } = await supabase
      .rpc("import_manufacturers_from_easybill");

    if (error) throw error;

    const rawResult = data as any;
    const result: ImportResult = Array.isArray(rawResult)
      ? (rawResult[0] as ImportResult)
      : (rawResult as ImportResult) ?? {
          manufacturers_created: 0,
          manufacturers_skipped: 0,
          products_linked: 0,
          products_without_manufacturer: 0,
        };

    revalidatePath("/verwaltung/hersteller");
    revalidatePath("/verwaltung/artikel");

    return { ok: true, data: result };
  } catch (err) {
    console.error("Import-Hersteller-Fehler:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unbekannter Fehler beim Import.",
    };
  }
}

/* ═══════════════════════════════════════════
   2) Hersteller CRUD
   ═══════════════════════════════════════════ */

export async function getManufacturers(): Promise<
  { ok: true; data: Manufacturer[] } | { ok: false; error: string }
> {
  try {
    const supabase = createAdminClient({ schema: "tms" });

    // Zählung direkt in der Datenbank — kein 1.000-Limit-Problem
    const { data, error } = await supabase
      .rpc("get_manufacturers_with_counts");

    if (error) throw error;

    const manufacturers = (data || []).map((m: any) => ({
      ...m,
      product_count: Number(m.product_count || 0),
    }));

    return { ok: true, data: manufacturers };
  } catch (err) {
    console.error("Hersteller laden Fehler:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Fehler beim Laden der Hersteller.",
    };
  }
}

export async function createManufacturer(
  name: string,
  notes?: string
): Promise<
  { ok: true; data: Manufacturer } | { ok: false; error: string }
> {
  if (!(await requireAdmin())) {
    return { ok: false, error: "Keine Berechtigung." };
  }

  const trimmedName = name.trim();
  if (!trimmedName) {
    return { ok: false, error: "Hersteller-Name ist erforderlich." };
  }

  try {
    const supabase = createAdminClient({ schema: "tms" });

    // Prüfen ob Name schon existiert
    const { data: existing } = await supabase
      .from("manufacturers")
      .select("id")
      .eq("name", trimmedName)
      .single();

    if (existing) {
      return { ok: false, error: `Hersteller "${trimmedName}" existiert bereits.` };
    }

    const { data, error } = await supabase
      .from("manufacturers")
      .insert({ name: trimmedName, notes: notes?.trim() || null })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/verwaltung/hersteller");
    revalidatePath("/verwaltung/artikel");

    return {
      ok: true,
      data: { ...data, product_count: 0 },
    };
  } catch (err) {
    console.error("Hersteller anlegen Fehler:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Fehler beim Anlegen.",
    };
  }
}

export async function updateManufacturer(
  id: string,
  name: string,
  notes?: string
): Promise<
  { ok: true; data: Manufacturer } | { ok: false; error: string }
> {
  if (!(await requireAdmin())) {
    return { ok: false, error: "Keine Berechtigung." };
  }

  const trimmedName = name.trim();
  if (!trimmedName) {
    return { ok: false, error: "Hersteller-Name ist erforderlich." };
  }

  try {
    const supabase = createAdminClient({ schema: "tms" });

    // Prüfen ob Name schon bei anderem Hersteller existiert
    const { data: existing } = await supabase
      .from("manufacturers")
      .select("id")
      .eq("name", trimmedName)
      .neq("id", id)
      .single();

    if (existing) {
      return { ok: false, error: `Hersteller "${trimmedName}" existiert bereits.` };
    }

    const { data, error } = await supabase
      .from("manufacturers")
      .update({ name: trimmedName, notes: notes?.trim() || null })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/verwaltung/hersteller");
    revalidatePath("/verwaltung/artikel");

    return {
      ok: true,
      data: { ...data, product_count: 0 },
    };
  } catch (err) {
    console.error("Hersteller aktualisieren Fehler:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Fehler beim Aktualisieren.",
    };
  }
}

export async function deleteManufacturer(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await requireAdmin())) {
    return { ok: false, error: "Keine Berechtigung." };
  }

  try {
    const supabase = createAdminClient({ schema: "tms" });

    // Prüfen ob Artikel verknüpft sind
    const { count, error: countError } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("manufacturer_id", id);

    if (countError) throw countError;

    if ((count || 0) > 0) {
      return {
        ok: false,
        error: `Hersteller kann nicht gelöscht werden — ${count} Artikel sind noch verknüpft.`,
      };
    }

    const { error } = await supabase
      .from("manufacturers")
      .delete()
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/verwaltung/hersteller");
    revalidatePath("/verwaltung/artikel");

    return { ok: true };
  } catch (err) {
    console.error("Hersteller löschen Fehler:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Fehler beim Löschen.",
    };
  }
}

/* ═══════════════════════════════════════════
   3) Artikel mit Hersteller
   ═══════════════════════════════════════════ */

export async function getProducts(filters?: {
  manufacturerId?: string | null;
  groupId?: number | null;
  search?: string;
  type?: "PRODUCT" | "SERVICE" | "all";
  page?: number;
  pageSize?: number;
}): Promise<
  {
    ok: true;
    data: ProductWithManufacturer[];
    total: number;
  } | { ok: false; error: string }
> {
  try {
    const supabase = createAdminClient({ schema: "tms" });
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 50;
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from("products")
      .select(
        "id, number, description, manufacturer_id, type, group_id, cost_price, sale_price, vat_percent, unit, archived, created_at",
        { count: "exact" }
      )
      .range(offset, offset + pageSize - 1);

    // Typ-Filter
    const typeFilter = filters?.type ?? "PRODUCT";
    if (typeFilter !== "all") {
      query = query.eq("type", typeFilter);
    }

    if (filters?.manufacturerId) {
      query = query.eq("manufacturer_id", filters.manufacturerId);
    } else if (filters?.manufacturerId === null) {
      query = query.is("manufacturer_id", null);
    }

    if (filters?.groupId) {
      query = query.eq("group_id", filters.groupId);
    } else if (filters?.groupId === null) {
      query = query.is("group_id", null);
    }

    if (filters?.search) {
      const escaped = escapeOrFilterValue(filters.search);
      query = query.or(
        `number.ilike."%${escaped}%",description.ilike."%${escaped}%"`
      );
    }

    const { data, error, count } = await query;

    if (error) throw error;

    // Hersteller-Namen + Gruppen-Namen holen
    const manufacturerIds = [
      ...new Set((data || []).map((p: any) => p.manufacturer_id).filter(Boolean)),
    ];
    const groupIds = [
      ...new Set((data || []).map((p: any) => p.group_id).filter(Boolean)),
    ];

    let nameMap = new Map<string, string>();
    if (manufacturerIds.length > 0) {
      const { data: manufacturers } = await supabase
        .from("manufacturers")
        .select("id, name")
        .in("id", manufacturerIds);

      for (const m of manufacturers || []) {
        nameMap.set(m.id, m.name);
      }
    }

    let groupMap = new Map<number, { name: string; number: string | null }>();
    if (groupIds.length > 0) {
      const { data: groups } = await supabase
        .from("position_groups")
        .select("id, name, number")
        .in("id", groupIds);

      for (const g of groups || []) {
        groupMap.set(g.id, { name: g.name, number: g.number });
      }
    }

    const products = (data || []).map((p: any) => ({
      ...p,
      manufacturer_name: nameMap.get(p.manufacturer_id || "") || null,
      group_name: p.group_id ? groupMap.get(p.group_id)?.name ?? null : null,
      group_number: p.group_id ? groupMap.get(p.group_id)?.number ?? null : null,
    }));

    return {
      ok: true,
      data: products,
      total: count || 0,
    };
  } catch (err) {
    console.error("Artikel laden Fehler:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Fehler beim Laden der Artikel.",
    };
  }
}

export async function getProductById(
  id: string
): Promise<
  { ok: true; data: ProductWithManufacturer } | { ok: false; error: string }
> {
  try {
    const supabase = createAdminClient({ schema: "tms" });

    const { data, error } = await supabase
      .from("products")
      .select(
        "id, number, description, manufacturer_id, type, group_id, cost_price, sale_price, vat_percent, unit, archived, created_at"
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) return { ok: false, error: "Artikel nicht gefunden." };

    // Hersteller-Name
    let manufacturer_name: string | null = null;
    if (data.manufacturer_id) {
      const { data: m } = await supabase
        .from("manufacturers")
        .select("name")
        .eq("id", data.manufacturer_id)
        .single();
      manufacturer_name = m?.name ?? null;
    }

    // Gruppen-Name
    let group_name: string | null = null;
    let group_number: string | null = null;
    if (data.group_id) {
      const { data: g } = await supabase
        .from("position_groups")
        .select("name, number")
        .eq("id", data.group_id)
        .single();
      group_name = g?.name ?? null;
      group_number = g?.number ?? null;
    }

    return {
      ok: true,
      data: {
        ...data,
        manufacturer_name,
        group_name,
        group_number,
      },
    };
  } catch (err) {
    console.error("Artikel-Detail Fehler:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Fehler beim Laden des Artikels.",
    };
  }
}

export async function getProductStatsByType(): Promise<
  { ok: true; data: ProductStatsByType[] } | { ok: false; error: string }
> {
  try {
    const supabase = createAdminClient({ schema: "tms" });

    const { data, error } = await supabase
      .from("products")
      .select("type")
      .eq("archived", false);

    if (error) throw error;

    const counts = new Map<string, number>();
    for (const row of data || []) {
      const t = row.type || "UNKNOWN";
      counts.set(t, (counts.get(t) || 0) + 1);
    }

    const stats: ProductStatsByType[] = [];
    counts.forEach((count, type) => {
      stats.push({ type, count });
    });

    return { ok: true, data: stats };
  } catch (err) {
    console.error("Artikel-Statistik Fehler:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Fehler beim Laden der Statistik.",
    };
  }
}

export async function getPositionGroups(): Promise<
  { ok: true; data: PositionGroup[] } | { ok: false; error: string }
> {
  try {
    const supabase = createAdminClient({ schema: "tms" });

    const { data, error } = await supabase
      .from("position_groups")
      .select("id, name, number, display_name")
      .order("number", { ascending: true });

    if (error) throw error;

    return { ok: true, data: data || [] };
  } catch (err) {
    console.error("Rabattgruppen laden Fehler:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Fehler beim Laden der Gruppen.",
    };
  }
}

export async function updateProductManufacturer(
  productId: string,
  manufacturerId: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await requireAdmin())) {
    return { ok: false, error: "Keine Berechtigung." };
  }

  try {
    const supabase = createAdminClient({ schema: "tms" });

    const { error } = await supabase
      .from("products")
      .update({ manufacturer_id: manufacturerId })
      .eq("id", productId);

    if (error) throw error;

    revalidatePath("/verwaltung/artikel");

    return { ok: true };
  } catch (err) {
    console.error("Artikel-Hersteller-Zuordnung Fehler:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Fehler beim Zuordnen.",
    };
  }
}

export async function bulkUpdateProductManufacturers(
  productIds: string[],
  manufacturerId: string | null
): Promise<{ ok: true; updated: number } | { ok: false; error: string }> {
  if (!(await requireAdmin())) {
    return { ok: false, error: "Keine Berechtigung." };
  }

  if (productIds.length === 0) {
    return { ok: true, updated: 0 };
  }

  try {
    const supabase = createAdminClient({ schema: "tms" });

    const { error } = await supabase
      .from("products")
      .update({ manufacturer_id: manufacturerId })
      .in("id", productIds);

    if (error) throw error;

    revalidatePath("/verwaltung/artikel");

    return { ok: true, updated: productIds.length };
  } catch (err) {
    console.error("Bulk-Zuordnung Fehler:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Fehler beim Zuordnen.",
    };
  }
}
