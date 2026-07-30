"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DienstleisterFormValues = {
  company_name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  street?: string;
  postal_code?: string;
  city?: string;
};

type DienstleisterFormDialogProps = {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  onSubmit: (input: DienstleisterFormValues) => void;
};

export function DienstleisterFormDialog({
  open,
  onClose,
  loading,
  onSubmit,
}: DienstleisterFormDialogProps) {
  const [values, setValues] = useState<DienstleisterFormValues>({ company_name: "" });

  const set = (key: keyof DienstleisterFormValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const reset = () => setValues({ company_name: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.company_name.trim()) return;
    onSubmit(values);
    reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Neuer externer Dienstleister</DialogTitle>
            <DialogDescription>
              Wird als Partner mit Typ „Dienstleister&quot; angelegt und steht danach bei
              „extern&quot;-Pfad-Schritten zur Auswahl.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="dl-company">Firmenname *</Label>
              <Input
                id="dl-company"
                value={values.company_name}
                onChange={set("company_name")}
                placeholder="z.B. Mustermann GmbH"
                disabled={loading}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dl-contact">Ansprechpartner</Label>
              <Input
                id="dl-contact"
                value={values.contact_name || ""}
                onChange={set("contact_name")}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dl-email">E-Mail</Label>
              <Input
                id="dl-email"
                type="email"
                value={values.email || ""}
                onChange={set("email")}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dl-phone">Telefon</Label>
              <Input
                id="dl-phone"
                value={values.phone || ""}
                onChange={set("phone")}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dl-street">Straße</Label>
              <Input
                id="dl-street"
                value={values.street || ""}
                onChange={set("street")}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dl-postal">PLZ</Label>
              <Input
                id="dl-postal"
                value={values.postal_code || ""}
                onChange={set("postal_code")}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dl-city">Ort</Label>
              <Input
                id="dl-city"
                value={values.city || ""}
                onChange={set("city")}
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading || !values.company_name.trim()}>
              {loading ? "Speichert..." : "Anlegen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
