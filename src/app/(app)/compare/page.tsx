"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { STLUploader } from "@/components/calculator/stl-uploader";
import { PartSummary } from "@/components/calculator/part-summary";
import { useConfig, saveQuote, getNextQuoteNumber } from "@/lib/storage";
import { calculatePrice, formatEUR, formatNumber } from "@/lib/pricing";
import { PROCESSES, PROCESS_LABELS } from "@/lib/types";
import type { AnalyzedPart, ProcessId, Quote } from "@/lib/types";

type VariantState = Record<ProcessId, { materialId: string; quantity: number }>;

export default function ComparePage() {
  const router = useRouter();
  const config = useConfig();
  const [part, setPart] = useState<AnalyzedPart | null>(null);
  const [variants, setVariants] = useState<VariantState>({
    FDM: { materialId: "", quantity: 1 },
    SLS: { materialId: "", quantity: 1 },
    DLP: { materialId: "", quantity: 1 },
  });

  const breakdowns = useMemo(() => {
    if (!part) return null;
    return PROCESSES.map((process) => {
      const activeMaterials = config.materials.filter(
        (m) => m.process === process && m.active,
      );
      const wantedId = variants[process].materialId;
      const material =
        activeMaterials.find((m) => m.id === wantedId) ?? activeMaterials[0];
      if (!material) return { process, breakdown: null, material: null };
      return {
        process,
        breakdown: calculatePrice({
          process,
          part,
          material,
          formula: config.formulas[process],
          quantity: variants[process].quantity,
          tiers: config.discountTiers[process] ?? [],
          printers: config.printers,
        }),
        material,
      };
    });
  }, [part, variants, config]);

  const adoptAsQuote = (process: ProcessId) => {
    if (!part || !breakdowns) return;
    const entry = breakdowns.find((b) => b.process === process);
    if (!entry?.breakdown || !entry.material) return;
    const now = new Date().toISOString();
    const quote: Quote = {
      id: crypto.randomUUID(),
      number: getNextQuoteNumber(),
      createdAt: now,
      updatedAt: now,
      status: "draft",
      customer: { name: "Neuer Kunde" },
      partLabel: part.fileName.replace(/\.stl$/i, ""),
      part,
      variants: [
        {
          process,
          materialId: entry.material.id,
          quantity: variants[process].quantity,
          breakdown: entry.breakdown,
        },
      ],
    };
    saveQuote(quote);
    toast.success(`Angebot ${quote.number} angelegt`);
    router.push(`/quotes/${quote.id}`);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Verfahren vergleichen</h2>
        <p className="text-sm text-muted-foreground mt-1">
          STL hochladen und FDM, SLS, DLP nebeneinander kalkulieren.
        </p>
      </div>

      <STLUploader current={part} onAnalyzed={setPart} onClear={() => setPart(null)} />

      {part && (
        <>
          <PartSummary part={part} onChange={setPart} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {breakdowns?.map(({ process, breakdown, material }) => {
              const activeMaterials = config.materials.filter(
                (m) => m.process === process && m.active,
              );
              const v = variants[process];
              return (
                <Card key={process} className={!breakdown ? "opacity-60" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{PROCESS_LABELS[process]}</CardTitle>
                      {breakdown ? (
                        <Badge variant={breakdown.fits ? "secondary" : "destructive"}>
                          {breakdown.fits ? "Passt" : "Bauraum"}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Kein Material</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Material</Label>
                      <Select
                        value={material?.id ?? ""}
                        onValueChange={(id) =>
                          setVariants((prev) => ({
                            ...prev,
                            [process]: { ...prev[process], materialId: id },
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Material" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeMaterials.length === 0 ? (
                            <SelectItem value="__none" disabled>
                              Keine Materialien aktiv
                            </SelectItem>
                          ) : (
                            activeMaterials.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Menge</Label>
                      <Input
                        type="number"
                        min={1}
                        value={v.quantity}
                        onChange={(e) =>
                          setVariants((prev) => ({
                            ...prev,
                            [process]: {
                              ...prev[process],
                              quantity: Math.max(1, parseInt(e.target.value, 10) || 1),
                            },
                          }))
                        }
                      />
                    </div>

                    <Separator />

                    {breakdown ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Stueckpreis</span>
                          <span className="tabular-nums font-medium">
                            {formatEUR(breakdown.unitPrice)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Druckzeit</span>
                          <span className="tabular-nums">
                            {formatNumber(breakdown.estimatedPrintHours)} h
                          </span>
                        </div>
                        {breakdown.appliedDiscountPercent > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Mengenrabatt</span>
                            <span className="tabular-nums">
                              -{breakdown.appliedDiscountPercent}%
                            </span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-sm font-medium">Gesamt</span>
                          <span className="text-xl font-bold tabular-nums">
                            {formatEUR(breakdown.totalPrice)}
                          </span>
                        </div>
                        <Button
                          onClick={() => adoptAsQuote(process)}
                          className="w-full gap-2 mt-2"
                          variant={breakdown.fits ? "default" : "outline"}
                        >
                          <Save className="h-4 w-4" />
                          Als Angebot uebernehmen
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Kein aktives Material fuer dieses Verfahren.
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
