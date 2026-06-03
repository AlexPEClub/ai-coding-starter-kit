"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud, FileBox, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { analyzeSTL } from "@/lib/stl-parser";
import type { AnalyzedPart } from "@/lib/types";
import { formatNumber } from "@/lib/pricing";

interface STLUploaderProps {
  onAnalyzed: (part: AnalyzedPart) => void;
  current: AnalyzedPart | null;
  onClear: () => void;
}

const MAX_BYTES = 100 * 1024 * 1024;
const WARN_BYTES = 50 * 1024 * 1024;

export function STLUploader({ onAnalyzed, current, onClear }: STLUploaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".stl")) {
        toast.error("Bitte eine .stl-Datei waehlen");
        return;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`Datei zu gross (max. ${MAX_BYTES / 1024 / 1024} MB)`);
        return;
      }
      if (file.size > WARN_BYTES) {
        toast.warning("Grosse Datei, Analyse kann einige Sekunden dauern");
      }
      setIsLoading(true);
      try {
        const part = await analyzeSTL(file);
        onAnalyzed(part);
        toast.success(`STL analysiert: ${formatNumber(part.volumeCm3)} cm3`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Analyse fehlgeschlagen";
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [onAnalyzed],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  if (current) {
    return (
      <Card className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
            <FileBox className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{current.fileName}</p>
            <p className="text-xs text-muted-foreground">
              {(current.fileSizeBytes / 1024).toFixed(1)} KB ·{" "}
              {current.triangleCount.toLocaleString("de-DE")} Dreiecke
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="h-4 w-4 mr-1" />
          Anderes Bauteil
        </Button>
      </Card>
    );
  }

  return (
    <Card
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      className={`border-2 border-dashed transition-colors ${
        isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
      }`}
    >
      <div className="flex flex-col items-center justify-center px-6 py-12 text-center gap-3">
        {isLoading ? (
          <>
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">STL wird analysiert...</p>
          </>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">STL-Datei hochladen</p>
              <p className="text-xs text-muted-foreground">
                Drag &amp; Drop oder klicken. Max 100 MB. Binary &amp; ASCII unterstuetzt.
              </p>
            </div>
            <Button onClick={() => inputRef.current?.click()} className="mt-2">
              Datei waehlen
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept=".stl"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
                e.target.value = "";
              }}
            />
          </>
        )}
      </div>
    </Card>
  );
}
