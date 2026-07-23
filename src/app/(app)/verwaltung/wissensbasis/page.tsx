import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getCurrentProfile } from "@/lib/supabase/server";
import { isAdmin, isRedaktion } from "@/lib/roles";
import { getCategories, getDocuments } from "@/lib/actions/knowledge-documents";
import { WissensbasisAdminPage } from "@/components/wissensbasis/wissensbasis-admin-page";

export const metadata: Metadata = {
  title: "Wissensbasis — TMS 2.0",
};

export default async function WissensbasisPage() {
  const profile = await getCurrentProfile();

  // Nur Redaktion oder Admin dürfen zugreifen
  if (!profile?.roles || (!isRedaktion(profile.roles) && !isAdmin(profile.roles))) {
    redirect("/dashboard");
  }

  const [documentsResult, categoriesResult] = await Promise.all([
    getDocuments(),
    getCategories(),
  ]);

  return (
    <WissensbasisAdminPage
      initialDocuments={documentsResult.ok ? documentsResult.data : []}
      initialCategories={categoriesResult.ok ? categoriesResult.data : []}
      isAdmin={isAdmin(profile.roles)}
    />
  );
}
