"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
} from "@/components/ui/dialog";
import { useConfig, saveConfig } from "@/lib/storage";
import { PROCESSES, PROCESS_LABELS } from "@/lib/types";
import type { Printer, ProcessId } from "@/lib/types";

export default function PrintersAdminPage() {
  const config = useConfig();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Printer | null>(null);

  const startNew = () => {
    setEditing({
      id: crypto.randomUUID(),
      name: "",
      process: "FDM",
      buildVolume: { x: 250, y: 250, z: 250 },
      active: true,
    });
    setOpen(true);
  };

  const save = () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      toast.error("Name erforderlich");
      return;
    }
    const exists = config.printers.some((p) => p.id === editing.id);
    const next = exists
      ? config.printers.map((p) => (p.id === editing.id ? editing : p))
      : [...config.printers, editing];
    saveConfig({ ...config, printers: next });
    toast.success(exists ? "Drucker aktualisiert" : "Drucker angelegt");
    setOpen(false);
    setEditing(null);
  };

  const remove = (id: string) => {
    saveConfig({ ...config, printers: config.printers.filter((p) => p.id !== id) });
    toast.success("Drucker entfernt");
  };

  const toggleActive = (p: Printer) =>
    saveConfig({
      ...config,
      printers: config.printers.map((x) =>
        x.id === p.id ? { ...x, active: !x.active } : x,
      ),
    });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Drucker</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Bauraum-Limits pro Maschine. Pruefung erfolgt gegen alle aktiven Drucker.
          </p>
        </div>
        <Button onClick={startNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Drucker
        </Button>
      </div>

      {PROCESSES.map((proc) => {
        const items = config.printers.filter((p) => p.process === proc);
        return (
          <Card key={proc}>
            <CardHeader>
              <CardTitle className="text-base">{PROCESS_LABELS[proc]}</CardTitle>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">Noch keine Drucker.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Bauraum X [mm]</TableHead>
                      <TableHead className="text-right">Y [mm]</TableHead>
                      <TableHead className="text-right">Z [mm]</TableHead>
                      <TableHead>Aktiv</TableHead>
                      <TableHead className="w-[120px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-right tabular-nums">{p.buildVolume.x}</TableCell>
                        <TableCell className="text-right tabular-nums">{p.buildVolume.y}</TableCell>
                        <TableCell className="text-right tabular-nums">{p.buildVolume.z}</TableCell>
                        <TableCell>
                          <Switch checked={p.active} onCheckedChange={() => toggleActive(p)} />
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditing({ ...p });
                              setOpen(true);
                            }}
                          >
                            Editieren
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(p.id)}
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
            <DialogTitle>
              {editing && config.printers.some((p) => p.id === editing.id)
                ? "Drucker bearbeiten"
                : "Neuer Drucker"}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label>Name</Label>
                <Input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="z.B. EOS Formiga P110"
                />
              </div>
              <div className="space-y-1.5 col-span-2">
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
              {(["x", "y", "z"] as const).map((axis) => (
                <div key={axis} className="space-y-1.5">
                  <Label>Bauraum {axis.toUpperCase()} [mm]</Label>
                  <Input
                    type="number"
                    value={editing.buildVolume[axis]}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        buildVolume: {
                          ...editing.buildVolume,
                          [axis]: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                  />
                </div>
              ))}
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
