"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, ChevronRight } from "lucide-react";
import {
  listOberkategorien,
  createOberkategorie,
  toggleOberkategorieAktiv,
  listUnterkategorien,
  createUnterkategorie,
  toggleUnterkategorieAktiv,
  type Oberkategorie,
  type UnterkategorieDetail,
  type GeometrieParameter,
  type Pfad,
} from "@/lib/actions/werkzeugkategorien";
import { UnterkategorieDetailDialog } from "./unterkategorie-detail-dialog";

type KategorienTabProps = {
  initialOberkategorien: Oberkategorie[];
  initialParameter: GeometrieParameter[];
  initialPfade: Pfad[];
};

export function KategorienTab({
  initialOberkategorien,
  initialParameter,
  initialPfade,
}: KategorienTabProps) {
  const [oberkategorien, setOberkategorien] = useState(initialOberkategorien);
  const [selectedOberId, setSelectedOberId] = useState<string | null>(
    initialOberkategorien[0]?.id ?? null,
  );
  const [unterkategorien, setUnterkategorien] = useState<UnterkategorieDetail[]>([]);
  const [neueOberName, setNeueOberName] = useState("");
  const [neueUnterName, setNeueUnterName] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [parameter, setParameter] = useState(initialParameter);
  const [pfade, setPfade] = useState(initialPfade);
  const [loading, setLoading] = useState(false);

  const refreshUnterkategorien = useCallback(async (oberId: string | null) => {
    if (!oberId) {
      setUnterkategorien([]);
      return;
    }
    const result = await listUnterkategorien(oberId);
    if (result.ok) setUnterkategorien(result.data);
  }, []);

  useEffect(() => {
    async function ladeInitial() {
      if (!selectedOberId) {
        setUnterkategorien([]);
        return;
      }
      const result = await listUnterkategorien(selectedOberId);
      if (result.ok) setUnterkategorien(result.data);
    }
    ladeInitial();
  }, [selectedOberId]);

  const handleCreateOber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!neueOberName.trim()) return;
    const result = await createOberkategorie(neueOberName.trim());
    if (result.ok) {
      toast.success(`Oberkategorie "${neueOberName.trim()}" angelegt.`);
      setOberkategorien((prev) => [...prev, result.data]);
      setNeueOberName("");
      setSelectedOberId(result.data.id);
    } else {
      toast.error(result.error);
    }
  };

  const handleToggleOber = async (id: string) => {
    const result = await toggleOberkategorieAktiv(id);
    if (result.ok) {
      setOberkategorien((prev) => prev.map((o) => (o.id === id ? result.data : o)));
    } else {
      toast.error(result.error);
    }
  };

  const handleCreateUnter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!neueUnterName.trim() || !selectedOberId) return;
    setLoading(true);
    const result = await createUnterkategorie({
      oberkategorie_id: selectedOberId,
      name: neueUnterName.trim(),
    });
    if (result.ok) {
      toast.success(`Unterkategorie "${neueUnterName.trim()}" angelegt.`);
      setNeueUnterName("");
      await refreshUnterkategorien(selectedOberId);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  const handleToggleUnter = async (id: string) => {
    const result = await toggleUnterkategorieAktiv(id);
    if (result.ok) {
      await refreshUnterkategorien(selectedOberId);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
      {/* Oberkategorien */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Oberkategorien</p>
        <div className="space-y-1 rounded-md border">
          {oberkategorien.map((o) => (
            <div
              key={o.id}
              onClick={() => setSelectedOberId(o.id)}
              className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-muted/50 ${
                selectedOberId === o.id ? "bg-muted" : ""
              }`}
            >
              <span className={o.ist_aktiv ? "" : "text-muted-foreground line-through"}>
                {o.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleOber(o.id);
                }}
              >
                {o.ist_aktiv ? "Deaktivieren" : "Aktivieren"}
              </Button>
            </div>
          ))}
        </div>
        <form onSubmit={handleCreateOber} className="flex gap-2">
          <Input
            value={neueOberName}
            onChange={(e) => setNeueOberName(e.target.value)}
            placeholder="Neue Oberkategorie"
            className="h-8 text-sm"
          />
          <Button type="submit" size="sm" variant="outline" disabled={!neueOberName.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Unterkategorien */}
      <div className="space-y-3 sm:col-span-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            Unterkategorien
            {selectedOberId && (
              <span className="ml-1 text-muted-foreground">
                — {oberkategorien.find((o) => o.id === selectedOberId)?.name}
              </span>
            )}
          </p>
        </div>

        {!selectedOberId ? (
          <p className="text-sm text-muted-foreground">Zuerst eine Oberkategorie wählen/anlegen.</p>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Einsatzbereit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unterkategorien.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        Noch keine Unterkategorien.
                      </TableCell>
                    </TableRow>
                  ) : (
                    unterkategorien.map((u) => (
                      <TableRow
                        key={u.id}
                        className="cursor-pointer"
                        onClick={() => setDetailId(u.id)}
                      >
                        <TableCell className={`font-medium ${u.ist_aktiv ? "" : "text-muted-foreground"}`}>
                          {u.name}
                        </TableCell>
                        <TableCell>
                          {u.einsatzbereit ? (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                              Einsatzbereit
                            </Badge>
                          ) : (
                            <Badge variant="outline">Preisstaffel fehlt</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.ist_aktiv ? "secondary" : "outline"}>
                            {u.ist_aktiv ? "Aktiv" : "Inaktiv"}
                          </Badge>
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

            {oberkategorien.find((o) => o.id === selectedOberId)?.ist_aktiv ? (
              <form onSubmit={handleCreateUnter} className="flex gap-2">
                <Input
                  value={neueUnterName}
                  onChange={(e) => setNeueUnterName(e.target.value)}
                  placeholder="Neue Unterkategorie"
                  className="h-8 max-w-xs text-sm"
                  disabled={loading}
                />
                <Button type="submit" size="sm" variant="outline" disabled={!neueUnterName.trim() || loading}>
                  <Plus className="mr-1 h-4 w-4" />
                  Hinzufügen
                </Button>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground">
                Diese Oberkategorie ist deaktiviert — es können keine neuen Unterkategorien angelegt werden.
              </p>
            )}
          </>
        )}
      </div>

      {detailId && (
        <UnterkategorieDetailDialog
          unterkategorieId={detailId}
          parameter={parameter}
          pfade={pfade}
          onClose={() => setDetailId(null)}
          onChanged={() => refreshUnterkategorien(selectedOberId)}
          onParameterCreated={(p) => setParameter((prev) => [...prev, p])}
          onPfadCreated={(p) => setPfade((prev) => [...prev, p])}
        />
      )}
    </div>
  );
}
