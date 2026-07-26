"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { calculateEasterSunday, calculateHolidays } from "@/lib/pickup-utils";

export type Tour = {
  id: string;
  partner_id: string;
  auftragsnummer: string | null;
  titel: string | null;
  status: string;
  geplantes_abholdatum: string | null;
  tatsaechliches_abholdatum: string | null;
  fahrer_id: string | null;
  zugang: string | null;
  ruecksendung: string | null;
  abholzyklus_wochen: number | null;
  abholservice: boolean;
  erstellt_am: string;
  geaendert_am: string;
};

export type TourResult =
  | { ok: true; data: Tour | null }
  | { ok: false; error: string };

export type CreateTourPayload = {
  geplantes_abholdatum: string;
  fahrer_id?: string | null;
  titel?: string | null;
};

export type UpsertResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Lädt die nächste geplante Tour für einen Kunden
 */
export async function getNextPickupTour(
  partnerId: string,
): Promise<TourResult> {
  // supabase-js mit Schema-Header (Accept-Profile: tms)
  const serviceClient = createAdminClient({ schema: "tms" });

  const { data, error } = await serviceClient
    .from("tours")
    .select("*")
    .eq("partner_id", partnerId)
    .eq("status", "geplant")
    .order("geplantes_abholdatum", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[getNextPickupTour]", error);
    return { ok: false, error: "Konnte nächste Abholung nicht laden." };
  }

  return { ok: true, data: data as Tour | null };
}

/**
 * Prüft, ob ein Datum blockiert ist (Feiertag oder manueller Blocker)
 */
async function isBlockedDate(
  date: Date,
  serviceClient: any,
): Promise<boolean> {
  const dateStr = date.toISOString().split("T")[0];

  // 1. Prüfe manuelle Blocker (tms.blocked_days)
  const { data: blockedData } = await serviceClient
    .schema("tms")
    .from("blocked_days")
    .select("*")
    .lte("von_datum", dateStr)
    .gte("bis_datum", dateStr)
    .maybeSingle();

  if (blockedData) return true;

  // 2. Prüfe Feiertage NRW
  const holidays = calculateHolidays(date.getFullYear());
  return holidays.some(
    (h) =>
      h.datum.getFullYear() === date.getFullYear() &&
      h.datum.getMonth() === date.getMonth() &&
      h.datum.getDate() === date.getDate(),
  );
}

/**
 * Berechnet das nächste gültige Abholdatum
 */
export async function calculateNextPickupDate(
  partnerId: string,
): Promise<{ ok: true; date: string } | { ok: false; error: string }> {
  const serviceClient = createAdminClient({ schema: "tms" });

  // Lade Defaults
  const { data: defaults, error: defaultsError } = await serviceClient
    .from("partner_order_defaults")
    .select("pickup_day, pickup_cycle_count, fahrer_id")
    .eq("partner_id", partnerId)
    .maybeSingle();

  if (defaultsError || !defaults) {
    return { ok: false, error: "Konnte Kunden-Defaults nicht laden." };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start: Heute + Abholzyklus (Wochen)
  const cycleWeeks = defaults.pickup_cycle_count || 1;
  let targetDate = new Date(today);
  targetDate.setDate(targetDate.getDate() + cycleWeeks * 7);

  // Abholtag (Wochentag) berücksichtigen
  const pickupDay = defaults.pickup_day; // 1=Mo, ..., 5=Fr (ISO)

  if (pickupDay && pickupDay >= 1 && pickupDay <= 5) {
    // Auf den nächsten passenden Wochentag korrigieren
    const currentDay = targetDate.getDay(); // 0=So, 1=Mo, ..., 6=Sa
    const targetDay = pickupDay === 7 ? 0 : pickupDay; // ISO -> JS: 7=So -> 0=So
    
    let daysDiff = targetDay - currentDay;
    if (daysDiff < 0) daysDiff += 7;
    if (daysDiff === 0) daysDiff = 7; // Nächste Woche, nicht heute
    
    targetDate.setDate(targetDate.getDate() + daysDiff);
  }

  // Feiertage und Blocker überspringen
  let attempts = 0;
  const maxAttempts = 365; // Max 1 Jahr in Zukunft

  while (await isBlockedDate(targetDate, serviceClient)) {
    targetDate.setDate(targetDate.getDate() + 1);
    
    // Auf Wochentag korrigieren (falls wir auf Wochenende gelandet sind)
    if (pickupDay && pickupDay >= 1 && pickupDay <= 5) {
      while (targetDate.getDay() === 0 || targetDate.getDay() === 6) {
        targetDate.setDate(targetDate.getDate() + 1);
      }
    }
    
    attempts++;
    if (attempts > maxAttempts) {
      return { ok: false, error: "Konnte kein gültiges Abholdatum finden." };
    }
  }

  return { ok: true, date: targetDate.toISOString().split("T")[0] };
}

/**
 * Erstellt eine neue Abholung/Tour
 */
export async function createPickupTour(
  partnerId: string,
  values: CreateTourPayload,
): Promise<UpsertResult> {
  const serviceClient = createAdminClient({ schema: "tms" });

  // Lade Defaults für Vorausfüllung
  const { data: defaults } = await serviceClient
    .from("partner_order_defaults")
    .select("zugang, ruecksendung, driver_id, abholzyklus_wochen, abholservice")
    .eq("partner_id", partnerId)
    .maybeSingle();

  // Lade aktuellen User
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Nicht eingeloggt." };
  }

  const payload = {
    partner_id: partnerId,
    status: "geplant",
    geplantes_abholdatum: values.geplantes_abholdatum,
    fahrer_id: values.fahrer_id || defaults?.driver_id || null,
    zugang: defaults?.zugang || "Bringen",
    ruecksendung: defaults?.ruecksendung || "Lieferung",
    abholzyklus_wochen: defaults?.abholzyklus_wochen || null,
    abholservice: defaults?.abholservice || false,
    titel: values.titel || null,
    erstellt_von: user.id,
  };

  const { error } = await serviceClient
    .from("tours")
    .insert(payload);

  if (error) {
    console.error("[createPickupTour]", error);
    return { ok: false, error: "Erstellen der Abholung fehlgeschlagen." };
  }

  revalidatePath(`/kunden/${partnerId}`);
  return { ok: true };
}

/**
 * Automatisch nächste Abholung erstellen (nach "erledigt"-Status)
 */
export async function autoCreateNextPickup(
  partnerId: string,
  erledigtDatum: string,
): Promise<UpsertResult> {
  const serviceClient = createAdminClient({ schema: "tms" });

  // Prüfe ob Abholservice = Automatisch
  const { data: defaults } = await serviceClient
    .from("partner_order_defaults")
    .select("pickup_delivery_status, pickup_cycle_count, pickup_day, driver_id, zugang, ruecksendung, abholzyklus_wochen")
    .eq("partner_id", partnerId)
    .maybeSingle();

  if (!defaults || defaults.pickup_delivery_status !== "Automatisch") {
    // Kein automatischer Abholservice — nichts tun
    return { ok: true };
  }

  // Berechne nächstes Datum
  const dateResult = await calculateNextPickupDate(partnerId);
  if (!dateResult.ok) {
    return dateResult;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Nicht eingeloggt." };
  }

  const payload = {
    partner_id: partnerId,
    status: "geplant",
    geplantes_abholdatum: dateResult.date,
    fahrer_id: defaults.driver_id || null,
    zugang: defaults.zugang || "Bringen",
    ruecksendung: defaults.ruecksendung || "Lieferung",
    abholzyklus_wochen: defaults.abholzyklus_wochen || null,
    abholservice: true,
    titel: "Automatisch erstellt",
    erstellt_von: user.id,
  };

  const { error } = await serviceClient
    .from("tours")
    .insert(payload);

  if (error) {
    console.error("[autoCreateNextPickup]", error);
    return { ok: false, error: "Automatische Erstellung fehlgeschlagen." };
  }

  revalidatePath(`/kunden/${partnerId}`);
  return { ok: true };
}

/**
 * Bearbeitet eine bestehende Tour (Fahrer + Datum)
 * Jeder eingeloggte Nutzer darf bearbeiten
 */
export async function updatePickupTour(
  tourId: string,
  values: {
    geplantes_abholdatum?: string;
    fahrer_id?: string | null;
    titel?: string | null;
  }
): Promise<UpsertResult> {
  const serviceClient = createAdminClient({ schema: "tms" });

  const { error } = await serviceClient
    .from("tours")
    .update({
      ...values,
      geaendert_am: new Date().toISOString(),
    })
    .eq("id", tourId);

  if (error) {
    console.error("[updatePickupTour]", error);
    return { ok: false, error: "Konnte Abholung nicht aktualisieren." };
  }

  revalidatePath("/kunden/[id]", "page");
  return { ok: true };
}

/**
 * Löscht eine geplante Tour
 */
export async function deletePickupTour(
  tourId: string,
): Promise<UpsertResult> {
  const serviceClient = createAdminClient({ schema: "tms" });

  const { error } = await serviceClient
    .from("tours")
    .delete()
    .eq("id", tourId);

  if (error) {
    console.error("[deletePickupTour]", error);
    return { ok: false, error: "Konnte Abholung nicht löschen." };
  }

  revalidatePath("/kunden/[id]", "page");
  return { ok: true };
}
