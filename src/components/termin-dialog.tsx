"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { DatePicker } from "@/components/date-picker"

import { cn } from "@/lib/utils"
import type { Termin, TerminStatus } from "@/lib/types"
import { createTermin, updateTermin } from "@/lib/actions/termine"
import { getApotheken } from "@/lib/actions/apotheken"
import { getUsers } from "@/lib/actions/users"
import { format } from "date-fns"

interface TerminFormValues {
  apotheke_id: string
  trainer_id: string
  datum: Date | undefined
  zeit_start: string
  zeit_ende: string
  status: TerminStatus
  notiz: string
}

interface TerminDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  termin?: Termin
  defaultTourId?: string | null
  defaultTrainerId?: string
}

export function TerminDialog({
  open,
  onOpenChange,
  termin,
  defaultTourId,
  defaultTrainerId,
}: TerminDialogProps) {
  const isEdit = !!termin
  const [apothekeOpen, setApothekeOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [trainers, setTrainers] = useState<{ id: string; full_name: string }[]>([])

  // We will load apotheken for the combobox. 
  // Optimization: implement server-side search in combobox if list is huge.
  // For now, let's load first 100 active apotheken or search.
  // Actually the combobox filters client side. We need to load them.
  const [apotheken, setApotheken] = useState<{ id: string; name: string; ort: string; plz: string }[]>([])
  const [searchApo, setSearchApo] = useState("")

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TerminFormValues>({
    defaultValues: {
      apotheke_id: "",
      trainer_id: defaultTrainerId ?? "",
      datum: undefined,
      zeit_start: "09:00",
      zeit_ende: "11:00",
      status: "geplant",
      notiz: "",
    },
  })

  // Load trainers on mount
  useEffect(() => {
    getUsers().then((res) => {
      const activeTrainers = (res as any[])
        .filter(u => u.role === "trainer" && u.is_active)
        .map(u => ({ id: u.id, full_name: u.full_name }))
      setTrainers(activeTrainers)
    })
  }, [])

  // Load apotheken search
  useEffect(() => {
    if (!open) return
    // If we have an existing termin, we want to ensure its apotheke is loaded or pre-set text
    // But for combobox list, we load some. 
    // Let's simplified load: fetch top 100 + search.
    const loadApos = async () => {
      const res = await getApotheken({ pageSize: 100, search: searchApo })
      // Map to simpler shape
      setApotheken(res.data.map((a: any) => ({
        id: a.id,
        name: a.name,
        ort: a.ort,
        plz: a.plz
      })))
    }
    loadApos()
  }, [open, searchApo]) // reloading on search change if implemented

  useEffect(() => {
    if (open && termin) {
      reset({
        apotheke_id: termin.apotheke_id,
        trainer_id: termin.trainer_id,
        datum: new Date(termin.datum),
        zeit_start: termin.zeit_start,
        zeit_ende: termin.zeit_ende,
        status: termin.status,
        notiz: termin.notiz ?? "",
      })
    } else if (open) {
      reset({
        apotheke_id: "",
        trainer_id: defaultTrainerId ?? "",
        datum: undefined,
        zeit_start: "09:00",
        zeit_ende: "11:00",
        status: "geplant",
        notiz: "",
      })
    }
  }, [open, termin, reset, defaultTrainerId])

  const apothekeId = watch("apotheke_id")
  const trainerId = watch("trainer_id")
  const datum = watch("datum")
  const status = watch("status")

  // Find selected name for display even if not in current search list? 
  // If termin is set, we might not have the apotheke in the loaded list if it's not top 100.
  // For now, reliance on loaded list.
  // Ideally, pass the Apotheke object if known.
  // If Editing, we can use termin.apotheke (if joined).
  // The termin prop might be the full object with joins.
  const displayApotheke = apotheken.find(a => a.id === apothekeId) ??
    (termin as any)?.apotheke

  const onSubmit = async (data: TerminFormValues) => {
    if (!data.apotheke_id) {
      toast.error("Bitte eine Apotheke auswählen.")
      return
    }
    if (!data.trainer_id) {
      toast.error("Bitte einen Trainer auswählen.")
      return
    }
    if (!data.datum) {
      toast.error("Bitte ein Datum auswählen.")
      return
    }

    setLoading(true)

    const payload = {
      apotheke_id: data.apotheke_id,
      trainer_id: data.trainer_id,
      tour_id: defaultTourId ?? (termin?.tour_id ?? null),
      datum: format(data.datum, "yyyy-MM-dd"),
      zeit_start: data.zeit_start,
      zeit_ende: data.zeit_ende,
      status: data.status,
      notiz: data.notiz
    }

    let result
    if (isEdit && termin) {
      result = await updateTermin(termin.id, payload)
    } else {
      result = await createTermin(payload as any)
    }

    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      const apoName = displayApotheke?.name ?? "Apotheke"
      if (isEdit) {
        toast.success(`Termin bei "${apoName}" wurde aktualisiert.`)
      } else {
        toast.success(`Termin bei "${apoName}" wurde erstellt.`)
      }
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Termin bearbeiten" : "Neuer Termin"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Ändern Sie die Daten des Termins."
              : "Erstellen Sie einen neuen Termin für eine Apotheke."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Apotheke searchable select (Combobox) */}
          <div className="space-y-2">
            <Label>Apotheke *</Label>
            <Popover open={apothekeOpen} onOpenChange={setApothekeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={apothekeOpen}
                  aria-label="Apotheke auswählen"
                  className="w-full justify-between font-normal"
                  disabled={loading}
                >
                  {displayApotheke
                    ? `${displayApotheke.name} (${displayApotheke.ort})`
                    : "Apotheke suchen..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[460px] p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Name oder Ort eingeben..."
                    onValueChange={(v) => setSearchApo(v)}
                  />
                  <CommandList>
                    <CommandEmpty>Keine Apotheke gefunden.</CommandEmpty>
                    <CommandGroup>
                      {apotheken.map((apo) => (
                        <CommandItem
                          key={apo.id}
                          value={`${apo.name} ${apo.ort} ${apo.plz}`}
                          onSelect={() => {
                            setValue("apotheke_id", apo.id)
                            setApothekeOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              apothekeId === apo.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div>
                            <span className="font-medium">{apo.name}</span>
                            <span className="ml-2 text-muted-foreground text-sm">
                              {apo.plz} {apo.ort}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Trainer */}
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

          {/* Date */}
          <div className="space-y-2">
            <Label>Datum *</Label>
            <DatePicker
              value={datum}
              onChange={(d) => setValue("datum", d)}
              placeholder="Datum wählen"
            />
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zeit_start">Startzeit *</Label>
              <Input
                id="zeit_start"
                type="time"
                disabled={loading}
                {...register("zeit_start", { required: "Startzeit ist erforderlich" })}
              />
              {errors.zeit_start && (
                <p className="text-sm text-destructive">{errors.zeit_start.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="zeit_ende">Endzeit *</Label>
              <Input
                id="zeit_ende"
                type="time"
                disabled={loading}
                {...register("zeit_ende", { required: "Endzeit ist erforderlich" })}
              />
              {errors.zeit_ende && (
                <p className="text-sm text-destructive">{errors.zeit_ende.message}</p>
              )}
            </div>
          </div>

          {/* Status (only in edit mode or Admin setting initial) */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setValue("status", v as TerminStatus)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="geplant">Geplant</SelectItem>
                <SelectItem value="fixiert">Fixiert</SelectItem>
                <SelectItem value="durchgefuehrt">Durchgeführt</SelectItem>
                <SelectItem value="abgesagt">Abgesagt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="termin-notiz">Notizen</Label>
            <Textarea
              id="termin-notiz"
              {...register("notiz")}
              placeholder="Interne Notizen zum Termin..."
              rows={3}
              disabled={loading}
            />
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
