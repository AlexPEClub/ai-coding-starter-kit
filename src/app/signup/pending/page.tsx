'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { EmailPendingScreen } from '@/components/auth/EmailPendingScreen'

function PendingContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''
  return <EmailPendingScreen email={email} />
}

export default function SignupPendingPage() {
  return (
    <AuthLayout title="Fast geschafft!">
      <Suspense fallback={<EmailPendingScreen email="" />}>
        <PendingContent />
      </Suspense>
    </AuthLayout>
  )
}
