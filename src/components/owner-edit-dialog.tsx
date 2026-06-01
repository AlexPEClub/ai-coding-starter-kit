'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import type { Owner } from '@/lib/database.types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const OwnerSchema = z
  .object({
    first_name: z.string().min(1, 'Vorname ist erforderlich').max(100),
    last_name: z.string().min(1, 'Nachname ist erforderlich').max(100),
    email: z.string().max(200).optional().or(z.literal('')),
    phone: z.string().max(30).optional().or(z.literal('')),
  })
  .superRefine((val, ctx) => {
    if (!val.email?.trim() && !val.phone?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['email'],
        message: 'Mindestens E-Mail oder Telefon ist erforderlich',
      })
    }
    if (val.email?.trim() && !z.email().safeParse(val.email).success) {
      ctx.addIssue({ code: 'custom', path: ['email'], message: 'Ungültige E-Mail-Adresse' })
    }
  })

type OwnerValues = z.infer<typeof OwnerSchema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  owner: Pick<Owner, 'id' | 'first_name' | 'last_name' | 'email' | 'phone'>
  onSaved: () => void
}

export function OwnerEditDialog({ open, onOpenChange, owner, onSaved }: Props) {
  const [saving, setSaving] = useState(false)

  const form = useForm<OwnerValues>({
    resolver: zodResolver(OwnerSchema),
    defaultValues: {
      first_name: owner.first_name,
      last_name: owner.last_name,
      email: owner.email ?? '',
      phone: owner.phone ?? '',
    },
  })

  // Dialog stays mounted between opens — re-sync to the current owner on open
  // so cancelled/uncommitted edits don't carry over.
  useEffect(() => {
    if (!open) return
    form.reset({
      first_name: owner.first_name,
      last_name: owner.last_name,
      email: owner.email ?? '',
      phone: owner.phone ?? '',
    })
  }, [open, owner, form])

  async function onSubmit(values: OwnerValues) {
    setSaving(true)
    try {
      const res = await fetch(`/api/owners/${owner.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: values.first_name.trim(),
          last_name: values.last_name.trim(),
          email: values.email?.trim() || null,
          phone: values.phone?.trim() || null,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        console.error('[owner] PATCH error:', body)
        toast.error(`Speichern fehlgeschlagen: ${body.error ?? res.status}`)
        return
      }
      toast.success('Besitzer gespeichert')
      onSaved()
      onOpenChange(false)
    } catch (err) {
      console.error('[owner] save network error:', err)
      toast.error('Netzwerkfehler — bitte erneut versuchen. Deine Eingaben bleiben erhalten.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Besitzer bearbeiten</DialogTitle>
          <DialogDescription>Aktualisiere die Kontaktdaten des Besitzers.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vorname</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nachname</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Speichern…' : 'Speichern'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
