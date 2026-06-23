'use client'

import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useArchive } from '@/hooks/useArchive'
import { ArchiveActivityCard } from './ArchiveActivityCard'
import { ActivityDetailSheet } from '@/components/groups/ActivityDetailSheet'
import { useAuth } from '@/contexts/AuthContext'
import { Archive } from 'lucide-react'

export function ArchiveTab() {
  const { user } = useAuth()
  const { activities, loading, loadingMore, hasMore, loadMore } = useArchive()
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')

  function handleCardClick(activityId: string, groupId: string) {
    setSelectedActivityId(activityId)
    setSelectedGroupId(groupId)
  }

  function handleClose() {
    setSelectedActivityId(null)
    setSelectedGroupId('')
  }

  if (loading) {
    return (
      <div className="space-y-3 px-5 pt-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-[168px] w-full rounded-[18px] bg-surface" />
        ))}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-5 pt-12 pb-8 text-center">
        <div className="h-14 w-14 rounded-full bg-surface-2 flex items-center justify-center mb-4">
          <Archive className="h-7 w-7 text-ink-3" />
        </div>
        <p className="text-[15px] font-[700] text-ink mb-1">Noch kein Archiv</p>
        <p className="text-[13px] text-ink-3 leading-relaxed max-w-[220px]">
          Eure erste gemeinsame Erinnerung wartet auf euch!
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="px-5 pt-4 pb-6 space-y-3">
        {activities.map(activity => (
          <ArchiveActivityCard
            key={activity.id}
            activity={activity}
            onClick={() => handleCardClick(activity.id, activity.group_id)}
          />
        ))}

        {hasMore && (
          <div className="pt-1">
            <Button
              variant="outline"
              className="w-full border-line text-ink-2 text-[13px] font-[700] rounded-[12px]"
              onClick={loadMore}
              disabled={loadingMore}
            >
              {loadingMore ? 'Wird geladen…' : 'Mehr laden'}
            </Button>
          </div>
        )}
      </div>

      {selectedActivityId && (
        <ActivityDetailSheet
          activityId={selectedActivityId}
          groupId={selectedGroupId}
          currentUserId={user?.id ?? ''}
          isAdmin={false}
          onClose={handleClose}
          readOnly={true}
        />
      )}
    </>
  )
}
