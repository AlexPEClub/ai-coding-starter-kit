"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { ExternalLink, AlertCircle, MapPin, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getFahrtAenderungen,
  markiereFahrtAlsErledigt,
  type Fahrt,
  type FahrtAenderung,
} from "@/lib/actions/fahrten";
import { berechneFahrtBadge } from "@/lib/actions/fahrten-helpers";

function formatDatum(datum: string | null): string {
  if (!datum) return "–";
  return new Date(datum).toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatZeitstempel(iso: string): string {
  return new Date(iso).toLocaleString("de-DE", {
    timeZone: "Europe/Berlin",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatWert(feld: string, wert: string | null): string {
  if (wert === null) return "–";
  if (feld === "geplantes_abholdatum") return formatDatum(wert);
  return wert;
}

/** PROJ-42: berechnete Ankunftszeit an einem Stopp, z. B. "09:15". */
function formatAnkunftszeit(ankunftszeit: string): string {
  return new Date(ankunftszeit).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  });
}

/**
 * PROJ-44-Refine: Abweichung in Minuten zwischen geplanter (berechneter)
 * Ankunftszeit und tatsächlicher Erledigt-Zeit. Positiv = zu spät, negativ = zu früh.
 */
function berechneAbweichungMinuten(berechneteAnkunftszeit: string, erledigtAm: string): number {
  return Math.round(
    (new Date(erledigtAm).getTime() - new Date(berechneteAnkunftszeit).getTime()) / 60000
  );
}

/**
 * PROJ-46: Formatiert die Pünktlichkeits-Abweichung benutzerfreundlich.
 * - 0 Min: "pünktlich"
 * - < 5 Min verspätet: "X Min. später"
 * - < 120 Min verspätet: "X Min. später"
 * - >= 120 Min verspätet: "> 2 Std. später"
 * - < 0 Min (zu früh): "X Min. früher"
 */
function formatPuenktlichkeit(abweichungMinuten: number): { text: string; variant: "neutral" | "positive" | "negative" } {
  if (abweichungMinuten === 0) {
    return { text: "pünktlich", variant: "neutral" };
  }
  if (abweichungMinuten < 0) {
    const minutenAbs = Math.abs(abweichungMinuten);
    return { text: `${minutenAbs} Min. früher`, variant: "positive" };
  }
  if (abweichungMinuten < 120) {
    return { text: `${abweichungMinuten} Min. später`, variant: "negative" };
  }
  return { text: "> 2 Std. später", variant: "negative" };
}

/** Etappen-Distanz in km, z. B. "2,3 km". */
function formatDistanz(distanzMeter: number): string {
  return `${(distanzMeter / 1000).toLocaleString("de-DE", { maximumFractionDigits: 1 })} km`;
}

/** Etappen-Fahrzeit, z. B. "15 Min." oder "1 Std. 5 Min.". */
function formatDauer(dauerSekunden: number): string {
  const minuten = Math.round(dauerSekunden / 60);
  const stunden = Math.floor(minuten / 60);
  const restMinuten = minuten % 60;
  return stunden > 0 ? `${stunden} Std. ${restMinuten} Min.` : `${restMinuten} Min.`;
}

/** Formatiere die Kundenadresse für einen Google-Maps-Link. */
function formatAdresseForMaps(kunde: Fahrt["kunde"]): string {
  const zeile1 = kunde.strasse ?? "";
  const zeile2 = [kunde.plz, kunde.ort].filter(Boolean).join(" ");
  return [zeile1, zeile2].filter(Boolean).join(", ");
}

const FELD_LABEL: Record<string, string> = {
  fahrer_id: "Fahrer",
  geplantes_abholdatum: "Datum",
  notiz: "Notiz",
  status: "Status",
};

export interface StoppDetailModalZiel {
  fahrt: Fahrt;
  tourFahrerId: string | null;
  tourDatum: string | null;
  fahrerName?: string | null; // Name des Fahrers, der diese Fahrt zugewiesen hat
  legDistanceMeters?: number | null; // PROJ-44: Etappen-Distanz in Metern
  legDurationSeconds?: number | null; // PROJ-44: Etappen-Fahrzeit in Sekunden
  heute: string;
  tourGestartet?: boolean; // PROJ-46: Ob die Tour, zu der dieser Stopp gehört, gestartet wurde
}

interface StoppDetailModalProps {
  ziel: StoppDetailModalZiel | null;
  onClose: () => void;
  onOeffneBearbeiten: (ziel: StoppDetailModalZiel) => void;
}

/**
 * PROJ-44: Detail-Modal für einen Stopp in der Fahrer-Tourenliste.
 * Zeigt alle Infos (Kunde, Status, Datum, Fahrer, Notiz, Route, Chronologie)
 * und bietet drei Aktionen: Ändern (öffnet PROJ-41-Dialog), Navi (Google Maps),
 * Erledigt (Status-Wechsel mit Bestätigung).
 */
export function StoppDetailModal({
  ziel,
  onClose,
  onOeffneBearbeiten,
}: StoppDetailModalProps) {
  const [aenderungen, setAenderungen] = useState<FahrtAenderung[]>([]);
  const [verlaufLaedt, setVerlaufLaedt] = useState(false);
  const [erledeltBestaetigung, setErledeltBestaetigung] = useState(false);
  const [erledeltLaedt, setErledeltLaedt] = useState(false);
  const [erledeltError, setErledeltError] = useState<string | null>(null);
  const [erfolgsAnimation, setErfolgsAnimation] = useState(false);
  const bestaetigungsButtonRef = useRef<HTMLButtonElement>(null);

  // Lade Chronologie beim Öffnen des Modals
  useEffect(() => {
    if (!ziel) return;

    let isMounted = true;

    const ladeFahrtAenderungen = async () => {
      if (!isMounted) return;
      setVerlaufLaedt(true);
      const result = await getFahrtAenderungen(ziel.fahrt.id);
      if (isMounted) {
        setAenderungen(result.ok ? result.data : []);
        setVerlaufLaedt(false);
      }
    };

    void ladeFahrtAenderungen();

    return () => {
      isMounted = false;
    };
  }, [ziel]);

  if (!ziel) return null;

  const badge = berechneFahrtBadge(ziel.fahrt.status, ziel.fahrt.geplantesAbholdatum, ziel.heute);

  // Status ist "erledigt" wenn status === "erledigt" (PROJ-44)
  const istErledigt = ziel.fahrt.status === "erledigt";

  // PROJ-44-Refine: Abweichung geplante vs. tatsächliche Erledigt-Zeit, nur wenn beide vorhanden.
  const abweichungMinuten =
    istErledigt && ziel.fahrt.erledigtAm && ziel.fahrt.berechneteAnkunftszeit
      ? berechneAbweichungMinuten(ziel.fahrt.berechneteAnkunftszeit, ziel.fahrt.erledigtAm)
      : null;

  // Navi-Link zu Google Maps mit der Kundenadresse
  const adresseFuerMaps = formatAdresseForMaps(ziel.fahrt.kunde);
  const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(adresseFuerMaps)}`;

  async function handleErledigt() {
    if (!ziel) return;

    setErledeltLaedt(true);
    setErledeltError(null);

    // PROJ-44-Refine: Geolocation-Erfassung mit Timeout (5 Sekunden)
    // Analog zu PROJ-46 handleTourStarten, aber ohne Depot-Fallback
    let startPunkt: { lat: number; lon: number } | null = null;

    if (navigator.geolocation) {
      try {
        // Wrapper für Geolocation mit Timeout
        const geolocationPromise = new Promise<GeolocationCoordinates | null>((resolve) => {
          const timeoutId = setTimeout(() => {
            resolve(null); // Timeout: null zurückgeben, nicht abbrechen
          }, 5000);

          navigator.geolocation.getCurrentPosition(
            (position) => {
              clearTimeout(timeoutId);
              resolve(position.coords);
            },
            () => {
              // Fehler (Berechtigung verweigert, GPS aus, etc.): null zurückgeben
              clearTimeout(timeoutId);
              resolve(null);
            }
          );
        });

        const coords = await geolocationPromise;
        if (coords) {
          startPunkt = { lat: coords.latitude, lon: coords.longitude };
        }
      } catch {
        // Fehler bei Geolocation-API: null, weitermachen mit Fallback
      }
    }

    try {
      // PROJ-44-Refine: markiereFahrtAlsErledigt wird mit optionalem startPunkt-Parameter aufgerufen
      const result = await markiereFahrtAlsErledigt(ziel.fahrt.id, startPunkt || undefined);
      if (!result.ok) {
        setErledeltError(result.error || "Fehler beim Speichern.");
        setErledeltLaedt(false);
        return;
      }

      // PROJ-44-Refine: Kurze Erfolgs-Animation triggern, bevor Modal schließt
      setErfolgsAnimation(true);
      toast.success("Stopp als erledigt markiert.");

      // Nach kurzer Animation schließen
      setTimeout(() => {
        setErledeltBestaetigung(false);
        onClose();
        setErfolgsAnimation(false);
        // revalidatePath wird von der Server-Action aufgerufen, also ist kein
        // zusätzlicher router.refresh() nötig — die Tour-Listen werden automatisch neu geladen
      }, 300);
    } catch (err) {
      setErledeltError("Unerwarteter Fehler beim Speichern. Bitte erneut versuchen.");
      setErledeltLaedt(false);
    }
  }

  return (
    <>
      <Dialog open={!!ziel} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{ziel.fahrt.kunde.name}</DialogTitle>
            {ziel.fahrt.kunde.strasse && (
              <DialogDescription className="text-sm text-muted-foreground">
                {ziel.fahrt.kunde.strasse}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Status-Badge */}
            <div className="flex items-center gap-3">
              <Badge variant={badge.variant}>{badge.label}</Badge>
              {istErledigt && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                  Erledigt
                </div>
              )}
            </div>

            {/* Basis-Infos */}
            <div className="space-y-3 border-t border-border pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Datum</p>
                  <p className="text-sm text-foreground">
                    {formatDatum(ziel.fahrt.geplantesAbholdatum)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Fahrer</p>
                  <p className="text-sm text-foreground">
                    {ziel.fahrerName ?? "–"}
                  </p>
                </div>
              </div>
            </div>

            {/* Notiz (falls vorhanden) */}
            {ziel.fahrt.notiz && (
              <div className="rounded-md border border-border bg-muted/30 p-3">
                <p className="text-xs font-medium uppercase text-muted-foreground">Notiz</p>
                <p className="mt-1 text-sm text-foreground">{ziel.fahrt.notiz}</p>
              </div>
            )}

            {/* Route-Infos (PROJ-42 + neu: Etappen-Distanz/Fahrzeit) */}
            {ziel.fahrt.berechneteAnkunftszeit && (
              <div className="space-y-3 border-t border-border pt-4">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Berechnete Ankunftszeit
                  </p>
                  <p className="text-sm text-foreground">
                    {formatAnkunftszeit(ziel.fahrt.berechneteAnkunftszeit)} Uhr
                  </p>
                </div>

                {/* Erledigt-Zeit + Abweichung (PROJ-44-Refine, PROJ-46: formatiert) */}
                {ziel.fahrt.erledigtAm && (
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      Erledigt um
                    </p>
                    <p className="text-sm text-foreground">
                      {formatAnkunftszeit(ziel.fahrt.erledigtAm)} Uhr
                      {abweichungMinuten !== null && (
                        (() => {
                          const puenktlichkeit = formatPuenktlichkeit(abweichungMinuten);
                          const colorClass =
                            puenktlichkeit.variant === "positive"
                              ? "text-green-600"
                              : puenktlichkeit.variant === "negative"
                                ? "text-destructive"
                                : "text-muted-foreground";
                          return (
                            <span className={`ml-2 font-medium ${colorClass}`}>
                              {puenktlichkeit.text}
                            </span>
                          );
                        })()
                      )}
                    </p>
                  </div>
                )}

                {/* Etappen-Distanz und Fahrzeit (PROJ-44) */}
                {ziel.legDistanceMeters !== null && ziel.legDistanceMeters !== undefined && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Etappen-Distanz
                      </p>
                      <p className="text-sm text-foreground">{formatDistanz(ziel.legDistanceMeters)}</p>
                    </div>
                    {ziel.legDurationSeconds !== null && ziel.legDurationSeconds !== undefined && (
                      <div>
                        <p className="text-xs font-medium uppercase text-muted-foreground">
                          Etappen-Fahrzeit
                        </p>
                        <p className="text-sm text-foreground">{formatDauer(ziel.legDurationSeconds)}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Chronologie */}
            <div className="space-y-2 border-t border-border pt-4">
              <p className="text-sm font-medium">Änderungsverlauf</p>
              {verlaufLaedt ? (
                <p className="text-sm text-muted-foreground">Lädt…</p>
              ) : aenderungen.length === 0 ? (
                <p className="text-sm text-muted-foreground">Noch keine Änderungen.</p>
              ) : (
                <ul className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-border bg-muted/30 p-3">
                  {aenderungen.map((a) => (
                    <li key={a.id} className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{a.geaendertVonName}</span> hat
                      am {formatZeitstempel(a.geaendertAm)} {FELD_LABEL[a.feld] ?? a.feld} geändert:{" "}
                      {formatWert(a.feld, a.alterWert)} → {formatWert(a.feld, a.neuerWert)}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Fehler bei "Erledigt" */}
            {erledeltError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{erledeltError}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Action-Buttons */}
          <div className="flex gap-2 pt-4">
            {!istErledigt && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-[48px] flex-1"
                onClick={() => onOeffneBearbeiten(ziel)}
              >
                Ändern
              </Button>
            )}

            {/* PROJ-46: Navi-Button deaktivieren, wenn Tour nicht gestartet */}
            {ziel.tourGestartet === false ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-h-[48px] flex-1"
                      disabled
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Navi
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Erst nach Tour-Start verfügbar</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-[48px] flex-1"
                asChild
              >
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                  <MapPin className="h-4 w-4 mr-2" />
                  Navi
                </a>
              </Button>
            )}

            {!istErledigt && (
              <>
                {/* PROJ-46: Erledigt-Button deaktivieren, wenn Tour nicht gestartet */}
                {ziel.tourGestartet === false ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          className="min-h-[48px] flex-1"
                          disabled
                        >
                          Erledigt
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Erst nach Tour-Start verfügbar</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="min-h-[48px] flex-1"
                    onClick={() => setErledeltBestaetigung(true)}
                    disabled={erledeltLaedt}
                  >
                    {erledeltLaedt ? "Lädt…" : "Erledigt"}
                  </Button>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Ja/Nein-Bestätigung für "Erledigt" */}
      <AlertDialog open={erledeltBestaetigung} onOpenChange={setErledeltBestaetigung}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stopp als erledigt markieren?</AlertDialogTitle>
            <AlertDialogDescription>
              Der Stopp wird in der Tour-Liste ans Ende sortiert und durchgestrichen dargestellt.
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel className="min-h-[48px]">Nein</AlertDialogCancel>
            {/* PROJ-44-Refine: Erfolgs-Animation beim Bestätigen */}
            <motion.div
              animate={erfolgsAnimation ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.3 }}
              className="flex-1"
            >
              <AlertDialogAction
                ref={bestaetigungsButtonRef}
                className="min-h-[48px]"
                onClick={handleErledigt}
                disabled={erledeltLaedt || erfolgsAnimation}
              >
                {erledeltLaedt ? "Lädt…" : "Ja"}
              </AlertDialogAction>
            </motion.div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
