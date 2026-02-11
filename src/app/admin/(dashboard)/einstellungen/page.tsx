'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Check, ClipboardCopy, Loader2, Save, Settings } from 'lucide-react'

interface WidgetConfig {
  map_provider: 'openstreetmap' | 'google_maps'
  google_maps_api_key: string | null
  default_language: 'de' | 'fr' | 'it'
  primary_color: string
  default_radius_km: number
  default_center_lat: number
  default_center_lng: number
  default_zoom: number
}

const defaultConfig: WidgetConfig = {
  map_provider: 'openstreetmap',
  google_maps_api_key: null,
  default_language: 'de',
  primary_color: '#E30613',
  default_radius_km: 50,
  default_center_lat: 46.948,
  default_center_lng: 7.4474,
  default_zoom: 8,
}

export default function EinstellungenPage() {
  const [config, setConfig] = useState<WidgetConfig>(defaultConfig)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const loadConfig = useCallback(async () => {
    setIsLoading(true)
    const response = await fetch('/api/widget-config')
    if (response.ok) {
      const data = await response.json()
      setConfig({
        map_provider: data.config.map_provider,
        google_maps_api_key: data.config.google_maps_api_key || '',
        default_language: data.config.default_language,
        primary_color: data.config.primary_color,
        default_radius_km: data.config.default_radius_km,
        default_center_lat: data.config.default_center_lat,
        default_center_lng: data.config.default_center_lng,
        default_zoom: data.config.default_zoom,
      })
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const update = (field: keyof WidgetConfig, value: unknown) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    const response = await fetch('/api/widget-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...config,
        google_maps_api_key: config.google_maps_api_key || null,
      }),
    })

    if (response.ok) {
      setSuccess('Konfiguration gespeichert')
    } else {
      const data = await response.json()
      setError(data.error)
    }
    setIsSaving(false)
  }

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [success])

  const snippetCode = `<!-- Heizmann Storefinder Widget -->
<div id="heizmann-storefinder"></div>
<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget/storefinder.js"></script>`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippetCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Einstellungen</h2>
        <p className="text-muted-foreground">
          Widget-Konfiguration und Embed-Code
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Map-Provider */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Karten-Einstellungen
            </CardTitle>
            <CardDescription>
              Wählen Sie den Map-Provider und konfigurieren Sie die Kartenanzeige
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Map-Provider</Label>
              <Select
                value={config.map_provider}
                onValueChange={(v) => update('map_provider', v)}
              >
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openstreetmap">OpenStreetMap (kostenlos)</SelectItem>
                  <SelectItem value="google_maps">Google Maps (API Key nötig)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {config.map_provider === 'google_maps' && (
              <div className="space-y-2">
                <Label htmlFor="api-key">Google Maps API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  value={config.google_maps_api_key || ''}
                  onChange={(e) => update('google_maps_api_key', e.target.value)}
                  placeholder="AIzaSy..."
                />
                <p className="text-xs text-muted-foreground">
                  Benötigt Maps JavaScript API. Der Key wird sicher gespeichert.
                </p>
              </div>
            )}

            <Separator />

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="center-lat">Standard-Mittelpunkt (Lat)</Label>
                <Input
                  id="center-lat"
                  type="number"
                  step="0.0001"
                  value={config.default_center_lat}
                  onChange={(e) => update('default_center_lat', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="center-lng">Standard-Mittelpunkt (Lng)</Label>
                <Input
                  id="center-lng"
                  type="number"
                  step="0.0001"
                  value={config.default_center_lng}
                  onChange={(e) => update('default_center_lng', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zoom">Zoomstufe</Label>
                <Select
                  value={String(config.default_zoom)}
                  onValueChange={(v) => update('default_zoom', parseInt(v))}
                >
                  <SelectTrigger id="zoom">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 15 }, (_, i) => i + 4).map((z) => (
                      <SelectItem key={z} value={String(z)}>
                        {z} {z <= 6 ? '(Land)' : z <= 10 ? '(Region)' : z <= 14 ? '(Stadt)' : '(Straße)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Widget-Darstellung */}
        <Card>
          <CardHeader>
            <CardTitle>Widget-Darstellung</CardTitle>
            <CardDescription>
              Passen Sie das Erscheinungsbild des Widgets an
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Standardsprache</Label>
                <Select
                  value={config.default_language}
                  onValueChange={(v) => update('default_language', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="it">Italiano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Standard-Suchradius</Label>
                <Select
                  value={String(config.default_radius_km)}
                  onValueChange={(v) => update('default_radius_km', parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 km</SelectItem>
                    <SelectItem value="25">25 km</SelectItem>
                    <SelectItem value="50">50 km</SelectItem>
                    <SelectItem value="100">100 km</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primärfarbe</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config.primary_color}
                    onChange={(e) => update('primary_color', e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded border p-1"
                  />
                  <Input
                    id="primary-color"
                    value={config.primary_color}
                    onChange={(e) => update('primary_color', e.target.value)}
                    placeholder="#E30613"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    className="w-32"
                  />
                  <div
                    className="flex h-10 items-center rounded-md px-3 text-sm font-medium text-white"
                    style={{ backgroundColor: config.primary_color }}
                  >
                    Vorschau
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Speichern */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Konfiguration speichern
          </Button>
        </div>
      </form>

      {/* Snippet-Generator */}
      <Card>
        <CardHeader>
          <CardTitle>Embed-Code</CardTitle>
          <CardDescription>
            Kopieren Sie diesen Code in Ihre HTML-Seite, um den Storefinder einzubinden
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
              <code>{snippetCode}</code>
            </pre>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="absolute right-2 top-2"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="mr-1 h-3 w-3" />
                  Kopiert
                </>
              ) : (
                <>
                  <ClipboardCopy className="mr-1 h-3 w-3" />
                  Kopieren
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Fügen Sie diesen Code an der Stelle ein, an der das Widget erscheinen soll.
            Die Konfiguration wird automatisch von der API geladen.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
