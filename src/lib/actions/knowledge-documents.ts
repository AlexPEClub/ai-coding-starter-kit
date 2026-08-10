"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/supabase/server";
import { isAdmin, isRedaktion } from "@/lib/roles";
import { extractTextFromPdf } from "@/lib/knowledge/extract-text";

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
  // Additiv (rückwärtskompatibel — bestehende Aufrufer ignorieren unbekannte Felder):
  errorMessage?: string | null;
  updatedAt?: string;
};

export type DocumentFilters = {
  search?: string;
  categoryIds?: string[];
};

const STORAGE_BUCKET = "wissensbasis";

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
  revalidatePath("/verwaltung/cms/wissensbasis");
}

/* ═══════════════════════════════════════════
   Mapping-Helfer (snake_case DB → camelCase UI)
   ═══════════════════════════════════════════ */

function mapDocument(row: {
  id: string;
  file_name: string;
  source: string;
  status: DocumentStatus;
  full_text: string | null;
  uploaded_by_name: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  category_ids: string[] | null;
}): KnowledgeDocument {
  return {
    id: row.id,
    filename: row.file_name,
    source: row.source,
    status: row.status,
    categoryIds: row.category_ids ?? [],
    fullText: row.full_text ?? "",
    uploadedBy: row.uploaded_by_name ?? "Unbekannt",
    createdAt: row.created_at,
    errorMessage: row.error_message,
    updatedAt: row.updated_at,
  };
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

  try {
    const supabase = createAdminClient({ schema: "tms" });
    const { data, error } = await supabase
      .from("knowledge_categories")
      .select("id, kind, name")
      .order("kind", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw error;

    return { ok: true, data: (data ?? []) as DocumentCategory[] };
  } catch (err) {
    console.error("Kategorien laden Fehler:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Fehler beim Laden der Kategorien.",
    };
  }
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

  try {
    const supabase = createAdminClient({ schema: "tms" });
    const { data, error } = await supabase
      .from("knowledge_categories")
      .insert({ kind, name: trimmedName })
      .select("id, kind, name")
      .single();

    if (error) {
      // Postgres Unique-Violation → verständliche Meldung (kein Vorab-Check, vermeidet Race)
      if ((error as { code?: string }).code === "23505") {
        return { ok: false, error: `"${trimmedName}" existiert bereits.` };
      }
      throw error;
    }

    revalidateWissensbasis();
    return { ok: true, data: data as DocumentCategory };
  } catch (err) {
    console.error("Kategorie anlegen Fehler:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Fehler beim Anlegen.",
    };
  }
}

export async function deleteCategory(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await requireAdmin())) {
    return { ok: false, error: "Keine Berechtigung." };
  }

  try {
    const supabase = createAdminClient({ schema: "tms" });
    // Join-Zeilen werden per ON DELETE CASCADE automatisch aufgeräumt.
    const { data, error } = await supabase
      .from("knowledge_categories")
      .delete()
      .eq("id", id)
      .select("id");

    if (error) throw error;
    if (!data || data.length === 0) {
      return { ok: false, error: "Kategorie nicht gefunden." };
    }

    revalidateWissensbasis();
    return { ok: true };
  } catch (err) {
    console.error("Kategorie löschen Fehler:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Fehler beim Löschen.",
    };
  }
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

  try {
    const supabase = createAdminClient({ schema: "tms" });
    const search = filters.search?.trim();
    const categoryIds = filters.categoryIds ?? [];

    const { data, error } = await supabase.rpc("search_knowledge_documents", {
      p_search: search || null,
      p_category_ids: categoryIds.length > 0 ? categoryIds : null,
    });

    if (error) throw error;

    return { ok: true, data: (data ?? []).map(mapDocument) };
  } catch (err) {
    console.error("Dokumente laden Fehler:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Fehler beim Laden der Dokumente.",
    };
  }
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
  const uploadedByName = profile?.full_name || profile?.email || "Unbekannt";

  try {
    const supabase = createAdminClient({ schema: "tms" });
    const storageClient = createAdminClient(); // Storage nutzt das public-Schema-Client-Objekt

    // ID vorab erzeugen → dient als Storage-Pfad UND als DB-Zeilen-ID.
    const documentId = crypto.randomUUID();
    const storagePath = `${documentId}.pdf`;

    // 1) Original-PDF in den privaten Bucket legen
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: uploadError } = await storageClient.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, bytes, {
        contentType: file.type || "application/pdf",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // 2) Dokument-Zeile anlegen (Status „verarbeitung", Volltext noch leer)
    const { data: inserted, error: insertError } = await supabase
      .from("knowledge_documents")
      .insert({
        id: documentId,
        file_name: file.name,
        storage_path: storagePath,
        source,
        status: "verarbeitung",
        full_text: "",
        uploaded_by: profile?.id ?? null,
        uploaded_by_name: uploadedByName,
      })
      .select("id, file_name, source, status, full_text, uploaded_by_name, error_message, created_at, updated_at")
      .single();

    if (insertError) throw insertError;

    // 3) Kategorie-Tags setzen
    if (categoryIds.length > 0) {
      const { error: tagError } = await supabase.rpc("set_document_categories", {
        p_document_id: documentId,
        p_category_ids: categoryIds,
      });
      if (tagError) throw tagError;
    }

    revalidateWissensbasis();

    const doc: KnowledgeDocument = mapDocument({
      ...inserted,
      category_ids: categoryIds,
    });

    // 4) Text-Extraktion NACH der Antwort im Hintergrund (Next.js `after`),
    //    damit große PDFs den Upload nicht blockieren.
    after(async () => {
      const bg = createAdminClient({ schema: "tms" });
      try {
        const text = await extractTextFromPdf(bytes);
        if (text.length > 0) {
          await bg
            .from("knowledge_documents")
            .update({ status: "aktiv", full_text: text, error_message: null })
            .eq("id", documentId);
        } else {
          await bg
            .from("knowledge_documents")
            .update({
              status: "fehler",
              error_message:
                "Aus dieser Datei konnte kein Text extrahiert werden (leer oder nur Bild ohne Textlayer).",
            })
            .eq("id", documentId);
        }
      } catch (err) {
        console.error("Text-Extraktion Fehler:", err);
        await bg
          .from("knowledge_documents")
          .update({
            status: "fehler",
            error_message:
              "Die Datei konnte nicht verarbeitet werden (unlesbar oder beschädigt).",
          })
          .eq("id", documentId);
      } finally {
        revalidateWissensbasis();
      }
    });

    return { ok: true, data: doc };
  } catch (err) {
    console.error("Dokument hochladen Fehler:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Fehler beim Hochladen.",
    };
  }
}

export async function updateDocumentCategories(
  id: string,
  categoryIds: string[]
): Promise<{ ok: true; data: KnowledgeDocument } | { ok: false; error: string }> {
  if (!(await requireRedaktion())) {
    return { ok: false, error: "Keine Berechtigung." };
  }

  try {
    const supabase = createAdminClient({ schema: "tms" });

    // Atomarer Tag-Austausch + updated_at-Bump in einem Funktionsaufruf
    // (kein Fenster mit „null Tags" für gleichzeitig Lesende).
    const { error: rpcError } = await supabase.rpc("set_document_categories", {
      p_document_id: id,
      p_category_ids: categoryIds,
    });

    if (rpcError) throw rpcError;

    // Aktualisiertes Dokument gezielt zurückgeben (nicht die gesamte Liste laden)
    const { data: docRow, error: docError } = await supabase
      .from("knowledge_documents")
      .select(
        "id, file_name, source, status, full_text, uploaded_by_name, error_message, created_at, updated_at"
      )
      .eq("id", id)
      .maybeSingle();
    if (docError) throw docError;
    if (!docRow) {
      return { ok: false, error: "Dokument nicht gefunden." };
    }

    const { data: tagRows, error: tagsError } = await supabase
      .from("knowledge_document_categories")
      .select("category_id")
      .eq("document_id", id);
    if (tagsError) throw tagsError;

    revalidateWissensbasis();
    return {
      ok: true,
      data: mapDocument({
        ...docRow,
        category_ids: (tagRows ?? []).map((t) => t.category_id),
      }),
    };
  } catch (err) {
    console.error("Tags aktualisieren Fehler:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Fehler beim Aktualisieren.",
    };
  }
}

export async function deleteDocument(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await requireRedaktion())) {
    return { ok: false, error: "Keine Berechtigung." };
  }

  try {
    const supabase = createAdminClient({ schema: "tms" });
    const storageClient = createAdminClient();

    // Storage-Pfad ermitteln, um die Original-Datei mit zu entfernen.
    // maybeSingle() statt single(): bei 0 Treffern kommt `null` zurück statt eines
    // Fehlers, damit die Not-Found-Meldung unten tatsächlich erreichbar ist.
    const { data: doc, error: fetchError } = await supabase
      .from("knowledge_documents")
      .select("storage_path")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!doc) {
      return { ok: false, error: "Dokument nicht gefunden." };
    }

    // Datei aus dem Bucket löschen. Scheitert das, trotzdem weiterlöschen —
    // eine verwaiste Storage-Datei ist ein kleineres Problem als eine
    // Zeile, die niemand aus der UI entfernen kann.
    if (doc.storage_path) {
      const { error: removeError } = await storageClient.storage
        .from(STORAGE_BUCKET)
        .remove([doc.storage_path]);
      if (removeError) {
        console.error("Storage-Datei löschen Fehler (fortgesetzt):", removeError);
      }
    }

    // Join-Zeilen werden per ON DELETE CASCADE mit entfernt.
    const { error: deleteError } = await supabase
      .from("knowledge_documents")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    revalidateWissensbasis();
    return { ok: true };
  } catch (err) {
    console.error("Dokument löschen Fehler:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Fehler beim Löschen.",
    };
  }
}
