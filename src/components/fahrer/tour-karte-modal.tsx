"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { AlertCircle, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getTourKarteDaten } from "@/lib/actions/tour-karte";
import type { TourKarteDaten } from "@/lib/actions/tour-karte-helpers";

/**
 * Dynamisch laden der Leaflet-Karte (benötigt Browser, kein SSR).
 * PROJ-45 Tech Design, Entscheidung 3: Karte nur clientseitig rendern.
 */
const TourKarteContent = dynamic(
  () => import("./tour-karte-inhalt").then((m) => m.TourKarteInhalt),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-96 items-center justify-center bg-muted/20">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Karte wird geladen...</p>
        </div>
      </div>
    ),
  }
);

export interface TourKarteModalProps {
  /** Ob das Modal offen ist. */
  isOpen: boolean;
  /** Schließen-Callback. */
  onClose: () => void;
  /** Fahrer-ID der Tour. */
  fahrerId: string | null;
  /** Datum der Tour (YYYY-MM-DD). */
  tourDatum: string | null;
  /** Wird aufgerufen, wenn ein Stopp auf der Karte angeklickt wird. */
  onStoppClick?: (stoppId: string) => void;
}

export function TourKarteModal({
  isOpen,
  onClose,
  fahrerId,
  tourDatum,
  onStoppClick,
}: TourKarteModalProps) {
  const [karteDaten, setKarteDaten] = useState<TourKarteDaten | null>(null);
  const [ladet, setLadet] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [versuchheNumber, setVersuchNumber] = useState(0);
  const timeoutRef = useCallback(() => new AbortController(), []);

  /**
   * Ladefunktion mit 10-Sekunden-Timeout (PROJ-45 Tech Design, Entscheidung 7).
   */
  const ladeTourKarteDaten = useCallback(async () => {
    if (!fahrerId || !tourDatum) {
      setFehler("Fahrer-ID oder Datum fehlen.");
      return;
    }

    setLadet(true);
    setFehler(null);

    try {
      // 10-Sekunden-Timeout
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Anfrage überschritten Zeitlimit (10s)")), 10000)
      );

      const datenPromise = getTourKarteDaten(fahrerId, tourDatum);
      const result = await Promise.race([datenPromise, timeoutPromise]);

      if (result.ok) {
        setKarteDaten(result.data);
        setFehler(null);
      } else {
        setFehler(result.error || "Kartendaten konnten nicht geladen werden.");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten.";
      setFehler(errorMessage);
    } finally {
      setLadet(false);
    }
  }, [fahrerId, tourDatum]);

  /**
   * Trigger Ladefunktion, wenn Modal geöffnet wird (nur einmalig per offene Session).
   */
  useEffect(() => {
    if (isOpen && !karteDaten && !ladet && !fehler) {
      ladeTourKarteDaten();
    }
  }, [isOpen, karteDaten, ladet, fehler, ladeTourKarteDaten]);

  /**
   * Erneut versuchen bei Fehler.
   * PROJ-45 Spec AC: "Fehlermeldung mit Erneut-versuchen-Button".
   */
  const handleErneut = () => {
    setKarteDaten(null);
    setFehler(null);
    setVersuchNumber((n) => n + 1);
    // Nächster useEffect-Durchlauf wird die Ladefunktion erneut aufrufen
  };

  const handleClose = () => {
    setKarteDaten(null);
    setFehler(null);
    setLadet(false);
    setVersuchNumber(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl p-0">
        <div className="flex flex-col">
          {/* Header */}
          <DialogHeader className="border-b border-border px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <DialogTitle>Karte</DialogTitle>
                <DialogDescription>
                  {tourDatum ? new Date(tourDatum).toLocaleDateString("de-DE") : "Tour"}
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-8 w-8"
                aria-label="Karte schließen"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="px-4 py-4">
            {ladet && (
              <div className="flex h-96 items-center justify-center bg-muted/20">
                <div className="text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  <p className="mt-2 text-sm font-medium text-foreground">
                    Route wird berechnet…
                  </p>
                </div>
              </div>
            )}

            {fehler && (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{fehler}</AlertDescription>
                </Alert>
                <Button onClick={handleErneut} className="w-full" variant="outline">
                  Erneut versuchen
                </Button>
              </div>
            )}

            {karteDaten && !ladet && !fehler && (
              <TourKarteContent
                karteDaten={karteDaten}
                onStoppClick={onStoppClick}
              />
            )}

            {!ladet && !fehler && !karteDaten && (
              <div className="text-center text-sm text-muted-foreground">
                <p>Kartendaten werden vorbereitet…</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
