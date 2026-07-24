"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/supabase/server";
import { isAdmin, isRedaktion } from "@/lib/roles";

/* ═══════════════════════════════════════════
   Types
   ═══════════════════════════════════════════ */

export type CategoryKind = "werkzeugart" | "material";

export type DocumentCategory = {
  id: string;
  kind: CategoryKind;
  name: string;
};

export type DocumentStatus = "verarbeitung" | "aktiv" | "fehler";

export type KnowledgeDocument = {
  id: string;
  filename: string;
  source: string;
  status: DocumentStatus;
  categoryIds: string[];
  fullText: string;
  uploadedBy: string;
  createdAt: string;
};

export type DocumentFilters = {
  search?: string;
  categoryIds?: string[];
};

/* ═══════════════════════════════════════════
   TEMPORÄRER In-Memory-Speicher
   Ersetzt /backend durch echtes Supabase Storage + Postgres-Volltextsuche
   (siehe Tech Design in features/PROJ-29-wissensbasis.md). Zustand geht bei
   jedem Server-Neustart verloren — nur zum Testen der UI in /frontend.
   ═══════════════════════════════════════════ */

const categoryStore: DocumentCategory[] = [
  { id: "cat-werkzeugart-saege", kind: "werkzeugart", name: "Säge" },
  { id: "cat-werkzeugart-fraeser", kind: "werkzeugart", name: "Fräser" },
  { id: "cat-werkzeugart-bohrer", kind: "werkzeugart", name: "Bohrer" },
  { id: "cat-material-holz", kind: "material", name: "Holz" },
  { id: "cat-material-kunststoff", kind: "material", name: "Kunststoff" },
  { id: "cat-material-alu", kind: "material", name: "Aluminium" },
];

const documentStore: KnowledgeDocument[] = [
  {
    id: "doc-leitz-lexikon",
    filename: "Leitz-Anwenderlexikon.pdf",
    source: "Leitz",
    status: "aktiv",
    categoryIds: ["cat-werkzeugart-saege", "cat-material-holz"],
    fullText:
      "Das Leitz-Anwenderlexikon erklärt Fachbegriffe der Holzbearbeitung, u.a. Zahnteilung, Zahnwinkel und Schnittgeschwindigkeit von Kreissägeblättern.",
    uploadedBy: "System",
    createdAt: "2026-07-20T09:00:00.000Z",
  },
];

/* ═══════════════════════════════════════════
   Berechtigungs-Checks
   ═══════════════════════════════════════════ */

async function requireRedaktion(): Promise<boolean> {
  const profile = await getCurrentProfile();
  return (
    !!profile &&
    (isRedaktion(profile.roles) || isAdmin(profile.roles)) &&
    profile.status === "aktiv"
  );
}

async function requireAdmin(): Promise<boolean> {
  const profile = await getCurrentProfile();
  return !!profile && isAdmin(profile.roles) && profile.status === "aktiv";
}

function revalidateWissensbasis() {
  revalidatePath("/verwaltung/wissensbasis");
}

/* ═══════════════════════════════════════════
   Kategorien (Taxonomie) — admin-pflegbar
   ═══════════════════════════════════════════ */

export async function getCategories(): Promise<
  { ok: true; data: DocumentCategory[] } | { ok: false; error: string }
> {
  if (!(await requireRedaktion())) {
    return { ok: false, error: "Keine Berechtigung." };
  }
  return { ok: true, data: [...categoryStore] };
}

export async function createCategory(
  kind: CategoryKind,
  name: string
): Promise<{ ok: true; data: DocumentCategory } | { ok: false; error: string }> {
  if (!(await requireAdmin())) {
    return { ok: false, error: "Keine Berechtigung." };
  }

  const trimmedName = name.trim();
  if (!trimmedName) {
    return { ok: false, error: "Name ist erforderlich." };
  }

  const exists = categoryStore.some(
    (c) => c.kind === kind && c.name.toLowerCase() === trimmedName.toLowerCase()
  );
  if (exists) {
    return { ok: false, error: `"${trimmedName}" existiert bereits.` };
  }

  const category: DocumentCategory = {
    id: crypto.randomUUID(),
    kind,
    name: trimmedName,
  };
  categoryStore.push(category);
  revalidateWissensbasis();

  return { ok: true, data: category };
}

export async function deleteCategory(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await requireAdmin())) {
    return { ok: false, error: "Keine Berechtigung." };
  }

  const idx = categoryStore.findIndex((c) => c.id === id);
  if (idx === -1) {
    return { ok: false, error: "Kategorie nicht gefunden." };
  }

  categoryStore.splice(idx, 1);
  for (const doc of documentStore) {
    doc.categoryIds = doc.categoryIds.filter((c) => c !== id);
  }
  revalidateWissensbasis();

  return { ok: true };
}

/* ═══════════════════════════════════════════
   Dokumente
   ═══════════════════════════════════════════ */

export async function getDocuments(
  filters: DocumentFilters = {}
): Promise<{ ok: true; data: KnowledgeDocument[] } | { ok: false; error: string }> {
  if (!(await requireRedaktion())) {
    return { ok: false, error: "Keine Berechtigung." };
  }

  const search = filters.search?.trim().toLowerCase();
  const categoryIds = filters.categoryIds ?? [];

  const filtered = documentStore.filter((doc) => {
    const matchesSearch =
      !search ||
      doc.filename.toLowerCase().includes(search) ||
      doc.source.toLowerCase().includes(search) ||
      doc.fullText.toLowerCase().includes(search);

    const matchesCategories =
      categoryIds.length === 0 ||
      categoryIds.every((id) => doc.categoryIds.includes(id));

    return matchesSearch && matchesCategories;
  });

  return {
    ok: true,
    data: [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}

export async function uploadDocument(formData: FormData): Promise<
  { ok: true; data: KnowledgeDocument } | { ok: false; error: string }
> {
  if (!(await requireRedaktion())) {
    return { ok: false, error: "Keine Berechtigung." };
  }

  const file = formData.get("file");
  const source = (formData.get("source") as string | null)?.trim() ?? "";
  const categoryIds = formData.getAll("categoryIds").map(String);

  if (!(file instanceof File) || file.name.trim() === "") {
    return { ok: false, error: "Bitte eine PDF-Datei auswählen." };
  }
  if (!source) {
    return { ok: false, error: "Hersteller/Quelle ist erforderlich." };
  }

  const profile = await getCurrentProfile();
  const text = await file.text().catch(() => "");

  const doc: KnowledgeDocument = {
    id: crypto.randomUUID(),
    filename: file.name,
    source,
    // Kein extrahierbarer Text → wird wie ein unlesbares/leeres PDF behandelt (siehe Edge Cases)
    status: text.trim().length > 0 ? "aktiv" : "fehler",
    categoryIds,
    fullText: text,
    uploadedBy: profile?.full_name || profile?.email || "Unbekannt",
    createdAt: new Date().toISOString(),
  };

  documentStore.unshift(doc);
  revalidateWissensbasis();

  if (doc.status === "fehler") {
    return {
      ok: false,
      error:
        "Aus dieser Datei konnte kein Text extrahiert werden (unlesbar oder leer). Es wurde kein Dokument angelegt.",
    };
  }

  return { ok: true, data: doc };
}

export async function updateDocumentCategories(
  id: string,
  categoryIds: string[]
): Promise<{ ok: true; data: KnowledgeDocument } | { ok: false; error: string }> {
  if (!(await requireRedaktion())) {
    return { ok: false, error: "Keine Berechtigung." };
  }

  const doc = documentStore.find((d) => d.id === id);
  if (!doc) {
    return { ok: false, error: "Dokument nicht gefunden." };
  }

  doc.categoryIds = categoryIds;
  revalidateWissensbasis();

  return { ok: true, data: doc };
}

export async function deleteDocument(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await requireRedaktion())) {
    return { ok: false, error: "Keine Berechtigung." };
  }

  const idx = documentStore.findIndex((d) => d.id === id);
  if (idx === -1) {
    return { ok: false, error: "Dokument nicht gefunden." };
  }

  documentStore.splice(idx, 1);
  revalidateWissensbasis();

  return { ok: true };
}
