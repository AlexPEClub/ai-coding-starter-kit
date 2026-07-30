"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Lock } from "lucide-react";
import {
  listParameter,
  createParameter,
  updateParameterTyp,
  addDropdownWert,
  toggleParameterAktiv,
  type GeometrieParameter,
  type ParameterTyp,
} from "@/lib/actions/werkzeugkategorien";

type ParameterTabProps = {
  initialParameter: GeometrieParameter[];
};

export function ParameterTab({ initialParameter }: ParameterTabProps) {
  const [parameter, setParameter] = useState(initialParameter);
  const [createOpen, setCreateOpen] = useState(false);
  const [wertDialogFor, setWertDialogFor] = useState<GeometrieParameter | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const result = await listParameter();
    if (result.ok) setParameter(result.data);
  }, []);

  const handleTypChange = async (id: string, typ: ParameterTyp) => {
    const result = await updateParameterTyp(id, typ);
    if (result.ok) {
      toast.success("Typ aktualisiert.");
      await refresh();
    } else {
      toast.error(result.error);
    }
  };

  const handleToggleAktiv = async (id: string) => {
    const result = await toggleParameterAktiv(id);
    if (result.ok) {
      await refresh();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Globales Register — Parameter stehen jeder Unterkategorie zur Auswahl.
        </p>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Neuer Parameter
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parameter.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Noch keine Parameter angelegt.
                </TableCell>
              </TableRow>
            ) : (
              parameter.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className={`font-medium ${p.ist_aktiv ? "" : "text-muted-foreground line-through"}`}>
                    {p.name}
                  </TableCell>
                  <TableCell>
                    {p.in_benutzung ? (
                      <span className="inline-flex items-center gap-1 text-sm">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                        {p.typ === "dropdown" ? "Dropdown" : "Freitext"}
                      </span>
                    ) : (
                      <Select value={p.typ} onValueChange={(v) => handleTypChange(p.id, v as ParameterTyp)}>
                        <SelectTrigger className="h-8 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="freitext">Freitext</SelectItem>
                          <SelectItem value="dropdown">Dropdown</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    {p.typ === "freitext" ? (
                      <span className="text-sm text-muted-foreground">Einheit: {p.einheit || "—"}</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {p.dropdown_werte.map((w) => (
                          <Badge key={w} variant="secondary">
                            {w}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.ist_aktiv ? "secondary" : "outline"}>
                      {p.ist_aktiv ? "Aktiv" : "Inaktiv"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {p.typ === "dropdown" && (
                        <Button variant="ghost" size="sm" onClick={() => setWertDialogFor(p)}>
                          + Wert
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleToggleAktiv(p.id)}>
                        {p.ist_aktiv ? "Deaktivieren" : "Aktivieren"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CreateParameterDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        loading={loading}
        onSubmit={async (input) => {
          setLoading(true);
          const result = await createParameter(input);
          if (result.ok) {
            toast.success(`Parameter "${input.name}" angelegt.`);
            setCreateOpen(false);
            await refresh();
          } else {
            toast.error(result.error);
          }
          setLoading(false);
        }}
      />

      {wertDialogFor && (
        <AddDropdownWertDialog
          parameter={wertDialogFor}
          onClose={() => setWertDialogFor(null)}
          onSubmit={async (wert) => {
            const result = await addDropdownWert(wertDialogFor.id, wert);
            if (result.ok) {
              toast.success("Wert hinzugefügt.");
              setWertDialogFor(null);
              await refresh();
            } else {
              toast.error(result.error);
            }
          }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Neuer-Parameter-Dialog
   ═══════════════════════════════════════════ */

type CreateParameterDialogProps = {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  onSubmit: (input: {
    name: string;
    typ: ParameterTyp;
    einheit?: string;
    dropdown_werte?: string[];
  }) => void;
};

function CreateParameterDialog({ open, onClose, loading, onSubmit }: CreateParameterDialogProps) {
  const [name, setName] = useState("");
  const [typ, setTyp] = useState<ParameterTyp>("freitext");
  const [einheit, setEinheit] = useState("");
  const [werteText, setWerteText] = useState("");

  const reset = () => {
    setName("");
    setTyp("freitext");
    setEinheit("");
    setWerteText("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      typ,
      einheit: typ === "freitext" ? einheit.trim() : undefined,
      dropdown_werte:
        typ === "dropdown"
          ? werteText
              .split(",")
              .map((w) => w.trim())
              .filter(Boolean)
          : undefined,
    });
    reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Neuer Geometrie-Parameter</DialogTitle>
            <DialogDescription>
              Steht danach global für jede Unterkategorie zur Auswahl.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="param-name">Name *</Label>
              <Input
                id="param-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Nenndurchmesser"
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Typ *</Label>
              <Select value={typ} onValueChange={(v) => setTyp(v as ParameterTyp)}>
                <SelectTrigger disabled={loading}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="freitext">Freitext + Einheit (numerisch)</SelectItem>
                  <SelectItem value="dropdown">Dropdown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {typ === "freitext" ? (
              <div className="space-y-2">
                <Label htmlFor="param-einheit">Einheit</Label>
                <Input
                  id="param-einheit"
                  value={einheit}
                  onChange={(e) => setEinheit(e.target.value)}
                  placeholder="z.B. mm"
                  disabled={loading}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="param-werte">Dropdown-Werte (kommagetrennt) *</Label>
                <Input
                  id="param-werte"
                  value={werteText}
                  onChange={(e) => setWerteText(e.target.value)}
                  placeholder="z.B. Wechselzahn, Flachzahn"
                  disabled={loading}
                  required
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? "Speichert..." : "Anlegen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════
   Dropdown-Wert hinzufügen
   ═══════════════════════════════════════════ */

type AddDropdownWertDialogProps = {
  parameter: GeometrieParameter;
  onClose: () => void;
  onSubmit: (wert: string) => void;
};

function AddDropdownWertDialog({ parameter, onClose, onSubmit }: AddDropdownWertDialogProps) {
  const [wert, setWert] = useState("");

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (wert.trim()) onSubmit(wert.trim());
          }}
        >
          <DialogHeader>
            <DialogTitle>Wert zu „{parameter.name}&quot; hinzufügen</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={wert}
              onChange={(e) => setWert(e.target.value)}
              placeholder="z.B. Spitzzahn"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={!wert.trim()}>
              Hinzufügen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
