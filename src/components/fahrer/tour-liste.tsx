"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Fahrt, FahrerOption, Tour } from "@/lib/actions/fahrten";
import { berechneFahrtBadge } from "@/lib/actions/fahrten-helpers";
import {
  FahrtBearbeitenDialog,
  type BearbeiteFahrtZiel,
} from "@/components/fahrer/fahrt-bearbeiten-dialog";

export function formatDatum(datum: string | null): string {
  if (!datum) return "Ohne Datum";
  return new Date(datum).toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatAdresse(kunde: Fahrt["kunde"]): string | null {
  const zeile2 = [kunde.plz, kunde.ort].filter(Boolean).join(" ");
  const teile = [kunde.strasse, zeile2].filter(Boolean);
  return teile.length > 0 ? teile.join(", ") : null;
}

interface TourListeProps {
  touren: Tour[];
  leerTitel?: string;
  /** Im Tab "Tourenplanung": Fahrername (bzw. "Kein Fahrer zugewiesen") zusätzlich anzeigen. */
  zeigeFahrer?: boolean;
  /** Heutiges Datum (Europe/Berlin, YYYY-MM-DD), serverseitig bestimmt — für Fällig/Überfällig. */
  heute: string;
  /** Fahrerliste für den Bearbeiten-Dialog (Fahrer wechseln). */
  fahrerOptionen: FahrerOption[];
}

export function TourListe({ touren, leerTitel, zeigeFahrer, heute, fahrerOptionen }: TourListeProps) {
  const [bearbeitenZiel, setBearbeitenZiel] = useState<BearbeiteFahrtZiel | null>(null);

  if (touren.length === 0) {
    return <p className="text-sm text-muted-foreground">{leerTitel ?? "Keine offenen Touren."}</p>;
  }

  return (
    <>
      <Accordion type="multiple" className="space-y-2">
        {touren.map((tour) => {
          const fahrerLabel = zeigeFahrer ? tour.fahrerName ?? "Kein Fahrer zugewiesen" : null;
          return (
            <AccordionItem
              key={`${tour.fahrerId ?? "ohne-fahrer"}-${tour.datum ?? "ohne-datum"}`}
              value={`${tour.fahrerId ?? "ohne-fahrer"}-${tour.datum ?? "ohne-datum"}`}
              className="rounded-2xl border border-border bg-card px-4 shadow-sm"
            >
              <AccordionTrigger className="min-h-[48px] py-3 hover:no-underline">
                <div className="text-left">
                  <p className="font-semibold text-foreground">{formatDatum(tour.datum)}</p>
                  <p className="text-sm text-muted-foreground">
                    {fahrerLabel ? `${fahrerLabel} — ` : ""}
                    {tour.fahrten.length} {tour.fahrten.length === 1 ? "Stopp" : "Stopps"}
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2">
                  {tour.fahrten.map((fahrt) => {
                    const adresse = formatAdresse(fahrt.kunde);
                    const badge = berechneFahrtBadge(fahrt.status, tour.datum, heute);
                    return (
                      <li key={fahrt.id}>
                        <button
                          type="button"
                          onClick={() =>
                            setBearbeitenZiel({
                              fahrt,
                              tourFahrerId: tour.fahrerId,
                              tourDatum: tour.datum,
                            })
                          }
                          className="flex min-h-[48px] w-full items-start justify-between gap-3 rounded-xl bg-muted/50 px-3 py-2 text-left transition-colors hover:bg-muted"
                        >
                          <div>
                            <p className="font-medium text-foreground">{fahrt.kunde.name}</p>
                            {adresse && <p className="text-sm text-muted-foreground">{adresse}</p>}
                          </div>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <FahrtBearbeitenDialog
        ziel={bearbeitenZiel}
        fahrerOptionen={fahrerOptionen}
        onClose={() => setBearbeitenZiel(null)}
      />
    </>
  );
}
