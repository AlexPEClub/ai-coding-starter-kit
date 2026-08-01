"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Settings } from "lucide-react";
import {
  DocumentTable,
  UploadDialog,
  EditTagsDialog,
  DeleteDocumentDialog,
} from "@/components/wissensbasis/document-table";
import { CategoryManagerDialog } from "@/components/wissensbasis/category-manager-dialog";
import {
  getCategories,
  getDocuments,
  uploadDocument,
  updateDocumentCategories,
  deleteDocument,
  type DocumentCategory,
  type KnowledgeDocument,
} from "@/lib/actions/knowledge-documents";

type WissensbasisAdminPageProps = {
  initialDocuments: KnowledgeDocument[];
  initialCategories: DocumentCategory[];
  isAdmin: boolean;
};

export function WissensbasisAdminPage({
  initialDocuments,
  initialCategories,
  isAdmin,
}: WissensbasisAdminPageProps) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [categories, setCategories] = useState(initialCategories);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({ search: "", werkzeugart: "", material: "" });

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [editingDoc, setEditingDoc] = useState<KnowledgeDocument | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<{ id: string; filename: string } | null>(
    null
  );

  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);

  const refreshDocuments = useCallback(
    async (nextFilters = filters) => {
      const categoryIds = [nextFilters.werkzeugart, nextFilters.material].filter(Boolean);
      const result = await getDocuments({ search: nextFilters.search, categoryIds });
      if (result.ok) setDocuments(result.data);
    },
    [filters]
  );

  const refreshCategories = useCallback(async () => {
    const result = await getCategories();
    if (result.ok) setCategories(result.data);
  }, []);

  // Solange mindestens ein Dokument noch verarbeitet wird (Text-Extraktion läuft
  // im Hintergrund), regelmäßig neu laden, bis alle „aktiv" oder „fehler" sind.
  useEffect(() => {
    const hasProcessing = documents.some((doc) => doc.status === "verarbeitung");
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      refreshDocuments();
    }, 4000);

    return () => clearInterval(interval);
  }, [documents, refreshDocuments]);

  const handleFilterChange = (next: typeof filters) => {
    setFilters(next);
    refreshDocuments(next);
  };

  const handleUpload = async (formData: FormData) => {
    setLoading(true);
    setUploadError(null);
    try {
      const result = await uploadDocument(formData);
      if (result.ok) {
        toast.success(`"${result.data.filename}" hochgeladen.`);
        setUploadOpen(false);
        await refreshDocuments();
      } else {
        setUploadError(result.error);
      }
    } catch (err) {
      setUploadError(
        err instanceof Error
          ? `Netzwerkfehler: ${err.message}`
          : "Unerwarteter Fehler beim Hochladen. Bitte erneut versuchen."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTags = async (categoryIds: string[]) => {
    if (!editingDoc) return;
    setLoading(true);
    try {
      const result = await updateDocumentCategories(editingDoc.id, categoryIds);
      if (result.ok) {
        toast.success("Tags aktualisiert.");
        setEditingDoc(null);
        await refreshDocuments();
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? `Netzwerkfehler: ${err.message}`
          : "Unerwarteter Fehler beim Speichern. Bitte erneut versuchen."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingDoc) return;
    setLoading(true);
    try {
      const result = await deleteDocument(deletingDoc.id);
      if (result.ok) {
        toast.success(`"${deletingDoc.filename}" gelöscht.`);
        setDeletingDoc(null);
        await refreshDocuments();
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? `Netzwerkfehler: ${err.message}`
          : "Unerwarteter Fehler beim Löschen. Bitte erneut versuchen."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <CardTitle>Wissensbasis</CardTitle>
            </div>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCategoryManagerOpen(true)}
              >
                <Settings className="h-4 w-4 mr-1" />
                Kategorien
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <DocumentTable
            documents={documents}
            categories={categories}
            loading={loading}
            filters={filters}
            onFilterChange={handleFilterChange}
            onUpload={() => {
              setUploadError(null);
              setUploadOpen(true);
            }}
            onEditTags={(doc) => setEditingDoc(doc)}
            onDelete={(id, filename) => setDeletingDoc({ id, filename })}
          />
        </CardContent>
      </Card>

      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSubmit={handleUpload}
        categories={categories}
        loading={loading}
        error={uploadError}
      />

      <EditTagsDialog
        open={!!editingDoc}
        onClose={() => setEditingDoc(null)}
        onSubmit={handleSaveTags}
        document={editingDoc}
        categories={categories}
        loading={loading}
      />

      {deletingDoc && (
        <DeleteDocumentDialog
          open={!!deletingDoc}
          onClose={() => setDeletingDoc(null)}
          onConfirm={handleConfirmDelete}
          filename={deletingDoc.filename}
          loading={loading}
        />
      )}

      {isAdmin && (
        <CategoryManagerDialog
          open={categoryManagerOpen}
          onClose={() => setCategoryManagerOpen(false)}
          categories={categories}
          onChanged={async () => {
            await refreshCategories();
            await refreshDocuments();
          }}
        />
      )}
    </div>
  );
}
