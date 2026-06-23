'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { SignupForm } from '@/components/auth/SignupForm'

export default function SignupPage() {
  const { user, profile, loading } = useAuth()

  useEffect(() => {
    if (loading || !user) return
    window.location.href = profile?.status === 'pending' ? '/signup/pending' : '/'
  }, [user, profile, loading])

  if (loading || user) return null

  return (
    <AuthLayout
      title="Konto erstellen"
      subtitle="Werde Teil von ZUSAMMEN."
    >
      <SignupForm />
    </AuthLayout>
  )
}
