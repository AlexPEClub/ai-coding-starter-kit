'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Rocket, CheckCircle2, XCircle, Clock } from 'lucide-react'
import type { Suggestion } from './suggestion-card'

type StatusFilter = 'all' | 'implemented' | 'approved' | 'rejected' | 'pending'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  implemented: {
    label: 'Umgesetzt',
    color: '#0E9594',
    icon: <Rocket className="w-3 h-3" aria-hidden="true" />,
  },
  approved: {
    label: 'Bestätigt',
    color: '#4ADE80',
    icon: <CheckCircle2 className="w-3 h-3" aria-hidden="true" />,
  },
  rejected: {
    label: 'Abgelehnt',
    color: '#4A5568',
    icon: <XCircle className="w-3 h-3" aria-hidden="true" />,
  },
  pending: {
    label: 'Offen',
    color: '#8892B0',
    icon: <Clock className="w-3 h-3" aria-hidden="true" />,
  },
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  marketing: { label: 'Marketing', color: '#38E5FF' },
  product: { label: 'Produkt', color: '#0078FF' },
  operations: { label: 'Operations', color: '#A720FF' },
  design: { label: 'Design & Brand', color: '#0E9594' },
  digital_product: { label: 'Produkt-Chance', color: '#7B81FF' },
}

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Alle' },
  { value: 'implemented', label: 'Umgesetzt' },
  { value: 'approved', label: 'Bestätigt' },
  { value: 'rejected', label: 'Abgelehnt' },
  { value: 'pending', label: 'Offen' },
]

type HistoryViewProps = {
  suggestions: Suggestion[]
  extraCounts?: { implemented: number; approved: number; rejected: number }
  onAction?: (id: string, status: 'approved' | 'rejected' | 'pending' | 'implemented') => Promise<void>
}

export function HistoryView({ suggestions, extraCounts, onAction }: HistoryViewProps) {
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all')

  const implemented = suggestions.filter(s => s.status === 'implemented').length + (extraCounts?.implemented ?? 0)
  const approved = suggestions.filter(s => s.status === 'approved').length + (extraCounts?.approved ?? 0)
  const rejected = suggestions.filter(s => s.status === 'rejected').length + (extraCounts?.rejected ?? 0)

  const filtered = suggestions
    .filter(s => activeFilter === 'all' || s.status === activeFilter)
    .slice(0, 50)

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div
        className="flex items-center gap-4 flex-wrap px-4 py-3 rounded-lg text-sm"
        style={{ background: '#0E1430', border: '1px solid #1C2340' }}
      >
        <span style={{ color: '#8892B0' }}>
          <span className="font-semibold" style={{ color: '#0E9594' }}>{implemented}</span>
          {' '}umgesetzt
        </span>
        <span style={{ color: '#1C2340' }}>·</span>
        <span style={{ color: '#8892B0' }}>
          <span className="font-semibold" style={{ color: '#4ADE80' }}>{approved}</span>
          {' '}bestätigt
        </span>
        <span style={{ color: '#1C2340' }}>·</span>
        <span style={{ color: '#8892B0' }}>
          <span className="font-semibold">{rejected}</span>
          {' '}abgelehnt
        </span>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Nach Status filtern">
        {FILTER_OPTIONS.map(option => (
          <button
            key={option.value}
            onClick={() => setActiveFilter(option.value)}
            className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
            style={
              activeFilter === option.value
                ? { background: '#0078FF', color: '#FFFFFF' }
                : { background: '#0E1430', color: '#8892B0', border: '1px solid #1C2340' }
            }
            aria-pressed={activeFilter === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 text-center space-y-2"
          role="status"
        >
          <p className="text-sm font-medium" style={{ color: '#4A5568' }}>
            Keine Einträge
          </p>
          <p className="text-xs" style={{ color: '#2D3748' }}>
            {activeFilter === 'all'
              ? 'Noch keine Vorschläge vorhanden — neue Generierung starten.'
              : `Noch keine Vorschläge mit Status „${FILTER_OPTIONS.find(f => f.value === activeFilter)?.label}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(suggestion => (
            <HistoryCard key={suggestion.id} suggestion={suggestion} onAction={onAction} />
          ))}
        </div>
      )}
    </div>
  )
}

function HistoryCard({
  suggestion,
  onAction,
}: {
  suggestion: Suggestion
  onAction?: (id: string, status: 'approved' | 'rejected' | 'pending' | 'implemented') => Promise<void>
}) {
  const [isLoading, setIsLoading] = useState(false)
  const status = STATUS_CONFIG[suggestion.status] ?? STATUS_CONFIG.pending
  const category = CATEGORY_CONFIG[suggestion.category] ?? { label: suggestion.category, color: '#8892B0' }

  async function handleImplement() {
    if (!onAction) return
    setIsLoading(true)
    try {
      await onAction(suggestion.id, 'implemented')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card style={{ background: '#0E1430', border: '1px solid #1C2340' }}>
      <CardContent className="px-4 py-3 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1">
            <p
              className="text-sm font-medium leading-snug truncate"
              style={{ color: suggestion.status === 'rejected' ? '#4A5568' : '#FFFFFF' }}
              title={suggestion.title}
            >
              {suggestion.title}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className="text-xs"
                style={{
                  color: category.color,
                  borderColor: category.color + '40',
                  background: category.color + '15',
                }}
              >
                {category.label}
              </Badge>
              <span className="text-xs" style={{ color: '#4A5568' }}>
                {new Date(suggestion.report_date + 'T12:00:00').toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit',
                })}
              </span>
            </div>
          </div>
          <div
            className="flex items-center gap-1 text-xs font-medium shrink-0"
            style={{ color: status.color }}
          >
            {status.icon}
            <span>{status.label}</span>
          </div>
        </div>

        {/* "Als umgesetzt markieren" nur für bestätigte Einträge */}
        {suggestion.status === 'approved' && onAction && (
          <Button
            onClick={handleImplement}
            disabled={isLoading}
            size="sm"
            variant="outline"
            className="w-full text-xs font-medium h-8 transition-all hover:opacity-90"
            style={{ borderColor: '#0E9594', color: '#0E9594', background: 'rgba(14,149,148,0.08)' }}
            aria-label={`Vorschlag als umgesetzt markieren: ${suggestion.title}`}
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block w-3 h-3 border-2 rounded-full animate-spin"
                  style={{ borderColor: 'rgba(14,149,148,0.3)', borderTopColor: '#0E9594' }}
                />
                Speichere…
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Rocket className="w-3.5 h-3.5" aria-hidden="true" />
                Als umgesetzt markieren
              </span>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
