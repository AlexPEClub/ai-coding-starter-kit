"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  bearbeiteFahrt,
  getFahrtAenderungen,
  type Fahrt,
  type FahrerOption,
  type FahrtAenderung,
} from "@/lib/actions/fahrten";

const NOTIZ_MAX_LAENGE = 500;

const FELD_LABEL: Record<string, string> = {
  fahrer_id: "Fahrer",
  geplantes_abholdatum: "Datum",
  notiz: "Notiz",
};

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

export interface BearbeiteFahrtZiel {
  fahrt: Fahrt;
  tourFahrerId: string | null;
  tourDatum: string | null;
}

interface FahrtBearbeitenDialogProps {
  ziel: BearbeiteFahrtZiel | null;
  fahrerOptionen: FahrerOption[];
  onClose: () => void;
}

export function FahrtBearbeitenDialog({ ziel, fahrerOptionen, onClose }: FahrtBearbeitenDialogProps) {
  const router = useRouter();
  const [fahrerId, setFahrerId] = useState("");
  const [datum, setDatum] = useState("");
  const [notiz, setNotiz] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aenderungen, setAenderungen] = useState<FahrtAenderung[]>([]);
  const [verlaufLaedt, setVerlaufLaedt] = useState(false);

  useEffect(() => {
    if (!ziel) return;

    setFahrerId(ziel.tourFahrerId ?? "");
    setDatum(ziel.tourDatum ?? "");
    setNotiz(ziel.fahrt.notiz ?? "");
    setError(null);

    setVerlaufLaedt(true);
    getFahrtAenderungen(ziel.fahrt.id).then((result) => {
      setAenderungen(result.ok ? result.data : []);
      setVerlaufLaedt(false);
    });
  }, [ziel]);

  if (!ziel) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ziel) return;

    if (!fahrerId) {
      setError("Bitte einen Fahrer auswählen.");
      return;
    }
    if (!datum) {
      setError("Bitte ein Datum auswählen.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await bearbeiteFahrt(ziel.fahrt.id, {
        fahrerId,
        datum,
        notiz: notiz.trim() || null,
      });

      if (result.ok) {
        toast.success("Gespeichert.");
        router.refresh();
        onClose();
      } else {
        setError(result.error);
      }
    } catch {
      setError("Unerwarteter Fehler beim Speichern. Bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={!!ziel} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Stopp bearbeiten</DialogTitle>
            <DialogDescription>{ziel.fahrt.kunde.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Fahrer *</label>
              <Select value={fahrerId} onValueChange={setFahrerId} disabled={loading}>
                <SelectTrigger className="min-h-[48px] w-full" aria-label="Fahrer auswählen">
                  <SelectValue placeholder="Fahrer auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {fahrerOptionen.map((fahrer) => (
                    <SelectItem key={fahrer.id} value={fahrer.id}>
                      {fahrer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="fahrt-datum" className="text-sm font-medium">
                Datum *
              </label>
              <input
                id="fahrt-datum"
                type="date"
                value={datum}
                onChange={(e) => setDatum(e.target.value)}
                disabled={loading}
                className="min-h-[48px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="fahrt-notiz" className="text-sm font-medium">
                Notiz
              </label>
              <Textarea
                id="fahrt-notiz"
                value={notiz}
                onChange={(e) => setNotiz(e.target.value)}
                placeholder="z. B. Kunde erst nach 14 Uhr erreichbar"
                maxLength={NOTIZ_MAX_LAENGE}
                disabled={loading}
                className="min-h-[80px]"
              />
              <p className="text-right text-xs text-muted-foreground">
                {notiz.length}/{NOTIZ_MAX_LAENGE}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Änderungsverlauf</p>
              {verlaufLaedt ? (
                <p className="text-sm text-muted-foreground">Lädt…</p>
              ) : aenderungen.length === 0 ? (
                <p className="text-sm text-muted-foreground">Noch keine Änderungen.</p>
              ) : (
                <ul className="max-h-40 space-y-2 overflow-y-auto rounded-md border border-border bg-muted/30 p-3">
                  {aenderungen.map((a) => (
                    <li key={a.id} className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{a.geaendertVonName}</span> hat
                      am {formatZeitstempel(a.geaendertAm)} {FELD_LABEL[a.feld] ?? a.feld} geändert:{" "}
                      {formatWert(a.feld, a.alterWert)} → {formatWert(a.feld, a.neuerWert)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Speichert…" : "Speichern"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
