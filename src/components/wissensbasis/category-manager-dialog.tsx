"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Plus, Trash2 } from "lucide-react";
import {
  createCategory,
  deleteCategory,
  type CategoryKind,
  type DocumentCategory,
} from "@/lib/actions/knowledge-documents";

type CategoryManagerDialogProps = {
  open: boolean;
  onClose: () => void;
  categories: DocumentCategory[];
  onChanged: () => Promise<void>;
};

function CategorySection({
  label,
  kind,
  categories,
  onChanged,
}: {
  label: string;
  kind: CategoryKind;
  categories: DocumentCategory[];
  onChanged: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const options = categories.filter((c) => c.kind === kind);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    const result = await createCategory(kind, name.trim());
    if (result.ok) {
      setName("");
      await onChanged();
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string, categoryName: string) => {
    setLoading(true);
    const result = await deleteCategory(id);
    if (result.ok) {
      toast.success(`"${categoryName}" gelöscht.`);
      await onChanged();
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-wrap gap-2">
        {options.length === 0 ? (
          <p className="text-xs text-muted-foreground">Noch keine Einträge.</p>
        ) : (
          options.map((c) => (
            <Badge key={c.id} variant="secondary" className="gap-1 pr-1">
              {c.name}
              <button
                type="button"
                onClick={() => handleDelete(c.id, c.name)}
                disabled={loading}
                aria-label={`${c.name} löschen`}
                className="ml-1 rounded-full hover:bg-muted p-0.5"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </Badge>
          ))
        )}
      </div>
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`Neue ${label.toLowerCase()}...`}
          disabled={loading}
          className="h-8"
        />
        <Button type="submit" size="sm" variant="outline" disabled={loading || !name.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

export function CategoryManagerDialog({
  open,
  onClose,
  categories,
  onChanged,
}: CategoryManagerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kategorien verwalten</DialogTitle>
          <DialogDescription>
            Werkzeugart und Material sind admin-erweiterbar — neue Einträge stehen sofort
            beim Hochladen/Taggen zur Auswahl.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <CategorySection
            label="Werkzeugart"
            kind="werkzeugart"
            categories={categories}
            onChanged={onChanged}
          />
          <CategorySection
            label="Material"
            kind="material"
            categories={categories}
            onChanged={onChanged}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Schließen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
