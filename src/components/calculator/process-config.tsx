"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROCESSES, PROCESS_LABELS } from "@/lib/types";
import type { Material, ProcessId } from "@/lib/types";

interface Props {
  process: ProcessId;
  materialId: string;
  quantity: number;
  materials: Material[];
  onProcessChange: (p: ProcessId) => void;
  onMaterialChange: (id: string) => void;
  onQuantityChange: (q: number) => void;
}

export function ProcessConfig({
  process,
  materialId,
  quantity,
  materials,
  onProcessChange,
  onMaterialChange,
  onQuantityChange,
}: Props) {
  const filteredMaterials = materials.filter((m) => m.process === process && m.active);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Konfiguration</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Druckverfahren</Label>
          <Select value={process} onValueChange={(v) => onProcessChange(v as ProcessId)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROCESSES.map((p) => (
                <SelectItem key={p} value={p}>
                  {PROCESS_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Material</Label>
          <Select value={materialId} onValueChange={onMaterialChange}>
            <SelectTrigger>
              <SelectValue placeholder="Material waehlen" />
            </SelectTrigger>
            <SelectContent>
              {filteredMaterials.length === 0 ? (
                <SelectItem value="__empty" disabled>
                  Kein Material aktiv
                </SelectItem>
              ) : (
                filteredMaterials.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                    {m.color ? ` (${m.color})` : ""}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Menge</Label>
          <Input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => onQuantityChange(Math.max(1, parseInt(e.target.value, 10) || 1))}
          />
        </div>
      </CardContent>
    </Card>
  );
}
