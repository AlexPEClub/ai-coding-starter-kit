'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { StuetzpunktForm } from '@/components/stuetzpunkt-form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

interface StuetzpunktData {
  id: string
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

export default function EditStuetzpunktPage() {
  const params = useParams()
  const id = params.id as string

  const [data, setData] = useState<StuetzpunktData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const response = await fetch(`/api/stuetzpunkte/${id}`)
      if (response.ok) {
        const result = await response.json()
        const sp = result.stuetzpunkt
        setData({
          id: sp.id,
          name: sp.name,
          strasse: sp.strasse,
          hausnummer: sp.hausnummer,
          plz: sp.plz,
          ort: sp.ort,
          land: sp.land,
          telefon: sp.telefon,
          email: sp.email,
          website: sp.website || '',
          bild_url: sp.bild_url || '',
          latitude: sp.latitude,
          longitude: sp.longitude,
          status: sp.status,
          oeffnungszeiten_typ: sp.oeffnungszeiten_typ,
          oeffnungszeiten_von: sp.oeffnungszeiten_von || '07:00',
          oeffnungszeiten_bis: sp.oeffnungszeiten_bis || '17:00',
          service_ids: (sp.stuetzpunkt_services || []).map(
            (ss: { service_typ_id: string }) => ss.service_typ_id
          ),
        })
      } else {
        setError('Stützpunkt konnte nicht geladen werden')
      }
      setIsLoading(false)
    }
    load()
  }, [id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Stützpunkt bearbeiten</h2>
        <p className="text-muted-foreground">
          Bearbeiten Sie die Details dieses Standorts
        </p>
      </div>
      {data && <StuetzpunktForm initialData={data} isEdit />}
    </div>
  )
}
