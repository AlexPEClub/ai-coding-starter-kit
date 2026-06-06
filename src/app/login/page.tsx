'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setError('E-Mail oder Passwort ungültig.')
        return
      }

      if (data.session) {
        window.location.href = '/dashboard'
      }
    } catch {
      setError('Verbindungsfehler. Bitte versuche es erneut.')
    } finally {
      setLoading(false)
    }
  }

  const isDisabled = !email || !password || loading

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#070B1E', fontFamily: 'var(--font-sora), sans-serif' }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        aria-hidden
      >
        <div
          className="w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, #0078FF15, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 w-full max-w-[420px]">
        <div
          className="rounded-2xl border p-10"
          style={{ background: '#0E1430', borderColor: '#1C2340' }}
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div
              className="text-2xl font-extrabold tracking-[5px] uppercase mb-1"
              style={{
                background: 'linear-gradient(90deg, #38E5FF, #0078FF, #7B81FF, #A720FF)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              NEXORA AI
            </div>
            <div className="text-[10px] tracking-[3px] uppercase" style={{ color: '#7B81FF' }}>
              Intelligence · Compliance · Impact
            </div>
          </div>

          {/* NORA badge */}
          <div className="flex justify-center mb-6">
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full border text-xs"
              style={{ background: '#0078FF18', borderColor: '#0078FF44', color: '#38E5FF' }}
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: '#00C875', boxShadow: '0 0 6px #00C875' }}
              />
              NORA ist bereit
            </div>
          </div>

          <p className="text-center text-sm mb-8" style={{ color: '#8892B0' }}>
            Melde dich an, um deine täglichen BizDev-Vorschläge zu sehen.
          </p>

          {error && (
            <Alert
              className="mb-4 border"
              style={{ background: '#FF3D7118', borderColor: '#FF3D7144', color: '#FF8FA3' }}
            >
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-[11px] tracking-widest uppercase"
                style={{ color: '#3D4A6B' }}
              >
                E-Mail
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="stefan@nexora.ai"
                required
                autoComplete="email"
                className="border text-white placeholder:text-[#3D4A6B] focus-visible:ring-1 focus-visible:ring-[#0078FF] focus-visible:ring-offset-0"
                style={{ background: '#070B1E', borderColor: '#1C2340' }}
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-[11px] tracking-widest uppercase"
                style={{ color: '#3D4A6B' }}
              >
                Passwort
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="border text-white placeholder:text-[#3D4A6B] focus-visible:ring-1 focus-visible:ring-[#0078FF] focus-visible:ring-offset-0"
                style={{ background: '#070B1E', borderColor: '#1C2340' }}
              />
            </div>

            <Button
              type="submit"
              disabled={isDisabled}
              className="w-full mt-2 font-bold tracking-wider border-0 transition-opacity hover:opacity-90"
              style={{
                background: isDisabled
                  ? '#1C2340'
                  : 'linear-gradient(135deg, #38E5FF, #0078FF, #7B81FF, #A720FF)',
                color: isDisabled ? '#3D4A6B' : '#fff',
              }}
            >
              {loading ? 'Anmelden…' : 'Anmelden'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
