"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer as PrinterIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuotes, saveQuote, deleteQuote } from "@/lib/storage";
import { formatEUR, formatNumber } from "@/lib/pricing";
import { PROCESS_LABELS } from "@/lib/types";
import type { Quote, QuoteStatus } from "@/lib/types";

const STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: "Entwurf",
  sent: "Versendet",
  accepted: "Angenommen",
  rejected: "Abgelehnt",
};

export default function QuoteDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const quotes = useQuotes();
  const original = quotes.find((q) => q.id === params.id);
  const [draft, setDraft] = useState<Quote | null>(null);

  useEffect(() => {
    if (original && (!draft || draft.id !== original.id)) {
      setDraft(original);
    }
  }, [original, draft]);

  if (!draft) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <p className="text-sm text-muted-foreground">Angebot nicht gefunden.</p>
        <Button asChild variant="outline">
          <Link href="/quotes">Zurueck zur Liste</Link>
        </Button>
      </div>
    );
  }

  const total = draft.variants.reduce((s, v) => s + v.breakdown.totalPrice, 0);

  const persist = (next: Quote) => {
    setDraft(next);
    saveQuote({ ...next, updatedAt: new Date().toISOString() });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/quotes" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Zurueck
          </Link>
        </Button>
      </div>

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{draft.number}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Erstellt am {new Date(draft.createdAt).toLocaleString("de-DE")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{STATUS_LABEL[draft.status]}</Badge>
          <Button asChild variant="outline" className="gap-2">
            <Link href={`/quotes/${draft.id}/print`} target="_blank">
              <PrinterIcon className="h-4 w-4" />
              Drucken / PDF
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              deleteQuote(draft.id);
              toast.success("Geloescht");
              router.push("/quotes");
            }}
            aria-label="Loeschen"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kunde &amp; Bauteil</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Kunde</Label>
            <Input
              value={draft.customer.name}
              onChange={(e) =>
                persist({ ...draft, customer: { ...draft.customer, name: e.target.value } })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Firma</Label>
            <Input
              value={draft.customer.company ?? ""}
              onChange={(e) =>
                persist({
                  ...draft,
                  customer: { ...draft.customer, company: e.target.value || undefined },
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>E-Mail</Label>
            <Input
              type="email"
              value={draft.customer.email ?? ""}
              onChange={(e) =>
                persist({
                  ...draft,
                  customer: { ...draft.customer, email: e.target.value || undefined },
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Telefon</Label>
            <Input
              value={draft.customer.phone ?? ""}
              onChange={(e) =>
                persist({
                  ...draft,
                  customer: { ...draft.customer, phone: e.target.value || undefined },
                })
              }
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Adresse</Label>
            <Textarea
              rows={2}
              value={draft.customer.address ?? ""}
              onChange={(e) =>
                persist({
                  ...draft,
                  customer: { ...draft.customer, address: e.target.value || undefined },
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Bauteil-Bezeichnung</Label>
            <Input
              value={draft.partLabel}
              onChange={(e) => persist({ ...draft, partLabel: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={draft.status}
              onValueChange={(v) => persist({ ...draft, status: v as QuoteStatus })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABEL).map(([k, l]) => (
                  <SelectItem key={k} value={k}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Notizen</Label>
            <Textarea
              rows={3}
              value={draft.partNotes ?? ""}
              onChange={(e) =>
                persist({ ...draft, partNotes: e.target.value || undefined })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bauteil-Daten</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Datei</p>
            <p className="font-medium truncate">{draft.part.fileName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Volumen</p>
            <p className="font-medium tabular-nums">
              {formatNumber(draft.part.volumeCm3)} cm3
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Bounding Box</p>
            <p className="font-medium tabular-nums">
              {formatNumber(draft.part.boundingBox.x, 1)} x{" "}
              {formatNumber(draft.part.boundingBox.y, 1)} x{" "}
              {formatNumber(draft.part.boundingBox.z, 1)} mm
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Dreiecke</p>
            <p className="font-medium tabular-nums">
              {draft.part.triangleCount.toLocaleString("de-DE")}
            </p>
          </div>
        </CardContent>
      </Card>

      {draft.variants.map((v, idx) => (
        <Card key={idx}>
          <CardHeader>
            <CardTitle className="text-base">
              Position {idx + 1}: {PROCESS_LABELS[v.process]} - {v.breakdown.materialName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {v.breakdown.lines.map((line, i) => (
              <div key={i} className="flex justify-between text-muted-foreground">
                <span>{line.label}</span>
                <span className="tabular-nums">
                  {line.amount === 0 ? "-" : formatEUR(line.amount)}
                </span>
              </div>
            ))}
            <Separator />
            <div className="flex items-center justify-between pt-1">
              <span className="font-medium">Gesamt Position</span>
              <span className="text-lg font-bold tabular-nums">
                {formatEUR(v.breakdown.totalPrice)}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <span className="text-base font-medium">Gesamtsumme (netto)</span>
          <span className="text-2xl font-bold tabular-nums">{formatEUR(total)}</span>
        </CardContent>
      </Card>
    </div>
  );
}
