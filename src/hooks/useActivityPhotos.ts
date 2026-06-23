'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ActivityPhoto } from '@/lib/activity-types'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const MAX_PHOTOS_PER_USER = 5
const BUCKET = 'activity-photos'

interface UseActivityPhotosResult {
  photos: ActivityPhoto[]
  loading: boolean
  error: string | null
  uploadPhoto: (activityId: string, file: File) => Promise<{ error?: string }>
  deletePhoto: (photo: ActivityPhoto) => Promise<boolean>
  userPhotoCount: number
}

export function useActivityPhotos(
  activityId: string | null,
  currentUserId: string | null
): UseActivityPhotosResult {
  const [photos, setPhotos] = useState<ActivityPhoto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPhotos = useCallback(async () => {
    if (!activityId) return
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('activity_photos')
      .select('*')
      .eq('activity_id', activityId)
      .order('created_at', { ascending: true })

    if (err) {
      setError('Fotos konnten nicht geladen werden.')
    } else {
      setPhotos((data ?? []) as ActivityPhoto[])
    }
    setLoading(false)
  }, [activityId])

  useEffect(() => {
    fetchPhotos()
  }, [fetchPhotos])

  const userPhotoCount = photos.filter((p) => p.user_id === currentUserId).length

  async function uploadPhoto(actId: string, file: File): Promise<{ error?: string }> {
    if (file.size > MAX_FILE_SIZE) {
      return { error: 'Datei zu groß (max. 5 MB)' }
    }
    if (userPhotoCount >= MAX_PHOTOS_PER_USER) {
      return { error: 'Du hast dein Limit von 5 Fotos erreicht' }
    }

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return { error: 'Nicht eingeloggt' }

    const ext = file.name.split('.').pop() ?? 'jpg'
    const uuid = crypto.randomUUID()
    const storagePath = `${actId}/${userData.user.id}/${uuid}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, { upsert: false })

    if (uploadErr) return { error: 'Upload fehlgeschlagen' }

    const { error: insertErr } = await supabase.from('activity_photos').insert({
      activity_id: actId,
      user_id: userData.user.id,
      storage_path: storagePath,
    })

    if (insertErr) {
      await supabase.storage.from(BUCKET).remove([storagePath])
      return { error: 'Foto konnte nicht gespeichert werden' }
    }

    await fetchPhotos()
    return {}
  }

  async function deletePhoto(photo: ActivityPhoto): Promise<boolean> {
    const { error: dbErr } = await supabase
      .from('activity_photos')
      .delete()
      .eq('id', photo.id)

    if (dbErr) return false

    // Storage cleanup after DB record is gone — orphaned files are safer than broken references
    await supabase.storage.from(BUCKET).remove([photo.storage_path])

    await fetchPhotos()
    return true
  }

  return { photos, loading, error, uploadPhoto, deletePhoto, userPhotoCount }
}

export function useActivityPhotoUrl(storagePath: string | null): string | null {
  if (!storagePath) return null
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  return data?.publicUrl ?? null
}
