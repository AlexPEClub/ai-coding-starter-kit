"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STLUploader } from "@/components/calculator/stl-uploader";
import { PartSummary } from "@/components/calculator/part-summary";
import { ProcessConfig } from "@/components/calculator/process-config";
import { PriceBreakdownCard } from "@/components/calculator/price-breakdown";
import { SaveQuoteDialog } from "@/components/calculator/save-quote-dialog";
import { useConfig } from "@/lib/storage";
import { calculatePrice } from "@/lib/pricing";
import type { AnalyzedPart, ProcessId } from "@/lib/types";

export default function CalculatorPage() {
  const config = useConfig();
  const [part, setPart] = useState<AnalyzedPart | null>(null);
  const [process, setProcess] = useState<ProcessId>("FDM");
  const [materialId, setMaterialId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);

  const activeMaterials = useMemo(
    () => config.materials.filter((m) => m.process === process && m.active),
    [config.materials, process],
  );

  const effectiveMaterialId = useMemo(() => {
    if (materialId && activeMaterials.some((m) => m.id === materialId)) return materialId;
    return activeMaterials[0]?.id ?? "";
  }, [materialId, activeMaterials]);

  const breakdown = useMemo(() => {
    if (!part) return null;
    const material = config.materials.find((m) => m.id === effectiveMaterialId);
    if (!material) return null;
    const formula = config.formulas[process];
    const tiers = config.discountTiers[process] ?? [];
    return calculatePrice({
      process,
      part,
      material,
      formula,
      quantity,
      tiers,
      printers: config.printers,
    });
  }, [part, effectiveMaterialId, process, quantity, config]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Preiskalkulator</h2>
        <p className="text-sm text-muted-foreground mt-1">
          STL hochladen, Verfahren waehlen, Preis erhalten. Werte sind editierbar.
        </p>
      </div>

      <STLUploader
        current={part}
        onAnalyzed={setPart}
        onClear={() => setPart(null)}
      />

      {part && (
        <>
          <PartSummary part={part} onChange={setPart} />

          <ProcessConfig
            process={process}
            materialId={effectiveMaterialId}
            quantity={quantity}
            materials={config.materials}
            onProcessChange={(p) => {
              setProcess(p);
              setMaterialId("");
            }}
            onMaterialChange={setMaterialId}
            onQuantityChange={setQuantity}
          />

          {breakdown ? (
            <>
              <PriceBreakdownCard breakdown={breakdown} />
              <div className="flex flex-wrap gap-3 justify-end">
                <Button variant="outline" asChild className="gap-2">
                  <Link href="/compare">
                    <Columns3 className="h-4 w-4" />
                    Verfahren vergleichen
                  </Link>
                </Button>
                <SaveQuoteDialog
                  part={part}
                  process={process}
                  materialId={effectiveMaterialId}
                  quantity={quantity}
                  breakdown={breakdown}
                />
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Kein aktives Material fuer {process} gefunden. Bitte unter{" "}
              <Link href="/admin/materials" className="underline">
                Admin / Materialien
              </Link>{" "}
              ein Material aktivieren.
            </div>
          )}
        </>
      )}
    </div>
  );
}
