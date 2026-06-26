'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'

export function GenerateButton() {
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    try {
      const res = await fetch('/api/generate-suggestions', { method: 'POST' })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const detail = data?.detail ?? data?.error ?? 'Generierung fehlgeschlagen.'
        toast.error(detail)
        return
      }

      if (data?.skipped) {
        toast.info('Für heute liegen bereits Vorschläge vor.')
        return
      }

      const count = typeof data?.count === 'number' ? data.count : null
      toast.success(
        count !== null
          ? `${count} neue Vorschläge generiert.`
          : 'Neue Vorschläge generiert.'
      )
      // Dashboard neu laden, damit die frischen Vorschläge erscheinen
      window.location.reload()
    } catch {
      toast.error('Netzwerkfehler. Bitte prüfe deine Verbindung.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleGenerate}
      disabled={loading}
      className="text-white hover:opacity-90 transition-opacity"
      style={{ background: '#0078FF', border: 'none' }}
      aria-label="Neue Vorschläge generieren"
    >
      {loading ? (
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-3.5 h-3.5 border-2 rounded-full animate-spin"
            style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }}
          />
          <span className="hidden sm:inline">Generiere…</span>
        </span>
      ) : (
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">Jetzt generieren</span>
        </span>
      )}
    </Button>
  )
}
