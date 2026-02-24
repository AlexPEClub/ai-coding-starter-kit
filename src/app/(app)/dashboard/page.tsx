import Link from "next/link"
import { format, startOfWeek, endOfWeek } from "date-fns"
import { de } from "date-fns/locale"
import {
  CalendarDays,
  Users,
  FileText,
  AlertCircle,
  Plus,
  Calendar,
  BarChart3,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createClient } from "@/lib/supabase/server"
import { TERMIN_STATUS_CONFIG } from "@/lib/types"

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Guten Morgen"
  if (hour < 18) return "Guten Tag"
  return "Guten Abend"
}

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get current user profile
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user!.id)
    .single()

  const role = profile?.role ?? "trainer"
  const firstName = profile?.full_name?.split(" ")[0] ?? "Benutzer"

  const today = format(new Date(), "yyyy-MM-dd")
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")

  // ── Admin queries ──────────────────────────────────────────────
  let termineHeute: any[] = []
  let termineWocheCount = 0
  let missingReports: any[] = []
  let activeTrainersCount = 0

  // ── Trainer queries ────────────────────────────────────────────
  let myNextTermine: any[] = []
  let myMissingReports: any[] = []

  if (role === "admin" || role === "management") {
    // Today's appointments with pharmacy + trainer name
    const { data: heute } = await supabase
      .from("termine")
      .select("id, datum, zeit_start, zeit_ende, status, apotheken(name), user_profiles(full_name)")
      .eq("datum", today)
      .neq("status", "abgesagt")
      .order("zeit_start")

    termineHeute = heute ?? []

    // This week count
    const { count: wocheCount } = await supabase
      .from("termine")
      .select("id", { count: "exact", head: true })
      .gte("datum", weekStart)
      .lte("datum", weekEnd)
      .neq("status", "abgesagt")

    termineWocheCount = wocheCount ?? 0

    // Missing reports: durchgefuehrt termine without a submitted bericht
    const { data: missing } = await supabase
      .from("termine")
      .select("id, datum, apotheken(name), user_profiles(full_name)")
      .eq("status", "durchgefuehrt")
      .is("berichte.id", null)
      .order("datum", { ascending: false })
      .limit(10)

    // Fallback: query termine then filter
    if (!missing) {
      const { data: allDone } = await supabase
        .from("termine")
        .select("id, datum, apotheken(name), user_profiles(full_name)")
        .eq("status", "durchgefuehrt")
        .order("datum", { ascending: false })

      const { data: allBerichte } = await supabase
        .from("berichte")
        .select("termin_id, is_draft")
        .eq("is_draft", false)

      const submittedIds = new Set((allBerichte ?? []).map((b: any) => b.termin_id))
      missingReports = (allDone ?? []).filter((t: any) => !submittedIds.has(t.id)).slice(0, 10)
    } else {
      missingReports = missing
    }

    // Active trainers this week
    const { data: weekTermine } = await supabase
      .from("termine")
      .select("trainer_id")
      .gte("datum", weekStart)
      .lte("datum", weekEnd)

    activeTrainersCount = new Set((weekTermine ?? []).map((t: any) => t.trainer_id)).size
  }

  if (role === "trainer") {
    // My next 5 upcoming appointments
    const { data: next } = await supabase
      .from("termine")
      .select("id, datum, zeit_start, zeit_ende, status, apotheken(name)")
      .eq("trainer_id", user!.id)
      .gte("datum", today)
      .neq("status", "abgesagt")
      .order("datum")
      .limit(5)

    myNextTermine = next ?? []

    // My missing reports
    const { data: myDone } = await supabase
      .from("termine")
      .select("id, datum, apotheken(name)")
      .eq("trainer_id", user!.id)
      .eq("status", "durchgefuehrt")
      .order("datum", { ascending: false })

    const { data: myBerichte } = await supabase
      .from("berichte")
      .select("termin_id, is_draft")
      .eq("submitted_by", user!.id)
      .eq("is_draft", false)

    const submittedIds = new Set((myBerichte ?? []).map((b: any) => b.termin_id))
    myMissingReports = (myDone ?? []).filter((t: any) => !submittedIds.has(t.id))
  }

  const isAdmin = role === "admin"
  const isTrainer = role === "trainer"

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {format(new Date(), "EEEE, dd. MMMM yyyy", { locale: de })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Termine heute
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isAdmin ? termineHeute.length : myNextTermine.filter((t: any) => t.datum === today).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isAdmin ? "Alle Trainer" : "Meine Termine"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Termine diese Woche
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isAdmin ? termineWocheCount : myNextTermine.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              KW {format(new Date(), "w", { locale: de })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fehlende Berichte
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(isAdmin ? missingReports : myMissingReports).length > 0 ? "text-destructive" : ""}`}>
              {(isAdmin ? missingReports : myMissingReports).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {(isAdmin ? missingReports : myMissingReports).length === 0 ? "Alles vollständig ✓" : "Ausstehend"}
            </p>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Aktive Trainer
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeTrainersCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Diese Woche</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Missing Reports Alert (Admin) */}
      {isAdmin && missingReports.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {missingReports.length} abgeschlossene{" "}
            {missingReports.length === 1 ? "Termin" : "Termine"} ohne Bericht
          </AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1">
              {missingReports.slice(0, 5).map((t: any) => (
                <li key={t.id} className="text-sm">
                  <Link href={`/termine/${t.id}`} className="underline hover:no-underline">
                    {format(new Date(t.datum), "dd.MM.yyyy", { locale: de })} —{" "}
                    {(t.apotheken as any)?.name ?? "–"} ({(t.user_profiles as any)?.full_name ?? "–"})
                  </Link>
                </li>
              ))}
            </ul>
            {missingReports.length > 5 && (
              <Link href="/berichte" className="mt-2 block text-sm underline hover:no-underline">
                Alle {missingReports.length} anzeigen →
              </Link>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Today's Appointments (Admin) */}
      {isAdmin && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Heute</h2>
          {termineHeute.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Termine heute.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zeit</TableHead>
                    <TableHead>Apotheke</TableHead>
                    <TableHead>Trainer</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {termineHeute.map((t: any) => {
                    const statusConfig = TERMIN_STATUS_CONFIG[t.status as keyof typeof TERMIN_STATUS_CONFIG]
                    return (
                      <TableRow
                        key={t.id}
                        className="cursor-pointer hover:bg-muted/50"
                      >
                        <TableCell className="tabular-nums text-sm">{t.zeit_start}</TableCell>
                        <TableCell className="font-medium">
                          <Link href={`/termine/${t.id}`} className="hover:underline">
                            {(t.apotheken as any)?.name ?? "–"}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {(t.user_profiles as any)?.full_name ?? "–"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={statusConfig?.color}>
                            {statusConfig?.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* Trainer: My Next Appointments */}
      {isTrainer && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Meine nächsten Termine</h2>
          {myNextTermine.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Keine bevorstehenden Termine — kontaktieren Sie Ihren Admin.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {myNextTermine.map((t: any) => {
                const statusConfig = TERMIN_STATUS_CONFIG[t.status as keyof typeof TERMIN_STATUS_CONFIG]
                return (
                  <Link key={t.id} href={`/termine/${t.id}`}>
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                      <CardContent className="pt-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm">{(t.apotheken as any)?.name ?? "–"}</p>
                          <Badge variant="secondary" className={`${statusConfig?.color} shrink-0`}>
                            {statusConfig?.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(t.datum), "EEE, dd.MM.yyyy", { locale: de })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t.zeit_start} – {t.zeit_ende} Uhr
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
          <Link href="/termine" className="text-sm text-primary hover:underline">
            Alle meine Termine →
          </Link>
        </div>
      )}

      {/* Trainer: Missing Reports */}
      {isTrainer && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Fehlende Berichte</h2>
          {myMissingReports.length === 0 ? (
            <p className="text-sm text-muted-foreground">Alle Berichte vollständig ✓</p>
          ) : (
            <ul className="space-y-2">
              {myMissingReports.map((t: any) => (
                <li key={t.id}>
                  <Link href={`/termine/${t.id}`} className="text-sm underline hover:no-underline">
                    {format(new Date(t.datum), "dd.MM.yyyy", { locale: de })} — {(t.apotheken as any)?.name ?? "–"}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Schnellzugriff</h2>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/termine">
              <Plus className="mr-2 h-4 w-4" />
              Termin erstellen
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/kalender">
              <Calendar className="mr-2 h-4 w-4" />
              Kalender öffnen
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/berichte">
              <BarChart3 className="mr-2 h-4 w-4" />
              Berichte anzeigen
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
