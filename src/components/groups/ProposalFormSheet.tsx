'use client'

import { useEffect, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Minus, Plus, ImageOff } from 'lucide-react'
import { useOgImage } from '@/hooks/useOgImage'
import { useCreateProposal } from '@/hooks/useCreateProposal'
import { useEditProposal } from '@/hooks/useEditProposal'
import type { ActivityWithInitiator, DurationCategory } from '@/lib/activity-types'
import { DURATION_CATEGORY_LABELS, PLACEHOLDER_IMAGE } from '@/lib/activity-types'

interface FormValues {
  name: string
  duration_category: DurationCategory | ''
  required_votes: number
  url: string
  description: string
}

const EMPTY_FORM: FormValues = {
  name: '',
  duration_category: '',
  required_votes: 1,
  url: '',
  description: '',
}

interface ProposalFormSheetProps {
  open: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  groupId: string
  memberCount: number
  proposal?: ActivityWithInitiator
  onSuccess: () => void
}

export function ProposalFormSheet({
  open,
  onClose,
  mode,
  groupId,
  memberCount,
  proposal,
  onSuccess,
}: ProposalFormSheetProps) {
  const [values, setValues] = useState<FormValues>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const { createProposal } = useCreateProposal(groupId)
  const { editProposal } = useEditProposal(proposal?.id ?? '')
  const { ogImageUrl, loading: ogLoading, found: ogFound } = useOgImage(
    values.url.trim() || null
  )

  // Populate form when editing
  useEffect(() => {
    if (mode === 'edit' && proposal) {
      setValues({
        name: proposal.name,
        duration_category: proposal.duration_category,
        required_votes: proposal.required_votes,
        url: proposal.url ?? '',
        description: proposal.description ?? '',
      })
    } else if (mode === 'create') {
      setValues(EMPTY_FORM)
    }
    setErrors({})
    setApiError(null)
  }, [open, mode, proposal])

  function validate(): boolean {
    const next: Partial<Record<keyof FormValues, string>> = {}
    if (!values.name.trim()) next.name = 'Name ist erforderlich'
    else if (values.name.length > 200) next.name = 'Maximal 200 Zeichen'
    if (!values.duration_category) next.duration_category = 'Bitte Kategorie wählen'
    if (values.required_votes < 1) next.required_votes = 'Mindestens 1 Vote erforderlich'
    if (values.required_votes > memberCount)
      next.required_votes = `Maximal ${memberCount} (Mitgliederanzahl)`
    if (values.url.trim()) {
      try {
        new URL(values.url.trim())
      } catch {
        next.url = 'Gültige URL eingeben (z. B. https://…)'
      }
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
    if (apiError) setApiError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setApiError(null)

    const resolvedOgImage = values.url.trim() ? (ogImageUrl ?? PLACEHOLDER_IMAGE) : null

    if (mode === 'create') {
      const { error } = await createProposal({
        name: values.name.trim(),
        duration_category: values.duration_category as DurationCategory,
        required_votes: values.required_votes,
        url: values.url.trim() || undefined,
        description: values.description.trim() || undefined,
        og_image_url: resolvedOgImage ?? undefined,
      })
      setSubmitting(false)
      if (error) { setApiError(error); return }
    } else {
      const { error } = await editProposal({
        name: values.name.trim(),
        duration_category: values.duration_category as DurationCategory,
        required_votes: values.required_votes,
        url: values.url.trim() || null,
        description: values.description.trim() || null,
        og_image_url: resolvedOgImage,
      })
      setSubmitting(false)
      if (error) { setApiError(error); return }
    }

    onSuccess()
    onClose()
  }

  const maxVotes = memberCount
  const title = mode === 'create' ? 'Vorschlag erstellen' : 'Vorschlag bearbeiten'

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-[24px] bg-bg border-t border-line p-0 max-h-[92vh] flex flex-col"
      >
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-line flex-shrink-0">
          <SheetTitle className="text-[18px] font-[800] text-ink">{title}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-[13px] font-[700] text-ink-2 uppercase tracking-[0.07em]">
              Name <span className="text-error">*</span>
            </Label>
            <Input
              value={values.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="z. B. Klettern im Kletterzentrum"
              maxLength={200}
              className="h-11 text-[15px] border-[1.5px] border-line bg-surface rounded-[12px] px-[14px]
                         focus-visible:ring-0 focus-visible:border-secondary focus-visible:shadow-[0_0_0_3px_var(--secondary-soft)]"
              aria-invalid={!!errors.name}
            />
            {errors.name && <p className="text-[12.5px] text-error">{errors.name}</p>}
            <p className="text-[11.5px] text-ink-3">{values.name.length}/200</p>
          </div>

          {/* Dauer-Kategorie */}
          <div className="space-y-1.5">
            <Label className="text-[13px] font-[700] text-ink-2 uppercase tracking-[0.07em]">
              Dauer-Kategorie <span className="text-error">*</span>
            </Label>
            <Select
              value={values.duration_category}
              onValueChange={(v) => set('duration_category', v as DurationCategory)}
            >
              <SelectTrigger
                className="h-11 text-[15px] border-[1.5px] border-line bg-surface rounded-[12px] px-[14px]
                           focus:ring-0 focus:border-secondary focus:shadow-[0_0_0_3px_var(--secondary-soft)]
                           data-[state=open]:border-secondary"
              >
                <SelectValue placeholder="Kategorie wählen…" />
              </SelectTrigger>
              <SelectContent className="bg-surface border-line rounded-[12px]">
                {(Object.entries(DURATION_CATEGORY_LABELS) as [DurationCategory, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value} className="text-[15px] rounded-[8px]">
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
            {errors.duration_category && (
              <p className="text-[12.5px] text-error">{errors.duration_category}</p>
            )}
          </div>

          {/* Benötigte Upvotes – Stepper */}
          <div className="space-y-1.5">
            <Label className="text-[13px] font-[700] text-ink-2 uppercase tracking-[0.07em]">
              Benötigte Upvotes <span className="text-error">*</span>
            </Label>
            <div className="flex items-center gap-0 border-[1.5px] border-line bg-surface rounded-[12px] h-11 overflow-hidden w-fit">
              <button
                type="button"
                onClick={() => set('required_votes', Math.max(1, values.required_votes - 1))}
                className="w-[42px] h-full flex items-center justify-center bg-surface-2 hover:bg-line/50 transition-colors"
                aria-label="Weniger"
              >
                <Minus className="h-4 w-4 text-ink-2" />
              </button>
              <span className="w-14 text-center text-[18px] font-[800] text-ink select-none">
                {values.required_votes}
              </span>
              <button
                type="button"
                onClick={() => set('required_votes', Math.min(maxVotes, values.required_votes + 1))}
                className="w-[42px] h-full flex items-center justify-center bg-surface-2 hover:bg-line/50 transition-colors"
                aria-label="Mehr"
              >
                <Plus className="h-4 w-4 text-ink-2" />
              </button>
            </div>
            <p className="text-[11.5px] text-ink-3">Min. 1 · Max. {maxVotes} (Mitgliederanzahl)</p>
            {errors.required_votes && (
              <p className="text-[12.5px] text-error">{errors.required_votes}</p>
            )}
          </div>

          {/* URL (optional) */}
          <div className="space-y-1.5">
            <Label className="text-[13px] font-[700] text-ink-2 uppercase tracking-[0.07em]">
              Link <span className="text-[11px] font-[500] normal-case tracking-normal text-ink-3">(optional)</span>
            </Label>
            <Input
              type="url"
              value={values.url}
              onChange={(e) => set('url', e.target.value)}
              placeholder="https://…"
              className="h-11 text-[15px] border-[1.5px] border-line bg-surface rounded-[12px] px-[14px]
                         focus-visible:ring-0 focus-visible:border-secondary focus-visible:shadow-[0_0_0_3px_var(--secondary-soft)]"
              aria-invalid={!!errors.url}
            />
            {errors.url && <p className="text-[12.5px] text-error">{errors.url}</p>}

            {/* OG Image Preview */}
            {values.url.trim() && (
              <div className="mt-2">
                {ogLoading ? (
                  <div className="h-[120px] rounded-[12px] bg-surface-2 border border-line flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-ink-3" />
                  </div>
                ) : ogImageUrl ? (
                  <div className="relative rounded-[12px] overflow-hidden border border-line">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ogImageUrl}
                      alt="Vorschaubild"
                      className="w-full h-[120px] object-cover"
                    />
                    {!ogFound && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2">
                        <ImageOff className="h-4 w-4 text-white/80" />
                        <span className="text-[12px] text-white/80 font-[600]">
                          Kein Vorschaubild gefunden
                        </span>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Beschreibung (optional) */}
          <div className="space-y-1.5">
            <Label className="text-[13px] font-[700] text-ink-2 uppercase tracking-[0.07em]">
              Beschreibung <span className="text-[11px] font-[500] normal-case tracking-normal text-ink-3">(optional)</span>
            </Label>
            <Textarea
              value={values.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Was ist das für eine Aktivität? Was sollte die Gruppe wissen?"
              rows={3}
              className="text-[15px] border-[1.5px] border-line bg-surface rounded-[12px] px-[14px] py-3 resize-none
                         focus-visible:ring-0 focus-visible:border-secondary focus-visible:shadow-[0_0_0_3px_var(--secondary-soft)]"
            />
          </div>

          {apiError && (
            <p className="text-[13px] text-error bg-error/10 rounded-[10px] px-3 py-2">
              {apiError}
            </p>
          )}

          {/* Submit */}
          <div className="pb-6">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 bg-primary hover:bg-primary-600 text-white font-[700] text-[15px]
                         rounded-[12px] border border-primary-600 tracking-[0.01em]"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'create' ? 'Wird erstellt…' : 'Wird gespeichert…'}
                </>
              ) : mode === 'create' ? (
                'Vorschlag erstellen'
              ) : (
                'Änderungen speichern'
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
