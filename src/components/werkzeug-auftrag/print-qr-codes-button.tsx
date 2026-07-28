"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { printQrCodeLabels } from "@/lib/actions/werkzeug-auftraege";

const SCHNELLWAHL = [25, 50, 100];

/**
 * "QR-Codes drucken"-Button — gemeinsame Komponente für /fahrer, /wareneingang
 * und die künftige QR-Code-Verwaltung (PROJ-34: ein Button/Modal, drei
 * Einstiegspunkte). Sendet den Druckauftrag über PrintNode (Backend-Stub) und
 * legt erst NACH erfolgreichem Druck die neuen freien Codes an.
 */
export function PrintQrCodesButton() {
  const [open, setOpen] = useState(false);
  const [anzahl, setAnzahl] = useState<number | null>(50);
  const [printing, setPrinting] = useState(false);

  async function handlePrint() {
    if (!anzahl || anzahl <= 0) {
      toast.error("Bitte eine gültige Anzahl wählen.");
      return;
    }
    setPrinting(true);
    try {
      const result = await printQrCodeLabels(anzahl);
      if (result.ok) {
        toast.success(`${result.data.created} QR-Code-Etiketten werden gedruckt.`);
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      console.error(err);
      toast.error("Druckauftrag konnte nicht gesendet werden.");
    } finally {
      setPrinting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="min-h-[44px] gap-2">
          <Printer className="h-4 w-4" />
          <span className="hidden sm:inline">QR-Codes drucken</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>QR-Codes drucken</DialogTitle>
          <DialogDescription>
            Neue, noch freie QR-Code-Etiketten auf dem angeschlossenen Etikettendrucker
            ausdrucken.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            {SCHNELLWAHL.map((n) => (
              <Button
                key={n}
                type="button"
                variant={anzahl === n ? "default" : "outline"}
                className="min-h-[44px] flex-1"
                onClick={() => setAnzahl(n)}
              >
                {n}
              </Button>
            ))}
          </div>

          <div className="space-y-1">
            <Label htmlFor="anzahl">Oder eigene Anzahl</Label>
            <Input
              id="anzahl"
              type="number"
              min={1}
              max={500}
              value={anzahl ?? ""}
              onChange={(e) => setAnzahl(e.target.value ? Number(e.target.value) : null)}
              className="min-h-[44px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={printing}>
            Abbrechen
          </Button>
          <Button onClick={handlePrint} disabled={printing} className="gap-2">
            <Printer className="h-4 w-4" />
            {printing ? "Wird gesendet…" : "Drucken"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
