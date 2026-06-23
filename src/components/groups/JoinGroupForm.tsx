'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { useGroups } from '@/hooks/useGroups'
import { useRouter } from 'next/navigation'

interface JoinGroupFormProps {
  onSuccess?: (groupId: string) => void
}

export function JoinGroupForm({ onSuccess }: JoinGroupFormProps) {
  const router = useRouter()
  const { joinGroup } = useGroups()
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!code.trim()) {
      setError('Bitte gib einen Einladungs-Code ein')
      return
    }

    setError(null)
    setSubmitting(true)

    const { groupId, error: joinError } = await joinGroup(code)

    setSubmitting(false)

    if (joinError) {
      setError(joinError)
      return
    }

    if (groupId) {
      if (onSuccess) {
        onSuccess(groupId)
      } else {
        router.push(`/groups?group=${groupId}`)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label
          htmlFor="invite-code"
          className="text-[13px] font-semibold text-ink-2 uppercase tracking-[0.08em]"
        >
          Einladungs-Code
        </Label>
        <Input
          id="invite-code"
          placeholder="z. B. XJHF42"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/[OI01]/g, '').slice(0, 6))
            if (error) setError(null)
          }}
          maxLength={6}
          autoFocus
          autoComplete="off"
          spellCheck={false}
          className="h-11 text-[17px] font-bold tracking-[0.25em] text-center border-[1.5px] border-line
                     bg-surface rounded-md px-[14px] uppercase
                     focus-visible:ring-0 focus-visible:border-secondary focus-visible:shadow-[0_0_0_3px_var(--secondary-soft)]"
          aria-describedby={error ? 'invite-code-error' : undefined}
          aria-invalid={!!error}
        />
        {error && (
          <p id="invite-code-error" className="text-[13px] text-error" role="alert">
            {error}
          </p>
        )}
        <p className="text-[12px] text-ink-3 text-center">
          6-stelliger Code — z. B. von einem Gruppenmitglied teilen lassen
        </p>
      </div>

      <Button
        type="submit"
        disabled={submitting || code.length !== 6}
        className="w-full h-11 bg-secondary hover:bg-secondary-600 text-white font-semibold text-[15px]
                   rounded-md border border-secondary-600 tracking-[0.005em] disabled:opacity-40"
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Trete bei…
          </>
        ) : (
          'Gruppe beitreten'
        )}
      </Button>
    </form>
  )
}
