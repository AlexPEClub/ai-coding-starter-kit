'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useCalendarConnection } from '@/hooks/useCalendarConnection'
import { Calendar, TriangleAlert, CheckCircle2 } from 'lucide-react'

export function CalendarConnectionSection() {
  const { connection, loading, connecting, disconnecting, isExpired, connectGoogleCalendar, disconnectCalendar } = useCalendarConnection()
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false)

  async function handleConnect() {
    const { error } = await connectGoogleCalendar()
    if (error) toast.error(`Verbindung fehlgeschlagen: ${error}`)
  }

  async function handleDisconnect() {
    const ok = await disconnectCalendar()
    setDisconnectDialogOpen(false)
    if (!ok) toast.error('Trennen fehlgeschlagen – bitte erneut versuchen')
    else toast.success('Google Kalender getrennt')
  }

  return (
    <div className="space-y-3">
      <h3 className="text-[12px] font-[800] text-ink-2 uppercase tracking-[0.06em]">
        Kalender-Verbindung
      </h3>

      {loading ? (
        <Skeleton className="h-10 w-full rounded-[10px] bg-surface" />
      ) : connection ? (
        <div className="space-y-2">
          {isExpired ? (
            <div className="flex items-start gap-3 bg-accent-soft border border-accent/30 rounded-[12px] px-3.5 py-3">
              <TriangleAlert className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-[700] text-ink">Kalender-Verbindung abgelaufen</p>
                <p className="text-[12px] text-ink-2 mt-0.5">Erneut verbinden, damit deine Verfügbarkeit berücksichtigt wird.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-surface border border-line rounded-[12px] px-3.5 py-3">
              <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-[600] text-ink">Verbunden</p>
                <p className="text-[12px] text-ink-3 truncate">{connection.google_email}</p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {isExpired && (
              <Button
                size="sm"
                onClick={handleConnect}
                disabled={connecting}
                className="flex-1 bg-primary hover:bg-primary-600 text-white text-[12.5px]"
              >
                {connecting ? 'Verbinden…' : 'Erneut verbinden'}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDisconnectDialogOpen(true)}
              disabled={disconnecting}
              className="flex-1 border-line text-error hover:text-error hover:bg-error-soft text-[12.5px]"
            >
              {disconnecting ? 'Trennen…' : 'Kalender trennen'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[13px] text-ink-3">
            Verbinde deinen Google Kalender, damit die Terminfindung deine Verfügbarkeit automatisch berücksichtigt.
          </p>
          <Button
            size="sm"
            onClick={handleConnect}
            disabled={connecting}
            className="flex items-center gap-2 bg-secondary hover:bg-secondary-600 text-white text-[13px] rounded-[10px]"
          >
            <Calendar className="h-4 w-4" />
            {connecting ? 'Verbinden…' : 'Google Kalender verbinden'}
          </Button>
        </div>
      )}

      <AlertDialog open={disconnectDialogOpen} onOpenChange={setDisconnectDialogOpen}>
        <AlertDialogContent className="bg-surface border-line rounded-[18px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-ink">Google Kalender trennen?</AlertDialogTitle>
            <AlertDialogDescription className="text-ink-3">
              Deine manuellen Blockierungen bleiben erhalten. Dein Google Kalender wird nicht mehr für die Terminfindung berücksichtigt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-line text-ink-2">Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              className="bg-error hover:bg-error text-white"
            >
              Trennen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
