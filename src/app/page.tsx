'use client'

import { useEffect } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

function HomeRedirect() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    supabase
      .from('group_members')
      .select('group_id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count, error }) => {
        if (!error && count && count > 0) {
          window.location.href = '/groups'
        } else {
          window.location.href = '/onboarding'
        }
      })
  }, [user])

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div
        className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"
        role="status"
        aria-label="Wird geladen…"
      />
    </div>
  )
}

export default function HomePage() {
  return (
    <AuthGuard>
      <HomeRedirect />
    </AuthGuard>
  )
}
