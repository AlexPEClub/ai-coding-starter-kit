"use client";

import { MapPin, CalendarClock, ClipboardPlus } from "lucide-react";
import { DriverTour } from "@/lib/actions/driver-tours";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TourDetailModalProps {
  tour: DriverTour;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuftragHinzufuegen: () => void;
}

/**
 * Detail-Modal einer Abholung (PROJ-34): zeigt die Eckdaten und bietet den
 * auffällig hervorgehobenen Einstieg in die Auftrags-Erfassung.
 */
export function TourDetailModal({
  tour,
  open,
  onOpenChange,
  onAuftragHinzufuegen,
}: TourDetailModalProps) {
  const address = [tour.partner.street, `${tour.partner.zip} ${tour.partner.city}`]
    .filter(Boolean)
    .join(", ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{tour.partner.company_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{address || "Keine Adresse hinterlegt"}</span>
          </div>
          {tour.geplantes_abholdatum && (
            <div className="flex items-start gap-2 text-muted-foreground">
              <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Geplante Abholung:{" "}
                {new Date(tour.geplantes_abholdatum).toLocaleDateString("de-DE")}
              </span>
            </div>
          )}
          {tour.titel && <p className="text-muted-foreground">{tour.titel}</p>}
        </div>

        <Button
          onClick={onAuftragHinzufuegen}
          className="min-h-[48px] w-full gap-2 bg-primary text-base font-semibold hover:bg-primary/90"
        >
          <ClipboardPlus className="h-5 w-5" />
          Auftrag hinzufügen
        </Button>
      </DialogContent>
    </Dialog>
  );
}
