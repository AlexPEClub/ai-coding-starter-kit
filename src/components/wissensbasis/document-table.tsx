"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  FileText,
  Loader2,
  Search,
  Tag,
  Trash2,
  Upload,
} from "lucide-react";
import type {
  CategoryKind,
  DocumentCategory,
  KnowledgeDocument,
} from "@/lib/actions/knowledge-documents";

/* ═══════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════ */

const STATUS_LABEL: Record<KnowledgeDocument["status"], string> = {
  verarbeitung: "Wird verarbeitet",
  aktiv: "Aktiv",
  fehler: "Fehler",
};

function StatusBadge({ status }: { status: KnowledgeDocument["status"] }) {
  if (status === "aktiv") {
    return <Badge variant="secondary">{STATUS_LABEL.aktiv}</Badge>;
  }
  if (status === "verarbeitung") {
    return (
      <Badge variant="outline">
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        {STATUS_LABEL.verarbeitung}
      </Badge>
    );
  }
  return (
    <Badge variant="destructive">
      <AlertCircle className="h-3 w-3 mr-1" />
      {STATUS_LABEL.fehler}
    </Badge>
  );
}

function categoryNames(ids: string[], categories: DocumentCategory[]): string {
  const byId = new Map(categories.map((c) => [c.id, c.name]));
  const names = ids.map((id) => byId.get(id)).filter(Boolean);
  return names.length > 0 ? names.join(", ") : "—";
}

/* ═══════════════════════════════════════════
   Document Table + Toolbar
   ═══════════════════════════════════════════ */

type DocumentTableProps = {
  documents: KnowledgeDocument[];
  categories: DocumentCategory[];
  loading?: boolean;
  filters: { search: string; werkzeugart: string; material: string };
  onFilterChange: (filters: {
    search: string;
    werkzeugart: string;
    material: string;
  }) => void;
  onUpload: () => void;
  onEditTags: (doc: KnowledgeDocument) => void;
  onDelete: (id: string, filename: string) => void;
};

export function DocumentTable({
  documents,
  categories,
  loading,
  filters,
  onFilterChange,
  onUpload,
  onEditTags,
  onDelete,
}: DocumentTableProps) {
  const werkzeugarten = categories.filter((c) => c.kind === "werkzeugart");
  const materialien = categories.filter((c) => c.kind === "material");

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button onClick={onUpload} variant="default" size="sm">
          <Upload className="h-4 w-4 mr-1" />
          Dokument hochladen
        </Button>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Wissensbasis durchsuchen..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-[140px]">
          <label className="text-xs text-muted-foreground mb-1 block">Werkzeugart</label>
          <select
            value={filters.werkzeugart}
            onChange={(e) => onFilterChange({ ...filters, werkzeugart: e.target.value })}
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            <option value="">Alle Werkzeugarten</option>
            {werkzeugarten.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="text-xs text-muted-foreground mb-1 block">Material</label>
          <select
            value={filters.material}
            onChange={(e) => onFilterChange({ ...filters, material: e.target.value })}
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            <option value="">Alle Materialien</option>
            {materialien.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">{documents.length} Dokumente</div>

      {/* Mobile */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))
        ) : documents.length === 0 ? (
          <EmptyState hasFilters={!!(filters.search || filters.werkzeugart || filters.material)} onUpload={onUpload} />
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="font-medium truncate">{doc.filename}</span>
                </div>
                <StatusBadge status={doc.status} />
              </div>
              <div className="text-sm text-muted-foreground">Quelle: {doc.source}</div>
              <div className="text-xs text-muted-foreground">
                Tags: {categoryNames(doc.categoryIds, categories)}
              </div>
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="sm" onClick={() => onEditTags(doc)}>
                  <Tag className="h-4 w-4 mr-1" />
                  Tags
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(doc.id, doc.filename)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dateiname</TableHead>
              <TableHead>Quelle</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Hochgeladen</TableHead>
              <TableHead className="w-24 text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8">
                  <EmptyState
                    hasFilters={!!(filters.search || filters.werkzeugart || filters.material)}
                    onUpload={onUpload}
                  />
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {doc.filename}
                    </div>
                  </TableCell>
                  <TableCell>{doc.source}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {categoryNames(doc.categoryIds, categories)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={doc.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(doc.createdAt).toLocaleDateString("de-DE")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditTags(doc)}
                        title="Tags bearbeiten"
                      >
                        <Tag className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(doc.id, doc.filename)}
                        title="Löschen"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function EmptyState({ hasFilters, onUpload }: { hasFilters: boolean; onUpload: () => void }) {
  if (hasFilters) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Keine Dokumente für diese Suche/Filter gefunden.
      </div>
    );
  }
  return (
    <div className="text-center py-8 space-y-3">
      <p className="text-muted-foreground">Erstes Dokument hochladen</p>
      <Button onClick={onUpload} variant="outline" size="sm">
        <Upload className="h-4 w-4 mr-1" />
        Dokument hochladen
      </Button>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Category Checkbox Group (Upload + Tags bearbeiten)
   ═══════════════════════════════════════════ */

function CategoryCheckboxGroup({
  label,
  kind,
  categories,
  selectedIds,
  onToggle,
}: {
  label: string;
  kind: CategoryKind;
  categories: DocumentCategory[];
  selectedIds: string[];
  onToggle: (id: string, checked: boolean) => void;
}) {
  const options = categories.filter((c) => c.kind === kind);
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {options.length === 0 ? (
        <p className="text-xs text-muted-foreground">Noch keine Kategorien angelegt.</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {options.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selectedIds.includes(c.id)}
                onCheckedChange={(checked) => onToggle(c.id, !!checked)}
              />
              {c.name}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Upload Dialog
   ═══════════════════════════════════════════ */

type UploadDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
  categories: DocumentCategory[];
  loading?: boolean;
  error?: string | null;
};

export function UploadDialog({
  open,
  onClose,
  onSubmit,
  categories,
  loading,
  error,
}: UploadDialogProps) {
  const [source, setSource] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Echter Byte-Fortschritt ist über Server Actions nicht ohne Weiteres messbar
  // (kein direkter XHR-Zugriff) — nähert sich stattdessen asymptotisch 90 % an,
  // damit bei langsamen mobilen Uploads großer PDFs sichtbar ist, dass etwas
  // passiert, statt dass die Oberfläche wie eingefroren wirkt.
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setUploadProgress((prev) => (prev >= 90 ? prev : prev + (90 - prev) * 0.15));
    }, 400);
    return () => clearInterval(interval);
  }, [loading]);

  const reset = () => {
    setSource("");
    setCategoryIds([]);
    setFileName(null);
    setUploadProgress(0);
  };

  const toggleCategory = (id: string, checked: boolean) => {
    setCategoryIds((prev) =>
      checked ? [...prev, id] : prev.filter((c) => c !== id)
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    categoryIds.forEach((id) => formData.append("categoryIds", id));
    await onSubmit(formData);
    reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Dokument hochladen</DialogTitle>
            <DialogDescription>
              Das PDF wird automatisch in durchsuchbaren Text umgewandelt und ist danach
              sofort Teil der Wissensbasis.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {loading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-xs text-muted-foreground">
                  Wird hochgeladen … bei großen Dateien und mobilen Netzwerken kann das
                  einen Moment dauern.
                </p>
              </div>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="file">PDF-Datei *</Label>
              <input
                id="file"
                name="file"
                type="file"
                accept="application/pdf"
                required
                disabled={loading}
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
                className="w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm"
              />
              {fileName && <p className="text-xs text-muted-foreground">{fileName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Hersteller/Quelle *</Label>
              <Input
                id="source"
                name="source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="z.B. Leitz"
                required
                disabled={loading}
              />
            </div>

            <CategoryCheckboxGroup
              label="Werkzeugart"
              kind="werkzeugart"
              categories={categories}
              selectedIds={categoryIds}
              onToggle={toggleCategory}
            />
            <CategoryCheckboxGroup
              label="Material"
              kind="material"
              categories={categories}
              selectedIds={categoryIds}
              onToggle={toggleCategory}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Lädt hoch..." : "Hochladen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════
   Edit Tags Dialog
   ═══════════════════════════════════════════ */

type EditTagsDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (categoryIds: string[]) => Promise<void>;
  document: KnowledgeDocument | null;
  categories: DocumentCategory[];
  loading?: boolean;
};

export function EditTagsDialog({
  open,
  onClose,
  onSubmit,
  document,
  categories,
  loading,
}: EditTagsDialogProps) {
  const [categoryIds, setCategoryIds] = useState<string[]>(document?.categoryIds ?? []);
  const [syncedId, setSyncedId] = useState(document?.id);

  if (syncedId !== document?.id) {
    setSyncedId(document?.id);
    setCategoryIds(document?.categoryIds ?? []);
  }

  const toggleCategory = (id: string, checked: boolean) => {
    setCategoryIds((prev) =>
      checked ? [...prev, id] : prev.filter((c) => c !== id)
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tags bearbeiten</DialogTitle>
          <DialogDescription>{document?.filename}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <CategoryCheckboxGroup
            label="Werkzeugart"
            kind="werkzeugart"
            categories={categories}
            selectedIds={categoryIds}
            onToggle={toggleCategory}
          />
          <CategoryCheckboxGroup
            label="Material"
            kind="material"
            categories={categories}
            selectedIds={categoryIds}
            onToggle={toggleCategory}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Abbrechen
          </Button>
          <Button onClick={() => onSubmit(categoryIds)} disabled={loading}>
            {loading ? "Speichert..." : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════
   Delete Confirmation Dialog
   ═══════════════════════════════════════════ */

type DeleteDocumentDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  filename: string;
  loading?: boolean;
};

export function DeleteDocumentDialog({
  open,
  onClose,
  onConfirm,
  filename,
  loading,
}: DeleteDocumentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dokument löschen</DialogTitle>
          <DialogDescription>
            Bist du sicher, dass du <strong>{filename}</strong> löschen möchtest? Das
            Dokument fließt danach nicht mehr in den wöchentlichen Themen-Scan ein. Diese
            Aktion kann nicht rückgängig gemacht werden.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Abbrechen
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? "Löscht..." : "Löschen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
