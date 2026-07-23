"use client";

import { useState } from "react";
import { Check, MapPin, Navigation } from "lucide-react";
import {
  DriverTour,
  markTourAsCollected,
  markTourEnRoute,
  type Coords,
} from "@/lib/actions/driver-tours";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";

interface DriverTourCardProps {
  tour: DriverTour;
}

/**
 * Best-effort-Standort: fragt einmal den Gerätestandort ab.
 * Wirft NIE — bei Ablehnung/Timeout/keinem GPS wird `undefined` geliefert.
 */
function getCoordsBestEffort(): Promise<Coords | undefined> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(undefined);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(undefined),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  });
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  geplant: { label: "Offen", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
  unterwegs: { label: "Unterwegs", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
  erledigt: { label: "Erledigt", className: "bg-green-100 text-green-800 hover:bg-green-100" },
};

export function DriverTourCard({ tour }: DriverTourCardProps) {
  const [isCollecting, setIsCollecting] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const router = useRouter();

  const address = [tour.partner.street, `${tour.partner.zip} ${tour.partner.city}`]
    .filter(Boolean)
    .join(", ");

  // Google-Maps-Navigation (turn-by-turn) zum Kunden
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${tour.partner.company_name} ${address}`
  )}`;

  const badge = STATUS_BADGE[tour.status] ?? {
    label: tour.status,
    className: "bg-muted text-muted-foreground hover:bg-muted",
  };

  // "Navi" gedrückt: Navigation öffnet (via <a>), zusätzlich als unterwegs melden.
  async function handleNavi() {
    if (tour.status === "erledigt" || isRouting) return;
    setIsRouting(true);
    const coords = await getCoordsBestEffort();
    const result = await markTourEnRoute(tour.id, coords);
    if (result.ok) {
      router.refresh();
    } else {
      alert("Fehler: " + result.error);
    }
    setIsRouting(false);
  }

  // "Erledigt" bestätigt: abschließen (Standort best-effort).
  async function handleConfirmCollected() {
    setIsCollecting(true);
    const coords = await getCoordsBestEffort();
    const result = await markTourAsCollected(tour.id, coords);
    if (result.ok) {
      router.refresh();
    } else {
      alert("Fehler: " + result.error);
    }
    setIsCollecting(false);
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      {/* Kunden-Name */}
      <div className="mb-2">
        <h3 className="text-base font-semibold text-foreground">
          {tour.partner.company_name}
        </h3>
      </div>

      {/* Adresse */}
      <div className="mb-3 flex items-start gap-2 text-sm text-muted-foreground">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <div>{tour.partner.street}</div>
          <div>{tour.partner.zip} {tour.partner.city}</div>
        </div>
      </div>

      {/* Status + Buttons */}
      <div className="flex items-center justify-between gap-2">
        {/* Status-Badge (echter Status) */}
        <Badge className={badge.className}>{badge.label}</Badge>

        {/* Action-Buttons */}
        <div className="flex gap-2">
          {/* Navi: öffnet Google-Maps-Navigation und meldet "unterwegs" */}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleNavi}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
          >
            <Navigation className="h-4 w-4" />
            Navi
          </a>

          {/* Erledigt: Bestätigungs-Modal */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                disabled={isCollecting}
                className="min-h-[44px] bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="mr-1 h-4 w-4" />
                {isCollecting ? "..." : "Erledigt"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Wirklich erledigt?</AlertDialogTitle>
                <AlertDialogDescription>
                  Abholung bei <strong>{tour.partner.company_name}</strong> als erledigt
                  markieren? Zeitpunkt und (falls erlaubt) Standort werden gespeichert.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmCollected}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Ja, erledigt
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
