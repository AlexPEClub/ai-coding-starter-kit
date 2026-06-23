import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { exportToIcal } from './ical-export'

// ─── DOM mocks ────────────────────────────────────────────────────────────────

let capturedBlob: Blob | null = null
let capturedDownloadName = ''
let anchorClicked = false

beforeEach(() => {
  capturedBlob = null
  capturedDownloadName = ''
  anchorClicked = false

  vi.spyOn(URL, 'createObjectURL').mockImplementation((obj) => {
    capturedBlob = obj as Blob
    return 'blob:mock'
  })
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

  const mockAnchor = {
    href: '',
    get download() { return capturedDownloadName },
    set download(v: string) { capturedDownloadName = v },
    click() { anchorClicked = true },
  }
  vi.spyOn(document, 'createElement').mockImplementation((tag) => {
    if (tag === 'a') return mockAnchor as unknown as HTMLElement
    return document.createElement.wrappedObject?.call(document, tag) ?? document.createElement(tag)
  })
  vi.spyOn(document.body, 'appendChild').mockImplementation((n) => n)
  vi.spyOn(document.body, 'removeChild').mockImplementation((n) => n)
})

afterEach(() => {
  vi.restoreAllMocks()
})

async function getContent(): Promise<string> {
  if (!capturedBlob) throw new Error('No blob was created')
  return capturedBlob.text()
}

// ─── RFC-5545 structure ───────────────────────────────────────────────────────

describe('RFC-5545 structure', () => {
  it('generates correct VCALENDAR/VEVENT wrapper', async () => {
    exportToIcal({ uid: 'x', summary: 'Test', startDate: '2024-06-15', endDate: '2024-06-15' })
    const c = await getContent()
    expect(c).toContain('BEGIN:VCALENDAR')
    expect(c).toContain('VERSION:2.0')
    expect(c).toContain('CALSCALE:GREGORIAN')
    expect(c).toContain('BEGIN:VEVENT')
    expect(c).toContain('END:VEVENT')
    expect(c).toContain('END:VCALENDAR')
  })

  it('uses CRLF line endings', async () => {
    exportToIcal({ uid: 'x', summary: 'Test', startDate: '2024-06-15', endDate: '2024-06-15' })
    expect(await getContent()).toContain('\r\n')
  })

  it('sets stable UID with @zusammen.app domain', async () => {
    exportToIcal({ uid: 'act-uuid-999', summary: 'Test', startDate: '2024-06-15', endDate: '2024-06-15' })
    expect(await getContent()).toContain('UID:act-uuid-999@zusammen.app')
  })
})

// ─── DTSTART / DTEND ─────────────────────────────────────────────────────────

describe('DTSTART and DTEND', () => {
  it('DTSTART is formatted as VALUE=DATE (YYYYMMDD)', async () => {
    exportToIcal({ uid: 'x', summary: 'T', startDate: '2024-08-05', endDate: '2024-08-05' })
    expect(await getContent()).toContain('DTSTART;VALUE=DATE:20240805')
  })

  it('DTEND is exclusive — single-day event ends next day', async () => {
    exportToIcal({ uid: 'x', summary: 'T', startDate: '2024-06-15', endDate: '2024-06-15' })
    expect(await getContent()).toContain('DTEND;VALUE=DATE:20240616')
  })

  it('DTEND is exclusive — multi-day event ends day after endDate', async () => {
    exportToIcal({ uid: 'x', summary: 'T', startDate: '2024-06-10', endDate: '2024-06-17' })
    expect(await getContent()).toContain('DTEND;VALUE=DATE:20240618')
  })

  it('DTEND crosses month boundary correctly (Jan 31 → Feb 1)', async () => {
    exportToIcal({ uid: 'x', summary: 'T', startDate: '2024-01-31', endDate: '2024-01-31' })
    expect(await getContent()).toContain('DTEND;VALUE=DATE:20240201')
  })

  it('DTEND crosses year boundary correctly (Dec 31 → Jan 1)', async () => {
    exportToIcal({ uid: 'x', summary: 'T', startDate: '2024-12-31', endDate: '2024-12-31' })
    expect(await getContent()).toContain('DTEND;VALUE=DATE:20250101')
  })
})

// ─── SUMMARY / optional fields ────────────────────────────────────────────────

describe('SUMMARY and optional fields', () => {
  it('includes SUMMARY with activity name', async () => {
    exportToIcal({ uid: 'x', summary: 'Wandertag im Schwarzwald', startDate: '2024-08-01', endDate: '2024-08-07' })
    expect(await getContent()).toContain('SUMMARY:Wandertag im Schwarzwald')
  })

  it('includes DESCRIPTION when provided', async () => {
    exportToIcal({ uid: 'x', summary: 'T', startDate: '2024-08-01', endDate: '2024-08-01', description: 'Wir treffen uns um 10 Uhr' })
    expect(await getContent()).toContain('DESCRIPTION:Wir treffen uns um 10 Uhr')
  })

  it('omits DESCRIPTION when null', async () => {
    exportToIcal({ uid: 'x', summary: 'T', startDate: '2024-08-01', endDate: '2024-08-01', description: null })
    expect(await getContent()).not.toContain('DESCRIPTION:')
  })

  it('omits DESCRIPTION when undefined', async () => {
    exportToIcal({ uid: 'x', summary: 'T', startDate: '2024-08-01', endDate: '2024-08-01' })
    expect(await getContent()).not.toContain('DESCRIPTION:')
  })

  it('includes LOCATION when provided', async () => {
    exportToIcal({ uid: 'x', summary: 'T', startDate: '2024-08-01', endDate: '2024-08-01', location: 'Biergarten Englischer Garten' })
    expect(await getContent()).toContain('LOCATION:Biergarten Englischer Garten')
  })

  it('omits LOCATION when null', async () => {
    exportToIcal({ uid: 'x', summary: 'T', startDate: '2024-08-01', endDate: '2024-08-01', location: null })
    expect(await getContent()).not.toContain('LOCATION:')
  })
})

// ─── Text escaping ────────────────────────────────────────────────────────────

describe('RFC-5545 text escaping', () => {
  it('escapes backslash in summary', async () => {
    exportToIcal({ uid: 'x', summary: 'C:\\Folder\\Event', startDate: '2024-08-01', endDate: '2024-08-01' })
    expect(await getContent()).toContain('SUMMARY:C:\\\\Folder\\\\Event')
  })

  it('escapes semicolons in summary', async () => {
    exportToIcal({ uid: 'x', summary: 'Test;Event', startDate: '2024-08-01', endDate: '2024-08-01' })
    expect(await getContent()).toContain('SUMMARY:Test\\;Event')
  })

  it('escapes commas in summary', async () => {
    exportToIcal({ uid: 'x', summary: 'Event,Ausflug', startDate: '2024-08-01', endDate: '2024-08-01' })
    expect(await getContent()).toContain('SUMMARY:Event\\,Ausflug')
  })

  it('escapes newlines in description', async () => {
    exportToIcal({ uid: 'x', summary: 'T', startDate: '2024-08-01', endDate: '2024-08-01', description: 'Zeile1\nZeile2' })
    expect(await getContent()).toContain('DESCRIPTION:Zeile1\\nZeile2')
  })
})

// ─── Download trigger ─────────────────────────────────────────────────────────

describe('Download trigger', () => {
  it('triggers anchor click for download', () => {
    exportToIcal({ uid: 'x', summary: 'Test', startDate: '2024-08-01', endDate: '2024-08-01' })
    expect(anchorClicked).toBe(true)
  })

  it('filename ends with .ics', () => {
    exportToIcal({ uid: 'x', summary: 'Strandurlaub', startDate: '2024-08-01', endDate: '2024-08-01' })
    expect(capturedDownloadName).toMatch(/\.ics$/)
  })

  it('filename is sanitized (no special chars other than hyphen and word chars)', () => {
    exportToIcal({ uid: 'x', summary: 'Wander!tag & Picknick?', startDate: '2024-08-01', endDate: '2024-08-01' })
    expect(capturedDownloadName).not.toMatch(/[!&?]/)
  })

  it('revokes blob URL after download', () => {
    exportToIcal({ uid: 'x', summary: 'Test', startDate: '2024-08-01', endDate: '2024-08-01' })
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock')
  })
})
