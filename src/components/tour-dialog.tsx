"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

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
import { DatePicker } from "@/components/date-picker"

import { REGIONS } from "@/lib/types"
import type { Tour, Region } from "@/lib/types"
import { createTour, updateTour } from "@/lib/actions/touren"
import { getUsers } from "@/lib/actions/users"
import { format } from "date-fns"

interface TourFormValues {
  name: string
  trainer_id: string
  region: Region
  start_date: Date | undefined
  end_date: Date | undefined
}

interface TourDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tour?: Tour
}

export function TourDialog({ open, onOpenChange, tour }: TourDialogProps) {
  const isEdit = !!tour
  const [loading, setLoading] = useState(false)
  const [trainers, setTrainers] = useState<{ id: string; full_name: string }[]>([])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TourFormValues>({
    defaultValues: {
      name: "",
      trainer_id: "",
      region: "OÖ",
      start_date: undefined,
      end_date: undefined,
    },
  })

  useEffect(() => {
    getUsers().then((res) => {
      const activeTrainers = (res as any[])
        .filter(u => u.role === "trainer" && u.is_active)
        .map(u => ({ id: u.id, full_name: u.full_name }))
      setTrainers(activeTrainers)
    })
  }, [])

  useEffect(() => {
    if (open && tour) {
      reset({
        name: tour.name,
        trainer_id: tour.trainer_id,
        region: tour.region,
        start_date: new Date(tour.start_date),
        end_date: new Date(tour.end_date),
      })
    } else if (open) {
      reset({
        name: "",
        trainer_id: "",
        region: "OÖ",
        start_date: undefined,
        end_date: undefined,
      })
    }
  }, [open, tour, reset])

  const trainerId = watch("trainer_id")
  const region = watch("region")
  const startDate = watch("start_date")
  const endDate = watch("end_date")

  const onSubmit = async (data: TourFormValues) => {
    if (!data.start_date || !data.end_date) {
      toast.error("Bitte Start- und Enddatum angeben.")
      return
    }
    if (!data.trainer_id) {
      toast.error("Bitte einen Trainer auswählen.")
      return
    }

    setLoading(true)
    const payload = {
      name: data.name,
      trainer_id: data.trainer_id,
      region: data.region,
      start_date: format(data.start_date, "yyyy-MM-dd"),
      end_date: format(data.end_date, "yyyy-MM-dd"),
    }

    let result
    if (isEdit && tour) {
      result = await updateTour(tour.id, payload)
    } else {
      result = await createTour(payload)
    }
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      if (isEdit) {
        toast.success(`Tour "${data.name}" wurde aktualisiert.`)
      } else {
        toast.success(`Tour "${data.name}" wurde erstellt.`)
      }
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Tour bearbeiten" : "Neue Tour"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Ändern Sie die Daten der Tour."
              : "Erstellen Sie eine neue Tour mit Trainer und Zeitraum."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tour-name">Name *</Label>
            <Input
              id="tour-name"
              {...register("name", { required: "Name ist erforderlich" })}
              placeholder='z.B. "KW 42 Tirol - Sebastian"'
              disabled={loading}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Trainer *</Label>
            <Select
              value={trainerId}
              onValueChange={(v) => setValue("trainer_id", v)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Trainer auswählen" />
              </SelectTrigger>
              <SelectContent>
                {trainers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Region *</Label>
            <Select
              value={region}
              onValueChange={(v) => setValue("region", v as Region)}
              disabled={loading}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Startdatum *</Label>
              <DatePicker
                value={startDate}
                onChange={(d) => setValue("start_date", d)}
                placeholder="Startdatum"
              />
            </div>
            <div className="space-y-2">
              <Label>Enddatum *</Label>
              <DatePicker
                value={endDate}
                onChange={(d) => setValue("end_date", d)}
                placeholder="Enddatum"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Speichern" : "Erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
