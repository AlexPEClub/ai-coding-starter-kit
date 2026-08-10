"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ablehnenThemenvorschlag,
  freigebenThemenvorschlag,
  type Themenvorschlag,
} from "@/lib/actions/content-themen";

function formatDatum(datum: string): string {
  return new Date(datum).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

type Aktion = "freigeben" | "ablehnen";

interface ThemenKarteProps {
  themenvorschlag: Themenvorschlag;
}

export function ThemenKarte({ themenvorschlag }: ThemenKarteProps) {
  const [bestaetigung, setBestaetigung] = useState<Aktion | null>(null);
  const [laedt, setLaedt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBestaetigt() {
    if (!bestaetigung) return;

    setLaedt(true);
    setError(null);
    const result =
      bestaetigung === "freigeben"
        ? await freigebenThemenvorschlag(themenvorschlag.id)
        : await ablehnenThemenvorschlag(themenvorschlag.id);

    if (!result.ok) {
      setError(result.error);
      setLaedt(false);
      return;
    }

    toast.success(bestaetigung === "freigeben" ? "Thema freigegeben." : "Thema abgelehnt.");
    setLaedt(false);
    setBestaetigung(null);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">{themenvorschlag.titel}</CardTitle>
            <Badge variant="secondary">Vorgeschlagen</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-foreground">{themenvorschlag.begruendung}</p>

          {themenvorschlag.quellen.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Quellen</p>
              <ul className="mt-1 space-y-1">
                {themenvorschlag.quellen.map((quelle) => (
                  <li key={quelle.id} className="text-sm text-muted-foreground">
                    {quelle.dokumentDateiname}
                    {quelle.fundstelle && (
                      <span className="italic"> — „{quelle.fundstelle}“</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Wochen-Batch: {formatDatum(themenvorschlag.wochenBatchDatum)}
          </p>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-[48px] flex-1"
              onClick={() => setBestaetigung("ablehnen")}
            >
              Ablehnen
            </Button>
            <Button
              type="button"
              variant="default"
              className="min-h-[48px] flex-1"
              onClick={() => setBestaetigung("freigeben")}
            >
              Freigeben
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!bestaetigung} onOpenChange={(open) => !open && setBestaetigung(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Thema wirklich {bestaetigung === "freigeben" ? "freigeben" : "ablehnen"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bestaetigung === "freigeben"
                ? "Das Thema steht danach für die Content-Erstellung (PROJ-31) zur Auswahl."
                : "Das Thema erscheint frühestens nach 3 Monaten wieder als möglicher neuer Vorschlag."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel className="min-h-[48px]">Nein</AlertDialogCancel>
            <AlertDialogAction className="min-h-[48px]" onClick={handleBestaetigt} disabled={laedt}>
              {laedt ? "Lädt…" : "Ja"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
