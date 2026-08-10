"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ThemenKarte } from "./themen-karte";
import type { Themenvorschlag } from "@/lib/actions/content-themen";

interface ThemenvorschlaegePageProps {
  offene: Themenvorschlag[];
  archiv: Themenvorschlag[];
}

function formatDatum(datum: string): string {
  return new Date(datum).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatZeitstempel(iso: string | null): string {
  if (!iso) return "–";
  return new Date(iso).toLocaleString("de-DE", {
    timeZone: "Europe/Berlin",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ThemenvorschlaegePage({ offene, archiv }: ThemenvorschlaegePageProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground">Themenvorschläge</h1>
      <p className="mb-6 text-muted-foreground">
        Wöchentliche KI-Themenvorschläge aus der Wissensbasis
      </p>

      <Tabs defaultValue="offen">
        <TabsList>
          <TabsTrigger value="offen" className="min-h-[40px]">
            Offen
          </TabsTrigger>
          <TabsTrigger value="archiv" className="min-h-[40px]">
            Archiv
          </TabsTrigger>
        </TabsList>

        <TabsContent value="offen" className="space-y-4">
          {offene.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aktuell keine offenen Themenvorschläge. Der wöchentliche Scan läuft automatisch
              montags — schau nächste Woche wieder vorbei.
            </p>
          ) : (
            offene.map((themenvorschlag) => (
              <ThemenKarte key={themenvorschlag.id} themenvorschlag={themenvorschlag} />
            ))
          )}
        </TabsContent>

        <TabsContent value="archiv">
          {archiv.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine entschiedenen Themenvorschläge.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titel</TableHead>
                  <TableHead>Woche</TableHead>
                  <TableHead>Entscheidung</TableHead>
                  <TableHead>Entscheider</TableHead>
                  <TableHead>Zeitpunkt</TableHead>
                  <TableHead>Artikel erstellt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {archiv.map((themenvorschlag) => (
                  <TableRow key={themenvorschlag.id}>
                    <TableCell className="font-medium">{themenvorschlag.titel}</TableCell>
                    <TableCell>{formatDatum(themenvorschlag.wochenBatchDatum)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={themenvorschlag.status === "freigegeben" ? "secondary" : "outline"}
                      >
                        {themenvorschlag.status === "freigegeben" ? "Freigegeben" : "Abgelehnt"}
                      </Badge>
                    </TableCell>
                    <TableCell>{themenvorschlag.entschiedenVonName ?? "–"}</TableCell>
                    <TableCell>{formatZeitstempel(themenvorschlag.entschiedenAm)}</TableCell>
                    <TableCell className="text-muted-foreground">–</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
