'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle } from 'lucide-react'

type PageState = 'loading' | 'error'
type ErrorKind = 'expired' | 'used' | 'generic'

const ERROR_MESSAGES: Record<ErrorKind, { title: string; body: string }> = {
  expired: {
    title: 'Link abgelaufen',
    body: 'Dieser Bestätigungs-Link ist nicht mehr gültig (24 Stunden überschritten). Fordere einen neuen Link an.',
  },
  used: {
    title: 'Account bereits bestätigt',
    body: 'Dein Account wurde bereits aktiviert. Du kannst dich jetzt einloggen.',
  },
  generic: {
    title: 'Bestätigung fehlgeschlagen',
    body: 'Der Link ist ungültig oder ein Fehler ist aufgetreten. Bitte fordere einen neuen Bestätigungs-Link an.',
  },
}

function parseUrlError(): ErrorKind | null {
  // Supabase sends errors in the hash fragment for PKCE flow
  const hash = typeof window !== 'undefined' ? window.location.hash.substring(1) : ''
  const search = typeof window !== 'undefined' ? window.location.search.substring(1) : ''
  const hashParams = new URLSearchParams(hash)
  const searchParams = new URLSearchParams(search)

  const error = hashParams.get('error') ?? searchParams.get('error')
  const errorCode = hashParams.get('error_code') ?? searchParams.get('error_code')

  if (!error) return null

  if (errorCode === 'otp_expired') return 'expired'
  if (error === 'access_denied') return 'used'
  return 'generic'
}

export default function AuthCallbackPage() {
  const [state, setState] = useState<PageState>('loading')
  const [errorKind, setErrorKind] = useState<ErrorKind>('generic')

  useEffect(() => {
    // Check for Supabase error parameters in URL (expired / already-used links)
    const urlError = parseUrlError()
    if (urlError) {
      setErrorKind(urlError)
      setState('error')
      return
    }

    // Capture the link type BEFORE supabase-js processes and clears the URL,
    // so a recovery link is still routed correctly even via the getSession path.
    const isRecovery =
      (new URLSearchParams(window.location.hash.substring(1)).get('type') ??
        new URLSearchParams(window.location.search.substring(1)).get('type')) === 'recovery'

    let done = false

    function finishSignIn() {
      if (done) return
      done = true
      // The profile row and its status are managed entirely server-side:
      // handle_new_user creates it ('pending'), and the on_auth_user_confirmed
      // trigger flips it to 'active' the moment the email is confirmed — which
      // has already happened by the time this callback runs. So we just redirect.
      window.location.href = '/'
    }

    // Timeout: if no session can be resolved within 10 seconds, the link is invalid
    const timeout = setTimeout(() => {
      if (done) return
      done = true
      setErrorKind('generic')
      setState('error')
    }, 10_000)

    // Listen for auth events (covers slow URL detection / recovery)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        if (done) return
        done = true
        clearTimeout(timeout)
        window.location.href = '/reset-password'
        return
      }
      if (event === 'SIGNED_IN' && session && !isRecovery) {
        clearTimeout(timeout)
        finishSignIn()
      }
    })

    // Proactively resolve a session. detectSessionInUrl often establishes the
    // session before this listener attaches, so the SIGNED_IN event is missed
    // and the page would otherwise time out despite a successful confirmation.
    ;(async () => {
      // PKCE links arrive with ?code=…; exchange it if present and not yet done.
      const code = new URLSearchParams(window.location.search.substring(1)).get('code')
      if (code) {
        try {
          await supabase.auth.exchangeCodeForSession(code)
        } catch {
          // Fall through to getSession / event / timeout handling.
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session || done) return
      clearTimeout(timeout)

      if (isRecovery) {
        done = true
        window.location.href = '/reset-password'
        return
      }
      finishSignIn()
    })()

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  if (state === 'error') {
    const msg = ERROR_MESSAGES[errorKind]
    const isUsed = errorKind === 'used'

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center space-y-6">
          {isUsed ? (
            <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
          ) : (
            <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          )}
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-foreground">{msg.title}</h1>
            <p className="text-sm text-muted-foreground">{msg.body}</p>
          </div>
          <div className="flex flex-col gap-3">
            {!isUsed && (
              <Button asChild>
                <a href="/signup/pending">Neuen Link anfordern</a>
              </Button>
            )}
            <Button variant={isUsed ? 'default' : 'outline'} asChild>
              <a href="/login">Zum Login</a>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div
        className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"
        role="status"
        aria-label="Wird verarbeitet…"
      />
    </div>
  )
}
