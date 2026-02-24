import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

// Format a date+time string to iCalendar DATETIME format (YYYYMMDDTHHMMSS)
function toIcsDateTime(datum: string, time: string): string {
    // datum: "2025-03-15", time: "09:00" or "09:00:00"
    const d = datum.replace(/-/g, "")
    const t = time.replace(/:/g, "").slice(0, 6).padEnd(6, "0")
    return `${d}T${t}`
}

function toIcsDtstamp(): string {
    return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
}

// Map termin status to iCalendar STATUS
function toIcsStatus(status: string): string {
    switch (status) {
        case "fixiert":
        case "durchgefuehrt":
            return "CONFIRMED"
        case "abgesagt":
            return "CANCELLED"
        default:
            return "TENTATIVE"
    }
}

// Escape special characters in iCalendar text values
function escapeIcsText(text: string): string {
    return (text ?? "")
        .replace(/\\/g, "\\\\")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,")
        .replace(/\n/g, "\\n")
}

// Fold long lines (iCal spec: max 75 octets per line)
function foldLine(line: string): string {
    const bytes = new TextEncoder().encode(line)
    if (bytes.length <= 75) return line
    const parts: string[] = []
    let pos = 0
    while (pos < bytes.length) {
        const chunk = bytes.slice(pos, pos + (pos === 0 ? 75 : 74))
        parts.push(new TextDecoder().decode(chunk))
        pos += pos === 0 ? 75 : 74
    }
    return parts.join("\r\n ")
}

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    const { token } = await params

    if (!token) {
        return new NextResponse("Token fehlt", { status: 400 })
    }

    const supabase = createAdminClient()

    // Look up the user by calendar token
    const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("id, full_name, role")
        .eq("calendar_token", token)
        .maybeSingle()

    if (profileError || !profile) {
        return new NextResponse("Ungültiger Token", { status: 404 })
    }

    // Fetch termine based on role
    let query = supabase
        .from("termine")
        .select(`
            id, datum, zeit_start, zeit_ende, status, notiz,
            apotheke:apotheken(name, ort, address, plz)
        `)
        .neq("status", "abgesagt")
        .order("datum", { ascending: true })
        .limit(500)

    // Trainers only see their own appointments
    if (profile.role === "trainer") {
        query = query.eq("trainer_id", profile.id)
    }

    const { data: termine, error: termineError } = await query

    if (termineError) {
        return new NextResponse("Fehler beim Laden der Termine", { status: 500 })
    }

    // Build iCalendar content
    const dtstamp = toIcsDtstamp()
    const calName = `Apo-Schulungen – ${profile.full_name}`

    const lines: string[] = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Apo-Schulungs-Manager//DE",
        `X-WR-CALNAME:${escapeIcsText(calName)}`,
        "X-WR-TIMEZONE:Europe/Vienna",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        // Timezone definition for Europe/Vienna
        "BEGIN:VTIMEZONE",
        "TZID:Europe/Vienna",
        "BEGIN:STANDARD",
        "DTSTART:19701025T030000",
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10",
        "TZOFFSETFROM:+0200",
        "TZOFFSETTO:+0100",
        "TZNAME:CET",
        "END:STANDARD",
        "BEGIN:DAYLIGHT",
        "DTSTART:19700329T020000",
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3",
        "TZOFFSETFROM:+0100",
        "TZOFFSETTO:+0200",
        "TZNAME:CEST",
        "END:DAYLIGHT",
        "END:VTIMEZONE",
    ]

    for (const t of termine ?? []) {
        const apotheke = t.apotheke as any
        const summary = apotheke?.name ?? "Apotheke"
        const location = apotheke
            ? `${apotheke.address ? apotheke.address + ", " : ""}${apotheke.plz} ${apotheke.ort}`.trim()
            : ""
        const description = t.notiz ? `Notiz: ${t.notiz}` : ""

        lines.push("BEGIN:VEVENT")
        lines.push(`UID:${t.id}@apo-schulungs-manager`)
        lines.push(`DTSTAMP:${dtstamp}`)
        lines.push(`DTSTART;TZID=Europe/Vienna:${toIcsDateTime(t.datum, t.zeit_start)}`)
        lines.push(`DTEND;TZID=Europe/Vienna:${toIcsDateTime(t.datum, t.zeit_ende)}`)
        lines.push(`SUMMARY:${escapeIcsText(summary)}`)
        if (location) lines.push(`LOCATION:${escapeIcsText(location)}`)
        if (description) lines.push(`DESCRIPTION:${escapeIcsText(description)}`)
        lines.push(`STATUS:${toIcsStatus(t.status)}`)
        lines.push("END:VEVENT")
    }

    lines.push("END:VCALENDAR")

    const icsContent = lines.map(foldLine).join("\r\n") + "\r\n"

    return new NextResponse(icsContent, {
        status: 200,
        headers: {
            "Content-Type": "text/calendar; charset=utf-8",
            "Content-Disposition": 'attachment; filename="termine.ics"',
            "Cache-Control": "no-cache, no-store, must-revalidate",
        },
    })
}
