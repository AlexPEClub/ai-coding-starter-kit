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
import { Input } from "@/components/ui/input";
import { Plus, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  listPfade,
  createPfad,
  type Pfad,
  type Dienstleister,
} from "@/lib/actions/werkzeugkategorien";
import { PfadDetailDialog } from "./pfad-detail-dialog";

type PfadeTabProps = {
  initialPfade: Pfad[];
  initialDienstleister: Dienstleister[];
};

export function PfadeTab({ initialPfade, initialDienstleister }: PfadeTabProps) {
  const [pfade, setPfade] = useState(initialPfade);
  const [dienstleister, setDienstleister] = useState(initialDienstleister);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [detailPfadId, setDetailPfadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const result = await listPfade();
    if (result.ok) setPfade(result.data);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    const result = await createPfad(newName.trim());
    if (result.ok) {
      toast.success(`Pfad "${newName.trim()}" angelegt.`);
      setCreateOpen(false);
      setNewName("");
      await refresh();
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  const detailPfad = pfade.find((p) => p.id === detailPfadId) || null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Wiederverwendbare Bearbeitungspfade — je Unterkategorie als Standard-Pfad zuweisbar.
        </p>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Neuer Pfad
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Schritte</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pfade.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  Noch keine Pfade angelegt.
                </TableCell>
              </TableRow>
            ) : (
              pfade.map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() => setDetailPfadId(p.id)}
                >
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.schritte.length === 0
                      ? "Keine Schritte"
                      : p.schritte
                          .sort((a, b) => a.reihenfolge - b.reihenfolge)
                          .map((s) => s.name)
                          .join(" → ")}
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Neuer Pfad</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="z.B. Standard-Schärfpfad"
                autoFocus
                disabled={loading}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={loading || !newName.trim()}>
                {loading ? "Speichert..." : "Anlegen"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {detailPfad && (
        <PfadDetailDialog
          pfad={detailPfad}
          dienstleister={dienstleister}
          onClose={() => setDetailPfadId(null)}
          onPfadChanged={async () => {
            await refresh();
          }}
          onDienstleisterCreated={(neu) => setDienstleister((prev) => [...prev, neu])}
        />
      )}
    </div>
  );
}
