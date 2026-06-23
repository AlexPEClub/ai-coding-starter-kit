'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ActivityComment, CreateCommentInput } from '@/lib/activity-types'

interface UseActivityCommentsResult {
  comments: ActivityComment[]
  loading: boolean
  error: string | null
  addComment: (input: CreateCommentInput) => Promise<boolean>
  deleteComment: (commentId: string) => Promise<boolean>
}

export function useActivityComments(activityId: string | null): UseActivityCommentsResult {
  const [comments, setComments] = useState<ActivityComment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const fetchComments = useCallback(async () => {
    if (!activityId) return
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('activity_comments')
      .select(`
        *,
        author:profiles!activity_comments_user_id_fkey(id, display_name, avatar_url)
      `)
      .eq('activity_id', activityId)
      .order('created_at', { ascending: true })

    if (err) {
      setError('Kommentare konnten nicht geladen werden.')
    } else {
      setComments((data ?? []) as ActivityComment[])
    }
    setLoading(false)
  }, [activityId])

  useEffect(() => {
    if (!activityId) return

    fetchComments()

    const channel = supabase
      .channel(`comments:${activityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_comments',
          filter: `activity_id=eq.${activityId}`,
        },
        () => {
          fetchComments()
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [activityId, fetchComments])

  async function addComment(input: CreateCommentInput): Promise<boolean> {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return false

    const { error: err } = await supabase.from('activity_comments').insert({
      activity_id: input.activity_id,
      user_id: userData.user.id,
      content: input.content,
      mentioned_user_ids: input.mentioned_user_ids,
    })

    return !err
  }

  async function deleteComment(commentId: string): Promise<boolean> {
    const { error: err } = await supabase
      .from('activity_comments')
      .delete()
      .eq('id', commentId)

    return !err
  }

  return { comments, loading, error, addComment, deleteComment }
}

const COMMENT_IMAGE_MAX = 5 * 1024 * 1024 // 5 MB
const COMMENT_IMAGE_BUCKET = 'activity-comment-images'

export async function uploadCommentImage(
  activityId: string,
  file: File
): Promise<{ url?: string; storagePath?: string; error?: string }> {
  if (file.size > COMMENT_IMAGE_MAX) {
    return { error: 'Datei zu groß (max. 5 MB)' }
  }
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { error: 'Nicht eingeloggt' }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const uuid = crypto.randomUUID()
  const storagePath = `${activityId}/${userData.user.id}/${uuid}.${ext}`

  const { error: uploadErr } = await supabase.storage
    .from(COMMENT_IMAGE_BUCKET)
    .upload(storagePath, file, { upsert: false })

  if (uploadErr) return { error: 'Upload fehlgeschlagen' }

  const { data } = supabase.storage.from(COMMENT_IMAGE_BUCKET).getPublicUrl(storagePath)
  return { url: data.publicUrl, storagePath }
}

export async function deleteCommentImages(storagePaths: string[]): Promise<void> {
  if (storagePaths.length === 0) return
  await supabase.storage.from(COMMENT_IMAGE_BUCKET).remove(storagePaths)
}
