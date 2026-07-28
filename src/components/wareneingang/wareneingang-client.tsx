"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuftragErfassungsDialog } from "@/components/werkzeug-auftrag/auftrag-erfassungs-dialog";
import { createLeererAuftrag, type Auftrag, type AuftragStatus } from "@/lib/actions/werkzeug-auftraege";
import { toast } from "sonner";

const STATUS_BADGE: Record<AuftragStatus, { label: string; className: string }> = {
  wird_erfasst: { label: "Wird erfasst", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
  aufgenommen: { label: "Aufgenommen", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
  im_wareneingang_bestaetigt: {
    label: "Im Wareneingang bestätigt",
    className: "bg-green-100 text-green-800 hover:bg-green-100",
  },
};

interface WareneingangClientProps {
  initialAuftraege: Auftrag[];
}

export function WareneingangClient({ initialAuftraege }: WareneingangClientProps) {
  const [auftragId, setAuftragId] = useState<string | null>(null);
  const router = useRouter();

  async function handleAuftragHinzufuegen() {
    const result = await createLeererAuftrag({});
    if (result.ok) {
      setAuftragId(result.data.id);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-6">
      <Button
        onClick={handleAuftragHinzufuegen}
        className="min-h-[48px] w-full gap-2 bg-primary text-base font-semibold hover:bg-primary/90"
      >
        <Plus className="h-5 w-5" />
        Auftrag hinzufügen
      </Button>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Zuletzt erfasste Aufträge
        </h2>
        {initialAuftraege.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Aufträge erfasst.</p>
        ) : (
          <ul className="space-y-2">
            {initialAuftraege.map((a) => {
              const badge = STATUS_BADGE[a.status];
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setAuftragId(a.id)}
                    className="flex w-full min-h-[56px] items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3 text-left shadow-sm hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-foreground">{a.auftragsnummer}</p>
                      <p className="text-sm text-muted-foreground">
                        {a.partner_name ?? "Kein Kunde"}
                      </p>
                    </div>
                    <Badge className={badge.className}>{badge.label}</Badge>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {auftragId && (
        <AuftragErfassungsDialog
          key={auftragId}
          open={!!auftragId}
          onOpenChange={(open) => !open && setAuftragId(null)}
          auftragId={auftragId}
          variant="wareneingang"
          onResumeAuftrag={(andererId) => setAuftragId(andererId)}
          onDone={() => router.refresh()}
        />
      )}
    </div>
  );
}
