"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatEUR, formatNumber } from "@/lib/pricing";
import { PROCESS_LABELS } from "@/lib/types";
import type { PriceBreakdown } from "@/lib/types";

interface Props {
  breakdown: PriceBreakdown;
}

export function PriceBreakdownCard({ breakdown }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{PROCESS_LABELS[breakdown.process]}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{breakdown.materialName}</p>
          </div>
          {breakdown.fits ? (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Passt
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Bauraum
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!breakdown.fits && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Passt nicht in den Bauraum</AlertTitle>
            <AlertDescription>
              Kein aktiver {breakdown.process}-Drucker hat ausreichend Bauraum. Bitte
              Geometrie pruefen oder Bauteil splitten.
            </AlertDescription>
          </Alert>
        )}
        {breakdown.fits && breakdown.fittingPrinterName && (
          <p className="text-xs text-muted-foreground">
            Passt in: <span className="font-medium">{breakdown.fittingPrinterName}</span>
          </p>
        )}

        <div className="space-y-1.5 text-sm">
          {breakdown.lines.map((line, idx) => (
            <div key={idx} className="flex justify-between gap-2 text-muted-foreground">
              <span className="truncate">{line.label}</span>
              <span className="tabular-nums">
                {line.amount === 0 ? "-" : formatEUR(line.amount)}
              </span>
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Stueckpreis</span>
            <span className="tabular-nums font-medium">{formatEUR(breakdown.unitPrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Menge</span>
            <span className="tabular-nums font-medium">{breakdown.quantity}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Druckzeit (geschaetzt)</span>
            <span className="tabular-nums">
              {formatNumber(breakdown.estimatedPrintHours)} h
            </span>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Gesamtpreis (netto)</span>
          <span className="text-2xl font-bold tabular-nums">
            {formatEUR(breakdown.totalPrice)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
