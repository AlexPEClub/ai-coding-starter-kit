// PROJ-21 — Fahrer: Tourenliste (nur Anzeige)
// Reine Hilfslogik ohne Server-Client-Import, damit sie testbar bleibt
// (analog zu orders-helpers.ts) und "use server"-Dateien nur async
// Funktionen exportieren müssen.

export interface Fahrt {
  id: string;
  status: string;
  geplantesAbholdatum: string | null;
  kunde: {
    name: string;
    strasse: string | null;
    plz: string | null;
    ort: string | null;
  };
}

export interface Tour {
  datum: string | null;
  fahrerId: string | null;
  fahrerName: string | null;
  fahrten: Fahrt[];
}

export interface FahrerOption {
  id: string;
  name: string;
}

export interface RohFahrt extends Fahrt {
  fahrerId: string | null;
  fahrerName: string | null;
}

/** Bündelt Fahrten zu Touren nach Fahrer+Datum, sortiert nach Datum (ohne Datum ans Ende). */
export function gruppiereZuTouren(fahrten: RohFahrt[]): Tour[] {
  const gruppen = new Map<string, Tour>();
  for (const fahrt of fahrten) {
    const key = `${fahrt.fahrerId ?? "ohne-fahrer"}|${fahrt.geplantesAbholdatum ?? "ohne-datum"}`;
    const gruppe = gruppen.get(key) ?? {
      datum: fahrt.geplantesAbholdatum,
      fahrerId: fahrt.fahrerId,
      fahrerName: fahrt.fahrerName,
      fahrten: [],
    };
    gruppe.fahrten.push(fahrt);
    gruppen.set(key, gruppe);
  }

  return Array.from(gruppen.values()).sort((a, b) => {
    if (!a.datum) return 1;
    if (!b.datum) return -1;
    return a.datum.localeCompare(b.datum);
  });
}

export type FahrtBadgeVariant = "secondary" | "default" | "destructive" | "warning";

export interface FahrtBadgeInfo {
  label: string;
  variant: FahrtBadgeVariant;
}

const STATUS_LABEL: Record<string, string> = {
  geplant: "Geplant",
  unterwegs: "Unterwegs",
  angekommen: "Angekommen",
  problem: "Problem",
};

const STATUS_VARIANT: Record<string, FahrtBadgeVariant> = {
  geplant: "secondary",
  unterwegs: "default",
  angekommen: "default",
  problem: "destructive",
};

/**
 * Nur "geplant" (noch nicht gestartete) Fahrten werden anhand des Datums
 * umgefärbt: "Fällig" (gelb) wenn heute, "Überfällig" (rot) wenn in der
 * Vergangenheit. Alle anderen Status (unterwegs/angekommen/problem) und
 * "geplant" mit zukünftigem oder fehlendem Datum bleiben unverändert.
 */
export function berechneFahrtBadge(
  status: string,
  datum: string | null,
  heute: string
): FahrtBadgeInfo {
  if (status === "geplant" && datum) {
    if (datum < heute) return { label: "Überfällig", variant: "destructive" };
    if (datum === heute) return { label: "Fällig", variant: "warning" };
  }

  return {
    label: STATUS_LABEL[status] ?? status,
    variant: STATUS_VARIANT[status] ?? "secondary",
  };
}
