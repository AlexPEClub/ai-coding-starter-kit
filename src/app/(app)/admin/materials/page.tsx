"use client";

import { useState } from "react";
import { Plus, Trash2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useConfig, saveConfig, resetConfig } from "@/lib/storage";
import { PROCESSES, PROCESS_LABELS } from "@/lib/types";
import type { Material, ProcessId } from "@/lib/types";

export default function MaterialsAdminPage() {
  const config = useConfig();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);

  const startNew = () => {
    setEditing({
      id: crypto.randomUUID(),
      name: "",
      process: "FDM",
      density: 1.2,
      pricePerKg: 50,
      color: "",
      notes: "",
      active: true,
    });
    setOpen(true);
  };

  const startEdit = (m: Material) => {
    setEditing({ ...m });
    setOpen(true);
  };

  const save = () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      toast.error("Name erforderlich");
      return;
    }
    if (editing.density <= 0 || editing.pricePerKg <= 0) {
      toast.error("Dichte und Preis muessen > 0 sein");
      return;
    }
    const exists = config.materials.some((m) => m.id === editing.id);
    const next = exists
      ? config.materials.map((m) => (m.id === editing.id ? editing : m))
      : [...config.materials, editing];
    saveConfig({ ...config, materials: next });
    toast.success(exists ? "Material aktualisiert" : "Material angelegt");
    setOpen(false);
    setEditing(null);
  };

  const remove = (id: string) => {
    saveConfig({ ...config, materials: config.materials.filter((m) => m.id !== id) });
    toast.success("Material entfernt");
  };

  const toggleActive = (m: Material) => {
    saveConfig({
      ...config,
      materials: config.materials.map((x) =>
        x.id === m.id ? { ...x, active: !x.active } : x,
      ),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Materialien</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Materialien pro Druckverfahren pflegen. Aenderungen wirken sich sofort auf Kalkulationen aus.
          </p>
        </div>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Defaults
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Auf Defaults zuruecksetzen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Alle Materialien, Drucker, Formeln und Mengenstaffeln werden auf
                  Werkseinstellungen zurueckgesetzt. Angebote bleiben erhalten.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    resetConfig();
                    toast.success("Defaults wiederhergestellt");
                  }}
                >
                  Zuruecksetzen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={startNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Material
          </Button>
        </div>
      </div>

      {PROCESSES.map((p) => {
        const items = config.materials.filter((m) => m.process === p);
        return (
          <Card key={p}>
            <CardHeader>
              <CardTitle className="text-base">{PROCESS_LABELS[p]}</CardTitle>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">Noch keine Materialien.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Farbe</TableHead>
                      <TableHead className="text-right">Dichte [g/cm3]</TableHead>
                      <TableHead className="text-right">Preis [EUR/kg]</TableHead>
                      <TableHead>Aktiv</TableHead>
                      <TableHead className="w-[120px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.name}</TableCell>
                        <TableCell className="text-muted-foreground">{m.color || "-"}</TableCell>
                        <TableCell className="text-right tabular-nums">{m.density.toFixed(2)}</TableCell>
                        <TableCell className="text-right tabular-nums">{m.pricePerKg.toFixed(2)}</TableCell>
                        <TableCell>
                          <Switch checked={m.active} onCheckedChange={() => toggleActive(m)} />
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => startEdit(m)}>
                            Editieren
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(m.id)}
                            aria-label="Loeschen"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        );
      })}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing && config.materials.some((m) => m.id === editing.id) ? "Material bearbeiten" : "Neues Material"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label>Name</Label>
                <Input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="z.B. PA12 schwarz"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Verfahren</Label>
                <Select
                  value={editing.process}
                  onValueChange={(v) => setEditing({ ...editing, process: v as ProcessId })}
                >
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
                <Label>Farbe</Label>
                <Input
                  value={editing.color ?? ""}
                  onChange={(e) => setEditing({ ...editing, color: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Dichte [g/cm3]</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editing.density}
                  onChange={(e) =>
                    setEditing({ ...editing, density: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Preis [EUR/kg]</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editing.pricePerKg}
                  onChange={(e) =>
                    setEditing({ ...editing, pricePerKg: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Notizen</Label>
                <Input
                  value={editing.notes ?? ""}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <Switch
                  checked={editing.active}
                  onCheckedChange={(v) => setEditing({ ...editing, active: v })}
                />
                <Label>Aktiv</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={save}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
