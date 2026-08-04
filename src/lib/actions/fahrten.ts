"use server";

// PROJ-21 — Fahrer: Tourenliste (nur Anzeige)
// "Fahrt" = einzelne Abholung/Stopp (Datensatz in tms.tours).
// "Tour" = alle offenen Fahrten eines Fahrers an einem Tag, gebündelt beim Anzeigen.

import { revalidatePath } from "next/cache";
import { getCurrentProfile, type Profile } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { gruppiereZuTouren, type FahrerOption, type RohFahrt, type Tour } from "./fahrten-helpers";
import { loeseNeuberechnungAus } from "@/lib/routing/tour-route";

const NOTIZ_MAX_LAENGE = 500;

export type { Fahrt, Tour, FahrerOption } from "./fahrten-helpers";

// PROJ-21/PROJ-42/PROJ-44: Ladefunktionen laden diese Status (offene + neu erledigte Stopps aus PROJ-44).
// Erledigte Stopps werden geladen, aber am Ende ihrer Tour einsortiert und optional optisch
// abgeschwächt dargestellt (siehe gruppiereZuTouren in fahrten-helpers.ts).
const GELAD_STATUS = ["geplant", "unterwegs", "angekommen", "problem", "erledigt"] as const;
// Der ältere OFFENE_STATUS wird noch in tour-route.ts zum Filtern der Touren für
// Neuberechnung verwendet (dort dürfen nur nicht-finale Stopps einbezogen werden).
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
      notiz,
      partner_id,
      route_order,
      route_calculated_at,
      route_distance_meters,
      route_duration_seconds,
      berechnete_ankunftszeit,
      leg_distance_meters,
      leg_duration_seconds,
      geaendert_am,
      partners:partner_id ( display_name, company_name )
    `
    )
    .eq("fahrer_id", profile.id)
    .in("status", GELAD_STATUS)
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
      notiz: row.notiz ?? null,
      fahrerId: profile.id,
      fahrerName: profile.full_name || profile.email,
      routeOrder: row.route_order ?? null,
      routeCalculatedAt: row.route_calculated_at ?? null,
      routeDistanzMeter: row.route_distance_meters ?? null,
      routeDauerSekunden: row.route_duration_seconds ?? null,
      berechneteAnkunftszeit: row.berechnete_ankunftszeit ?? null,
      legDistanzMeter: row.leg_distance_meters ?? null,
      legDauerSekunden: row.leg_duration_seconds ?? null,
      erledigtAm: row.status === "erledigt" ? row.geaendert_am ?? null : null,
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
      notiz,
      fahrer_id,
      partner_id,
      route_order,
      route_calculated_at,
      route_distance_meters,
      route_duration_seconds,
      berechnete_ankunftszeit,
      leg_distance_meters,
      leg_duration_seconds,
      geaendert_am,
      partners:partner_id ( display_name, company_name )
    `
    )
    .in("status", GELAD_STATUS)
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
      notiz: row.notiz ?? null,
      fahrerId: row.fahrer_id,
      fahrerName: row.fahrer_id ? fahrerNamen.get(row.fahrer_id) ?? "Unbekannter Fahrer" : null,
      routeOrder: row.route_order ?? null,
      routeCalculatedAt: row.route_calculated_at ?? null,
      routeDistanzMeter: row.route_distance_meters ?? null,
      routeDauerSekunden: row.route_duration_seconds ?? null,
      berechneteAnkunftszeit: row.berechnete_ankunftszeit ?? null,
      legDistanzMeter: row.leg_distance_meters ?? null,
      legDauerSekunden: row.leg_duration_seconds ?? null,
      erledigtAm: row.status === "erledigt" ? row.geaendert_am ?? null : null,
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

// PROJ-41 — Fahrt bearbeiten (Fahrer/Datum/Notiz + Änderungsverlauf)

export interface BearbeiteFahrtEingabe {
  fahrerId: string;
  datum: string;
  notiz: string | null;
}

export type BearbeiteFahrtResult = { ok: true } | { ok: false; error: string };

/** Aktualisiert Fahrer, Datum und Notiz einer Fahrt und protokolliert jede tatsächlich geänderte Eigenschaft. */
export async function bearbeiteFahrt(
  fahrtId: string,
  eingabe: BearbeiteFahrtEingabe
): Promise<BearbeiteFahrtResult> {
  const zugriff = await pruefeFahrerZugriff();
  if (!zugriff.ok) return zugriff;
  const { profile } = zugriff;

  if (!eingabe.fahrerId) {
    return { ok: false, error: "Bitte einen Fahrer auswählen." };
  }
  if (!eingabe.datum) {
    return { ok: false, error: "Bitte ein Datum auswählen." };
  }
  if (eingabe.notiz && eingabe.notiz.length > NOTIZ_MAX_LAENGE) {
    return { ok: false, error: `Notiz darf höchstens ${NOTIZ_MAX_LAENGE} Zeichen lang sein.` };
  }

  const adminClient = createAdminClient({ schema: "tms" });

  // QA-Fund BUG-1: fahrerId muss zu einem echten Nutzer mit Rolle "fahrer"
  // gehören, nicht nur zu irgendeinem existierenden Account (die DB-FK auf
  // auth.users allein prüft das nicht).
  const { data: fahrerProfil, error: fahrerFehler } = await adminClient
    .schema("public")
    .from("profiles")
    .select("id")
    .eq("id", eingabe.fahrerId)
    .contains("roles", ["fahrer"])
    .maybeSingle();

  if (fahrerFehler) {
    console.error("bearbeiteFahrt (Fahrer-Prüfung) error:", fahrerFehler);
    return { ok: false, error: "Fahrer konnte nicht geprüft werden." };
  }
  if (!fahrerProfil) {
    return { ok: false, error: "Ungültiger Fahrer ausgewählt." };
  }

  const { data: aktuelleFahrt, error: leseFehler } = await adminClient
    .from("tours")
    .select("fahrer_id, geplantes_abholdatum, notiz, status")
    .eq("id", fahrtId)
    .single();

  if (leseFehler || !aktuelleFahrt) {
    console.error("bearbeiteFahrt (lesen) error:", leseFehler);
    return { ok: false, error: "Fahrt nicht gefunden." };
  }

  // PROJ-44-Refine: ein bereits erledigter/finaler Stopp darf nicht mehr
  // geändert werden — schützt auch bei einem direkt konstruierten Aufruf
  // am UI vorbei (gleiches Muster wie der Guard in markiereFahrtAlsErledigt).
  const finaleStatus = ["erledigt", "abgeschlossen", "archiviert"];
  if (finaleStatus.includes(aktuelleFahrt.status)) {
    return { ok: false, error: "Ein erledigter Stopp kann nicht mehr geändert werden." };
  }

  const neueNotiz = eingabe.notiz || null;

  const { error: updateFehler } = await adminClient
    .from("tours")
    .update({
      fahrer_id: eingabe.fahrerId,
      geplantes_abholdatum: eingabe.datum,
      notiz: neueNotiz,
      geaendert_am: new Date().toISOString(),
    })
    .eq("id", fahrtId);

  if (updateFehler) {
    console.error("bearbeiteFahrt (update) error:", updateFehler);
    return { ok: false, error: "Änderungen konnten nicht gespeichert werden." };
  }

  const aenderungen: { feld: string; alter_wert: string | null; neuer_wert: string | null }[] = [];
  if (aktuelleFahrt.fahrer_id !== eingabe.fahrerId) {
    aenderungen.push({
      feld: "fahrer_id",
      alter_wert: aktuelleFahrt.fahrer_id,
      neuer_wert: eingabe.fahrerId,
    });
  }
  if (aktuelleFahrt.geplantes_abholdatum !== eingabe.datum) {
    aenderungen.push({
      feld: "geplantes_abholdatum",
      alter_wert: aktuelleFahrt.geplantes_abholdatum,
      neuer_wert: eingabe.datum,
    });
  }
  if ((aktuelleFahrt.notiz ?? null) !== neueNotiz) {
    aenderungen.push({ feld: "notiz", alter_wert: aktuelleFahrt.notiz ?? null, neuer_wert: neueNotiz });
  }

  if (aenderungen.length > 0) {
    const { error: verlaufFehler } = await adminClient.from("tour_aenderungen").insert(
      aenderungen.map((a) => ({
        tour_id: fahrtId,
        feld: a.feld,
        alter_wert: a.alter_wert,
        neuer_wert: a.neuer_wert,
        geaendert_von: profile.id,
      }))
    );

    if (verlaufFehler) {
      // Die eigentliche Änderung ist bereits gespeichert — ein fehlgeschlagener
      // Verlaufs-Eintrag soll das nicht rückgängig machen, aber sichtbar sein.
      console.error("bearbeiteFahrt (Verlauf) error:", verlaufFehler);
    }
  }

  // PROJ-42: Fahrer/Datum-Änderung löst Neuberechnung von alter UND neuer
  // Tourengruppe aus — Notiz-only ändert nichts. Läuft nach dem erfolgreichen
  // Speichern und blockiert dieses unter keinen Umständen (siehe
  // loeseNeuberechnungAus: fängt alle Fehler intern ab, wirft nie).
  const fahrerOderDatumGeaendert = aenderungen.some(
    (a) => a.feld === "fahrer_id" || a.feld === "geplantes_abholdatum"
  );
  if (fahrerOderDatumGeaendert) {
    await loeseNeuberechnungAus(adminClient, [
      { fahrerId: aktuelleFahrt.fahrer_id, datum: aktuelleFahrt.geplantes_abholdatum },
      { fahrerId: eingabe.fahrerId, datum: eingabe.datum },
    ]);
  }

  revalidatePath("/fahrer");
  return { ok: true };
}

export interface FahrtAenderung {
  id: string;
  feld: string;
  alterWert: string | null;
  neuerWert: string | null;
  geaendertVonName: string;
  geaendertAm: string;
}

/** Änderungsverlauf einer Fahrt, neueste zuerst — für die Anzeige im Bearbeiten-Dialog. */
export async function getFahrtAenderungen(
  fahrtId: string
): Promise<{ ok: true; data: FahrtAenderung[] } | { ok: false; error: string }> {
  const zugriff = await pruefeFahrerZugriff();
  if (!zugriff.ok) return zugriff;

  const adminClient = createAdminClient({ schema: "tms" });

  const { data, error } = await adminClient
    .from("tour_aenderungen")
    .select("id, feld, alter_wert, neuer_wert, geaendert_von, geaendert_am")
    .eq("tour_id", fahrtId)
    .order("geaendert_am", { ascending: false });

  if (error) {
    console.error("getFahrtAenderungen error:", error);
    return { ok: false, error: "Änderungsverlauf konnte nicht geladen werden." };
  }

  const rows = data ?? [];

  const geaendertVonIds = rows.map((row: any) => row.geaendert_von).filter(Boolean);
  const fahrerWertIds = rows
    .filter((row: any) => row.feld === "fahrer_id")
    .flatMap((row: any) => [row.alter_wert, row.neuer_wert])
    .filter(Boolean);
  const alleProfilIds = Array.from(new Set([...geaendertVonIds, ...fahrerWertIds]));

  const namen = new Map<string, string>();
  if (alleProfilIds.length > 0) {
    const { data: profileRows, error: profileError } = await adminClient
      .schema("public")
      .from("profiles")
      .select("id, full_name, email")
      .in("id", alleProfilIds);

    if (profileError) {
      console.error("getFahrtAenderungen (Namen) error:", profileError);
    } else {
      for (const row of profileRows ?? []) {
        namen.set(row.id, row.full_name || row.email);
      }
    }
  }

  const aufloesen = (feld: string, wert: string | null): string | null => {
    if (wert === null) return null;
    if (feld === "fahrer_id") return namen.get(wert) ?? "Unbekannter Fahrer";
    return wert;
  };

  return {
    ok: true,
    data: rows.map((row: any) => ({
      id: row.id,
      feld: row.feld,
      alterWert: aufloesen(row.feld, row.alter_wert),
      neuerWert: aufloesen(row.feld, row.neuer_wert),
      geaendertVonName: row.geaendert_von ? namen.get(row.geaendert_von) ?? "Unbekannt" : "Unbekannt",
      geaendertAm: row.geaendert_am,
    })),
  };
}

// PROJ-44 — Stopp als erledigt markieren

export type MarkiereAlsErlediltResult = { ok: true } | { ok: false; error: string };

/**
 * Markiert einen Stopp als "erledigt" und erstellt einen Chronologie-Eintrag.
 * Serverseitige Absicherung: Status darf nur von nicht-finalem Zustand nach "erledigt" wechseln.
 * Rollenprüfung: nur Fahrer/Admin.
 */
export async function markiereFahrtAlsErledigt(fahrtId: string): Promise<MarkiereAlsErlediltResult> {
  const zugriff = await pruefeFahrerZugriff();
  if (!zugriff.ok) return zugriff;
  const { profile } = zugriff;

  const adminClient = createAdminClient({ schema: "tms" });

  // Fahrt laden: prüfe aktuellen Status
  const { data: aktuelleFahrt, error: leseFehler } = await adminClient
    .from("tours")
    .select("id, status")
    .eq("id", fahrtId)
    .single();

  if (leseFehler || !aktuelleFahrt) {
    console.error("markiereFahrtAlsErledigt (lesen) error:", leseFehler);
    return { ok: false, error: "Fahrt nicht gefunden." };
  }

  // Serverseitige Absicherung: nur von nicht-finalem Status nach "erledigt" übergehen
  const finaleStatus = ["erledigt", "abgeschlossen", "archiviert"];
  if (finaleStatus.includes(aktuelleFahrt.status)) {
    return { ok: false, error: "Stopp ist bereits in einem finalen Status." };
  }

  // Status setzen auf "erledigt"
  const { error: updateFehler } = await adminClient
    .from("tours")
    .update({
      status: "erledigt",
      geaendert_am: new Date().toISOString(),
    })
    .eq("id", fahrtId);

  if (updateFehler) {
    console.error("markiereFahrtAlsErledigt (update) error:", updateFehler);
    return { ok: false, error: "Status konnte nicht aktualisiert werden." };
  }

  // Chronologie-Eintrag: Status: [alter Status] → erledigt
  const { error: verlaufFehler } = await adminClient.from("tour_aenderungen").insert({
    tour_id: fahrtId,
    feld: "status",
    alter_wert: aktuelleFahrt.status,
    neuer_wert: "erledigt",
    geaendert_von: profile.id,
  });

  if (verlaufFehler) {
    // Die eigentliche Änderung ist bereits gespeichert — ein fehlgeschlagener
    // Verlaufs-Eintrag soll das nicht rückgängig machen, aber sichtbar sein.
    console.error("markiereFahrtAlsErledigt (Verlauf) error:", verlaufFehler);
  }

  // Nicht wie bearbeiteFahrt: Status-Änderung allein löst KEINE Neuberechnung aus
  // (siehe Decision Log: Statuswechsel ändert weder Fahrer noch Datum noch Adressen)

  revalidatePath("/fahrer");
  return { ok: true };
}
