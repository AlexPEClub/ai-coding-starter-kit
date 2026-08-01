"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TourListe } from "@/components/fahrer/tour-liste";
import type { FahrerOption, Tour } from "@/lib/actions/fahrten";

const ALLE_FAHRER = "__alle__";
const OHNE_FAHRER = "__ohne__";

interface TourenplanungClientProps {
  touren: Tour[];
  fahrerOptionen: FahrerOption[];
}

export function TourenplanungClient({ touren, fahrerOptionen }: TourenplanungClientProps) {
  const [fahrerFilter, setFahrerFilter] = useState<string>(ALLE_FAHRER);
  const [datumFilter, setDatumFilter] = useState<string>("");

  const gefiltert = useMemo(() => {
    return touren.filter((tour) => {
      if (fahrerFilter === OHNE_FAHRER && tour.fahrerId !== null) return false;
      if (
        fahrerFilter !== ALLE_FAHRER &&
        fahrerFilter !== OHNE_FAHRER &&
        tour.fahrerId !== fahrerFilter
      )
        return false;
      if (datumFilter && tour.datum !== datumFilter) return false;
      return true;
    });
  }, [touren, fahrerFilter, datumFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={fahrerFilter} onValueChange={setFahrerFilter}>
          <SelectTrigger className="min-h-[48px] sm:w-56">
            <SelectValue placeholder="Alle Fahrer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALLE_FAHRER}>Alle Fahrer</SelectItem>
            <SelectItem value={OHNE_FAHRER}>Kein Fahrer zugewiesen</SelectItem>
            {fahrerOptionen.map((fahrer) => (
              <SelectItem key={fahrer.id} value={fahrer.id}>
                {fahrer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={datumFilter}
          onChange={(e) => setDatumFilter(e.target.value)}
          className="min-h-[48px] sm:w-48"
          aria-label="Datum filtern"
        />

        {(fahrerFilter !== ALLE_FAHRER || datumFilter) && (
          <button
            type="button"
            onClick={() => {
              setFahrerFilter(ALLE_FAHRER);
              setDatumFilter("");
            }}
            className="min-h-[48px] text-sm text-muted-foreground underline underline-offset-2"
          >
            Filter zurücksetzen
          </button>
        )}
      </div>

      <TourListe
        touren={gefiltert}
        zeigeFahrer
        leerTitel="Keine Touren für diese Auswahl."
      />
    </div>
  );
}
