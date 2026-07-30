"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
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
import { Plus } from "lucide-react";
import {
  getUnterkategorieDetail,
  setUnterkategorieParameter,
  setPreisParameter,
  assignStandardPfad,
  listServiceartikelKandidaten,
  createServiceartikel,
  setPreisstaffelKandidaten,
  setPreisstufeBereich,
  type UnterkategorieDetail,
  type GeometrieParameter,
  type Pfad,
  type Serviceartikel,
  type Preisstufe,
} from "@/lib/actions/werkzeugkategorien";

type UnterkategorieDetailDialogProps = {
  unterkategorieId: string;
  parameter: GeometrieParameter[];
  pfade: Pfad[];
  onClose: () => void;
  onChanged: () => void;
  onParameterCreated: (p: GeometrieParameter) => void;
  onPfadCreated: (p: Pfad) => void;
};

export function UnterkategorieDetailDialog({
  unterkategorieId,
  parameter,
  pfade,
  onClose,
  onChanged,
}: UnterkategorieDetailDialogProps) {
  const [detail, setDetail] = useState<UnterkategorieDetail | null>(null);
  const [kandidaten, setKandidaten] = useState<Serviceartikel[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [detailResult, artikelResult] = await Promise.all([
      getUnterkategorieDetail(unterkategorieId),
      listServiceartikelKandidaten(),
    ]);
    if (detailResult.ok) setDetail(detailResult.data);
    if (artikelResult.ok) setKandidaten(artikelResult.data);
    setLoading(false);
  }, [unterkategorieId]);

  useEffect(() => {
    async function ladeInitial() {
      const [detailResult, artikelResult] = await Promise.all([
        getUnterkategorieDetail(unterkategorieId),
        listServiceartikelKandidaten(),
      ]);
      if (detailResult.ok) setDetail(detailResult.data);
      if (artikelResult.ok) setKandidaten(artikelResult.data);
      setLoading(false);
    }
    ladeInitial();
  }, [unterkategorieId]);

  const refreshAfterChange = async () => {
    await load();
    onChanged();
  };

  if (loading || !detail) {
    return (
      <Dialog open onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-2xl">
          <p className="py-8 text-center text-sm text-muted-foreground">Lädt...</p>
        </DialogContent>
      </Dialog>
    );
  }

  const numerischeParameterIds = detail.parameter_ids.filter(
    (id) => parameter.find((p) => p.id === id)?.typ === "freitext",
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{detail.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Parameter-Auswahl */}
          <section className="space-y-2">
            <Label>Geometrie-Parameter</Label>
            <div className="grid grid-cols-2 gap-2">
              {parameter
                .filter((p) => p.ist_aktiv || detail.parameter_ids.includes(p.id))
                .map((p) => {
                const checked = detail.parameter_ids.includes(p.id);
                return (
                  <label key={p.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={async (value) => {
                        const neueIds = value
                          ? [...detail.parameter_ids, p.id]
                          : detail.parameter_ids.filter((id) => id !== p.id);
                        const result = await setUnterkategorieParameter(unterkategorieId, neueIds);
                        if (result.ok) await refreshAfterChange();
                        else toast.error(result.error);
                      }}
                    />
                    {p.name}
                    <span className="text-muted-foreground">
                      ({p.typ === "dropdown" ? "Dropdown" : p.einheit || "Freitext"})
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          <Separator />

          {/* Preisstaffel */}
          <section className="space-y-3">
            <Label>Preisstaffel — automatische Serviceartikel-Zuordnung</Label>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">1. Preis-Parameter wählen</p>
              <Select
                value={detail.preis_parameter_id ?? ""}
                onValueChange={async (value) => {
                  const result = await setPreisParameter(unterkategorieId, value);
                  if (result.ok) await refreshAfterChange();
                  else toast.error(result.error);
                }}
                disabled={numerischeParameterIds.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Parameter wählen (nur numerische)" />
                </SelectTrigger>
                <SelectContent>
                  {numerischeParameterIds.map((id) => {
                    const p = parameter.find((pp) => pp.id === id)!;
                    return (
                      <SelectItem key={id} value={id}>
                        {p.name} ({p.einheit})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {numerischeParameterIds.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Zuerst mindestens einen numerischen Parameter oben zuordnen.
                </p>
              )}
            </div>

            {detail.preis_parameter_id && (
              <PreisstaffelEditor
                unterkategorieId={unterkategorieId}
                kandidaten={kandidaten}
                preisstufen={detail.preisstufen}
                onKandidatenErstellt={(neu) => setKandidaten((prev) => [...prev, neu])}
                onChanged={refreshAfterChange}
              />
            )}

            {!detail.einsatzbereit && (
              <p className="text-xs text-amber-600">
                Ohne mindestens eine vollständige Preisstufe ist diese Unterkategorie später in
                der Arbeitsvorbereitung (PROJ-40) nicht auswählbar.
              </p>
            )}
          </section>

          <Separator />

          {/* Standard-Pfad */}
          <section className="space-y-2">
            <Label>Standard-Pfad</Label>
            <Select
              value={detail.standard_pfad_id ?? ""}
              onValueChange={async (value) => {
                const result = await assignStandardPfad(unterkategorieId, value);
                if (result.ok) await refreshAfterChange();
                else toast.error(result.error);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pfad wählen" />
              </SelectTrigger>
              <SelectContent>
                {pfade.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════
   Preisstaffel-Editor (zweistufig)
   ═══════════════════════════════════════════ */

type PreisstaffelEditorProps = {
  unterkategorieId: string;
  kandidaten: Serviceartikel[];
  preisstufen: Preisstufe[];
  onKandidatenErstellt: (a: Serviceartikel) => void;
  onChanged: () => void;
};

function PreisstaffelEditor({
  unterkategorieId,
  kandidaten,
  preisstufen,
  onKandidatenErstellt,
  onChanged,
}: PreisstaffelEditorProps) {
  const [neuerArtikelOpen, setNeuerArtikelOpen] = useState(false);
  const angehakteArtikelIds = new Set(preisstufen.map((p) => p.serviceartikel_id));

  const handleToggleKandidat = async (artikelId: string, checked: boolean) => {
    const aktuelle = new Set(angehakteArtikelIds);
    if (checked) aktuelle.add(artikelId);
    else aktuelle.delete(artikelId);
    const result = await setPreisstaffelKandidaten(unterkategorieId, [...aktuelle]);
    if (result.ok) onChanged();
    else toast.error(result.error);
  };

  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          2. Serviceartikel als Kandidaten ankreuzen
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => setNeuerArtikelOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Neuer Serviceartikel
        </Button>
      </div>

      <div className="max-h-40 space-y-1 overflow-y-auto">
        {kandidaten.map((a) => (
          <label key={a.id} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={angehakteArtikelIds.has(a.id)}
              onCheckedChange={(value) => handleToggleKandidat(a.id, Boolean(value))}
            />
            <span className="font-medium">{a.number}</span>
            <span className="text-muted-foreground">{a.description}</span>
          </label>
        ))}
      </div>

      {preisstufen.length > 0 && (
        <div className="space-y-2 pt-2">
          <p className="text-sm text-muted-foreground">
            3. Wertebereich je angehaktem Artikel festlegen (&bdquo;Bis&ldquo; leer = offene Obergrenze)
          </p>
          {preisstufen.map((stufe) => {
            const artikel = kandidaten.find((a) => a.id === stufe.serviceartikel_id);
            return (
              <PreisstufeRow
                key={stufe.id}
                unterkategorieId={unterkategorieId}
                stufe={stufe}
                artikelLabel={artikel ? `${artikel.number} — ${artikel.description}` : stufe.serviceartikel_id}
                onChanged={onChanged}
              />
            );
          })}
        </div>
      )}

      {neuerArtikelOpen && (
        <NeuerServiceartikelDialog
          onClose={() => setNeuerArtikelOpen(false)}
          onSubmit={async (input) => {
            const result = await createServiceartikel(input);
            if (result.ok) {
              onKandidatenErstellt(result.data);
              setNeuerArtikelOpen(false);
              toast.success(`Serviceartikel "${input.description}" angelegt.`);
            } else {
              toast.error(result.error);
            }
          }}
        />
      )}
    </div>
  );
}

function PreisstufeRow({
  unterkategorieId,
  stufe,
  artikelLabel,
  onChanged,
}: {
  unterkategorieId: string;
  stufe: Preisstufe;
  artikelLabel: string;
  onChanged: () => void;
}) {
  const [von, setVon] = useState(stufe.von === null ? "" : String(stufe.von));
  const [bis, setBis] = useState(stufe.bis === null ? "" : String(stufe.bis));

  const handleSave = async () => {
    if (von.trim() === "") {
      toast.error('Bitte einen Wert für "Von" eingeben.');
      return;
    }
    const vonNum = Number(von);
    const bisNum = bis.trim() === "" ? null : Number(bis);
    if (Number.isNaN(vonNum) || (bisNum !== null && Number.isNaN(bisNum))) {
      toast.error("Bitte gültige Zahlen eingeben.");
      return;
    }
    const result = await setPreisstufeBereich(unterkategorieId, stufe.id, vonNum, bisNum);
    if (result.ok) {
      toast.success("Bereich gespeichert.");
      onChanged();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="min-w-0 flex-1 truncate">{artikelLabel}</span>
      <Input
        value={von}
        onChange={(e) => setVon(e.target.value)}
        className="h-8 w-20"
        placeholder="Von"
      />
      <span className="text-muted-foreground">–</span>
      <Input
        value={bis}
        onChange={(e) => setBis(e.target.value)}
        className="h-8 w-20"
        placeholder="offen"
      />
      <Button type="button" size="sm" variant="outline" onClick={handleSave}>
        Speichern
      </Button>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Neuer Serviceartikel (inline)
   ═══════════════════════════════════════════ */

function NeuerServiceartikelDialog({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (input: { number: string; description: string; sale_price: number }) => void;
}) {
  const [number, setNumber] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const salePrice = Number(price);
            if (!number.trim() || !description.trim() || Number.isNaN(salePrice)) return;
            onSubmit({ number: number.trim(), description: description.trim(), sale_price: salePrice });
          }}
        >
          <DialogHeader>
            <DialogTitle>Neuer Serviceartikel</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="space-y-2">
              <Label htmlFor="sa-number">Nummer *</Label>
              <Input id="sa-number" value={number} onChange={(e) => setNumber(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sa-desc">Bezeichnung *</Label>
              <Input
                id="sa-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sa-price">Preis (€) *</Label>
              <Input
                id="sa-price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit">Anlegen</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
