'use client'

import { useState } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Settings } from 'lucide-react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useGroupDetail } from '@/hooks/useGroupDetail'
import { GroupDetailSheet } from '@/components/groups/GroupDetailSheet'
import { ActivityDetailSheet } from '@/components/groups/ActivityDetailSheet'
import { GroupShellProvider } from '@/components/groups/GroupShellContext'

const TABS = [
  { seg: 'vorschlaege', label: 'Vorschläge' },
  { seg: 'planung', label: 'Planung' },
  { seg: 'archiv', label: 'Archiv' },
] as const

function GroupShell({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const groupId = String(params.groupId)
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()

  const { group, members, myRole, isAdmin, loading, error, refetch } = useGroupDetail(groupId)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [detailActivityId, setDetailActivityId] = useState<string | null>(null)

  const canCreate = myRole === 'admin' || myRole === 'editor'
  const memberCount = members.length || 1
  const activeSeg = TABS.find((t) => pathname.includes(`/${t.seg}`))?.seg ?? 'vorschlaege'

  return (
    <div className="h-[100dvh] overflow-hidden bg-bg flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 bg-bg border-b border-line">
        <div className="max-w-5xl mx-auto w-full px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => router.push('/groups')}
            className="h-9 w-9 -ml-1.5 rounded-[8px] flex items-center justify-center text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
            aria-label="Zurück zu meinen Gruppen"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <h1 className="flex-1 text-[18px] font-[800] text-ink truncate leading-tight">
            {loading && !group ? '…' : group?.name ?? 'Gruppe'}
          </h1>

          <button
            onClick={() => setSettingsOpen(true)}
            className="h-9 w-9 -mr-1.5 rounded-[8px] flex items-center justify-center text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
            aria-label="Einstellungen"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <nav className="max-w-5xl mx-auto w-full px-4 flex gap-1">
          {TABS.map((tab) => {
            const active = activeSeg === tab.seg
            return (
              <Link
                key={tab.seg}
                href={`/groups/${groupId}/${tab.seg}`}
                className={`pb-2.5 px-1 mr-3 text-[14px] border-b-2 transition-colors
                  ${active
                    ? 'font-[700] text-primary border-primary'
                    : 'font-[600] text-ink-3 border-transparent hover:text-ink-2'
                  }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </header>

      {/* Body */}
      <div className="flex-1 min-h-0 flex flex-col">
        {error && !group ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-[28px]">🚫</p>
            <p className="text-[16px] font-[800] text-ink">Gruppe nicht gefunden</p>
            <p className="text-[13px] text-ink-3 max-w-[260px]">
              Diese Gruppe existiert nicht mehr oder du bist kein Mitglied.
            </p>
            <Button
              onClick={() => router.push('/groups')}
              className="mt-1 bg-primary hover:bg-primary-600 text-white rounded-[12px]"
            >
              Zu meinen Gruppen
            </Button>
          </div>
        ) : loading && !group ? (
          <div className="max-w-5xl mx-auto w-full px-4 py-5 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[88px] w-full rounded-[18px] bg-surface" />
            ))}
          </div>
        ) : (
          <GroupShellProvider
            value={{
              groupId,
              group,
              myRole,
              isAdmin,
              canCreate,
              memberCount,
              loading,
              openActivityDetail: setDetailActivityId,
              refetchGroup: refetch,
            }}
          >
            {children}
          </GroupShellProvider>
        )}
      </div>

      {/* Shared settings sheet */}
      <GroupDetailSheet
        groupId={settingsOpen ? groupId : null}
        onClose={() => setSettingsOpen(false)}
        onGroupLeft={() => { setSettingsOpen(false); router.push('/groups') }}
        onGroupDeleted={() => { setSettingsOpen(false); router.push('/groups') }}
      />

      {/* Shared activity detail sheet */}
      <ActivityDetailSheet
        activityId={detailActivityId}
        groupId={groupId}
        currentUserId={user?.id ?? ''}
        isAdmin={isAdmin}
        onClose={() => setDetailActivityId(null)}
        onActivityUpdated={() => refetch()}
      />
    </div>
  )
}

export default function GroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <GroupShell>{children}</GroupShell>
    </AuthGuard>
  )
}
