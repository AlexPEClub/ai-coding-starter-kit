'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) {
      window.location.href = '/'
    }
  }, [user, loading])

  if (loading || user) return null

  return (
    <AuthLayout
      title="Willkommen zurück"
      subtitle="Logge dich mit deiner E-Mail-Adresse ein."
      footer={
        <>
          Noch kein Konto?{' '}
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            Registrieren
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthLayout>
  )
}
