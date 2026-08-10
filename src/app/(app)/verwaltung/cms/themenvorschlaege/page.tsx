import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getCurrentProfile } from "@/lib/supabase/server";
import { isAdmin, isRedaktion } from "@/lib/roles";
import { getArchivThemenvorschlaege, getOffeneThemenvorschlaege } from "@/lib/actions/content-themen";
import { ThemenvorschlaegePage } from "@/components/themenvorschlaege/themenvorschlaege-page";

export const metadata: Metadata = {
  title: "Themenvorschläge — TMS 2.0",
};

export default async function ThemenvorschlaegeRoute() {
  const profile = await getCurrentProfile();

  // Nur Redaktion oder Admin dürfen zugreifen
  if (!profile?.roles || (!isRedaktion(profile.roles) && !isAdmin(profile.roles))) {
    redirect("/dashboard");
  }

  const [offeneResult, archivResult] = await Promise.all([
    getOffeneThemenvorschlaege(),
    getArchivThemenvorschlaege(),
  ]);

  return (
    <ThemenvorschlaegePage
      offene={offeneResult.ok ? offeneResult.data : []}
      archiv={archivResult.ok ? archivResult.data : []}
    />
  );
}
