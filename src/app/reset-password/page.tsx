'use client'

import { AuthLayout } from '@/components/auth/AuthLayout'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Neues Passwort"
      subtitle="Wähle ein neues Passwort für deinen Account."
    >
      <ResetPasswordForm />
    </AuthLayout>
  )
}
