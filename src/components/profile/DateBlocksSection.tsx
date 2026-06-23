'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Trash2, CalendarOff } from 'lucide-react'
import { toast } from 'sonner'
import { useDateBlocks, type DateBlock } from '@/hooks/useDateBlocks'

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatBlockLabel(block: DateBlock): string {
  if (!block.end_date || block.end_date === block.start_date) {
    return formatDate(block.start_date)
  }
  return `${formatDate(block.start_date)} – ${formatDate(block.end_date)}`
}

export function DateBlocksSection() {
  const { blocks, loading, addBlock, deleteBlock } = useDateBlocks()
  const [showForm, setShowForm] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DateBlock | null>(null)
  const startInputRef = useRef<HTMLInputElement>(null)

  async function handleAdd() {
    if (!startDate) {
      setFormError('Startdatum ist ein Pflichtfeld')
      return
    }
    setSaving(true)
    setFormError(null)
    const { error } = await addBlock(startDate, endDate || undefined)
    setSaving(false)
    if (error) {
      setFormError(error)
    } else {
      setShowForm(false)
      setStartDate('')
      setEndDate('')
      toast.success('Blockierung hinzugefügt')
    }
  }

  function openForm() {
    setShowForm(true)
    setFormError(null)
    setStartDate('')
    setEndDate('')
    setTimeout(() => startInputRef.current?.focus(), 50)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const ok = await deleteBlock(deleteTarget.id)
    setDeleteTarget(null)
    if (!ok) toast.error('Blockierung konnte nicht gelöscht werden')
    else toast.success('Blockierung gelöscht')
  }

  return (
    <div className="space-y-3">
      <h3 className="text-[12px] font-[800] text-ink-2 uppercase tracking-[0.06em]">
        Meine Blockierungen
      </h3>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-10 w-full rounded-[10px] bg-surface" />
          ))}
        </div>
      ) : blocks.length === 0 && !showForm ? (
        <p className="text-[13px] text-ink-3 leading-relaxed">
          Noch keine Blockierungen. Füge Zeiträume hinzu, wenn du nicht verfügbar bist.
        </p>
      ) : (
        <div className="space-y-2">
          {blocks.map(block => (
            <div
              key={block.id}
              className="flex items-center gap-2 bg-surface border border-line rounded-[10px] px-3 py-2.5"
            >
              <CalendarOff className="h-3.5 w-3.5 text-ink-3 flex-shrink-0" />
              <span className="flex-1 min-w-0 text-[13.5px] text-ink font-[600] truncate">
                {formatBlockLabel(block)}
              </span>
              <button
                onClick={() => setDeleteTarget(block)}
                className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-[6px] text-ink-3 hover:text-error hover:bg-error-soft transition-colors"
                aria-label="Blockierung löschen"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="bg-surface border border-line rounded-[12px] p-3.5 space-y-2.5">
          <div className="space-y-1.5">
            <label className="text-[11.5px] font-[700] text-ink-2 uppercase tracking-[0.05em]">
              Von *
            </label>
            <Input
              ref={startInputRef}
              type="date"
              value={startDate}
              onChange={e => { setStartDate(e.target.value); setFormError(null) }}
              className="bg-bg border-line text-ink text-[14px]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11.5px] font-[700] text-ink-2 uppercase tracking-[0.05em]">
              Bis <span className="text-ink-3 font-[500] normal-case">(optional – leer = nur dieser Tag)</span>
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={e => { setEndDate(e.target.value); setFormError(null) }}
              className="bg-bg border-line text-ink text-[14px]"
            />
          </div>
          {formError && (
            <p className="text-[12px] text-error">{formError}</p>
          )}
          <div className="flex gap-2 pt-0.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setShowForm(false); setFormError(null) }}
              className="flex-1 border-line text-ink-2 text-[12.5px]"
            >
              Abbrechen
            </Button>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={saving}
              className="flex-1 bg-primary hover:bg-primary-600 text-white text-[12.5px]"
            >
              {saving ? 'Speichern…' : 'Hinzufügen'}
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={openForm}
          className="flex items-center gap-2 text-[13px] font-[700] text-primary hover:text-primary-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Blockierung hinzufügen
        </button>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-surface border-line rounded-[18px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-ink">Blockierung löschen?</AlertDialogTitle>
            <AlertDialogDescription className="text-ink-3">
              {deleteTarget && formatBlockLabel(deleteTarget)} wird entfernt und ist ab sofort nicht mehr für die Terminfindung aktiv.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-line text-ink-2">Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-error hover:bg-error text-white"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
