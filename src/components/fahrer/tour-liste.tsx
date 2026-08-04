"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
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
import {
  StoppDetailModal,
  type StoppDetailModalZiel,
} from "@/components/fahrer/stopp-detail-modal";

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

/** PROJ-42: Gesamtstrecke einer berechneten Tour, z. B. "12,3 km". */
function formatDistanz(distanzMeter: number): string {
  return `${(distanzMeter / 1000).toLocaleString("de-DE", { maximumFractionDigits: 1 })} km`;
}

/** PROJ-42: Gesamtfahrzeit einer berechneten Tour, z. B. "1 Std. 15 Min." oder "45 Min.". */
function formatDauer(dauerSekunden: number): string {
  const minuten = Math.round(dauerSekunden / 60);
  const stunden = Math.floor(minuten / 60);
  const restMinuten = minuten % 60;
  return stunden > 0 ? `${stunden} Std. ${restMinuten} Min.` : `${restMinuten} Min.`;
}

/** PROJ-42: berechnete Ankunftszeit an einem Stopp, z. B. "09:15". */
function formatAnkunftszeit(ankunftszeit: string): string {
  return new Date(ankunftszeit).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  });
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
  const [detailZiel, setDetailZiel] = useState<StoppDetailModalZiel | null>(null);
  const [bearbeitenZiel, setBearbeitenZiel] = useState<BearbeiteFahrtZiel | null>(null);

  if (touren.length === 0) {
    return <p className="text-sm text-muted-foreground">{leerTitel ?? "Keine offenen Touren."}</p>;
  }

  function handleStoppClick(fahrt: Fahrt, tour: Tour) {
    setDetailZiel({
      fahrt,
      tourFahrerId: tour.fahrerId,
      tourDatum: tour.datum,
      fahrerName: tour.fahrerName,
      legDistanceMeters: fahrt.legDistanzMeter ?? null,
      legDurationSeconds: fahrt.legDauerSekunden ?? null,
      heute,
    });
  }

  function handleOeffneBearbeiten(ziel: StoppDetailModalZiel) {
    setDetailZiel(null);
    setBearbeitenZiel({
      fahrt: ziel.fahrt,
      tourFahrerId: ziel.tourFahrerId,
      tourDatum: ziel.tourDatum,
    });
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
                    {tour.gesamtDistanzMeter !== null && tour.gesamtDauerSekunden !== null && (
                      <span className="tabular-nums">
                        {" — "}
                        {formatDistanz(tour.gesamtDistanzMeter)} · {formatDauer(tour.gesamtDauerSekunden)}
                      </span>
                    )}
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2">
                  {tour.fahrten.map((fahrt) => {
                    const adresse = formatAdresse(fahrt.kunde);
                    const badge = berechneFahrtBadge(fahrt.status, tour.datum, heute);
                    const istErledigt = fahrt.status === "erledigt";
                    return (
                      <li key={fahrt.id}>
                        <button
                          type="button"
                          onClick={() => handleStoppClick(fahrt, tour)}
                          className={`flex min-h-[48px] w-full items-start justify-between gap-3 rounded-xl bg-muted/50 px-3 py-2 text-left transition-colors hover:bg-muted ${istErledigt ? "opacity-60" : ""}`}
                        >
                          <div className="flex items-start gap-2">
                            {istErledigt && (
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                            )}
                            <div>
                              <p
                                className={`font-medium text-foreground ${istErledigt ? "text-muted-foreground line-through" : ""}`}
                              >
                                {fahrt.kunde.name}
                              </p>
                              {adresse && (
                                <p
                                  className={`text-sm text-muted-foreground ${istErledigt ? "line-through" : ""}`}
                                >
                                  {adresse}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {fahrt.berechneteAnkunftszeit && (
                              <span className="text-sm tabular-nums text-muted-foreground">
                                {formatAnkunftszeit(fahrt.berechneteAnkunftszeit)} Uhr
                              </span>
                            )}
                            <Badge variant={badge.variant}>{badge.label}</Badge>
                          </div>
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

      <StoppDetailModal
        ziel={detailZiel}
        onClose={() => setDetailZiel(null)}
        onOeffneBearbeiten={handleOeffneBearbeiten}
      />

      <FahrtBearbeitenDialog
        ziel={bearbeitenZiel}
        fahrerOptionen={fahrerOptionen}
        onClose={() => setBearbeitenZiel(null)}
      />
    </>
  );
}
