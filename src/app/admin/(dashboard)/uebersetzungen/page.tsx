'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LucideIcon } from '@/components/icon-picker'
import { Loader2, Check, Circle, CheckCircle, Minus } from 'lucide-react'

interface ServiceTyp {
  id: string
  name: string
  icon: string
  sort_order: number
}

interface Translation {
  id: string
  table_name: string
  row_id: string
  field_name: string
  language: string
  value: string
}

// Map translations by row_id + language for quick lookup
type TranslationMap = Map<string, string> // key: `${row_id}_${language}`

function buildTranslationMap(translations: Translation[]): TranslationMap {
  const map = new Map<string, string>()
  for (const t of translations) {
    map.set(`${t.row_id}_${t.language}`, t.value)
  }
  return map
}

function getTranslation(map: TranslationMap, rowId: string, lang: string): string {
  return map.get(`${rowId}_${lang}`) || ''
}

// Inline editable cell
function EditableCell({
  value,
  onSave,
}: {
  value: string
  onSave: (newValue: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(value)
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Sync external value changes
  useEffect(() => {
    if (!editing) setText(value)
  }, [value, editing])

  const startEdit = () => {
    setEditing(true)
    setError(null)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const save = async () => {
    const trimmed = text.trim()
    // No change? Just close
    if (trimmed === value) {
      setEditing(false)
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave(trimmed)
      setEditing(false)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern')
    }
    setSaving(false)
  }

  const cancel = () => {
    setText(value)
    setEditing(false)
    setError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      save()
    } else if (e.key === 'Escape') {
      cancel()
    }
  }

  if (editing) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <Input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={save}
            onKeyDown={handleKeyDown}
            disabled={saving}
            placeholder="Übersetzung eingeben..."
            className="h-8 text-sm"
          />
          {saving && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />}
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    )
  }

  return (
    <div
      className="group flex min-h-[32px] cursor-pointer items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/50"
      onClick={startEdit}
      title="Klicken zum Bearbeiten"
    >
      {value ? (
        <span className="text-sm">{value}</span>
      ) : (
        <span className="text-sm italic text-muted-foreground">Fehlt</span>
      )}
      {showSuccess && <Check className="h-3.5 w-3.5 text-green-600" />}
    </div>
  )
}

// Status indicator for a row
function StatusIndicator({ fr, it }: { fr: string; it: string }) {
  const hasFr = fr.length > 0
  const hasIt = it.length > 0

  if (hasFr && hasIt) {
    return <CheckCircle className="h-4 w-4 text-green-600" />
  }
  if (hasFr || hasIt) {
    return <Circle className="h-4 w-4 fill-orange-400 text-orange-400" />
  }
  return <Minus className="h-4 w-4 text-muted-foreground" />
}

export default function UebersetzungenPage() {
  const [services, setServices] = useState<ServiceTyp[]>([])
  const [translationMap, setTranslationMap] = useState<TranslationMap>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [servicesRes, translationsRes] = await Promise.all([
        fetch('/api/services'),
        fetch('/api/translations?table=service_typen&field=name'),
      ])

      if (servicesRes.ok) {
        const d = await servicesRes.json()
        setServices(d.services || [])
      }
      if (translationsRes.ok) {
        const d = await translationsRes.json()
        setTranslationMap(buildTranslationMap(d.translations || []))
      }
    } catch {
      setError('Daten konnten nicht geladen werden.')
    }
    setIsLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleSave = async (rowId: string, language: string, value: string) => {
    const res = await fetch('/api/translations', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table_name: 'service_typen',
        row_id: rowId,
        field_name: 'name',
        language,
        value,
      }),
    })

    if (!res.ok) {
      const d = await res.json()
      throw new Error(d.error || 'Speichern fehlgeschlagen')
    }

    // Update local state
    setTranslationMap((prev) => {
      const next = new Map(prev)
      const key = `${rowId}_${language}`
      if (value.trim()) {
        next.set(key, value.trim())
      } else {
        next.delete(key)
      }
      return next
    })
  }

  // Progress stats
  const frCount = services.filter((s) => getTranslation(translationMap, s.id, 'fr').length > 0).length
  const itCount = services.filter((s) => getTranslation(translationMap, s.id, 'it').length > 0).length
  const total = services.length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Übersetzungen</h2>
        <p className="text-muted-foreground">
          Pflegen Sie hier die Übersetzungen für mehrsprachige Inhalte. Der deutsche Text ist der Originalwert. Fehlende Übersetzungen werden im Widget durch den deutschen Text ersetzt.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Progress */}
      {!isLoading && total > 0 && (
        <div className="flex flex-wrap gap-6">
          <div className="flex-1 min-w-[200px] space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Französisch</span>
              <Badge variant="outline">{frCount}/{total}</Badge>
            </div>
            <Progress value={total > 0 ? (frCount / total) * 100 : 0} className="h-2" />
          </div>
          <div className="flex-1 min-w-[200px] space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Italienisch</span>
              <Badge variant="outline">{itCount}/{total}</Badge>
            </div>
            <Progress value={total > 0 ? (itCount / total) * 100 : 0} className="h-2" />
          </div>
        </div>
      )}

      <Tabs defaultValue="service_typen">
        <TabsList>
          <TabsTrigger value="service_typen">Service-Typen</TabsTrigger>
        </TabsList>

        <TabsContent value="service_typen">
          <Card>
            <CardHeader>
              <CardTitle>Service-Typ Übersetzungen</CardTitle>
              <CardDescription>
                Klicken Sie auf ein Feld, um die Übersetzung zu bearbeiten. Enter zum Speichern, Escape zum Abbrechen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : services.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Keine Service-Typen vorhanden. Erstellen Sie zuerst Services unter &quot;Services&quot;.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead>Deutsch (Original)</TableHead>
                      <TableHead>Französisch</TableHead>
                      <TableHead>Italienisch</TableHead>
                      <TableHead className="w-[40px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((service) => {
                      const fr = getTranslation(translationMap, service.id, 'fr')
                      const it = getTranslation(translationMap, service.id, 'it')
                      return (
                        <TableRow key={service.id}>
                          <TableCell>
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                              <LucideIcon name={service.icon} className="h-4 w-4" />
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{service.name}</TableCell>
                          <TableCell>
                            <EditableCell
                              value={fr}
                              onSave={(v) => handleSave(service.id, 'fr', v)}
                            />
                          </TableCell>
                          <TableCell>
                            <EditableCell
                              value={it}
                              onSave={(v) => handleSave(service.id, 'it', v)}
                            />
                          </TableCell>
                          <TableCell>
                            <StatusIndicator fr={fr} it={it} />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
