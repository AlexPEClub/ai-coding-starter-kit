'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useGroups } from '@/hooks/useGroups'
import { useAuth } from '@/contexts/AuthContext'
import { GroupCard } from '@/components/groups/GroupCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { OnboardingScreen } from '@/components/groups/OnboardingScreen'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ProfileSheet } from '@/components/profile/ProfileSheet'
import { Plus } from 'lucide-react'

function GroupsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { profile } = useAuth()
  const { groups, loading, error } = useGroups()

  const [addSheetOpen, setAddSheetOpen] = useState(false)
  const [profileSheetOpen, setProfileSheetOpen] = useState(false)

  // Open group from query param (e.g., after creation/join) → navigate to its page
  useEffect(() => {
    const groupParam = searchParams.get('group')
    if (groupParam) {
      router.replace(`/groups/${groupParam}/vorschlaege`)
    }
  }, [searchParams, router])

  // Show toast after successful Google Calendar OAuth
  useEffect(() => {
    if (searchParams.get('calendarConnected') === 'true') {
      toast.success('Google Kalender erfolgreich verbunden')
      router.replace('/groups')
    }
  }, [searchParams, router])

  // Redirect to onboarding only when the user genuinely has no groups.
  // Never redirect on a fetch error — that would silently bounce the user
  // away (and hide the error) instead of surfacing the problem.
  useEffect(() => {
    if (!loading && !error && groups.length === 0) {
      router.replace('/onboarding')
    }
  }, [loading, error, groups.length, router])

  const initials = profile?.display_name
    ? profile.display_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  function handleAddGroupSuccess(groupId: string) {
    setAddSheetOpen(false)
    router.push(`/groups/${groupId}/vorschlaege`)
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="bg-bg border-b border-line px-4 h-14 flex items-center justify-between sticky top-0 z-10">
        <span className="text-[18px] font-[900] uppercase tracking-[0.18em] text-ink">
          ZUSAMMEN
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAddSheetOpen(true)}
            className="h-8 px-3 rounded-md text-[13px] font-semibold text-ink-2 hover:text-ink hover:bg-surface-2 gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Hinzufügen
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setProfileSheetOpen(true)}
            className="rounded-full h-9 w-9"
            aria-label="Profil öffnen"
          >
            <Avatar className="h-8 w-8">
              {profile?.avatar_url && (
                <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
              )}
              <AvatarFallback className="bg-primary text-white text-xs font-[800]">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="px-4 py-6 max-w-lg mx-auto">
        <div className="mb-5">
          <h1 className="text-[24px] font-[900] text-ink">Meine Gruppen</h1>
          <p className="text-[14px] text-ink-2 mt-0.5">
            {loading ? ' ' : `${groups.length} ${groups.length === 1 ? 'Gruppe' : 'Gruppen'}`}
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-[74px] w-full rounded-[18px] bg-surface" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onClick={() => router.push(`/groups/${group.id}/vorschlaege`)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Profile Sheet */}
      <ProfileSheet open={profileSheetOpen} onOpenChange={setProfileSheetOpen} />

      {/* Add group sheet (inline onboarding) */}
      <Sheet open={addSheetOpen} onOpenChange={setAddSheetOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-[24px] bg-bg border-t border-line p-0 max-h-[90vh]"
        >
          <SheetHeader className="px-5 pt-5 pb-4 border-b border-line">
            <SheetTitle className="text-[18px] font-[800] text-ink">Gruppe hinzufügen</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto">
            <OnboardingScreen onSuccess={handleAddGroupSuccess} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default function GroupsPage() {
  return (
    <AuthGuard>
      <GroupsContent />
    </AuthGuard>
  )
}
