'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react'

export type Suggestion = {
  id: string
  title: string
  body: string
  insight: string | null
  source: string | null
  category: 'marketing' | 'product' | 'operations' | 'digital_product'
  status: 'pending' | 'approved' | 'rejected' | 'implemented'
  report_date: string
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  marketing: { label: 'Marketing', color: '#38E5FF' },
  product: { label: 'Produkt', color: '#0078FF' },
  operations: { label: 'Operations', color: '#A720FF' },
  digital_product: { label: 'Produkt-Chance', color: '#7B81FF' },
}

type SuggestionCardProps = {
  suggestion: Suggestion
  onAction: (id: string, status: 'approved' | 'rejected' | 'pending' | 'implemented') => Promise<void>
}

export function SuggestionCard({ suggestion, onAction }: SuggestionCardProps) {
  const [isLoading, setIsLoading] = useState<'approve' | 'reject' | null>(null)
  const [isBodyExpanded, setIsBodyExpanded] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const category = CATEGORY_CONFIG[suggestion.category] ?? { label: suggestion.category, color: '#8892B0' }
  const today = new Date().toISOString().split('T')[0]
  const showDate = suggestion.report_date !== today
  const hasDetails = suggestion.insight || suggestion.source

  async function handleAction(action: 'approve' | 'reject') {
    const newStatus = action === 'approve' ? 'approved' : 'rejected'
    setIsLoading(action)
    try {
      await onAction(suggestion.id, newStatus)
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <Card
      className="relative overflow-hidden"
      style={{ background: '#0E1430', border: '1px solid #1C2340' }}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header row: category badge + date */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className="text-xs font-medium"
            style={{
              color: category.color,
              borderColor: category.color + '40',
              background: category.color + '15',
            }}
          >
            {category.label}
          </Badge>
          {showDate && (
            <span className="text-xs" style={{ color: '#8892B0' }}>
              {new Date(suggestion.report_date + 'T12:00:00').toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
              })}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-sm leading-snug" style={{ color: '#FFFFFF' }}>
          {suggestion.title}
        </h3>

        {/* Body */}
        <div>
          <p
            className={`text-sm leading-relaxed whitespace-pre-line ${!isBodyExpanded ? 'line-clamp-3' : ''}`}
            style={{ color: '#8892B0' }}
          >
            {suggestion.body}
          </p>
          {suggestion.body.length > 200 && (
            <button
              onClick={() => setIsBodyExpanded(!isBodyExpanded)}
              className="text-xs mt-1 hover:opacity-80"
              style={{ color: '#0078FF' }}
            >
              {isBodyExpanded ? 'weniger anzeigen' : 'mehr anzeigen'}
            </button>
          )}
        </div>

        {/* Collapsible details (insight + source) */}
        {hasDetails && (
          <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <CollapsibleTrigger asChild>
              <button
                className="flex items-center gap-1 text-xs hover:opacity-80"
                style={{ color: '#0078FF' }}
                aria-label={isDetailsOpen ? 'Details ausblenden' : 'Details anzeigen'}
              >
                {isDetailsOpen ? (
                  <ChevronUp className="w-3 h-3" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-3 h-3" aria-hidden="true" />
                )}
                Details
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 space-y-1.5 text-xs rounded-md p-2.5" style={{ background: '#070B1E' }}>
                {suggestion.insight && (
                  <p style={{ color: '#8892B0' }}>
                    <span className="font-medium" style={{ color: '#FFFFFF' }}>Insight: </span>
                    {suggestion.insight}
                  </p>
                )}
                {suggestion.source && (
                  <p style={{ color: '#8892B0' }}>
                    <span className="font-medium" style={{ color: '#FFFFFF' }}>Quelle: </span>
                    {suggestion.source}
                  </p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Bestätigen / Ablehnen */}
        <div className="flex gap-2 pt-1">
          <Button
            onClick={() => handleAction('approve')}
            disabled={isLoading !== null}
            size="sm"
            className="flex-1 text-xs font-medium h-9 transition-all hover:opacity-90"
            style={{ background: '#0078FF', color: '#FFFFFF', border: 'none' }}
            aria-label={`Vorschlag bestätigen: ${suggestion.title}`}
          >
            {isLoading === 'approve' ? (
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block w-3 h-3 border-2 rounded-full animate-spin"
                  style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }}
                />
                Speichere…
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                Bestätigen
              </span>
            )}
          </Button>
          <Button
            onClick={() => handleAction('reject')}
            disabled={isLoading !== null}
            size="sm"
            variant="outline"
            className="flex-1 text-xs font-medium h-9 transition-all hover:opacity-80"
            style={{ background: 'transparent', borderColor: '#1C2340', color: '#8892B0' }}
            aria-label={`Vorschlag ablehnen: ${suggestion.title}`}
          >
            {isLoading === 'reject' ? (
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block w-3 h-3 border-2 rounded-full animate-spin"
                  style={{ borderColor: 'rgba(255,255,255,0.15)', borderTopColor: 'rgba(255,255,255,0.6)' }}
                />
                Speichere…
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                Ablehnen
              </span>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
