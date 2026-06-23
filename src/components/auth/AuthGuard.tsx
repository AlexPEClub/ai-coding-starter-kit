'use client'

import { useEffect, type ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth()

  useEffect(() => {
    if (loading) return

    if (!user) {
      window.location.href = '/login'
      return
    }

    if (profile?.status === 'pending') {
      window.location.href = '/signup/pending'
    }
  }, [user, profile, loading])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"
          role="status"
          aria-label="Wird geladen…"
        />
      </div>
    )
  }

  if (!user || profile?.status === 'pending') return null

  return <>{children}</>
}
