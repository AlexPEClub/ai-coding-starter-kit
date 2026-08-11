"use client";

import { berechneTourKpis, type Tour } from "@/lib/actions/fahrten-helpers";
import { Progress } from "@/components/ui/progress";

/**
 * PROJ-47: Kompakte KPI-Leiste innerhalb eines aufgeklappten Tour-Accordion.
 * Zeigt Fortschritt, verbleibende Stopps, nächsten Stopp und voraussichtliches Tourende.
 */
export function TourKpiLeiste({ tour }: { tour: Tour }) {
  const kpi = berechneTourKpis(tour);

  // Keine Leiste, wenn die Tour keine Stopps hat (Kantfall)
  if (!kpi) {
    return null;
  }

  /**
   * Formatiert eine ISO-Ankunftszeit zu "HH:MM".
   */
  function formatAnkunftszeit(ankunftszeit: string): string {
    return new Date(ankunftszeit).toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Berlin",
    });
  }

  return (
    <div className="mb-4 space-y-3 rounded-lg border border-border/50 bg-muted/30 px-4 py-3">
      {/* Fortschrittsbalken */}
      <div className="space-y-2">
        <Progress value={kpi.fortschrittProzent} className="h-2" />
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-foreground">
            <span className="font-semibold">{kpi.erledigtAnzahl}</span> von{" "}
            <span className="font-semibold">{kpi.gesamtAnzahl}</span> Stopps erledigt
          </span>
          {kpi.verbleibendeAnzahl > 0 && (
            <span className="text-muted-foreground">
              {kpi.verbleibendeAnzahl} verbleibend
            </span>
          )}
        </div>
      </div>

      {/* Nächster Stopp */}
      {kpi.naechsterStoppName && (
        <div className="text-sm">
          <span className="text-muted-foreground">Nächster Stopp: </span>
          <span className="font-medium text-foreground">{kpi.naechsterStoppName}</span>
          {kpi.naechsterStoppAnkunftszeit && (
            <span className="ml-2 tabular-nums text-muted-foreground">
              ({formatAnkunftszeit(kpi.naechsterStoppAnkunftszeit)} Uhr)
            </span>
          )}
        </div>
      )}

      {/* Voraussichtliches Tourende — nur wenn der Wert vorhanden ist */}
      {kpi.voraussichtlichesTourendeAnkunftszeit && (
        <div className="text-sm">
          <span className="text-muted-foreground">Voraussichtliches Tourende: </span>
          <span className="font-medium text-foreground tabular-nums">
            {formatAnkunftszeit(kpi.voraussichtlichesTourendeAnkunftszeit)} Uhr
          </span>
        </div>
      )}
    </div>
  );
}
