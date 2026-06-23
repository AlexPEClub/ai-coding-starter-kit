'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import type { DateRange } from 'react-day-picker'
import {
  X, RefreshCw, CalendarDays, AlertTriangle, Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'
import { useGroupAvailability, type DayColor } from '@/hooks/useGroupAvailability'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DateFinderSheetProps {
  open: boolean
  activityId: string
  activityName: string
  groupId: string
  /** 'schedule' → sets status to in_planung; 'adjust' → only updates dates */
  mode: 'schedule' | 'adjust'
  initialDateRange?: { from: Date; to: Date }
  onClose: () => void
  onSuccess?: () => void
}

// ─── Day colour legend ────────────────────────────────────────────────────────

const COLOR_CLASS: Record<DayColor, string> = {
  green: 'bg-green-100 dark:bg-green-900/30',
  yellow: 'bg-amber-100 dark:bg-amber-900/30',
  red: 'bg-red-100 dark:bg-red-900/20',
  grey: 'bg-gray-50 dark:bg-gray-800/30',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(date: Date | null): string {
  if (!date) return ''
  const mins = Math.round((Date.now() - date.getTime()) / 60000)
  if (mins < 1) return 'gerade eben'
  if (mins === 1) return 'vor 1 Min.'
  if (mins < 60) return `vor ${mins} Min.`
  const hrs = Math.floor(mins / 60)
  return hrs === 1 ? 'vor 1 Std.' : `vor ${hrs} Std.`
}

function formatDateRange(from: Date, to: Date): string {
  const sameDay = from.toDateString() === to.toDateString()
  if (sameDay) return format(from, 'dd. MMMM yyyy', { locale: de })
  return `${format(from, 'dd. MMMM yyyy', { locale: de })} – ${format(to, 'dd. MMMM yyyy', { locale: de })}`
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DateFinderSheet({
  open,
  activityId,
  activityName,
  groupId,
  mode,
  initialDateRange,
  onClose,
  onSuccess,
}: DateFinderSheetProps) {
  const [saving, setSaving] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    initialDateRange ? { from: initialDateRange.from, to: initialDateRange.to } : undefined
  )

  // Reset range when sheet opens / initialDateRange changes
  useEffect(() => {
    if (open) {
      setDateRange(
        initialDateRange ? { from: initialDateRange.from, to: initialDateRange.to } : undefined
      )
    }
  }, [open, initialDateRange])

  const {
    loading: availLoading,
    error: availError,
    members,
    cachedAt,
    membersWithoutCalendar,
    totalMembers,
    getDayColor,
    refresh,
  } = useGroupAvailability(groupId, open)

  // Build modifier arrays — recalculated only when colorMap changes (memoized in hook)
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const twelveMonthsOut = useMemo(() => {
    const d = new Date(today)
    d.setFullYear(d.getFullYear() + 1)
    return d
  }, [today])

  // Build a DayColor → function modifier for react-day-picker
  const modifiers = useMemo(() => {
    if (availLoading || availError || members.length === 0) return {}
    return {
      avail_green: (date: Date) => getDayColor(date) === 'green',
      avail_yellow: (date: Date) => getDayColor(date) === 'yellow',
      avail_red: (date: Date) => getDayColor(date) === 'red',
      avail_grey: (date: Date) => getDayColor(date) === 'grey',
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availLoading, availError, members, getDayColor])

  // ── Range selection ────────────────────────────────────────────────────────

  function handleRangeSelect(range: DateRange | undefined) {
    if (!range) { setDateRange(undefined); return }
    // Auto-swap if user taps end before start
    if (range.from && range.to && range.from > range.to) {
      setDateRange({ from: range.to, to: range.from })
    } else {
      setDateRange(range)
    }
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleConfirm = useCallback(async () => {
    if (!dateRange?.from) return
    setSaving(true)

    const startDate = format(dateRange.from, 'yyyy-MM-dd')
    const endDate = format(dateRange.to ?? dateRange.from, 'yyyy-MM-dd')

    const update: Record<string, string> =
      mode === 'schedule'
        ? { status: 'in_planung', start_date: startDate, end_date: endDate }
        : { start_date: startDate, end_date: endDate }

    const { error } = await supabase
      .from('activities')
      .update(update)
      .eq('id', activityId)

    setSaving(false)
    if (error) {
      toast.error('Termin konnte nicht gespeichert werden. Bitte erneut versuchen.')
    } else {
      toast.success(mode === 'schedule' ? 'Aktivität in Planung verschoben' : 'Termin aktualisiert')
      onSuccess?.()
      onClose()
    }
  }, [activityId, dateRange, mode, onClose, onSuccess])

  // ── Render ─────────────────────────────────────────────────────────────────

  const canConfirm = !!dateRange?.from && !saving

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent
        side="bottom"
        className="h-[96dvh] bg-bg border-t border-line p-0 flex flex-col rounded-t-[20px] [&>button]:hidden"
      >
        {/* ── Header ── */}
        <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-line flex items-center gap-3">
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-[8px] flex items-center justify-center text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
            aria-label="Schließen"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[17px] font-[800] text-ink">
              {mode === 'schedule' ? 'Termin finden' : 'Termin anpassen'}
            </p>
            <p className="text-[12px] text-ink-3 truncate">{activityName}</p>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">

          {/* Missing calendar banner */}
          {!availLoading && !availError && totalMembers > 0 && membersWithoutCalendar > 0 && (
            <div className="mx-4 mt-4 flex items-start gap-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-[12px] px-3.5 py-2.5">
              <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-[12.5px] text-amber-800 dark:text-amber-200 leading-snug">
                {membersWithoutCalendar === 1
                  ? `1 von ${totalMembers} Mitgliedern`
                  : `${membersWithoutCalendar} von ${totalMembers} Mitgliedern`}{' '}
                ohne Kalender — deren Verfügbarkeit ist unbekannt.
              </p>
            </div>
          )}

          {/* Cache refresh bar */}
          {!availLoading && !availError && cachedAt && (
            <div className="mx-4 mt-3 flex items-center gap-2 text-[12px] text-ink-3">
              <span>Zuletzt aktualisiert: {formatRelativeTime(cachedAt)}</span>
              <button
                onClick={refresh}
                className="flex items-center gap-1 text-secondary hover:text-secondary/80 transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                Aktualisieren
              </button>
            </div>
          )}

          {/* Error state */}
          {availError && (
            <div className="mx-4 mt-6 flex flex-col items-center gap-3 bg-surface border border-line rounded-[14px] p-5 text-center">
              <AlertTriangle className="h-6 w-6 text-ink-3" />
              <p className="text-[14px] text-ink-2">{availError}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                className="border-line text-ink-2 rounded-[10px]"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Erneut versuchen
              </Button>
            </div>
          )}

          {/* Loading skeleton */}
          {availLoading && (
            <div className="px-4 mt-4 space-y-3">
              <Skeleton className="h-5 w-36 rounded bg-surface" />
              <Skeleton className="h-[260px] w-full rounded-[14px] bg-surface" />
              <Skeleton className="h-[260px] w-full rounded-[14px] bg-surface" />
            </div>
          )}

          {/* Legend */}
          {!availLoading && (
            <div className="px-4 mt-4 mb-2 flex flex-wrap gap-3">
              <LegendDot color="green" label="Alle frei" />
              <LegendDot color="yellow" label="Mehrheit frei" />
              <LegendDot color="red" label="Mehrheit belegt" />
              <LegendDot color="grey" label="Unbekannt" />
            </div>
          )}

          {/* Calendar */}
          {!availLoading && (
            <div className="px-2 pb-4">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={handleRangeSelect}
                numberOfMonths={12}
                startMonth={today}
                endMonth={twelveMonthsOut}
                disabled={{ before: today }}
                locale={de}
                modifiers={modifiers}
                modifiersClassNames={{
                  avail_green: COLOR_CLASS.green,
                  avail_yellow: COLOR_CLASS.yellow,
                  avail_red: COLOR_CLASS.red,
                  avail_grey: COLOR_CLASS.grey,
                }}
                classNames={{
                  months: 'flex flex-col gap-6',
                }}
                components={{
                  Nav: () => <></>,
                }}
              />
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex-shrink-0 border-t border-line bg-bg px-4 pt-3 pb-5">
          {/* Selected range preview */}
          {dateRange?.from && (
            <div className="flex items-center gap-2 mb-3 bg-secondary-soft rounded-[10px] px-3 py-2">
              <CalendarDays className="h-4 w-4 text-secondary flex-shrink-0" />
              <p className="text-[13px] font-[700] text-secondary truncate">
                {formatDateRange(dateRange.from, dateRange.to ?? dateRange.from)}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="flex-1 border-line text-ink-2 rounded-[12px] hover:bg-surface-2"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="flex-1 bg-primary hover:bg-primary-600 text-white font-[700] rounded-[12px] border border-primary-600"
            >
              {saving
                ? 'Wird gespeichert…'
                : mode === 'schedule'
                  ? 'Termin bestätigen'
                  : 'Termin speichern'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Legend dot ───────────────────────────────────────────────────────────────

function LegendDot({ color, label }: { color: DayColor; label: string }) {
  const dotClass: Record<DayColor, string> = {
    green: 'bg-green-400',
    yellow: 'bg-amber-400',
    red: 'bg-red-400',
    grey: 'bg-gray-300',
  }
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotClass[color]}`} />
      <span className="text-[11.5px] text-ink-3">{label}</span>
    </div>
  )
}
