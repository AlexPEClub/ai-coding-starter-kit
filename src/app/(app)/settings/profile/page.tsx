'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

const ProfileSchema = z.object({
  first_name: z.string().min(1, 'Vorname ist erforderlich').max(100),
  last_name:  z.string().min(1, 'Nachname ist erforderlich').max(100),
  phone:      z.string().max(30).optional(),
})
type ProfileValues = z.infer<typeof ProfileSchema>

type Profile = {
  first_name:  string | null
  last_name:   string | null
  phone:       string | null
  avatar_url:  string | null
  tenant_id:   string
  user_id:     string
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB

export default function ProfileSettingsPage() {
  const router         = useRouter()
  const supabase       = createClient()
  const fileInputRef   = useRef<HTMLInputElement>(null)
  const [profile, setProfile]         = useState<Profile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [saving, setSaving]           = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const form = useForm<ProfileValues>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: { first_name: '', last_name: '', phone: '' },
  })

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.ok ? r.json() : null)
      .then((data: Profile | null) => {
        if (data) {
          setProfile(data)
          form.reset({
            first_name: data.first_name ?? '',
            last_name:  data.last_name  ?? '',
            phone:      data.phone      ?? '',
          })
        }
      })
      .finally(() => setLoadingProfile(false))
  }, [form])

  async function onSubmit(values: ProfileValues) {
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(values),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        console.error('[profile] PUT error:', body)
        toast.error(`Speichern fehlgeschlagen: ${body.error ?? res.status}`)
        return
      }
      toast.success('Profil gespeichert')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Nur JPG, PNG und WebP sind erlaubt')
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('Datei darf maximal 5 MB groß sein')
      return
    }

    setUploadingAvatar(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !profile) return

      const ext  = file.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`
      const { error } = await supabase.storage
        .from('profile-avatars')
        .upload(path, file, { upsert: true })

      if (error) {
        console.error('[avatar] Storage upload error:', error)
        toast.error(`Upload fehlgeschlagen: ${error.message}`)
        return
      }

      const { data: urlData } = supabase.storage
        .from('profile-avatars')
        .getPublicUrl(path)

      // Save avatar_url to profile
      await fetch('/api/profile', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ avatar_url: urlData.publicUrl }),
      })

      setProfile((prev) => prev ? { ...prev, avatar_url: urlData.publicUrl } : prev)
      toast.success('Profilbild aktualisiert')
      router.refresh()
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (loadingProfile) {
    return (
      <div className="max-w-2xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card><CardContent className="pt-6 space-y-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent></Card>
      </div>
    )
  }

  const displayInitials = [profile?.first_name?.[0], profile?.last_name?.[0]]
    .filter(Boolean).join('').toUpperCase() || '?'

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-[var(--font-outfit)]">Profil</h1>
        <p className="text-muted-foreground">Verwalte deine persönlichen Daten.</p>
      </div>

      {/* Avatar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profilbild</CardTitle>
          <CardDescription>Max. 5 MB — JPG, PNG oder WebP</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary/20 text-primary font-semibold text-lg">
              {displayInitials}
            </AvatarFallback>
          </Avatar>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={uploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadingAvatar ? 'Hochladen…' : 'Bild ändern'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Persönliche Daten</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vorname</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nachname</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon (optional)</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="+49 89 123456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Speichern…' : 'Änderungen speichern'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
