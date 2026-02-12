'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { LucideIcon } from '@/components/icon-picker'
import { Loader2, MapPin, Save, Upload, X } from 'lucide-react'

interface ServiceTyp {
  id: string
  name: string
  icon: string
}

interface StuetzpunktData {
  id?: string
  name: string
  strasse: string
  hausnummer: string
  plz: string
  ort: string
  land: string
  telefon: string
  email: string
  website: string
  bild_url: string
  latitude: number | null
  longitude: number | null
  status: 'aktiv' | 'temporaer_geschlossen'
  oeffnungszeiten_typ: 'tagsueber' | '24h'
  oeffnungszeiten_von: string
  oeffnungszeiten_bis: string
  service_ids: string[]
}

const defaultData: StuetzpunktData = {
  name: '',
  strasse: '',
  hausnummer: '',
  plz: '',
  ort: '',
  land: 'CH',
  telefon: '',
  email: '',
  website: '',
  bild_url: '',
  latitude: null,
  longitude: null,
  status: 'aktiv',
  oeffnungszeiten_typ: 'tagsueber',
  oeffnungszeiten_von: '07:00',
  oeffnungszeiten_bis: '17:00',
  service_ids: [],
}

interface StuetzpunktFormProps {
  initialData?: StuetzpunktData
  isEdit?: boolean
}

export function StuetzpunktForm({ initialData, isEdit = false }: StuetzpunktFormProps) {
  const router = useRouter()
  const [data, setData] = useState<StuetzpunktData>(initialData ?? defaultData)
  const [services, setServices] = useState<ServiceTyp[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [geocodeStatus, setGeocodeStatus] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/services')
      .then((r) => r.json())
      .then((d) => setServices(d.services || []))
  }, [])

  const update = (field: keyof StuetzpunktData, value: unknown) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  const handleGeocode = async () => {
    const address = `${data.strasse} ${data.hausnummer}, ${data.plz} ${data.ort}, ${data.land}`
    setIsGeocoding(true)
    setGeocodeStatus(null)

    const response = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`)

    if (response.ok) {
      const result = await response.json()
      setData((prev) => ({
        ...prev,
        latitude: result.latitude,
        longitude: result.longitude,
      }))
      setGeocodeStatus(`Koordinaten gefunden: ${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}`)
    } else {
      const result = await response.json()
      setGeocodeStatus(result.error || 'Geocoding fehlgeschlagen')
    }
    setIsGeocoding(false)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (response.ok) {
      const result = await response.json()
      update('bild_url', result.url)
    } else {
      const result = await response.json()
      setError(result.error)
    }
    setIsUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    // Auto-Geocoding wenn keine Koordinaten vorhanden
    if (!data.latitude && data.strasse && data.plz) {
      const address = `${data.strasse} ${data.hausnummer}, ${data.plz} ${data.ort}, ${data.land}`
      try {
        const geoResponse = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`)
        if (geoResponse.ok) {
          const geoResult = await geoResponse.json()
          data.latitude = geoResult.latitude
          data.longitude = geoResult.longitude
        }
      } catch {
        // Geocoding ist optional, Speichern geht trotzdem
      }
    }

    const url = isEdit ? `/api/stuetzpunkte/${data.id}` : '/api/stuetzpunkte'
    const method = isEdit ? 'PUT' : 'POST'

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (response.ok) {
      router.push('/admin/stuetzpunkte')
    } else {
      const result = await response.json()
      setError(result.error)
    }
    setIsSaving(false)
  }

  const toggleService = (serviceId: string) => {
    setData((prev) => ({
      ...prev,
      service_ids: prev.service_ids.includes(serviceId)
        ? prev.service_ids.filter((id) => id !== serviceId)
        : [...prev.service_ids, serviceId],
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Basis-Informationen */}
      <Card>
        <CardHeader>
          <CardTitle>Basis-Informationen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={data.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="z.B. Stützpunkt Bern"
              required
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={data.status === 'aktiv'}
                onCheckedChange={(checked) =>
                  update('status', checked ? 'aktiv' : 'temporaer_geschlossen')
                }
              />
              <Label>{data.status === 'aktiv' ? 'Aktiv' : 'Temporär geschlossen'}</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adresse */}
      <Card>
        <CardHeader>
          <CardTitle>Adresse</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="strasse">Straße *</Label>
              <Input
                id="strasse"
                value={data.strasse}
                onChange={(e) => update('strasse', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hausnummer">Nr. *</Label>
              <Input
                id="hausnummer"
                value={data.hausnummer}
                onChange={(e) => update('hausnummer', e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="plz">PLZ *</Label>
              <Input
                id="plz"
                value={data.plz}
                onChange={(e) => update('plz', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ort">Ort *</Label>
              <Input
                id="ort"
                value={data.ort}
                onChange={(e) => update('ort', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="land">Land *</Label>
              <Select value={data.land} onValueChange={(v) => update('land', v)}>
                <SelectTrigger id="land">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CH">Schweiz</SelectItem>
                  <SelectItem value="DE">Deutschland</SelectItem>
                  <SelectItem value="AT">Österreich</SelectItem>
                  <SelectItem value="FR">Frankreich</SelectItem>
                  <SelectItem value="IT">Italien</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="flex items-center gap-4">
            <Button type="button" variant="outline" onClick={handleGeocode} disabled={isGeocoding}>
              {isGeocoding ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="mr-2 h-4 w-4" />
              )}
              Koordinaten ermitteln
            </Button>
            {data.latitude && (
              <span className="text-sm text-muted-foreground">
                {data.latitude.toFixed(4)}, {data.longitude?.toFixed(4)}
              </span>
            )}
          </div>
          {geocodeStatus && (
            <p className="text-sm text-muted-foreground">{geocodeStatus}</p>
          )}
        </CardContent>
      </Card>

      {/* Kontakt */}
      <Card>
        <CardHeader>
          <CardTitle>Kontakt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="telefon">Telefon *</Label>
              <Input
                id="telefon"
                type="tel"
                value={data.telefon}
                onChange={(e) => update('telefon', e.target.value)}
                placeholder="+41 31 123 45 67"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={data.email}
                onChange={(e) => update('email', e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={data.website}
              onChange={(e) => update('website', e.target.value)}
              placeholder="https://www.example.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Öffnungszeiten */}
      <Card>
        <CardHeader>
          <CardTitle>Öffnungszeiten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Select
              value={data.oeffnungszeiten_typ}
              onValueChange={(v) => update('oeffnungszeiten_typ', v)}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tagsueber">Tagsüber geöffnet</SelectItem>
                <SelectItem value="24h">24h Service</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {data.oeffnungszeiten_typ === 'tagsueber' && (
            <div className="flex items-center gap-2">
              <div className="space-y-2">
                <Label htmlFor="von">Von</Label>
                <Input
                  id="von"
                  type="time"
                  value={data.oeffnungszeiten_von}
                  onChange={(e) => update('oeffnungszeiten_von', e.target.value)}
                  className="w-32"
                />
              </div>
              <span className="mt-6">–</span>
              <div className="space-y-2">
                <Label htmlFor="bis">Bis</Label>
                <Input
                  id="bis"
                  type="time"
                  value={data.oeffnungszeiten_bis}
                  onChange={(e) => update('oeffnungszeiten_bis', e.target.value)}
                  className="w-32"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Services */}
      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Services konfiguriert.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {services.map((service) => (
                <label
                  key={service.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md border p-3 hover:bg-accent"
                >
                  <Checkbox
                    checked={data.service_ids.includes(service.id)}
                    onCheckedChange={() => toggleService(service.id)}
                  />
                  <LucideIcon name={service.icon} className="h-4 w-4" />
                  <span className="text-sm">{service.name}</span>
                </label>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bild */}
      <Card>
        <CardHeader>
          <CardTitle>Bild</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.bild_url ? (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.bild_url}
                alt="Stützpunkt"
                className="h-40 rounded-md object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -right-2 -top-2 h-6 w-6"
                onClick={() => update('bild_url', '')}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Button type="button" variant="outline" asChild disabled={isUploading}>
                <label className="cursor-pointer">
                  {isUploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Bild hochladen
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              </Button>
              <span className="text-xs text-muted-foreground">
                JPG, PNG oder WebP, max. 5 MB
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push('/admin/stuetzpunkte')}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isEdit ? 'Speichern' : 'Erstellen'}
        </Button>
      </div>
    </form>
  )
}
