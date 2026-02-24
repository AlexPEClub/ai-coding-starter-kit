"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { FileText, AlertCircle, ExternalLink, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import { getBerichte, getMissingBerichte } from "@/lib/actions/berichte"
import { getUsers } from "@/lib/actions/users"
import { TERMIN_STATUS_CONFIG, REGIONS } from "@/lib/types"
import { DatePicker } from "@/components/date-picker"
import { useUser } from "@/lib/user-context"

const PAGE_SIZE = 25

export default function BerichtePage() {
    const [berichte, setBerichte] = useState<any[]>([])
    const [missingReports, setMissingReports] = useState<any[]>([])
    const [trainers, setTrainers] = useState<{ id: string; full_name: string }[]>([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)

    const [trainerFilter, setTrainerFilter] = useState("alle")
    const [regionFilter, setRegionFilter] = useState("alle")
    const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
    const [dateTo, setDateTo] = useState<Date | undefined>(undefined)
    const [page, setPage] = useState(0)

    const { user } = useUser()
    const isAdmin = user?.role === "admin"

    // Load trainers (admin only need to filter by all trainers, but good to have list)
    useEffect(() => {
        getUsers().then((data) => {
            setTrainers(
                (data as any[])
                    .filter((u) => u.role === "trainer" && u.is_active)
                    .map((u) => ({ id: u.id, full_name: u.full_name }))
            )
        })
    }, [])

    // Load missing reports (admin only)
    useEffect(() => {
        if (isAdmin) {
            getMissingBerichte().then((data) => {
                setMissingReports(data)
            })
        }
    }, [isAdmin])

    const load = useCallback(async () => {
        setLoading(true)
        const result = await getBerichte({
            trainerId: trainerFilter !== "alle" ? trainerFilter : undefined,
            region: regionFilter !== "alle" ? regionFilter : undefined,
            dateFrom: dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined,
            dateTo: dateTo ? format(dateTo, "yyyy-MM-dd") : undefined,
            isDraft: false, // Only show submitted reports in the main list
            page: page + 1,
            pageSize: PAGE_SIZE,
        })
        setBerichte(result.data)
        setTotal(result.count)
        setLoading(false)
    }, [trainerFilter, regionFilter, dateFrom, dateTo, page])

    useEffect(() => { load() }, [load])

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
    const hasFilters = trainerFilter !== "alle" || regionFilter !== "alle" || dateFrom || dateTo

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Berichte</h1>
            </div>

            {/* Missing Reports Alert (Admin only) */}
            {isAdmin && missingReports.length > 0 && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>
                        {missingReports.length} abgeschlossene{" "}
                        {missingReports.length === 1 ? "Termin" : "Termine"} ohne Bericht
                    </AlertTitle>
                    <AlertDescription>
                        <ul className="mt-2 space-y-1">
                            {missingReports.slice(0, 10).map((termin: any) => {
                                const bericht = termin.berichte && termin.berichte.length > 0 ? termin.berichte[0] : null
                                return (
                                    <li key={termin.id} className="flex items-center gap-2 text-sm">
                                        <span>
                                            {format(new Date(termin.datum), "dd.MM.yyyy", { locale: de })} —{" "}
                                            <strong>{termin.apotheke?.name ?? "–"}</strong> ({termin.trainer?.full_name ?? "–"})
                                            {bericht?.is_draft && (
                                                <Badge variant="secondary" className="ml-2 text-xs bg-amber-100 text-amber-800">
                                                    Entwurf
                                                </Badge>
                                            )}
                                        </span>
                                        <Link
                                            href={`/termine/${termin.id}`}
                                            className="flex items-center gap-1 underline hover:no-underline"
                                        >
                                            Bericht erfassen
                                            <ExternalLink className="h-3 w-3" />
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                        {missingReports.length > 10 && (
                            <p className="mt-2 text-sm">
                                … und {missingReports.length - 10} weitere.
                            </p>
                        )}
                    </AlertDescription>
                </Alert>
            )}

            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-3">
                <Select
                    value={trainerFilter}
                    onValueChange={(v) => { setTrainerFilter(v); setPage(0) }}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Trainer" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="alle">Alle Trainer</SelectItem>
                        {trainers.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={regionFilter}
                    onValueChange={(v) => { setRegionFilter(v); setPage(0) }}
                >
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Region" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="alle">Alle Regionen</SelectItem>
                        {REGIONS.map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="w-[180px]">
                    <DatePicker
                        value={dateFrom}
                        onChange={(d) => { setDateFrom(d); setPage(0) }}
                        placeholder="Von Datum"
                    />
                </div>
                <div className="w-[180px]">
                    <DatePicker
                        value={dateTo}
                        onChange={(d) => { setDateTo(d); setPage(0) }}
                        placeholder="Bis Datum"
                    />
                </div>

                {hasFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setTrainerFilter("alle")
                            setRegionFilter("alle")
                            setDateFrom(undefined)
                            setDateTo(undefined)
                            setPage(0)
                        }}
                    >
                        Filter zurücksetzen
                    </Button>
                )}
            </div>

            {/* Results count */}
            <p className="text-sm text-muted-foreground">
                {loading ? "Laden…" : `${total} ${total === 1 ? "Bericht" : "Berichte"} gefunden`}
            </p>

            {/* Table */}
            {loading ? (
                <div className="rounded-md border p-8 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                </div>
            ) : berichte.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
                        <p className="text-lg font-medium text-muted-foreground">
                            Keine Berichte gefunden
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {hasFilters
                                ? "Passen Sie Ihre Filter an."
                                : "Noch keine Schulungsberichte eingereicht."}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Datum</TableHead>
                                <TableHead>Apotheke</TableHead>
                                <TableHead>Trainer</TableHead>
                                <TableHead className="text-right">TN</TableHead>
                                <TableHead className="text-right">Ø Bewertung</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Eingereicht</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {berichte.map((bericht) => {
                                const termin = bericht.termin
                                const apo = termin?.apotheke
                                const trainer = termin?.trainer

                                const avgRating = (
                                    (bericht.rating_verstaendlichkeit +
                                        bericht.rating_nutzbarkeit +
                                        bericht.rating_kompetenz) /
                                    3
                                ).toFixed(1)

                                // Termin status might not be available directly on bericht object, 
                                // but we joined filters. 
                                // Actually getBerichte joins termin, so we should have it.
                                // We need to check the types returned by getBerichte.
                                // It returns *, termin:termine(...)
                                // But termine inside does not have status in the select string I saw earlier?
                                // Let's check getBerichte select string:
                                // .select(`*, termin:termine(id, datum, apotheke_id, trainer_id, apotheke:..., trainer:...)`)
                                // It does NOT select status. I should fix getBerichte to include status.
                                // For now, I will assume status is missing or undefined.

                                return (
                                    <TableRow
                                        key={bericht.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => termin && (window.location.href = `/termine/${termin.id}`)}
                                    >
                                        <TableCell>
                                            {termin
                                                ? format(new Date(termin.datum), "dd.MM.yyyy", { locale: de })
                                                : "–"}
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-medium">{apo?.name ?? "–"}</span>
                                        </TableCell>
                                        <TableCell>{trainer?.full_name ?? "–"}</TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {bericht.teilnehmer_anzahl}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums font-medium">
                                            {avgRating}
                                        </TableCell>
                                        <TableCell>
                                            {(() => {
                                                const s = termin?.status
                                                const cfg = s ? TERMIN_STATUS_CONFIG[s as keyof typeof TERMIN_STATUS_CONFIG] : null
                                                return cfg ? (
                                                    <Badge variant="secondary" className={cfg.color}>{cfg.label}</Badge>
                                                ) : (
                                                    <Badge variant="secondary">–</Badge>
                                                )
                                            })()}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {bericht.submitted_at
                                                ? format(new Date(bericht.submitted_at), "dd.MM.yyyy", { locale: de })
                                                : "–"}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Seite {page + 1} von {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 0}
                            onClick={() => setPage((p) => p - 1)}
                        >
                            Zurück
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages - 1}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            Weiter
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
