"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  getKommissionEinstellung,
  setKommissionEinstellung,
  type KommissionEinstellung,
  type KommissionTyp,
} from "@/lib/actions/order-defaults";
import { listKommissionen, addKommission, type Kommission } from "@/lib/actions/werkzeug-auftraege";

interface KommissionSettingsCardProps {
  partnerId: string;
  isAdmin: boolean;
}

/**
 * PROJ-34: Kommissions-Einstellung pro Kunde — Pflicht ja/nein + Typ
 * statisch/dynamisch. Erweitert die bestehenden Auftrags-Standardeinstellungen
 * auf der Kunden-Detailseite (gleiche Stelle wie Fahrer/Zugangsart).
 */
export function KommissionSettingsCard({ partnerId, isAdmin }: KommissionSettingsCardProps) {
  const [einstellung, setEinstellung] = useState<KommissionEinstellung | null>(null);
  const [kommissionen, setKommissionen] = useState<Kommission[]>([]);
  const [neueKommission, setNeueKommission] = useState("");

  async function reload() {
    const [e, k] = await Promise.all([
      getKommissionEinstellung(partnerId),
      listKommissionen(partnerId),
    ]);
    setEinstellung(e);
    setKommissionen(k);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId]);

  async function handlePflichtChange(pflicht: boolean) {
    if (!einstellung) return;
    const result = await setKommissionEinstellung(partnerId, { pflicht, typ: einstellung.typ });
    if (result.ok) {
      toast.success("Gespeichert.");
      await reload();
    } else {
      toast.error(result.error);
    }
  }

  async function handleTypChange(typ: KommissionTyp) {
    if (!einstellung) return;
    const result = await setKommissionEinstellung(partnerId, { pflicht: einstellung.pflicht, typ });
    if (result.ok) {
      toast.success("Gespeichert.");
      await reload();
    } else {
      toast.error(result.error);
    }
  }

  async function handleNeueKommission() {
    if (!neueKommission.trim()) return;
    const result = await addKommission(partnerId, neueKommission);
    if (result.ok) {
      setNeueKommission("");
      await reload();
    } else {
      toast.error(result.error);
    }
  }

  if (!einstellung) {
    return (
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">Lädt…</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="mb-4 font-semibold text-sm">🏷️ Kommissions-Einstellungen</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="kommission-pflicht">Kommission ist Pflicht</Label>
          <Switch
            id="kommission-pflicht"
            checked={einstellung.pflicht}
            disabled={!isAdmin}
            onCheckedChange={handlePflichtChange}
          />
        </div>

        {einstellung.pflicht && (
          <div className="space-y-2">
            <Label>Kommissionstyp</Label>
            <RadioGroup
              value={einstellung.typ}
              onValueChange={(v) => handleTypChange(v as KommissionTyp)}
              className="space-y-2"
              disabled={!isAdmin}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="statisch" id="typ-statisch" />
                <Label htmlFor="typ-statisch" className="font-normal">
                  Statisch — feste, wiederverwendbare Liste
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="dynamisch" id="typ-dynamisch" />
                <Label htmlFor="typ-dynamisch" className="font-normal">
                  Dynamisch — Freitext pro Auftrag
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {einstellung.pflicht && einstellung.typ === "statisch" && (
          <div className="space-y-2">
            <Label>Kommissionen dieses Kunden</Label>
            {kommissionen.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine Kommissionen angelegt.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {kommissionen.map((k) => (
                  <li key={k.id} className="rounded-md border px-3 py-2">
                    {k.bezeichnung}
                  </li>
                ))}
              </ul>
            )}
            {isAdmin && (
              <div className="flex gap-2">
                <Input
                  placeholder="Neue Kommission…"
                  value={neueKommission}
                  onChange={(e) => setNeueKommission(e.target.value)}
                  className="min-h-[44px]"
                />
                <Button type="button" variant="outline" onClick={handleNeueKommission} className="min-h-[44px]">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
