"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useConfig, saveConfig } from "@/lib/storage";
import { PROCESSES, PROCESS_LABELS } from "@/lib/types";
import type { FormulaConfig, ProcessId } from "@/lib/types";

const FIELDS: Array<{
  key: keyof FormulaConfig;
  label: string;
  unit: string;
  step: string;
  hint?: string;
}> = [
  { key: "materialMarkup", label: "Material-Aufschlag (Faktor)", unit: "x", step: "0.01", hint: "Faktor auf Materialeinkauf, z.B. 1.2 = 20%" },
  { key: "machineHourRate", label: "Maschinenstundensatz", unit: "EUR/h", step: "0.5" },
  { key: "printSpeed", label: "Druckgeschwindigkeit", unit: "cm3/h", step: "0.5", hint: "Volumen pro Stunde - dient zur Druckzeitschaetzung" },
  { key: "setupFee", label: "Setup-Pauschale", unit: "EUR", step: "0.5" },
  { key: "boundingBoxFactor", label: "Bauraum-Block-Faktor", unit: "EUR/(cm3 x 1000)", step: "0.0001", hint: "0 = nicht verwenden. Sinnvoll fuer SLS." },
  { key: "postProcessingFee", label: "Nachbearbeitung pro Teil", unit: "EUR", step: "0.5" },
  { key: "marginPercent", label: "Marge", unit: "%", step: "1" },
  { key: "minPrice", label: "Mindestpreis pro Teil", unit: "EUR", step: "1" },
];

export default function FormulasAdminPage() {
  const config = useConfig();

  const update = (process: ProcessId, key: keyof FormulaConfig, value: number) => {
    const next: FormulaConfig = { ...config.formulas[process], [key]: value };
    saveConfig({ ...config, formulas: { ...config.formulas, [process]: next } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Preisformeln</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Pro Druckverfahren editierbar. Aenderungen wirken sich sofort aus.
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
          const f = config.formulas[p];
          return (
            <TabsContent key={p} value={p}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{PROCESS_LABELS[p]} - Parameter</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {FIELDS.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <Label>
                        {field.label} <span className="text-muted-foreground">[{field.unit}]</span>
                      </Label>
                      <Input
                        type="number"
                        step={field.step}
                        value={f[field.key] as number}
                        onChange={(e) =>
                          update(p, field.key, parseFloat(e.target.value) || 0)
                        }
                      />
                      {field.hint && (
                        <p className="text-xs text-muted-foreground">{field.hint}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
              <div className="flex justify-end mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.success("Werte sind bereits gespeichert (Auto-Save)")}
                >
                  Gespeichert
                </Button>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
