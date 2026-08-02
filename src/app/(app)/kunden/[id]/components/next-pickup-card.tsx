"use client";

import { useState } from "react";
import { Calendar, Truck, Plus, AlertCircle, Pencil, Save, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreatePickupModal } from "./create-pickup-modal";
import { updatePickupTour, deletePickupTour } from "@/lib/actions/pickup-tours";
import type { Tour } from "@/lib/actions/pickup-tours";
import type { DriverOption } from "@/lib/actions/order-defaults";

interface NextPickupCardProps {
  tour: Tour | null;
  drivers: DriverOption[];
  partnerId: string;
  hasAbholservice: boolean;
  hasPlannedTour: boolean;
  /** QA-Fund BUG-1 (PROJ-42): Anlegen/Ändern/Löschen ist Admin vorbehalten — server-seitig in
   * pickup-tours.ts erzwungen, hier nur zusätzlich die UI ausgeblendet (Defense in Depth). */
  isAdmin: boolean;
}

export function NextPickupCard({
  tour,
  drivers,
  partnerId,
  hasAbholservice,
  hasPlannedTour,
  isAdmin,
}: NextPickupCardProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editDate, setEditDate] = useState(tour?.geplantes_abholdatum || "");
  const [editDriver, setEditDriver] = useState(tour?.fahrer_id || "");
  const [editNote, setEditNote] = useState(tour?.titel || "");

  const driverName = tour?.fahrer_id
    ? drivers.find((d) => d.id === tour.fahrer_id)?.full_name || "—"
    : "—";

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("de-DE", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "geplant":
        return (
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
            🟡 Geplant
          </span>
        );
      case "erledigt":
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
            🟢 Erledigt
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
            {status}
          </span>
        );
    }
  };

  const handleSave = async () => {
    if (!tour) return;
    setIsLoading(true);
    
    const result = await updatePickupTour(tour.id, {
      geplantes_abholdatum: editDate,
      fahrer_id: editDriver || null,
      titel: editNote || null,
    });
    
    setIsLoading(false);
    if (result.ok) {
      setIsEditing(false);
      // Seite neu laden
      window.location.reload();
    } else {
      alert("Fehler: " + result.error);
    }
  };

  const handleDelete = async () => {
    if (!tour) return;
    if (!confirm("Abholung wirklich löschen?")) return;
    
    setIsLoading(true);
    const result = await deletePickupTour(tour.id);
    setIsLoading(false);
    
    if (result.ok) {
      window.location.reload();
    } else {
      alert("Fehler: " + result.error);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm flex items-center gap-1.5">
          <Calendar className="h-4 w-4" />
          Nächste Abholung
        </h3>
        {tour && !isEditing && isAdmin && (
          <button
            onClick={() => {
              setIsEditing(true);
              setEditDate(tour.geplantes_abholdatum || "");
              setEditDriver(tour.fahrer_id || "");
              setEditNote(tour.titel || "");
            }}
            className="text-muted-foreground hover:text-primary transition-colors"
            title="Bearbeiten"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>

      {tour ? (
        // Tour existiert
        isEditing ? (
          // Bearbeiten-Modus
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Datum</label>
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Fahrer</label>
              <select
                value={editDriver}
                onChange={(e) => setEditDriver(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Kein Fahrer</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.full_name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Notiz</label>
              <input
                type="text"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Optional..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={handleSave}
                disabled={isLoading}
              >
                <Save className="h-4 w-4 mr-1.5" />
                {isLoading ? "Speichern..." : "Speichern"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-1.5" />
                Abbrechen
              </Button>
            </div>
            
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="w-full text-xs text-red-500 hover:text-red-700 flex items-center justify-center gap-1 py-2"
            >
              <Trash2 className="h-3 w-3" />
              Abholung löschen
            </button>
          </div>
        ) : (
          // Anzeige-Modus
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground shrink-0">Status</span>
              <span>{getStatusBadge(tour.status)}</span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground shrink-0">Datum</span>
              <span className="text-right font-medium">
                {formatDate(tour.geplantes_abholdatum)}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground shrink-0">Fahrer</span>
              <span className="text-right">{driverName}</span>
            </div>

            {tour.titel && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground shrink-0">Notiz</span>
                <span className="text-right text-muted-foreground">
                  {tour.titel}
                </span>
              </div>
            )}
          </div>
        )
      ) : (
        // Keine Tour
        <div className="space-y-4">
          {!hasAbholservice ? (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Kein Abholservice konfiguriert.
              </span>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Keine Abholung geplant
              </p>

              {!hasPlannedTour && isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setIsCreating(true)}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Abholung erstellen
                </Button>
              )}
            </>
          )}
        </div>
      )}

      {/* Modal */}
      {isCreating && (
        <CreatePickupModal
          partnerId={partnerId}
          drivers={drivers}
          onClose={() => setIsCreating(false)}
        />
      )}
    </div>
  );
}
