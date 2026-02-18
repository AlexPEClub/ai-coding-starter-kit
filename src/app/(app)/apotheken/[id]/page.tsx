"use client"

import { use, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Pencil, MapPin } from "lucide-react"

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

import { mockApotheken, mockTermine, mockTrainers } from "@/lib/mock-data"
import { TERMIN_STATUS_CONFIG } from "@/lib/types"
import { ApothekeDialog } from "@/components/apotheke-dialog"

export default function ApothekeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [editOpen, setEditOpen] = useState(false)

  const apotheke = mockApotheken.find((a) => a.id === id)

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

  // Get appointments for this pharmacy
  const termine = mockTermine
    .filter((t) => t.apotheke_id === apotheke.id)
    .sort((a, b) => {
      // Upcoming first, then past
      const today = new Date().toISOString().split("T")[0]
      const aUpcoming = a.datum >= today ? 0 : 1
      const bUpcoming = b.datum >= today ? 0 : 1
      if (aUpcoming !== bUpcoming) return aUpcoming - bUpcoming
      return a.datum.localeCompare(b.datum)
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
                {new Date(apotheke.created_at).toLocaleDateString("de-AT")}
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
                  <TableHead>Trainer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notiz</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {termine.map((termin) => {
                  const trainer = mockTrainers.find(
                    (t) => t.id === termin.trainer_id
                  )
                  const statusConfig = TERMIN_STATUS_CONFIG[termin.status]
                  return (
                    <TableRow key={termin.id}>
                      <TableCell>
                        {new Date(termin.datum).toLocaleDateString("de-AT")}
                      </TableCell>
                      <TableCell>
                        {termin.zeit_start}–{termin.zeit_ende}
                      </TableCell>
                      <TableCell>{trainer?.full_name ?? "–"}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={statusConfig.color}
                        >
                          {statusConfig.label}
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
        onOpenChange={setEditOpen}
        apotheke={apotheke}
      />
    </div>
  )
}
