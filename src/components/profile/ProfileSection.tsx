'use client'

import { useState, useRef } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Pencil, Check, X, Camera } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/hooks/useProfile'

export function ProfileSection() {
  const { profile } = useAuth()
  const { saving, uploadingAvatar, error, setError, updateDisplayName, uploadAvatar } = useProfile()
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const initials = profile?.display_name
    ? profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  function enterEditMode() {
    setEditName(profile?.display_name ?? '')
    setError(null)
    setEditing(true)
  }

  async function handleSave() {
    const ok = await updateDisplayName(editName)
    if (ok) {
      setEditing(false)
      toast.success('Name gespeichert')
    }
  }

  function handleCancel() {
    setEditing(false)
    setError(null)
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Das Bild darf maximal 5 MB groß sein')
      return
    }

    const ok = await uploadAvatar(file)
    if (ok) {
      toast.success('Profilbild aktualisiert')
    } else {
      toast.error('Profilbild konnte nicht hochgeladen werden')
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-[12px] font-[800] text-ink-2 uppercase tracking-[0.06em]">
        Profil
      </h3>

      <div className="flex items-center gap-4">
        {/* Avatar with tap-to-change */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Profilbild ändern"
          >
            <Avatar className="h-16 w-16">
              {profile?.avatar_url && (
                <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
              )}
              <AvatarFallback className="bg-primary text-white text-xl font-[800]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
              {uploadingAvatar ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="h-5 w-5 text-white" />
              )}
            </div>
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        {/* Display name */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-1.5">
              <Input
                value={editName}
                onChange={e => { setEditName(e.target.value); setError(null) }}
                maxLength={50}
                className="bg-bg border-line text-ink text-[14px]"
                placeholder="Anzeigename"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSave()
                  if (e.key === 'Escape') handleCancel()
                }}
              />
              {error && (
                <p className="text-[11.5px] text-error">{error}</p>
              )}
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  className="h-7 px-2.5 border-line text-ink-2 text-[12px]"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="h-7 px-2.5 bg-primary hover:bg-primary-600 text-white text-[12px]"
                >
                  {saving ? (
                    <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-[16px] font-[800] text-ink truncate">
                {profile?.display_name ?? ''}
              </p>
              <button
                onClick={enterEditMode}
                className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-[6px] text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
                aria-label="Namen bearbeiten"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <p className="text-[12px] text-ink-3 mt-0.5">
            {profile?.display_name
              ? `${profile.display_name.length}/50 Zeichen`
              : 'Max. 50 Zeichen'}
          </p>
        </div>
      </div>
    </div>
  )
}
