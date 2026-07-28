"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Weight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { QrScannerView } from "@/components/werkzeug-auftrag/qr-scanner-view";
import { getPartners, type Partner } from "@/lib/actions/partners";
import { getKommissionEinstellung, type KommissionEinstellung } from "@/lib/actions/order-defaults";
import {
  getAuftrag,
  getWerkzeugeImAuftrag,
  listKommissionen,
  addKommission,
  setKommissionAmAuftrag,
  scanCodeIntoAuftrag,
  addWerkzeugOhneCode,
  removeWerkzeugAusAuftrag,
  setKundeManuell,
  aufnehmenAuftrag,
  setGesamtgewicht,
  vorschlagFreienLagerplatz,
  abschliessenWareneingang,
  type Auftrag,
  type WerkzeugImAuftrag,
  type Werkzeug,
  type Kommission,
  type Lagerplatz,
} from "@/lib/actions/werkzeug-auftraege";

interface AuftragErfassungsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auftragId: string;
  /** "fahrer" = Kunde ist gesperrt/vorbefüllt, Abschluss = "Aufnehmen".
   *  "wareneingang" = Kunde kann fehlen/manuell gewählt werden, Abschluss = Gewicht + Lagerplatz. */
  variant: "fahrer" | "wareneingang";
  /** Wird aufgerufen, wenn ein Scan ergibt, dass der Code zu einem ANDEREN, bereits offenen Auftrag gehört. */
  onResumeAuftrag?: (andererAuftragId: string) => void;
  onDone?: () => void;
}

export function AuftragErfassungsDialog({
  open,
  onOpenChange,
  auftragId,
  variant,
  onResumeAuftrag,
  onDone,
}: AuftragErfassungsDialogProps) {
  const [auftrag, setAuftrag] = useState<Auftrag | null>(null);
  const [zeilen, setZeilen] = useState<Array<WerkzeugImAuftrag & { werkzeug: Werkzeug | null }>>(
    []
  );
  const [kommissionEinstellung, setKommissionEinstellungState] =
    useState<KommissionEinstellung | null>(null);
  const [kommissionListe, setKommissionListe] = useState<Kommission[]>([]);
  const [neueKommission, setNeueKommission] = useState("");
  const [kundenSuche, setKundenSuche] = useState("");
  const [kundenErgebnisse, setKundenErgebnisse] = useState<Partner[]>([]);
  const [scannerPaused, setScannerPaused] = useState(false);
  const [gesamtgewicht, setGesamtgewichtInput] = useState("");
  const [lagerplatzVorschlag, setLagerplatzVorschlag] = useState<Lagerplatz | null | undefined>(
    undefined
  );
  const [abschlussSchritt, setAbschlussSchritt] = useState(false);
  const [checklisteWagen, setChecklisteWagen] = useState(false);
  const [checklisteLagerplatz, setChecklisteLagerplatz] = useState(false);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const [a, w] = await Promise.all([getAuftrag(auftragId), getWerkzeugeImAuftrag(auftragId)]);
    setAuftrag(a);
    setZeilen(w);
    if (a?.partner_id) {
      const [einstellung, liste] = await Promise.all([
        getKommissionEinstellung(a.partner_id),
        listKommissionen(a.partner_id),
      ]);
      setKommissionEinstellungState(einstellung);
      setKommissionListe(liste);
    } else {
      setKommissionEinstellungState(null);
      setKommissionListe([]);
    }
  }, [auftragId]);

  // Reset des lokalen UI-Zustands passiert über `key={auftragId}` an den
  // Aufrufstellen (Remount statt manuellem Reset). Lädt hier lokal (statt
  // die außerhalb via useCallback gemeinsam genutzte `reload` aufzurufen),
  // damit der Effekt sein Laden selbst kapselt.
  useEffect(() => {
    if (!open) return;
    async function ladeInitial() {
      const [a, w] = await Promise.all([getAuftrag(auftragId), getWerkzeugeImAuftrag(auftragId)]);
      setAuftrag(a);
      setZeilen(w);
      if (a?.partner_id) {
        const [einstellung, liste] = await Promise.all([
          getKommissionEinstellung(a.partner_id),
          listKommissionen(a.partner_id),
        ]);
        setKommissionEinstellungState(einstellung);
        setKommissionListe(liste);
      } else {
        setKommissionEinstellungState(null);
        setKommissionListe([]);
      }
    }
    ladeInitial();
  }, [open, auftragId]);

  // BUG-3 (QA 2026-07-28): jeder Handler, der einen Zustand wie "pausiert"/
  // "busy" setzt, muss ihn auch bei einem Netzwerk-/Ausnahmefehler (nicht nur
  // bei einer regulären {ok:false}-Antwort) wieder zurücksetzen — sonst bleibt
  // der Scanner/Button hängen, bis der Dialog neu geöffnet wird.
  async function handleScan(code: string) {
    setScannerPaused(true);
    try {
      const result = await scanCodeIntoAuftrag(auftragId, code);
      if (result.ok) {
        if (result.action === "werkzeug_hinzugefuegt") toast.success("Werkzeug hinzugefügt.");
        if (result.action === "kunde_gesetzt") toast.success("Kunde übernommen.");
        await reload();
      } else if ("resumeAuftragId" in result) {
        toast.info(result.hinweis);
        onResumeAuftrag?.(result.resumeAuftragId);
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      console.error("[handleScan]", err);
      toast.error("Scan konnte nicht verarbeitet werden. Bitte erneut versuchen.");
    } finally {
      setScannerPaused(false);
    }
  }

  async function handleOhneCode() {
    try {
      await addWerkzeugOhneCode(auftragId, "Werkzeug ohne Code — Zuordnung im Werk nachholen");
      toast.success('Werkzeug als "ohne Code" vermerkt.');
      await reload();
    } catch (err) {
      console.error("[handleOhneCode]", err);
      toast.error("Konnte nicht gespeichert werden. Bitte erneut versuchen.");
    }
  }

  async function handleEntfernen(zeileId: string) {
    try {
      await removeWerkzeugAusAuftrag(zeileId);
      await reload();
    } catch (err) {
      console.error("[handleEntfernen]", err);
      toast.error("Konnte nicht entfernt werden. Bitte erneut versuchen.");
    }
  }

  async function handleKundenSuche(query: string) {
    setKundenSuche(query);
    if (query.trim().length < 2) {
      setKundenErgebnisse([]);
      return;
    }
    try {
      const result = await getPartners(query);
      if (result.ok) setKundenErgebnisse(result.data.slice(0, 5));
    } catch (err) {
      console.error("[handleKundenSuche]", err);
    }
  }

  async function handleKundeWaehlen(partner: Partner) {
    try {
      const result = await setKundeManuell(auftragId, partner.id, partner.display_name);
      if (result.ok) {
        toast.success("Kunde übernommen.");
        setKundenSuche("");
        setKundenErgebnisse([]);
        await reload();
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      console.error("[handleKundeWaehlen]", err);
      toast.error("Kunde konnte nicht übernommen werden. Bitte erneut versuchen.");
    }
  }

  async function handleKommissionStatischWaehlen(kommissionId: string) {
    try {
      await setKommissionAmAuftrag(auftragId, { kommissionId, freitext: null });
      await reload();
    } catch (err) {
      console.error("[handleKommissionStatischWaehlen]", err);
      toast.error("Kommission konnte nicht gespeichert werden. Bitte erneut versuchen.");
    }
  }

  async function handleKommissionFreitext(freitext: string) {
    try {
      await setKommissionAmAuftrag(auftragId, { kommissionId: null, freitext });
      setAuftrag((prev) => (prev ? { ...prev, kommission_freitext: freitext } : prev));
    } catch (err) {
      console.error("[handleKommissionFreitext]", err);
      toast.error("Kommission konnte nicht gespeichert werden. Bitte erneut versuchen.");
    }
  }

  async function handleNeueKommission() {
    if (!auftrag?.partner_id || !neueKommission.trim()) return;
    try {
      const result = await addKommission(auftrag.partner_id, neueKommission);
      if (result.ok) {
        setNeueKommission("");
        await reload();
        await handleKommissionStatischWaehlen(result.data.id);
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      console.error("[handleNeueKommission]", err);
      toast.error("Kommission konnte nicht angelegt werden. Bitte erneut versuchen.");
    }
  }

  async function handleAufnehmen() {
    setBusy(true);
    try {
      const result = await aufnehmenAuftrag(auftragId);
      if (result.ok) {
        toast.success("Auftrag aufgenommen.");
        onOpenChange(false);
        onDone?.();
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      console.error("[handleAufnehmen]", err);
      toast.error("Auftrag konnte nicht aufgenommen werden. Bitte erneut versuchen.");
    } finally {
      setBusy(false);
    }
  }

  async function handleWeiterZuAbschluss() {
    if (!auftrag?.partner_id) {
      toast.error("Auftrag braucht einen Kunden.");
      return;
    }
    if (zeilen.length === 0) {
      toast.error("Mindestens ein Werkzeug erforderlich.");
      return;
    }
    try {
      const kg = Number(gesamtgewicht.replace(",", "."));
      const gewichtResult = await setGesamtgewicht(auftragId, kg);
      if (!gewichtResult.ok) {
        toast.error(gewichtResult.error);
        return;
      }
      const vorschlag = await vorschlagFreienLagerplatz();
      setLagerplatzVorschlag(vorschlag);
      setAbschlussSchritt(true);
    } catch (err) {
      console.error("[handleWeiterZuAbschluss]", err);
      toast.error("Bitte erneut versuchen.");
    }
  }

  async function handleAbschliessen() {
    setBusy(true);
    try {
      const result = await abschliessenWareneingang(
        auftragId,
        lagerplatzVorschlag ? lagerplatzVorschlag.id : null
      );
      if (result.ok) {
        toast.success("Auftrag im Wareneingang bestätigt.");
        onOpenChange(false);
        onDone?.();
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      console.error("[handleAbschliessen]", err);
      toast.error("Auftrag konnte nicht bestätigt werden. Bitte erneut versuchen.");
    } finally {
      setBusy(false);
    }
  }

  const kommissionPflichtErfuellt =
    !kommissionEinstellung?.pflicht ||
    (kommissionEinstellung.typ === "statisch" && !!auftrag?.kommission_id) ||
    (kommissionEinstellung.typ === "dynamisch" && !!auftrag?.kommission_freitext?.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {auftrag ? `Auftrag ${auftrag.auftragsnummer}` : "Neuer Auftrag"}
          </DialogTitle>
        </DialogHeader>

        {!auftrag ? (
          <p className="text-sm text-muted-foreground">Lädt…</p>
        ) : abschlussSchritt ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Gesamtgewicht: <strong>{auftrag.gesamtgewicht_kg} kg</strong>
            </p>
            {lagerplatzVorschlag ? (
              <div className="rounded-lg border bg-muted/50 p-3 text-sm">
                Vorgeschlagener Lagerplatz für die Verpackung:{" "}
                <strong>{lagerplatzVorschlag.bezeichnung}</strong>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                Aktuell ist kein Lagerplatz frei. Die Verpackung wird ohne festen Lagerplatz
                vermerkt.
              </div>
            )}

            <div className="space-y-2">
              <label className="flex min-h-[44px] items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-5 w-5"
                  checked={checklisteWagen}
                  onChange={(e) => setChecklisteWagen(e.target.checked)}
                />
                Alle Werkzeuge im richtigen Wagen abgelegt
              </label>
              <label className="flex min-h-[44px] items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-5 w-5"
                  checked={checklisteLagerplatz}
                  onChange={(e) => setChecklisteLagerplatz(e.target.checked)}
                />
                Verpackung im {lagerplatzVorschlag ? "vorgeschlagenen Lagerplatz" : "Lager"}{" "}
                abgelegt
              </label>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAbschlussSchritt(false)}>
                Zurück
              </Button>
              <Button
                disabled={!checklisteWagen || !checklisteLagerplatz || busy}
                onClick={handleAbschliessen}
              >
                {busy ? "Wird bestätigt…" : "Im Wareneingang bestätigen"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Kunde */}
            <div className="space-y-1">
              <Label>Kunde</Label>
              {auftrag.partner_id ? (
                <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm font-medium">
                  {auftrag.partner_name}
                </p>
              ) : variant === "fahrer" ? (
                <p className="text-sm text-muted-foreground">Kein Kunde vorausgewählt.</p>
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder="Kunde suchen…"
                    value={kundenSuche}
                    onChange={(e) => handleKundenSuche(e.target.value)}
                    className="min-h-[44px]"
                  />
                  {kundenErgebnisse.length > 0 && (
                    <div className="space-y-1 rounded-md border p-1">
                      {kundenErgebnisse.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleKundeWaehlen(p)}
                          className="block w-full rounded px-2 py-2 text-left text-sm hover:bg-muted"
                        >
                          {p.display_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* QR-Scanner */}
            <div className="space-y-2">
              <Label>QR-Code scannen</Label>
              <QrScannerView onScan={handleScan} paused={scannerPaused} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-[44px] w-full"
                onClick={handleOhneCode}
              >
                Werkzeug ohne Code vermerken
              </Button>
            </div>

            {/* Werkzeug-Liste */}
            <div className="space-y-2">
              <Label>Werkzeuge im Auftrag ({zeilen.length})</Label>
              {zeilen.length === 0 ? (
                <p className="text-sm text-muted-foreground">Noch keine Werkzeuge erfasst.</p>
              ) : (
                <ul className="space-y-2">
                  {zeilen.map((z) => (
                    <li
                      key={z.id}
                      className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span>
                          {z.werkzeug
                            ? z.werkzeug.typ_bezeichnung || z.werkzeug.qr_code
                            : z.ohne_code_notiz}
                        </span>
                        {variant === "wareneingang" && z.werkzeug && (
                          <Badge
                            className={
                              z.werkzeug.ist_gelasert
                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                : "bg-blue-100 text-blue-800 hover:bg-blue-100"
                            }
                          >
                            → {z.werkzeug.ist_gelasert ? "Gelber" : "Blauer"} Wagen
                          </Badge>
                        )}
                      </div>
                      {auftrag.status === "wird_erfasst" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEntfernen(z.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Kommission */}
            {auftrag.partner_id && kommissionEinstellung?.pflicht && (
              <div className="space-y-1">
                <Label>
                  Kommission {kommissionEinstellung.pflicht && <span className="text-red-500">*</span>}
                </Label>
                {kommissionEinstellung.typ === "statisch" ? (
                  <div className="space-y-2">
                    <Select
                      value={auftrag.kommission_id ?? undefined}
                      onValueChange={handleKommissionStatischWaehlen}
                    >
                      <SelectTrigger className="min-h-[44px]">
                        <SelectValue placeholder="Kommission wählen…" />
                      </SelectTrigger>
                      <SelectContent>
                        {kommissionListe.map((k) => (
                          <SelectItem key={k.id} value={k.id}>
                            {k.bezeichnung}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Neue Kommission…"
                        value={neueKommission}
                        onChange={(e) => setNeueKommission(e.target.value)}
                        className="min-h-[44px]"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleNeueKommission}
                        className="min-h-[44px]"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Input
                    placeholder="Kommission (Freitext)…"
                    defaultValue={auftrag.kommission_freitext ?? ""}
                    onBlur={(e) => handleKommissionFreitext(e.target.value)}
                    className="min-h-[44px]"
                  />
                )}
              </div>
            )}

            {/* Abschluss */}
            {variant === "fahrer" ? (
              <DialogFooter>
                <Button
                  onClick={handleAufnehmen}
                  disabled={
                    busy || !auftrag.partner_id || zeilen.length === 0 || !kommissionPflichtErfuellt
                  }
                  className="min-h-[44px] w-full"
                >
                  {busy ? "Wird aufgenommen…" : "Auftrag aufnehmen"}
                </Button>
              </DialogFooter>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="gewicht" className="flex items-center gap-1">
                  <Weight className="h-4 w-4" /> Gesamtgewicht (kg, inkl. Verpackung)
                </Label>
                <Input
                  id="gewicht"
                  type="number"
                  step="0.01"
                  min="0"
                  value={gesamtgewicht}
                  onChange={(e) => setGesamtgewichtInput(e.target.value)}
                  className="min-h-[44px]"
                />
                <Button
                  onClick={handleWeiterZuAbschluss}
                  disabled={
                    !auftrag.partner_id ||
                    zeilen.length === 0 ||
                    !gesamtgewicht ||
                    !kommissionPflichtErfuellt
                  }
                  className="min-h-[44px] w-full"
                >
                  Weiter zum Abschluss
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
