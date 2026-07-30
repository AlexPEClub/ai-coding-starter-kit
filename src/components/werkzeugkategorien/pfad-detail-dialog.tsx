"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowUp, ArrowDown, X, Plus } from "lucide-react";
import {
  addPfadSchritt,
  removePfadSchritt,
  movePfadSchritt,
  createDienstleister,
  type Pfad,
  type PfadOrt,
  type Dienstleister,
} from "@/lib/actions/werkzeugkategorien";
import { DienstleisterFormDialog } from "./dienstleister-form-dialog";

type PfadDetailDialogProps = {
  pfad: Pfad;
  dienstleister: Dienstleister[];
  onClose: () => void;
  onPfadChanged: () => void;
  onDienstleisterCreated: (d: Dienstleister) => void;
};

export function PfadDetailDialog({
  pfad,
  dienstleister,
  onClose,
  onPfadChanged,
  onDienstleisterCreated,
}: PfadDetailDialogProps) {
  const [name, setName] = useState("");
  const [ort, setOrt] = useState<PfadOrt>("im_betrieb");
  const [dienstleisterId, setDienstleisterId] = useState<string>("");
  const [newDienstleisterOpen, setNewDienstleisterOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const schritte = [...pfad.schritte].sort((a, b) => a.reihenfolge - b.reihenfolge);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (ort === "extern" && !dienstleisterId) {
      toast.error('Bei Ort „extern" muss ein Dienstleister ausgewählt werden.');
      return;
    }
    setBusy(true);
    const result = await addPfadSchritt(pfad.id, {
      name: name.trim(),
      ort,
      dienstleister_id: ort === "extern" ? dienstleisterId : null,
    });
    if (result.ok) {
      setName("");
      setOrt("im_betrieb");
      setDienstleisterId("");
      onPfadChanged();
    } else {
      toast.error(result.error);
    }
    setBusy(false);
  };

  const handleRemove = async (schrittId: string) => {
    const result = await removePfadSchritt(pfad.id, schrittId);
    if (result.ok) onPfadChanged();
    else toast.error(result.error);
  };

  const handleMove = async (schrittId: string, richtung: "auf" | "ab") => {
    const result = await movePfadSchritt(pfad.id, schrittId, richtung);
    if (result.ok) onPfadChanged();
    else toast.error(result.error);
  };

  const dienstleisterName = (id: string | null) =>
    dienstleister.find((d) => d.id === id)?.company_name || "—";

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{pfad.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {schritte.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Schritte.</p>
          ) : (
            <ol className="space-y-2">
              {schritte.map((s, i) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">{i + 1}.</span>
                    <span className="font-medium">{s.name}</span>
                    <Badge variant={s.ort === "extern" ? "secondary" : "outline"}>
                      {s.ort === "extern" ? `Extern: ${dienstleisterName(s.dienstleister_id)}` : "Im Betrieb"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={i === 0}
                      onClick={() => handleMove(s.id, "auf")}
                      title="Nach oben"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={i === schritte.length - 1}
                      onClick={() => handleMove(s.id, "ab")}
                      title="Nach unten"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(s.id)}
                      title="Entfernen"
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </li>
              ))}
            </ol>
          )}

          <form onSubmit={handleAdd} className="space-y-2 rounded-md border p-3">
            <p className="text-sm font-medium">Schritt hinzufügen</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Schärfen"
                disabled={busy}
                className="sm:flex-1"
              />
              <Select value={ort} onValueChange={(v) => setOrt(v as PfadOrt)}>
                <SelectTrigger className="sm:w-40" disabled={busy}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="im_betrieb">Im Betrieb</SelectItem>
                  <SelectItem value="extern">Extern</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {ort === "extern" && (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select value={dienstleisterId} onValueChange={setDienstleisterId}>
                  <SelectTrigger className="sm:flex-1" disabled={busy}>
                    <SelectValue placeholder="Dienstleister wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {dienstleister.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNewDienstleisterOpen(true)}
                  disabled={busy}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Neuer Dienstleister
                </Button>
              </div>
            )}

            <Button type="submit" size="sm" disabled={busy || !name.trim()}>
              Schritt speichern
            </Button>
          </form>
        </div>

        <DienstleisterFormDialog
          open={newDienstleisterOpen}
          onClose={() => setNewDienstleisterOpen(false)}
          loading={busy}
          onSubmit={async (input) => {
            setBusy(true);
            const result = await createDienstleister(input);
            if (result.ok) {
              toast.success(`Dienstleister "${input.company_name}" angelegt.`);
              onDienstleisterCreated(result.data);
              setDienstleisterId(result.data.id);
              setNewDienstleisterOpen(false);
            } else {
              toast.error(result.error);
            }
            setBusy(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
