'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { updateSuggestionStatus } from '@/app/actions/suggestions'
import { SuggestionCard } from './suggestion-card'
import { StatsBar } from './stats-bar'
import type { Suggestion } from './suggestion-card'

const CATEGORY_ORDER = ['marketing', 'product', 'operations'] as const
const CATEGORY_LABELS: Record<string, string> = {
  marketing: 'Marketing',
  product: 'Produkt',
  operations: 'Operations',
}

type DashboardClientProps = {
  initialSuggestions: Suggestion[]
}

export function DashboardClient({ initialSuggestions }: DashboardClientProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>(initialSuggestions)
  const [actedIds, setActedIds] = useState<Set<string>>(new Set())

  const open = suggestions.filter(s => s.status === 'pending').length
  const approved = suggestions.filter(s => s.status === 'approved').length
  const rejected = suggestions.filter(s => s.status === 'rejected').length

  const handleAction = useCallback(
    async (id: string, status: 'approved' | 'rejected' | 'pending') => {
      const result = await updateSuggestionStatus(id, status)

      if (!result.success) {
        toast.error(result.error ?? 'Fehler beim Speichern. Bitte versuche es erneut.')
        return
      }

      setSuggestions(prev => prev.map(s => (s.id === id ? { ...s, status } : s)))

      setActedIds(prev => {
        const next = new Set(prev)
        if (status === 'pending') {
          next.delete(id)
        } else {
          next.add(id)
        }
        return next
      })

      if (status === 'approved' && result.monday_task_url) {
        const url = result.monday_task_url
        toast.success('✓ Task erstellt', {
          action: {
            label: 'In Monday öffnen ↗',
            onClick: () => window.open(url, '_blank', 'noopener,noreferrer'),
          },
          duration: 8000,
        })
      }
    },
    []
  )

  // Pending suggestions + any acted-this-session (to allow undo)
  const visibleSuggestions = suggestions.filter(
    s => s.status === 'pending' || actedIds.has(s.id)
  )

  // Group by category, skip empty groups
  const grouped = CATEGORY_ORDER
    .map(cat => ({
      category: cat,
      label: CATEGORY_LABELS[cat],
      items: visibleSuggestions.filter(s => s.category === cat),
    }))
    .filter(g => g.items.length > 0)

  return (
    <div className="flex-1 px-4 py-6 max-w-6xl mx-auto w-full space-y-6">
      <StatsBar open={open} approved={approved} rejected={rejected} />

      {visibleSuggestions.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-24 text-center space-y-3"
          role="status"
          aria-live="polite"
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
            style={{ background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.2)' }}
          >
            ✓
          </div>
          <p className="text-base font-semibold" style={{ color: '#4ADE80' }}>
            Alle Vorschläge bearbeitet
          </p>
          <p className="text-sm" style={{ color: '#8892B0' }}>
            NORA arbeitet bereits am nächsten Report.
          </p>
        </div>
      ) : (
        grouped.map(({ category, label, items }) => (
          <section key={category} aria-label={label}>
            <h2
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: '#8892B0' }}
            >
              {label}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {items.map(suggestion => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  isActed={actedIds.has(suggestion.id)}
                  onAction={handleAction}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
