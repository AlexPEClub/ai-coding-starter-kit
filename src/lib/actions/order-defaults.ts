"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export type KommissionTyp = "statisch" | "dynamisch";

export type OrderDefault = {
  id: string;
  partner_id: string;
  inbound_type: string | null;
  outbound_type: string | null;
  pickup_delivery_status: string | null;
  driver_id: string | null;
  pickup_cycle_count: number | null;
  pickup_day: number | null;
  source: string | null;
  created_at: string | null;
  updated_at: string | null;
  kommission_pflicht: boolean;
  kommission_typ: KommissionTyp;
};

export type KommissionEinstellung = {
  partner_id: string;
  pflicht: boolean;
  typ: KommissionTyp;
};

export type DriverOption = {
  id: string;
  full_name: string;
};

export type OrderDefaultResult =
  | { ok: true; data: OrderDefault | null }
  | { ok: false; error: string };

export type DriversResult =
  | { ok: true; data: DriverOption[] }
  | { ok: false; error: string };

export type UpsertResult =
  | { ok: true }
  | { ok: false; error: string };

export async function getPartnerOrderDefault(
  partnerId: string,
): Promise<OrderDefaultResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .schema("tms")
    .from("partner_order_defaults")
    .select("*")
    .eq("partner_id", partnerId)
    .maybeSingle();

  if (error) {
    console.error("[getPartnerOrderDefault]", error);
    return { ok: false, error: "Konnte Auftrags-Default nicht laden." };
  }

  return { ok: true, data: data as OrderDefault | null };
}

export async function getDrivers(): Promise<DriversResult> {
  const serviceClient = createAdminClient({ schema: "public" });

  const { data, error } = await serviceClient
    .from("profiles")
    .select("id, full_name, roles")
    .eq("status", "aktiv");

  if (error) {
    console.error("[getDrivers] Error:", error);
    return { ok: false, error: "Konnte Fahrer nicht laden." };
  }

  // Filter: Nur User mit Rolle 'fahrer' im Array
  const drivers: DriverOption[] = (data || [])
    .filter((p: any) => p.roles?.includes('fahrer'))
    .map((p: any) => ({
      id: p.id,
      full_name: p.full_name || "Unbekannt",
    }))
    .sort((a: any, b: any) => a.full_name.localeCompare(b.full_name));

  return { ok: true, data: drivers };
}

export async function upsertPartnerOrderDefault(
  partnerId: string,
  values: {
    inbound_type: string;
    outbound_type: string;
    pickup_delivery_status: string;
    driver_id?: string | null;
    pickup_cycle_count?: number | null;
    pickup_day?: number | null;
  },
): Promise<UpsertResult> {
  const supabase = await createClient();
  const { data: isAdmin, error: adminError } = await supabase.rpc("is_active_admin");

  if (adminError || !isAdmin) {
    return { ok: false, error: "Nur Admins dürfen Auftrags-Defaults bearbeiten." };
  }

  const serviceClient = createAdminClient({ schema: "tms" });

  const needsDriver =
    values.inbound_type === "Abholservice durch Gudel Werkzeuge" ||
    values.outbound_type === "Bringen";

  if (needsDriver && !values.driver_id) {
    return { ok: false, error: "Fahrer ist bei Abholservice oder 'Bringen' erforderlich." };
  }

  const { data: existing } = await serviceClient
    .from("partner_order_defaults")
    .select("id")
    .eq("partner_id", partnerId)
    .maybeSingle();

  const payload = {
    partner_id: partnerId,
    inbound_type: values.inbound_type,
    outbound_type: values.outbound_type,
    pickup_delivery_status: values.pickup_delivery_status,
    driver_id: values.driver_id || null,
    pickup_cycle_count: values.pickup_cycle_count || null,
    pickup_day: values.pickup_day || null,
  };

  let error;
  if (existing) {
    ({ error } = await serviceClient
      .from("partner_order_defaults")
      .update(payload)
      .eq("partner_id", partnerId));
  } else {
    ({ error } = await serviceClient
      .from("partner_order_defaults")
      .insert(payload));
  }

  if (error) {
    console.error("[upsertPartnerOrderDefault]", error);
    return { ok: false, error: "Speichern fehlgeschlagen." };
  }

  revalidatePath(`/kunden/${partnerId}`);
  return { ok: true };
}

/** PROJ-34: Kommissions-Einstellung ist Teil derselben Auftrags-Standardeinstellungen-Zeile. */
export async function getKommissionEinstellung(partnerId: string): Promise<KommissionEinstellung> {
  const result = await getPartnerOrderDefault(partnerId);
  if (!result.ok || !result.data) {
    return { partner_id: partnerId, pflicht: false, typ: "dynamisch" };
  }
  return {
    partner_id: partnerId,
    pflicht: result.data.kommission_pflicht ?? false,
    typ: result.data.kommission_typ ?? "dynamisch",
  };
}

export async function setKommissionEinstellung(
  partnerId: string,
  values: { pflicht: boolean; typ: KommissionTyp },
): Promise<UpsertResult> {
  const supabase = await createClient();
  const { data: isAdmin, error: adminError } = await supabase.rpc("is_active_admin");

  if (adminError || !isAdmin) {
    return { ok: false, error: "Nur Admins dürfen Kommissions-Einstellungen bearbeiten." };
  }

  const serviceClient = createAdminClient({ schema: "tms" });

  const { data: existing } = await serviceClient
    .from("partner_order_defaults")
    .select("id")
    .eq("partner_id", partnerId)
    .maybeSingle();

  const payload = {
    partner_id: partnerId,
    kommission_pflicht: values.pflicht,
    kommission_typ: values.typ,
  };

  let error;
  if (existing) {
    ({ error } = await serviceClient
      .from("partner_order_defaults")
      .update(payload)
      .eq("partner_id", partnerId));
  } else {
    ({ error } = await serviceClient.from("partner_order_defaults").insert(payload));
  }

  if (error) {
    console.error("[setKommissionEinstellung]", error);
    return { ok: false, error: "Speichern fehlgeschlagen." };
  }

  revalidatePath(`/kunden/${partnerId}`);
  return { ok: true };
}
