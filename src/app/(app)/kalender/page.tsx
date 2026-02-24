"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import deLocale from "@fullcalendar/core/locales/de"
import type { EventClickArg, EventDropArg } from "@fullcalendar/core"
import { ChevronLeft, ChevronRight, CalendarDays, Link2, RefreshCw, Copy, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { TerminDetailSheet } from "@/components/termin-detail-sheet"

import { getTermine } from "@/lib/actions/termine"
import { getUsers } from "@/lib/actions/users"
import { regenerateCalendarToken } from "@/lib/actions/users"
import { TERMIN_STATUS_CONFIG, REGIONS } from "@/lib/types"
import type { Termin } from "@/lib/types"
import { useUser } from "@/lib/user-context"

// Map status → FullCalendar event color
const STATUS_COLORS: Record<string, string> = {
    geplant: "#6b7280",
    fixiert: "#3b82f6",
    durchgefuehrt: "#22c55e",
    abgesagt: "#ef4444",
}

export default function KalenderPage() {
    const calendarRef = useRef<FullCalendar>(null)
    const [view, setView] = useState<"timeGridWeek" | "dayGridMonth">("timeGridWeek")
    const [trainerFilter, setTrainerFilter] = useState("alle")
    const [regionFilter, setRegionFilter] = useState("alle")
    const [selectedTermin, setSelectedTermin] = useState<any | null>(null)
    const [sheetOpen, setSheetOpen] = useState(false)
    const [title, setTitle] = useState("")
    const [events, setEvents] = useState<any[]>([])
    const [trainers, setTrainers] = useState<{ id: string; full_name: string }[]>([])
    const [calendarToken, setCalendarToken] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [regenerating, setRegenerating] = useState(false)

    const { user } = useUser()
    const isAdmin = user?.role === "admin"

    // Load trainers for filter dropdown (admin only)
    useEffect(() => {
        if (isAdmin) {
            getUsers().then((data) => {
                setTrainers(
                    (data as any[])
                        .filter((u) => u.role === "trainer" && u.is_active)
                        .map((u) => ({ id: u.id, full_name: u.full_name }))
                )
            })
        }
    }, [isAdmin])

    // Load the user's calendar token from their profile
    useEffect(() => {
        if (user) {
            setCalendarToken((user as any).calendar_token ?? null)
        }
    }, [user])

    // Load termine from Supabase
    const load = useCallback(async () => {
        const result = await getTermine({
            trainerId: trainerFilter !== "alle" ? trainerFilter : undefined,
            region: regionFilter !== "alle" ? regionFilter : undefined,
            pageSize: 500, // load all for calendar view
        })

        const calEvents = result.data.map((t: any) => ({
            id: t.id,
            title: (t.apotheke as any)?.name ?? "Apotheke",
            start: `${t.datum}T${t.zeit_start}`,
            end: `${t.datum}T${t.zeit_ende}`,
            backgroundColor: STATUS_COLORS[t.status] ?? "#6b7280",
            borderColor: STATUS_COLORS[t.status] ?? "#6b7280",
            extendedProps: { termin: t },
        }))
        setEvents(calEvents)
    }, [trainerFilter, regionFilter])

    useEffect(() => { load() }, [load])

    const handleEventClick = (info: EventClickArg) => {
        const termin = info.event.extendedProps.termin as Termin
        if (termin) {
            setSelectedTermin(termin)
            setSheetOpen(true)
        }
    }

    const handleEventDrop = async (info: EventDropArg) => {
        if (!isAdmin) {
            info.revert()
            return
        }
        // Update datum via Server Action
        const { updateTermin } = await import("@/lib/actions/termine")
        const newDate = info.event.startStr.split("T")[0]
        const result = await updateTermin(info.event.id, { datum: newDate })
        if (result.error) {
            info.revert()
        } else {
            load()
        }
    }

    const icsUrl = calendarToken
        ? `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/kalender/${calendarToken}`
        : null

    const handleCopyUrl = async () => {
        if (!icsUrl) return
        await navigator.clipboard.writeText(icsUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleRegenerateToken = async () => {
        setRegenerating(true)
        const result = await regenerateCalendarToken()
        setRegenerating(false)
        if (result.token) {
            setCalendarToken(result.token)
        }
    }

    const handleViewChange = (newView: "timeGridWeek" | "dayGridMonth") => {
        setView(newView)
        calendarRef.current?.getApi().changeView(newView)
    }

    const handlePrev = () => calendarRef.current?.getApi().prev()
    const handleNext = () => calendarRef.current?.getApi().next()
    const handleToday = () => calendarRef.current?.getApi().today()

    const updateTitle = () => {
        const api = calendarRef.current?.getApi()
        if (api) setTitle(api.view.title)
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-bold">Kalender</h1>

                {/* View toggle */}
                <div className="flex items-center gap-1 rounded-md border p-1">
                    <Button
                        variant={view === "timeGridWeek" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => handleViewChange("timeGridWeek")}
                    >
                        Woche
                    </Button>
                    <Button
                        variant={view === "dayGridMonth" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => handleViewChange("dayGridMonth")}
                    >
                        Monat
                    </Button>
                </div>
            </div>

            {/* Filters (Admin only) */}
            {isAdmin && (
                <div className="flex flex-wrap items-center gap-3">
                    <Select value={trainerFilter} onValueChange={setTrainerFilter}>
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

                    <Select value={regionFilter} onValueChange={setRegionFilter}>
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
                </div>
            )}

            {/* Navigation */}
            <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={handlePrev}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleNext}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleToday}>
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Heute
                </Button>
                {title && (
                    <span className="text-sm font-medium text-muted-foreground">{title}</span>
                )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
                {Object.entries(TERMIN_STATUS_CONFIG).map(([key, config]) => (
                    <div key={key} className="flex items-center gap-1.5">
                        <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: STATUS_COLORS[key] }}
                        />
                        <span className="text-muted-foreground">{config.label}</span>
                    </div>
                ))}
            </div>

            {/* Calendar */}
            <div className="rounded-lg border bg-background p-1">
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView={view}
                    locale={deLocale}
                    events={events}
                    editable={isAdmin}
                    droppable={isAdmin}
                    eventClick={handleEventClick}
                    eventDrop={handleEventDrop}
                    headerToolbar={false}
                    height="auto"
                    slotMinTime="07:00:00"
                    slotMaxTime="20:00:00"
                    allDaySlot={false}
                    nowIndicator
                    datesSet={updateTitle}
                    eventTimeFormat={{
                        hour: "2-digit",
                        minute: "2-digit",
                        meridiem: false,
                    }}
                />
            </div>

            {/* Detail Sheet */}
            {selectedTermin && (
                <TerminDetailSheet
                    open={sheetOpen}
                    onOpenChange={(open) => {
                        setSheetOpen(open)
                        if (!open) load()
                    }}
                    termin={selectedTermin}
                />
            )}

            {/* ICS Calendar Subscription */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-base">Kalender abonnieren</CardTitle>
                    </div>
                    <CardDescription>
                        Trage diese URL in Google Kalender, Apple Kalender oder Outlook ein — deine Termine werden automatisch synchronisiert.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {icsUrl ? (
                        <>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 truncate rounded bg-muted px-3 py-2 text-xs font-mono">
                                    {icsUrl}
                                </code>
                                <Button size="sm" variant="outline" onClick={handleCopyUrl}>
                                    {copied ? (
                                        <><Check className="mr-1.5 h-3.5 w-3.5 text-green-600" />Kopiert</>
                                    ) : (
                                        <><Copy className="mr-1.5 h-3.5 w-3.5" />Kopieren</>
                                    )}
                                </Button>
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">
                                    <strong>Google Kalender:</strong> Weitere Kalender → Per URL → URL einfügen<br />
                                    <strong>Apple Kalender:</strong> Ablage → Neues Kalenderabo → URL einfügen<br />
                                    <strong>Outlook:</strong> Kalender hinzufügen → Aus dem Internet → URL einfügen
                                </p>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleRegenerateToken}
                                    disabled={regenerating}
                                    className="text-xs text-muted-foreground shrink-0"
                                >
                                    <RefreshCw className={`mr-1.5 h-3 w-3 ${regenerating ? "animate-spin" : ""}`} />
                                    URL erneuern
                                </Button>
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-muted-foreground">Kalender-Token wird geladen...</p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
