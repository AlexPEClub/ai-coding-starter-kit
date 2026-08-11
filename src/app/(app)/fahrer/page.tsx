import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/server";
import {
  getAlleOffeneTouren,
  getEigeneOffeneTouren,
  listFahrerOptionen,
  ladeTourStarts,
  type LadeTourStartsResult,
} from "@/lib/actions/fahrten";
import { TourListe } from "@/components/fahrer/tour-liste";
import { TourenplanungClient } from "@/components/fahrer/tourenplanung-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "Fahrer — TMS 2.0",
};

/** Heutiges Datum in Europe/Berlin (YYYY-MM-DD) — serverseitig bestimmt, siehe "Offen ist serverseitig bestimmt". */
function heutigesDatumBerlin(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date());
}

export default async function FahrerPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  // PROJ-21: Fahrer-Seite ist Fahrer/Admin vorbehalten.
  if (!profile.roles?.some((r) => r === "fahrer" || r === "admin")) {
    redirect("/dashboard");
  }

  const [eigeneResult, alleResult, fahrerOptionenResult] = await Promise.all([
    getEigeneOffeneTouren(),
    getAlleOffeneTouren(),
    listFahrerOptionen(),
  ]);

  const heute = heutigesDatumBerlin();

  // PROJ-46: Lade Tour-Start-Einträge für alle Touren beider Tabs
  let tourStartsResult: LadeTourStartsResult = { ok: true, data: {} };
  if (eigeneResult.ok || alleResult.ok) {
    const allTouren = [
      ...(eigeneResult.ok ? eigeneResult.data : []),
      ...(alleResult.ok ? alleResult.data : []),
    ];

    // Extrahiere alle Fahrer+Datum-Kombinationen
    const fahrerDaten = new Set<string>();
    for (const tour of allTouren) {
      if (tour.fahrerId && tour.datum) {
        fahrerDaten.add(`${tour.fahrerId}|${tour.datum}`);
      }
    }

    if (fahrerDaten.size > 0) {
      tourStartsResult = await ladeTourStarts(
        Array.from(fahrerDaten).map((item) => {
          const [fahrerId, datum] = item.split("|");
          return { fahrerId, datum };
        })
      );
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground">Fahrer</h1>
      <p className="mb-6 text-muted-foreground">Offene Touren</p>

      <Tabs defaultValue="ich">
        <TabsList>
          <TabsTrigger value="ich" className="min-h-[40px]">
            Mir zugewiesen
          </TabsTrigger>
          <TabsTrigger value="tourenplanung" className="min-h-[40px]">
            Tourenplanung
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ich">
          {!eigeneResult.ok ? (
            <p className="text-sm text-destructive">{eigeneResult.error}</p>
          ) : (
            <TourListe
              touren={eigeneResult.data}
              leerTitel="Keine offenen Touren."
              heute={heute}
              fahrerOptionen={fahrerOptionenResult.ok ? fahrerOptionenResult.data : []}
              zeigeTourStarten={true}
              tourStarts={tourStartsResult.ok ? tourStartsResult.data : {}}
            />
          )}
        </TabsContent>

        <TabsContent value="tourenplanung">
          {!alleResult.ok ? (
            <p className="text-sm text-destructive">{alleResult.error}</p>
          ) : (
            <TourenplanungClient
              touren={alleResult.data}
              fahrerOptionen={fahrerOptionenResult.ok ? fahrerOptionenResult.data : []}
              heute={heute}
              tourStarts={tourStartsResult.ok ? tourStartsResult.data : {}}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
