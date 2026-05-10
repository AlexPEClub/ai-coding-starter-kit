"use client";

import Link from "next/link";
import { FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuotes, deleteQuote } from "@/lib/storage";
import { formatEUR } from "@/lib/pricing";
import type { QuoteStatus } from "@/lib/types";

const STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: "Entwurf",
  sent: "Versendet",
  accepted: "Angenommen",
  rejected: "Abgelehnt",
};

const STATUS_VARIANT: Record<QuoteStatus, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  sent: "secondary",
  accepted: "default",
  rejected: "destructive",
};

export default function QuotesListPage() {
  const quotes = useQuotes();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Angebote</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Lokale Historie aller erstellten Angebote.
          </p>
        </div>
        <Button asChild>
          <Link href="/" className="gap-2">
            <FileText className="h-4 w-4" />
            Neues Angebot
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {quotes.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Noch keine Angebote. Erstelle dein erstes ueber den Kalkulator.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nummer</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Kunde</TableHead>
                  <TableHead>Bauteil</TableHead>
                  <TableHead>Verfahren</TableHead>
                  <TableHead className="text-right">Gesamt</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((q) => {
                  const total = q.variants.reduce((s, v) => s + v.breakdown.totalPrice, 0);
                  const processes = q.variants.map((v) => v.process).join(", ");
                  return (
                    <TableRow key={q.id}>
                      <TableCell className="font-medium">
                        <Link href={`/quotes/${q.id}`} className="hover:underline">
                          {q.number}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(q.createdAt).toLocaleDateString("de-DE")}
                      </TableCell>
                      <TableCell>
                        {q.customer.name}
                        {q.customer.company && (
                          <span className="text-xs text-muted-foreground block">
                            {q.customer.company}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{q.partLabel}</TableCell>
                      <TableCell>{processes}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {formatEUR(total)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[q.status]}>
                          {STATUS_LABEL[q.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            deleteQuote(q.id);
                            toast.success(`${q.number} geloescht`);
                          }}
                          aria-label="Loeschen"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
