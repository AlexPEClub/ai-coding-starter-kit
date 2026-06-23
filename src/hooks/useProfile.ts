'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export function useProfile() {
  const { user, refreshProfile } = useAuth()
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function updateDisplayName(name: string): Promise<boolean> {
    if (!user) return false
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Name darf nicht leer sein')
      return false
    }
    if (trimmed.length > 50) {
      setError('Name darf maximal 50 Zeichen lang sein')
      return false
    }
    setSaving(true)
    setError(null)
    const { error: err } = await supabase
      .from('profiles')
      .update({ display_name: trimmed })
      .eq('id', user.id)
    setSaving(false)
    if (err) {
      setError(err.message)
      return false
    }
    await refreshProfile()
    return true
  }

  async function uploadAvatar(file: File): Promise<boolean> {
    if (!user) return false
    if (file.size > 5 * 1024 * 1024) {
      setError('Das Bild darf maximal 5 MB groß sein')
      return false
    }
    setUploadingAvatar(true)
    setError(null)
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `${user.id}/avatar.${ext}`
    const { error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (uploadErr) {
      setUploadingAvatar(false)
      setError('Profilbild konnte nicht hochgeladen werden')
      return false
    }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
    // Add cache-busting param so browser reloads the new image
    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', user.id)
    setUploadingAvatar(false)
    if (updateErr) {
      setError(updateErr.message)
      return false
    }
    await refreshProfile()
    return true
  }

  return { saving, uploadingAvatar, error, setError, updateDisplayName, uploadAvatar }
}
