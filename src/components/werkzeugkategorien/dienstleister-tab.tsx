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
import { Plus } from "lucide-react";
import {
  listDienstleister,
  createDienstleister,
  type Dienstleister,
} from "@/lib/actions/werkzeugkategorien";
import { DienstleisterFormDialog } from "./dienstleister-form-dialog";

type DienstleisterTabProps = {
  initialDienstleister: Dienstleister[];
};

export function DienstleisterTab({ initialDienstleister }: DienstleisterTabProps) {
  const [dienstleister, setDienstleister] = useState(initialDienstleister);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const result = await listDienstleister();
    if (result.ok) setDienstleister(result.data);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Externe Dienstleister für Fremdbearbeitung — auswählbar bei „extern&quot;-Pfad-Schritten.
        </p>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Neuer Dienstleister
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Firma</TableHead>
              <TableHead>Partnernummer</TableHead>
              <TableHead>Ansprechpartner</TableHead>
              <TableHead>Kontakt</TableHead>
              <TableHead>Ort</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dienstleister.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Noch keine externen Dienstleister angelegt.
                </TableCell>
              </TableRow>
            ) : (
              dienstleister.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.company_name}</TableCell>
                  <TableCell className="text-muted-foreground">{d.partner_number}</TableCell>
                  <TableCell>{d.contact_name || "—"}</TableCell>
                  <TableCell>{d.email || d.phone || "—"}</TableCell>
                  <TableCell>{d.city || "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DienstleisterFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        loading={loading}
        onSubmit={async (input) => {
          setLoading(true);
          const result = await createDienstleister(input);
          if (result.ok) {
            toast.success(`Dienstleister "${input.company_name}" angelegt.`);
            setFormOpen(false);
            await refresh();
          } else {
            toast.error(result.error);
          }
          setLoading(false);
        }}
      />
    </div>
  );
}
