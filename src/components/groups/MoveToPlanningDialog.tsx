'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface MoveToPlanningDialogProps {
  open: boolean
  activityName: string
  loading: boolean
  onCancel: () => void
  onConfirm: (startDate: string, endDate: string) => void
}

export function MoveToPlanningDialog({
  open,
  activityName,
  loading,
  onCancel,
  onConfirm,
}: MoveToPlanningDialogProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [validationError, setValidationError] = useState<string | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)

  function handleConfirm() {
    setValidationError(null)

    if (!dateRange?.from || !dateRange?.to) {
      setValidationError('Bitte wähle Start- und Enddatum aus.')
      return
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (dateRange.from < today) {
      setValidationError('Das Startdatum darf nicht in der Vergangenheit liegen.')
      return
    }

    if (dateRange.from > dateRange.to) {
      setValidationError('Das Startdatum muss vor dem Enddatum liegen.')
      return
    }

    onConfirm(
      format(dateRange.from, 'yyyy-MM-dd'),
      format(dateRange.to, 'yyyy-MM-dd')
    )
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setDateRange(undefined)
      setValidationError(null)
    }
    onCancel()
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-surface border-line rounded-[18px] sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle className="text-[17px] font-[800] text-ink text-left">
            In Planung verschieben
          </DialogTitle>
        </DialogHeader>

        <p className="text-[13px] text-ink-2 leading-snug -mt-1">
          Wähle einen Zeitraum für{' '}
          <span className="font-[700] text-ink">„{activityName}"</span>.
        </p>

        {/* Date Range Picker */}
        <div className="flex flex-col gap-1.5">
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  'w-full flex items-center gap-2 px-3.5 py-2.5 rounded-[12px]',
                  'border-[1.5px] border-line bg-bg text-left text-[13.5px] text-ink',
                  'hover:border-primary/40 transition-colors',
                  !dateRange?.from && 'text-ink-3'
                )}
              >
                <CalendarIcon className="h-4 w-4 flex-shrink-0 text-ink-3" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'dd. MMM yyyy', { locale: de })}
                      {' – '}
                      {format(dateRange.to, 'dd. MMM yyyy', { locale: de })}
                    </>
                  ) : (
                    format(dateRange.from, 'dd. MMM yyyy', { locale: de })
                  )
                ) : (
                  'Zeitraum auswählen'
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-surface border-line rounded-[14px]" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => {
                  setDateRange(range)
                  setValidationError(null)
                  if (range?.from && range?.to) setCalendarOpen(false)
                }}
                disabled={(date) => date < today}
                numberOfMonths={1}
                locale={de}
              />
            </PopoverContent>
          </Popover>

          {validationError && (
            <p className="text-[12.5px] text-error">{validationError}</p>
          )}
        </div>

        <DialogFooter className="flex gap-2 flex-row justify-end mt-1">
          <Button
            variant="outline"
            onClick={() => {
              setDateRange(undefined)
              setValidationError(null)
              onCancel()
            }}
            disabled={loading}
            className="border-line text-ink-2 rounded-[12px] hover:bg-surface-2"
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || !dateRange?.from || !dateRange?.to}
            className="bg-primary hover:bg-primary-600 text-white font-[700] rounded-[12px] border border-primary-600"
          >
            {loading ? 'Wird gespeichert…' : 'In Planung verschieben'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
