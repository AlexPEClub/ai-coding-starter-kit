"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNumber } from "@/lib/pricing";
import type { AnalyzedPart } from "@/lib/types";

interface PartSummaryProps {
  part: AnalyzedPart;
  onChange: (part: AnalyzedPart) => void;
}

export function PartSummary({ part, onChange }: PartSummaryProps) {
  const update = (patch: Partial<AnalyzedPart>) => onChange({ ...part, ...patch });
  const updateBbox = (axis: "x" | "y" | "z", value: number) =>
    onChange({ ...part, boundingBox: { ...part.boundingBox, [axis]: value } });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Bauteil-Daten</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Volumen [cm3]</Label>
          <Input
            type="number"
            step="0.01"
            value={part.volumeCm3}
            onChange={(e) => update({ volumeCm3: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Oberflaeche [cm2]</Label>
          <Input
            type="number"
            step="0.1"
            value={part.surfaceCm2}
            onChange={(e) => update({ surfaceCm2: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Dreiecke</Label>
          <Input value={part.triangleCount.toLocaleString("de-DE")} readOnly disabled />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Datei</Label>
          <Input value={part.fileName} readOnly disabled />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Bounding X [mm]</Label>
          <Input
            type="number"
            step="0.1"
            value={part.boundingBox.x}
            onChange={(e) => updateBbox("x", parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Bounding Y [mm]</Label>
          <Input
            type="number"
            step="0.1"
            value={part.boundingBox.y}
            onChange={(e) => updateBbox("y", parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Bounding Z [mm]</Label>
          <Input
            type="number"
            step="0.1"
            value={part.boundingBox.z}
            onChange={(e) => updateBbox("z", parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Bauraum-Bedarf</Label>
          <Input
            value={`${formatNumber(
              (part.boundingBox.x * part.boundingBox.y * part.boundingBox.z) / 1000,
            )} cm3`}
            readOnly
            disabled
          />
        </div>
      </CardContent>
    </Card>
  );
}
