'use client'

import { AuthGuard } from '@/components/auth/AuthGuard'
import { OnboardingScreen } from '@/components/groups/OnboardingScreen'
import { useRouter } from 'next/navigation'

function OnboardingContent() {
  const router = useRouter()

  function handleGroupReady(groupId: string) {
    router.push(`/groups?group=${groupId}`)
  }

  return <OnboardingScreen onSuccess={handleGroupReady} />
}

export default function OnboardingPage() {
  return (
    <AuthGuard>
      <OnboardingContent />
    </AuthGuard>
  )
}
