import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getCurrentProfile } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/roles";
import {
  listOberkategorien,
  listParameter,
  listPfade,
  listDienstleister,
} from "@/lib/actions/werkzeugkategorien";
import { WerkzeugkategorienAdminPage } from "@/components/werkzeugkategorien/werkzeugkategorien-admin-page";

export const metadata: Metadata = {
  title: "Werkzeugkategorien & Pfade — TMS 2.0",
};

export default async function WerkzeugkategorienPage() {
  const profile = await getCurrentProfile();

  // Nur Admin darf zugreifen
  if (!profile?.roles || !isAdmin(profile.roles)) {
    redirect("/dashboard");
  }

  const [oberkategorienResult, parameterResult, pfadeResult, dienstleisterResult] = await Promise.all([
    listOberkategorien(),
    listParameter(),
    listPfade(),
    listDienstleister(),
  ]);

  return (
    <WerkzeugkategorienAdminPage
      initialOberkategorien={oberkategorienResult.ok ? oberkategorienResult.data : []}
      initialParameter={parameterResult.ok ? parameterResult.data : []}
      initialPfade={pfadeResult.ok ? pfadeResult.data : []}
      initialDienstleister={dienstleisterResult.ok ? dienstleisterResult.data : []}
    />
  );
}
