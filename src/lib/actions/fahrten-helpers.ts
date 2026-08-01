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
