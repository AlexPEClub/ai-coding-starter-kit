'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Copy, Check, RefreshCw, Loader2 } from 'lucide-react'

interface InviteCodeCardProps {
  code: string | null
  isAdmin: boolean
  onRegenerate: () => Promise<{ code: string | null; error: string | null }>
}

export function InviteCodeCard({ code, isAdmin, onRegenerate }: InviteCodeCardProps) {
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCopy() {
    if (!code) return
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleRegenerate() {
    setRegenerating(true)
    setError(null)
    const { error: err } = await onRegenerate()
    setRegenerating(false)
    if (err) setError(err)
  }

  return (
    <div className="bg-surface-2 border border-line rounded-[14px] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-[800] uppercase tracking-[0.1em] text-ink-3">
          Einladungs-Code
        </span>
        {isAdmin && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[12px] text-ink-2 hover:text-primary gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Neu generieren
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-[18px] bg-surface border-line max-w-sm">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-[18px] font-[800] text-ink">
                  Code neu generieren?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-[14px] text-ink-2">
                  Der alte Code wird sofort ungültig. Mitglieder, die diesen Code noch nicht
                  verwendet haben, können damit nicht mehr beitreten.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-md border-line text-ink-2">
                  Abbrechen
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRegenerate}
                  className="rounded-md bg-primary hover:bg-primary-600 text-white border-primary-600"
                >
                  {regenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Neu generieren'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="flex-1 text-[26px] font-[900] tracking-[0.25em] text-ink font-mono">
          {code ?? '——————'}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          disabled={!code}
          className={`h-10 w-10 rounded-md transition-colors ${
            copied
              ? 'bg-success-soft text-success'
              : 'bg-surface hover:bg-primary-soft hover:text-primary text-ink-2'
          }`}
          aria-label="Code kopieren"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>

      {error && <p className="text-[12px] text-error">{error}</p>}

      <p className="text-[12px] text-ink-3">
        Teile diesen Code mit Freunden, damit sie der Gruppe beitreten können.
      </p>
    </div>
  )
}
