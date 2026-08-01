"use client";

import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Fahrt, Tour } from "@/lib/actions/fahrten";

const STATUS_LABEL: Record<string, string> = {
  geplant: "Geplant",
  unterwegs: "Unterwegs",
  angekommen: "Angekommen",
  problem: "Problem",
};

const STATUS_VARIANT: Record<string, "secondary" | "default" | "destructive"> = {
  geplant: "secondary",
  unterwegs: "default",
  angekommen: "default",
  problem: "destructive",
};

function formatDatum(datum: string | null): string {
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
}

export function TourListe({ touren, leerTitel, zeigeFahrer }: TourListeProps) {
  if (touren.length === 0) {
    return <p className="text-sm text-muted-foreground">{leerTitel ?? "Keine offenen Touren."}</p>;
  }

  return (
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
                  return (
                    <li
                      key={fahrt.id}
                      className="flex items-start justify-between gap-3 rounded-xl bg-muted/50 px-3 py-2"
                    >
                      <div>
                        <p className="font-medium text-foreground">{fahrt.kunde.name}</p>
                        {adresse && <p className="text-sm text-muted-foreground">{adresse}</p>}
                      </div>
                      <Badge variant={STATUS_VARIANT[fahrt.status] ?? "secondary"}>
                        {STATUS_LABEL[fahrt.status] ?? fahrt.status}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
