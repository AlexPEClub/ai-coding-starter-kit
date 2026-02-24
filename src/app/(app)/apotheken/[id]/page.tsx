"use client"

import { use, useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Pencil, MapPin, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { getApotheke } from "@/lib/actions/apotheken"
import { TERMIN_STATUS_CONFIG } from "@/lib/types"
import { ApothekeDialog } from "@/components/apotheke-dialog"
import type { Apotheke, Termin } from "@/lib/types"

export default function ApothekeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [apotheke, setApotheke] = useState<Apotheke | null>(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)

  useEffect(() => {
    load()
  }, [id])

  async function load() {
    setLoading(true)
    try {
      const data = await getApotheke(id)
      setApotheke(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!apotheke) {
    return (
      <div className="space-y-4">
        <Link
          href="/apotheken"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Liste
        </Link>
        <p className="text-muted-foreground">Apotheke nicht gefunden.</p>
      </div>
    )
  }

  // Get appointments for this pharmacy from the joined query
  // getApotheke returns *, termine(*)
  // The type might need assertion if not fully typed in Supabase
  const termine = ((apotheke as any).termine as any[]) || []

  // Sort detailed logic: upcoming first, then past
  termine.sort((a, b) => {
    const today = new Date().toISOString().split("T")[0]
    const aUpcoming = a.datum >= today ? 0 : 1
    const bUpcoming = b.datum >= today ? 0 : 1
    if (aUpcoming !== bUpcoming) return aUpcoming - bUpcoming
    return b.datum.localeCompare(a.datum) // Descending for same group
  })

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/apotheken">Apotheken</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{apotheke.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Info Card */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-xl">{apotheke.name}</CardTitle>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="outline">{apotheke.region}</Badge>
              {apotheke.priority === "top_kunde" && (
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                  Top-Kunde
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Bearbeiten
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Adresse</p>
              <div className="mt-1 flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p>{apotheke.address || "–"}</p>
                  <p>{apotheke.plz} {apotheke.ort}</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Erstellt am</p>
              <p className="mt-1">
                {format(new Date(apotheke.created_at), "dd.MM.yyyy", { locale: de })}
              </p>
            </div>
          </div>
          {apotheke.notes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Notizen</p>
              <p className="mt-1 text-sm">{apotheke.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Appointment History */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Terminverlauf</h2>
        {termine.length === 0 ? (
          <Card>
            <CardContent className="flex h-24 items-center justify-center text-muted-foreground">
              Noch keine Termine für diese Apotheke.
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Uhrzeit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notiz</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {termine.map((termin) => {
                  const statusConfig = TERMIN_STATUS_CONFIG[termin.status as keyof typeof TERMIN_STATUS_CONFIG]
                  return (
                    <TableRow key={termin.id}>
                      <TableCell>
                        {format(new Date(termin.datum), "dd.MM.yyyy", { locale: de })}
                      </TableCell>
                      <TableCell>
                        {termin.zeit_start}–{termin.zeit_ende}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={statusConfig?.color}
                        >
                          {statusConfig?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {termin.notiz || "–"}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <ApothekeDialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open)
          if (!open) load()
        }}
        apotheke={apotheke}
      />
    </div>
  )
}
