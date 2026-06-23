'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type State = 'loading' | 'error' | 'success'

export default function GoogleCalendarCallbackPage() {
  const [state, setState] = useState<State>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    async function handleCallback() {
      const searchParams = new URLSearchParams(window.location.search)
      const code = searchParams.get('code')
      const stateParam = searchParams.get('state')
      const error = searchParams.get('error')

      if (error) {
        setErrorMessage('Google Kalender konnte nicht verbunden werden. Bitte versuche es erneut.')
        setState('error')
        return
      }

      if (!code) {
        setErrorMessage('Ungültiger OAuth-Rückruf.')
        setState('error')
        return
      }

      try {
        const redirectUrl = `${window.location.origin}/auth/google-calendar/callback`
        const { error: fnError } = await supabase.functions.invoke('google-calendar-oauth/exchange', {
          body: { code, state: stateParam, redirect_url: redirectUrl },
        })

        if (fnError) {
          setErrorMessage('Verbindung konnte nicht hergestellt werden. Bitte versuche es erneut.')
          setState('error')
          return
        }

        window.location.href = '/groups?calendarConnected=true'
      } catch {
        setErrorMessage('Ein unbekannter Fehler ist aufgetreten.')
        setState('error')
      }
    }

    handleCallback()
  }, [])

  if (state === 'error') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-5">
          <p className="text-[17px] font-[800] text-ink">Verbindung fehlgeschlagen</p>
          <p className="text-[14px] text-ink-2">{errorMessage}</p>
          <a
            href="/groups"
            className="inline-block px-5 py-2.5 bg-primary text-white text-[14px] font-[700] rounded-[12px] hover:bg-primary-600 transition-colors"
          >
            Zurück zur App
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-center space-y-3">
        <div
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"
          role="status"
          aria-label="Google Kalender wird verbunden…"
        />
        <p className="text-[13px] text-ink-3">Google Kalender wird verbunden…</p>
      </div>
    </div>
  )
}
