"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { REGIONS, PRIORITIES } from "@/lib/types"
import type { Apotheke, Region, Priority } from "@/lib/types"

interface ApothekeFormValues {
  name: string
  address: string
  plz: string
  ort: string
  region: Region
  priority: Priority
  notes: string
}

interface ApothekeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  apotheke?: Apotheke
}

export function ApothekeDialog({ open, onOpenChange, apotheke }: ApothekeDialogProps) {
  const isEdit = !!apotheke
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ApothekeFormValues>({
    defaultValues: {
      name: "",
      address: "",
      plz: "",
      ort: "",
      region: "OÖ",
      priority: "normal",
      notes: "",
    },
  })

  useEffect(() => {
    if (open && apotheke) {
      reset({
        name: apotheke.name,
        address: apotheke.address,
        plz: apotheke.plz,
        ort: apotheke.ort,
        region: apotheke.region,
        priority: apotheke.priority,
        notes: apotheke.notes,
      })
    } else if (open) {
      reset({
        name: "",
        address: "",
        plz: "",
        ort: "",
        region: "OÖ",
        priority: "normal",
        notes: "",
      })
    }
  }, [open, apotheke, reset])

  const onSubmit = (data: ApothekeFormValues) => {
    // TODO: Replace with Server Action / Supabase call
    if (isEdit) {
      toast.success(`"${data.name}" wurde aktualisiert.`)
    } else {
      toast.success(`"${data.name}" wurde erstellt.`)
    }
    onOpenChange(false)
  }

  const region = watch("region")
  const priority = watch("priority")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Apotheke bearbeiten" : "Neue Apotheke"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Ändern Sie die Daten der Apotheke."
              : "Legen Sie eine neue Apotheke an."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register("name", { required: "Name ist erforderlich" })}
              placeholder="z.B. Marien Apotheke"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              {...register("address")}
              placeholder="Straße und Hausnummer"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plz">PLZ *</Label>
              <Input
                id="plz"
                {...register("plz", { required: "PLZ ist erforderlich" })}
                placeholder="z.B. 6020"
              />
              {errors.plz && (
                <p className="text-sm text-destructive">{errors.plz.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ort">Ort *</Label>
              <Input
                id="ort"
                {...register("ort", { required: "Ort ist erforderlich" })}
                placeholder="z.B. Innsbruck"
              />
              {errors.ort && (
                <p className="text-sm text-destructive">{errors.ort.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Region *</Label>
              <Select
                value={region}
                onValueChange={(v) => setValue("region", v as Region)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priorität *</Label>
              <Select
                value={priority}
                onValueChange={(v) => setValue("priority", v as Priority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notizen</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Interne Notizen zur Apotheke..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit">
              {isEdit ? "Speichern" : "Erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
