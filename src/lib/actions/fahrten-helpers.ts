// PROJ-21 — Fahrer: Tourenliste (nur Anzeige)
// Reine Hilfslogik ohne Server-Client-Import, damit sie testbar bleibt
// (analog zu orders-helpers.ts) und "use server"-Dateien nur async
// Funktionen exportieren müssen.

export interface Fahrt {
  id: string;
  status: string;
  geplantesAbholdatum: string | null;
  notiz: string | null;
  kunde: {
    name: string;
    strasse: string | null;
    plz: string | null;
    ort: string | null;
  };
  /** PROJ-42: Position in der berechneten Route (1, 2, 3, ...), null ohne Berechnung. */
  routeOrder: number | null;
  /** PROJ-42: berechnete Ankunftszeit an diesem Stopp (ISO), null ohne Berechnung. */
  berechneteAnkunftszeit: string | null;
}

export interface Tour {
  datum: string | null;
  fahrerId: string | null;
  fahrerName: string | null;
  fahrten: Fahrt[];
  /** PROJ-42: Gesamtstrecke der Tour in Metern, null ohne vollständige Berechnung. */
  gesamtDistanzMeter: number | null;
  /** PROJ-42: Gesamtfahrzeit der Tour in Sekunden, null ohne vollständige Berechnung. */
  gesamtDauerSekunden: number | null;
}

export interface FahrerOption {
  id: string;
  name: string;
}

export interface RohFahrt extends Fahrt {
  fahrerId: string | null;
  fahrerName: string | null;
  /** PROJ-42: identisch für alle Stopps einer erfolgreich berechneten Tour. */
  routeCalculatedAt: string | null;
  routeDistanzMeter: number | null;
  routeDauerSekunden: number | null;
}

/**
 * Bündelt Fahrten zu Touren nach Fahrer+Datum, sortiert nach Datum (ohne
 * Datum ans Ende). PROJ-42: hat eine Tourengruppe für JEDEN ihrer Stopps
 * denselben, nicht-null `routeCalculatedAt`-Zeitstempel (garantiert durch die
 * Alles-oder-nichts-Schreiblogik der Routenberechnung), werden die Stopps
 * nach `routeOrder` sortiert und Gesamtstrecke/-fahrzeit ausgegeben — sonst
 * bleibt es beim bisherigen Datums-/Anlage-Reihenfolge-Fallback ohne
 * Distanz-/Fahrzeit-Anzeige.
 */
export function gruppiereZuTouren(fahrten: RohFahrt[]): Tour[] {
  const gruppen = new Map<
    string,
    { datum: string | null; fahrerId: string | null; fahrerName: string | null; fahrten: RohFahrt[] }
  >();
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

  return Array.from(gruppen.values())
    .map((gruppe): Tour => {
      const routeVollstaendig =
        gruppe.fahrten.length > 0 &&
        gruppe.fahrten.every((f) => f.routeOrder !== null && f.routeCalculatedAt !== null) &&
        new Set(gruppe.fahrten.map((f) => f.routeCalculatedAt)).size === 1;

      const sortierteFahrten = routeVollstaendig
        ? [...gruppe.fahrten].sort((a, b) => (a.routeOrder ?? 0) - (b.routeOrder ?? 0))
        : gruppe.fahrten;

      return {
        datum: gruppe.datum,
        fahrerId: gruppe.fahrerId,
        fahrerName: gruppe.fahrerName,
        fahrten: sortierteFahrten.map(
          ({ fahrerId: _fahrerId, fahrerName: _fahrerName, routeCalculatedAt: _rc, routeDistanzMeter: _rd, routeDauerSekunden: _rs, ...fahrt }) =>
            fahrt
        ),
        gesamtDistanzMeter: routeVollstaendig ? gruppe.fahrten[0].routeDistanzMeter : null,
        gesamtDauerSekunden: routeVollstaendig ? gruppe.fahrten[0].routeDauerSekunden : null,
      };
    })
    .sort((a, b) => {
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
