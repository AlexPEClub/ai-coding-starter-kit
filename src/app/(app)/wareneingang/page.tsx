import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/server";
import { listLetzteAuftraege } from "@/lib/actions/werkzeug-auftraege";
import { PrintQrCodesButton } from "@/components/werkzeug-auftrag/print-qr-codes-button";
import { WareneingangClient } from "@/components/wareneingang/wareneingang-client";

export const metadata: Metadata = {
  title: "Wareneingang — TMS 2.0",
};

export default async function WareneingangPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  // PROJ-34: Wareneingang-Auftragserfassung ist Wareneingang/Admin vorbehalten.
  if (!profile.roles?.some((r) => r === "wareneingang" || r === "admin")) {
    redirect("/dashboard");
  }

  const auftraege = await listLetzteAuftraege();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">📦 Wareneingang</h1>
          <p className="text-muted-foreground">
            Aufträge erfassen, bestätigen und für die Arbeitsvorbereitung vorbereiten.
          </p>
        </div>
        <PrintQrCodesButton />
      </div>

      <WareneingangClient initialAuftraege={auftraege} />
    </div>
  );
}
