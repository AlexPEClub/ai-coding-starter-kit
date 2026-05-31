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

const WorkspaceSchema = z.object({
  name: z.string().min(1, 'Praxisname ist erforderlich').max(200),
})
type WorkspaceValues = z.infer<typeof WorkspaceSchema>

type Workspace = {
  id:       string
  name:     string
  slug:     string
  logo_url: string | null
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB

export default function WorkspaceSettingsPage() {
  const router       = useRouter()
  const supabase     = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [workspace, setWorkspace]       = useState<Workspace | null>(null)
  const [tenantId, setTenantId]         = useState<string | null>(null)
  const [loadingWs, setLoadingWs]       = useState(true)
  const [saving, setSaving]             = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const form = useForm<WorkspaceValues>({
    resolver: zodResolver(WorkspaceSchema),
    defaultValues: { name: '' },
  })

  useEffect(() => {
    // Fetch workspace and tenant_id from profile in parallel
    Promise.all([
      fetch('/api/workspace').then((r) => r.ok ? r.json() : null),
      fetch('/api/profile').then((r) => r.ok ? r.json() : null),
    ]).then(([ws, profile]: [Workspace | null, { tenant_id?: string } | null]) => {
      if (ws) {
        setWorkspace(ws)
        form.reset({ name: ws.name })
      }
      if (profile?.tenant_id) setTenantId(profile.tenant_id)
    }).finally(() => setLoadingWs(false))
  }, [form])

  async function onSubmit(values: WorkspaceValues) {
    setSaving(true)
    try {
      const res = await fetch('/api/workspace', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(values),
      })
      if (!res.ok) {
        const body = await res.json()
        if (res.status === 403) {
          toast.error('Nur Workspace-Admins können diese Einstellungen ändern')
        } else {
          toast.error(body.error ?? 'Speichern fehlgeschlagen')
        }
        return
      }
      const updated: Workspace = await res.json()
      setWorkspace(updated)
      toast.success('Praxisname gespeichert')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !tenantId) return

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Nur JPG, PNG und WebP sind erlaubt')
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('Datei darf maximal 5 MB groß sein')
      return
    }

    setUploadingLogo(true)
    try {
      const ext  = file.name.split('.').pop()
      const path = `${tenantId}/logo.${ext}`
      const { error } = await supabase.storage
        .from('workspace-logos')
        .upload(path, file, { upsert: true })

      if (error) {
        toast.error('Upload fehlgeschlagen')
        return
      }

      const { data: urlData } = supabase.storage
        .from('workspace-logos')
        .getPublicUrl(path)

      await fetch('/api/workspace', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ logo_url: urlData.publicUrl }),
      })

      setWorkspace((prev) => prev ? { ...prev, logo_url: urlData.publicUrl } : prev)
      toast.success('Logo aktualisiert')
      router.refresh()
    } finally {
      setUploadingLogo(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (loadingWs) {
    return (
      <div className="max-w-2xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card><CardContent className="pt-6 space-y-4">
          <Skeleton className="h-16 w-16 rounded-lg" />
          <Skeleton className="h-10 w-full" />
        </CardContent></Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-[var(--font-outfit)]">Praxis-Einstellungen</h1>
        <p className="text-muted-foreground">Verwalte den Namen und das Logo deiner Praxis.</p>
      </div>

      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Praxis-Logo</CardTitle>
          <CardDescription>Max. 5 MB — JPG, PNG oder WebP</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="h-16 w-16 rounded-lg">
            <AvatarImage src={workspace?.logo_url ?? undefined} />
            <AvatarFallback className="rounded-lg bg-primary/20 text-primary font-semibold text-lg">
              {workspace?.name?.[0]?.toUpperCase() ?? 'P'}
            </AvatarFallback>
          </Avatar>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleLogoChange}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={uploadingLogo}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadingLogo ? 'Hochladen…' : 'Logo ändern'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Workspace form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Praxisname</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Praxisname</FormLabel>
                    <FormControl>
                      <Input placeholder="Tierphysio München" {...field} />
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
