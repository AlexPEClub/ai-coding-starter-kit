"use client";

import { useState } from "react";
import { CheckCircle2, Map } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { tourStarten, type Fahrt, type FahrerOption, type Tour } from "@/lib/actions/fahrten";
import { berechneFahrtBadge } from "@/lib/actions/fahrten-helpers";
import {
  FahrtBearbeitenDialog,
  type BearbeiteFahrtZiel,
} from "@/components/fahrer/fahrt-bearbeiten-dialog";
import {
  StoppDetailModal,
  type StoppDetailModalZiel,
} from "@/components/fahrer/stopp-detail-modal";
import { TourKarteModal } from "@/components/fahrer/tour-karte-modal";
import { TourKpiLeiste } from "@/components/fahrer/tour-kpi-leiste";

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

/** PROJ-46: Format eines Zeitstempels zu HH:MM (z. B. "09:15"). */
function formatZeitstempel(iso: string): string {
  return new Date(iso).toLocaleTimeString("de-DE", {
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
  /** PROJ-46: Im Tab "Mir zugewiesen" (zeigeFahrer === false) den "Tour starten"-Button anzeigen. */
  zeigeTourStarten?: boolean;
  /** PROJ-46: Zwischengespeicherte Tour-Start-Zeiten als Map (Key: "fahrerId-datum", Value: ISO-String oder null). */
  tourStarts?: Record<string, string | null>;
}

interface KarteLadeZiel {
  fahrerId: string | null;
  tourDatum: string | null;
}

export function TourListe({
  touren,
  leerTitel,
  zeigeFahrer,
  heute,
  fahrerOptionen,
  zeigeTourStarten = false,
  tourStarts = {},
}: TourListeProps) {
  const [detailZiel, setDetailZiel] = useState<StoppDetailModalZiel | null>(null);
  const [bearbeitenZiel, setBearbeitenZiel] = useState<BearbeiteFahrtZiel | null>(null);
  const [karteZiel, setKarteZiel] = useState<KarteLadeZiel | null>(null);

  // PROJ-46: Tour-Start-Dialog Steuerung
  const [tourStartBestaetigung, setTourStartBestaetigung] = useState<{ fahrerId: string | null; datum: string | null } | null>(null);
  const [tourStartLaedt, setTourStartLaedt] = useState(false);
  const [tourStartError, setTourStartError] = useState<string | null>(null);

  if (touren.length === 0) {
    return <p className="text-sm text-muted-foreground">{leerTitel ?? "Keine offenen Touren."}</p>;
  }

  function handleStoppClick(fahrt: Fahrt, tour: Tour) {
    // PROJ-46: Prüfe, ob die Tour gestartet wurde
    const tourKey = `${tour.fahrerId ?? "ohne-fahrer"}-${tour.datum ?? "ohne-datum"}`;
    const tourGestartet = !!tourStarts?.[tourKey];

    setDetailZiel({
      fahrt,
      tourFahrerId: tour.fahrerId,
      tourDatum: tour.datum,
      fahrerName: tour.fahrerName,
      legDistanceMeters: fahrt.legDistanzMeter ?? null,
      legDurationSeconds: fahrt.legDauerSekunden ?? null,
      heute,
      tourGestartet,
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

  function handleOeffneKarte(fahrerId: string | null, tourDatum: string | null) {
    setKarteZiel({ fahrerId, tourDatum });
  }

  function handleKarteStoppClick(stoppId: string) {
    // Backend wird den Stopp an der Karte beim Click das StoppDetailModal öffnen
    // Hier suchen wir die Fahrt und öffnen das Modal
    const fahrt = touren
      .flatMap((t) => t.fahrten)
      .find((f) => f.id === stoppId);

    if (fahrt) {
      const tour = touren.find((t) =>
        t.fahrten.some((f) => f.id === stoppId)
      );

      if (tour) {
        handleStoppClick(fahrt, tour);
      }
    }
  }

  // PROJ-46: Tour-Start-Dialog öffnen
  function handleOeffneTourStartBestaetigung(fahrerId: string | null, datum: string | null) {
    setTourStartError(null);
    setTourStartBestaetigung({ fahrerId, datum });
  }

  // PROJ-46: Tour-Start durchführen
  async function handleTourStarten() {
    if (!tourStartBestaetigung?.fahrerId || !tourStartBestaetigung?.datum) return;

    setTourStartLaedt(true);
    setTourStartError(null);

    try {
      const result = await tourStarten(tourStartBestaetigung.fahrerId, tourStartBestaetigung.datum);
      if (!result.ok) {
        setTourStartError(result.error || "Fehler beim Starten der Tour.");
        setTourStartLaedt(false);
        return;
      }

      setTourStartBestaetigung(null);
      setTourStartLaedt(false);
      // revalidatePath wird von der Server-Action aufgerufen, kein zusätzliches Refresh nötig
    } catch (err) {
      setTourStartError("Unerwarteter Fehler beim Starten der Tour. Bitte erneut versuchen.");
      setTourStartLaedt(false);
    }
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
              {/* PROJ-45 Bugfix: Karte-Button als Sibling von AccordionTrigger (nicht nested) */}
              <div className="flex w-full items-center justify-between gap-2">
                <AccordionTrigger className="flex-1 min-h-[48px] py-3 hover:no-underline">
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

                {/* PROJ-46: Tour-Start-Button oder "Gestartet um HH:MM"-Text */}
                {zeigeTourStarten && tour.fahrten.length > 0 && (
                  (() => {
                    const tourKey = `${tour.fahrerId ?? "ohne-fahrer"}-${tour.datum ?? "ohne-datum"}`;
                    const gestartetAm = tourStarts?.[tourKey];

                    if (gestartetAm) {
                      // Tour bereits gestartet: Hinweis-Text anzeigen
                      return (
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          Gestartet um {formatZeitstempel(gestartetAm)}
                        </div>
                      );
                    }

                    // Tour noch nicht gestartet: Button anzeigen
                    return (
                      <Button
                        variant="default"
                        size="sm"
                        className="shrink-0 min-h-[48px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOeffneTourStartBestaetigung(tour.fahrerId, tour.datum);
                        }}
                      >
                        Tour starten
                      </Button>
                    );
                  })()
                )}

                {/* PROJ-45: Karte-Button — jetzt Sibling des Trigger, nicht nested */}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!tour.datum}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOeffneKarte(tour.fahrerId, tour.datum);
                  }}
                  className="shrink-0 gap-1"
                  aria-label="Karte dieser Tour anzeigen"
                >
                  <Map className="h-4 w-4" />
                  <span className="hidden sm:inline">Karte</span>
                </Button>
              </div>
              <AccordionContent>
                {/* PROJ-47: KPI-Leiste, nur sichtbar wenn Tour bereits gestartet wurde */}
                {(() => {
                  const tourKey = `${tour.fahrerId ?? "ohne-fahrer"}-${tour.datum ?? "ohne-datum"}`;
                  const tourGestartet = !!tourStarts?.[tourKey];
                  return tourGestartet && <TourKpiLeiste tour={tour} />;
                })()}
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

      {/*
        PROJ-44-Refine (Bug): key erzwingt einen Remount bei jedem Stopp-Wechsel,
        damit lokaler State (z.B. erledeltLaedt) nicht vom vorherigen Stopp
        hängen bleibt und "Erledigt" beim nächsten Stopp blockiert.
      */}
      <StoppDetailModal
        key={detailZiel?.fahrt.id ?? "leer"}
        ziel={detailZiel}
        onClose={() => setDetailZiel(null)}
        onOeffneBearbeiten={handleOeffneBearbeiten}
      />

      <FahrtBearbeitenDialog
        ziel={bearbeitenZiel}
        fahrerOptionen={fahrerOptionen}
        onClose={() => setBearbeitenZiel(null)}
      />

      {/* PROJ-45: Tour-Kartenansicht */}
      <TourKarteModal
        isOpen={karteZiel !== null}
        onClose={() => setKarteZiel(null)}
        fahrerId={karteZiel?.fahrerId ?? null}
        tourDatum={karteZiel?.tourDatum ?? null}
        onStoppClick={handleKarteStoppClick}
      />

      {/* PROJ-46: Tour-Start-Bestätigung */}
      <AlertDialog open={!!tourStartBestaetigung} onOpenChange={(open) => !open && setTourStartBestaetigung(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tour wirklich starten?</AlertDialogTitle>
            <AlertDialogDescription>
              Die Tour wird als gestartet markiert. Danach können Sie Stopps bearbeiten und die Navigation nutzen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel className="min-h-[48px]">Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="min-h-[48px]"
              onClick={handleTourStarten}
              disabled={tourStartLaedt}
            >
              {tourStartLaedt ? "Lädt…" : "Tour starten"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
