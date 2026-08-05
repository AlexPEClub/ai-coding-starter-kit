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
  /** PROJ-44: Etappen-Distanz vom vorherigen Stopp (in Metern), null ohne Berechnung. */
  legDistanzMeter?: number | null;
  /** PROJ-44: Etappen-Fahrzeit vom vorherigen Stopp (in Sekunden), null ohne Berechnung. */
  legDauerSekunden?: number | null;
  /** PROJ-44-Refine: Zeitpunkt, an dem der Stopp als erledigt markiert wurde (ISO), nur bei Status "erledigt". */
  erledigtAm?: string | null;
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
  /** PROJ-44: Etappen-Distanz vom vorherigen Stopp (in Metern). */
  legDistanzMeter?: number | null;
  /** PROJ-44: Etappen-Fahrzeit vom vorherigen Stopp (in Sekunden). */
  legDauerSekunden?: number | null;
}

/**
 * Bündelt Fahrten zu Touren nach Fahrer+Datum, sortiert nach Datum (ohne
 * Datum ans Ende). PROJ-42: hat eine Tourengruppe für JEDEN ihrer Stopps
 * denselben, nicht-null `routeCalculatedAt`-Zeitstempel (garantiert durch die
 * Alles-oder-nichts-Schreiblogik der Routenberechnung), werden die Stopps
 * nach `routeOrder` sortiert und Gesamtstrecke/-fahrzeit ausgegeben — sonst
 * bleibt es beim bisherigen Datums-/Anlage-Reihenfolge-Fallback ohne
 * Distanz-/Fahrzeit-Anzeige.
 *
 * PROJ-44: erledigte Stopps werden geladen und angezeigt, aber innerhalb ihrer Tour
 * ans Ende sortiert. Touren, bei denen ALLE Stopps erledigt/abgeschlossen/archiviert
 * sind, werden komplett aus der Liste entfernt (wie bei vollständig abgeschlossenen
 * Touren schon vorher).
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
    .filter((gruppe) => {
      // PROJ-44: Filter: entferne Touren, bei denen ALLE Stopps in einem finalen Status sind
      const finaleStatus = ["erledigt", "abgeschlossen", "archiviert"];
      const alleStoppsFinal = gruppe.fahrten.every((f) => finaleStatus.includes(f.status));
      return !alleStoppsFinal;
    })
    .map((gruppe): Tour => {
      // Finale Stopps (erledigt/abgeschlossen/archiviert) werden von
      // berechneUndSpeichereRoute() bewusst NIE neu berechnet (sie tragen
      // dauerhaft ihren alten routeCalculatedAt-Zeitstempel). Sie dürfen die
      // Vollständigkeits-Prüfung daher nicht mit einbeziehen, sonst bricht
      // die Sortierung der gesamten Tour, sobald ein offener Stopp derselben
      // Gruppe später neu berechnet wird.
      const finaleStatus = ["erledigt", "abgeschlossen", "archiviert"];
      const offeneFahrten = gruppe.fahrten.filter((f) => !finaleStatus.includes(f.status));
      const routeVollstaendig =
        offeneFahrten.length > 0 &&
        offeneFahrten.every((f) => f.routeOrder !== null && f.routeCalculatedAt !== null) &&
        new Set(offeneFahrten.map((f) => f.routeCalculatedAt)).size === 1;

      // PROJ-42: Sortiere nach Route-Order, wenn vorhanden.
      // PROJ-44: Nach Route-Order sortieren, aber erledigte Stopps zusätzlich ans Ende sortieren.
      const sortierteFahrten = [...gruppe.fahrten];
      if (routeVollstaendig) {
        // Sortiere zuerst nach routeOrder (nicht erledigt vor erledigt, da erledigt NULL-Order hat)
        // dann innerhalb jeder Gruppe nach Erledigt-Status
        sortierteFahrten.sort((a, b) => {
          const aErledigt = a.status === "erledigt";
          const bErledigt = b.status === "erledigt";

          // Nicht erledigt kommen vor erledigt
          if (aErledigt !== bErledigt) {
            return aErledigt ? 1 : -1;
          }

          // Innerhalb der gleichen Erledigt-Kategorie: nach routeOrder sortieren
          return (a.routeOrder ?? 0) - (b.routeOrder ?? 0);
        });
      }

      return {
        datum: gruppe.datum,
        fahrerId: gruppe.fahrerId,
        fahrerName: gruppe.fahrerName,
        fahrten: sortierteFahrten.map(
          ({ fahrerId: _fahrerId, fahrerName: _fahrerName, routeCalculatedAt: _rc, routeDistanzMeter: _rd, routeDauerSekunden: _rs, legDistanzMeter, legDauerSekunden, erledigtAm, ...fahrt }) =>
            ({ ...fahrt, legDistanzMeter, legDauerSekunden, erledigtAm })
        ),
        gesamtDistanzMeter: routeVollstaendig ? offeneFahrten[0].routeDistanzMeter : null,
        gesamtDauerSekunden: routeVollstaendig ? offeneFahrten[0].routeDauerSekunden : null,
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
  erledigt: "Erledigt",
};

const STATUS_VARIANT: Record<string, FahrtBadgeVariant> = {
  geplant: "secondary",
  unterwegs: "default",
  angekommen: "default",
  problem: "destructive",
  erledigt: "secondary",
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
