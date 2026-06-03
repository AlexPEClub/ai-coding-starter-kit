"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useConfig, saveConfig } from "@/lib/storage";
import { PROCESSES, PROCESS_LABELS } from "@/lib/types";
import type { DiscountTier, ProcessId } from "@/lib/types";

export default function DiscountsAdminPage() {
  const config = useConfig();

  const setTiers = (p: ProcessId, tiers: DiscountTier[]) => {
    saveConfig({
      ...config,
      discountTiers: { ...config.discountTiers, [p]: tiers },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Mengenstaffeln</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Mengenrabatt pro Verfahren. Bei einer Bestellmenge wird der hoechste passende Rabatt angewendet.
        </p>
      </div>

      <Tabs defaultValue="FDM">
        <TabsList>
          {PROCESSES.map((p) => (
            <TabsTrigger key={p} value={p}>
              {PROCESS_LABELS[p]}
            </TabsTrigger>
          ))}
        </TabsList>
        {PROCESSES.map((p) => {
          const tiers = config.discountTiers[p] ?? [];
          return (
            <TabsContent key={p} value={p}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{PROCESS_LABELS[p]} - Staffel</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tiers.length === 0 && (
                    <p className="text-sm text-muted-foreground">Keine Stufen definiert.</p>
                  )}
                  {tiers
                    .slice()
                    .sort((a, b) => a.minQty - b.minQty)
                    .map((tier, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
                        <div className="space-y-1.5">
                          <Label>Ab Menge</Label>
                          <Input
                            type="number"
                            min={1}
                            value={tier.minQty}
                            onChange={(e) => {
                              const v = parseInt(e.target.value, 10) || 1;
                              const next = tiers.map((t, i) =>
                                i === idx ? { ...t, minQty: v } : t,
                              );
                              setTiers(p, next);
                            }}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Rabatt [%]</Label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            step="0.5"
                            value={tier.discountPercent}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value) || 0;
                              const next = tiers.map((t, i) =>
                                i === idx ? { ...t, discountPercent: v } : t,
                              );
                              setTiers(p, next);
                            }}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Stufe entfernen"
                          onClick={() => setTiers(p, tiers.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setTiers(p, [...tiers, { minQty: 1, discountPercent: 0 }])
                    }
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Stufe hinzufuegen
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
