'use client'

import Link from 'next/link'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Passwort vergessen"
      subtitle="Gib deine E-Mail-Adresse ein. Wir senden dir einen Reset-Link."
      footer={
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Zurück zum Login
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthLayout>
  )
}
