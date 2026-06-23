'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

type EmailPendingScreenProps = {
  email: string
}

export function EmailPendingScreen({ email }: EmailPendingScreenProps) {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleResend() {
    setLoading(true)
    await supabase.auth.resend({ type: 'signup', email })
    setLoading(false)
    setSent(true)
    setTimeout(() => setSent(false), 6000)
  }

  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="w-8 h-8 text-primary" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-bold text-foreground">Bestätigungs-Mail gesendet</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Wir haben eine Mail an{' '}
          <span className="font-semibold text-foreground">{email || 'deine E-Mail-Adresse'}</span>{' '}
          gesendet. Klicke den Link darin, um deinen Account zu aktivieren.
        </p>
      </div>

      <div className="space-y-3">
        {sent ? (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
            <CheckCircle className="w-4 h-4 text-success" />
            Mail wurde erneut gesendet
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={handleResend}
            disabled={loading}
          >
            {loading ? 'Wird gesendet…' : 'Mail erneut senden'}
          </Button>
        )}

        <Link
          href="/signup"
          className="block text-sm text-center text-muted-foreground hover:text-foreground transition-colors"
        >
          Andere E-Mail-Adresse verwenden
        </Link>
      </div>
    </div>
  )
}
