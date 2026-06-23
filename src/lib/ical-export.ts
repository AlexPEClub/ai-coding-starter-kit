interface IcalExportOptions {
  uid: string
  summary: string
  startDate: string // YYYY-MM-DD
  endDate: string   // YYYY-MM-DD
  description?: string | null
  location?: string | null
}

export function exportToIcal(opts: IcalExportOptions): void {
  const dtstart = opts.startDate.replace(/-/g, '')

  // For all-day events DTEND is exclusive (day after last day).
  // Use UTC arithmetic to avoid off-by-one in UTC+ timezones (e.g. Germany UTC+1/+2).
  const [ey, em, ed] = opts.endDate.split('-').map(Number)
  const dtend = new Date(Date.UTC(ey, em - 1, ed + 1)).toISOString().slice(0, 10).replace(/-/g, '')

  const now = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ZUSAMMEN//ZUSAMMEN//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${opts.uid}@zusammen.app`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${dtstart}`,
    `DTEND;VALUE=DATE:${dtend}`,
    `SUMMARY:${escapeText(opts.summary)}`,
    ...(opts.description ? [`DESCRIPTION:${escapeText(opts.description)}`] : []),
    ...(opts.location ? [`LOCATION:${escapeText(opts.location)}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  const content = lines.join('\r\n')
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${opts.summary.replace(/[^a-z0-9äöüÄÖÜß]/gi, '-').slice(0, 60)}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function escapeText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}
