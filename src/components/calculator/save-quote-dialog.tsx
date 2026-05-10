"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save } from "lucide-react";
import { getNextQuoteNumber, saveQuote } from "@/lib/storage";
import type { AnalyzedPart, PriceBreakdown, ProcessId, Quote } from "@/lib/types";

interface Props {
  part: AnalyzedPart;
  process: ProcessId;
  materialId: string;
  quantity: number;
  breakdown: PriceBreakdown;
}

export function SaveQuoteDialog(props: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [partLabel, setPartLabel] = useState(props.part.fileName.replace(/\.stl$/i, ""));
  const [partNotes, setPartNotes] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");

  const submit = () => {
    if (!name.trim()) {
      toast.error("Kundenname erforderlich");
      return;
    }
    const now = new Date().toISOString();
    const quote: Quote = {
      id: crypto.randomUUID(),
      number: getNextQuoteNumber(),
      createdAt: now,
      updatedAt: now,
      status: "draft",
      customer: { name: name.trim(), company: company.trim() || undefined, email: email.trim() || undefined },
      partLabel: partLabel.trim() || props.part.fileName,
      partNotes: partNotes.trim() || undefined,
      part: props.part,
      variants: [
        {
          process: props.process,
          materialId: props.materialId,
          quantity: props.quantity,
          breakdown: props.breakdown,
        },
      ],
    };
    saveQuote(quote);
    toast.success(`Angebot ${quote.number} gespeichert`);
    setOpen(false);
    router.push(`/quotes/${quote.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <Save className="h-4 w-4" />
          Als Angebot speichern
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Angebot speichern</DialogTitle>
          <DialogDescription>
            Kundeninformationen erfassen, dann wird das Angebot in der Historie abgelegt.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Bauteil-Bezeichnung</Label>
              <Input value={partLabel} onChange={(e) => setPartLabel(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Kunde</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Vor- und Nachname"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Firma</Label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>E-Mail</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notizen</Label>
            <Textarea
              value={partNotes}
              onChange={(e) => setPartNotes(e.target.value)}
              placeholder="z.B. spezielle Anforderungen, Toleranzen, Farbe..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Abbrechen
          </Button>
          <Button onClick={submit}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
