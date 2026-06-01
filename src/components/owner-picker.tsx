'use client'

import { useEffect, useRef, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PatientFormValues } from '@/components/patient-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type OwnerOption = {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
}

/**
 * Owner selection section for the patient form. Lets the therapist either
 * search & pick an existing owner or fill in fields for a new one.
 * Relies on the surrounding <Form> (FormProvider) for field state.
 */
export function OwnerPicker() {
  const form = useFormContext<PatientFormValues>()
  const ownerMode = form.watch('ownerMode')
  const selectedOwnerId = form.watch('owner_id')

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [owners, setOwners] = useState<OwnerOption[]>([])
  const [loading, setLoading] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced owner search against the API.
  useEffect(() => {
    if (ownerMode !== 'existing') return
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => {
      setLoading(true)
      fetch(`/api/owners?search=${encodeURIComponent(query)}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((data: OwnerOption[]) => setOwners(Array.isArray(data) ? data : []))
        .catch(() => setOwners([]))
        .finally(() => setLoading(false))
    }, 250)
    return () => {
      if (debounce.current) clearTimeout(debounce.current)
    }
  }, [query, ownerMode])

  const selectedOwner = owners.find((o) => o.id === selectedOwnerId)

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Besitzer</h3>

      <RadioGroup
        value={ownerMode}
        onValueChange={(v) => form.setValue('ownerMode', v as 'existing' | 'new')}
        className="flex flex-col gap-2 sm:flex-row sm:gap-6"
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="existing" id="owner-existing" />
          <Label htmlFor="owner-existing" className="font-normal">
            Bestehenden Besitzer wählen
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="new" id="owner-new" />
          <Label htmlFor="owner-new" className="font-normal">
            Neuen Besitzer anlegen
          </Label>
        </div>
      </RadioGroup>

      {ownerMode === 'existing' ? (
        <FormField
          control={form.control}
          name="owner_id"
          render={() => (
            <FormItem className="flex flex-col">
              <FormLabel>Besitzer</FormLabel>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className={cn(
                        'justify-between font-normal',
                        !selectedOwner && 'text-muted-foreground',
                      )}
                    >
                      {selectedOwner
                        ? `${selectedOwner.first_name} ${selectedOwner.last_name}`
                        : 'Besitzer suchen…'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Name eingeben…"
                      value={query}
                      onValueChange={setQuery}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {loading ? 'Suche…' : 'Kein Besitzer gefunden'}
                      </CommandEmpty>
                      <CommandGroup>
                        {owners.map((owner) => (
                          <CommandItem
                            key={owner.id}
                            value={owner.id}
                            onSelect={() => {
                              form.setValue('owner_id', owner.id, { shouldValidate: true })
                              // keep the picked owner visible in the trigger
                              setOwners((prev) =>
                                prev.some((o) => o.id === owner.id) ? prev : [owner, ...prev],
                              )
                              setOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedOwnerId === owner.id ? 'opacity-100' : 'opacity-0',
                              )}
                            />
                            <div className="flex flex-col">
                              <span>
                                {owner.first_name} {owner.last_name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {owner.email ?? owner.phone ?? ''}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <div className="space-y-4 rounded-md border border-border/60 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="newOwnerFirstName"
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
              name="newOwnerLastName"
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
              name="newOwnerEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-Mail</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newOwnerPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefon</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+49 89 123456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Mindestens E-Mail oder Telefon ist erforderlich.
          </p>
        </div>
      )}
    </div>
  )
}
