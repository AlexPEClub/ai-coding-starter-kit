"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"
import { Upload, Download, Loader2, CheckCircle2, XCircle, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

import { REGIONS } from "@/lib/types"
import type { Region, Priority } from "@/lib/types"
import { importApotheken } from "@/lib/actions/apotheken"

// ─── CSV template ────────────────────────────────────────────────────────────
const CSV_TEMPLATE = [
    "Name,Adresse,PLZ,Ort,Region,Priorität,Notizen",
    "Marien Apotheke,Hauptstraße 1,6020,Innsbruck,Tirol,normal,Beispiel-Notiz",
    "Stadt Apotheke,Rathausplatz 5,4020,Linz,OÖ,top_kunde,",
].join("\n")

// ─── Types ────────────────────────────────────────────────────────────────────
interface ParsedRow {
    rowIndex: number
    name: string
    address: string
    plz: string
    ort: string
    region: string
    priority: string
    notes: string
    errors: string[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function splitCsvLine(line: string, delimiter: string): string[] {
    // Simple CSV split respecting quoted fields
    const result: string[] = []
    let current = ""
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') {
            inQuotes = !inQuotes
        } else if (ch === delimiter && !inQuotes) {
            result.push(current.trim())
            current = ""
        } else {
            current += ch
        }
    }
    result.push(current.trim())
    return result
}

function detectDelimiter(firstLine: string): string {
    const commas = (firstLine.match(/,/g) ?? []).length
    const semicolons = (firstLine.match(/;/g) ?? []).length
    return semicolons > commas ? ";" : ","
}

function parseCsv(text: string): ParsedRow[] {
    const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0)

    if (lines.length < 2) return []

    const delimiter = detectDelimiter(lines[0])
    // Skip header row (index 0)
    return lines.slice(1).map((line, i) => {
        const cols = splitCsvLine(line, delimiter)
        const [name = "", address = "", plz = "", ort = "", region = "", priority = "", notes = ""] = cols

        const errors: string[] = []
        if (!name) errors.push("Name fehlt")
        if (!plz) errors.push("PLZ fehlt")
        if (!ort) errors.push("Ort fehlt")
        if (!region) errors.push("Region fehlt")
        if (region && !(REGIONS as string[]).includes(region)) {
            errors.push(`Ungültige Region "${region}" (erlaubt: ${REGIONS.join(", ")})`)
        }
        const normalizedPriority = priority || "normal"
        if (normalizedPriority !== "normal" && normalizedPriority !== "top_kunde") {
            errors.push(`Ungültige Priorität "${priority}" (erlaubt: normal, top_kunde)`)
        }

        return {
            rowIndex: i + 2, // 1-based row number, starting after header
            name,
            address,
            plz,
            ort,
            region,
            priority: normalizedPriority,
            notes,
            errors,
        }
    })
}

// ─── Component ────────────────────────────────────────────────────────────────
interface ApothekenCsvImportProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onImported?: () => void
}

export function ApothekenCsvImport({ open, onOpenChange, onImported }: ApothekenCsvImportProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [rows, setRows] = useState<ParsedRow[]>([])
    const [fileName, setFileName] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const validRows = rows.filter((r) => r.errors.length === 0)
    const invalidRows = rows.filter((r) => r.errors.length > 0)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setFileName(file.name)
        const reader = new FileReader()
        reader.onload = (ev) => {
            const text = ev.target?.result as string
            setRows(parseCsv(text))
        }
        reader.readAsText(file, "utf-8")
    }

    const handleDownloadTemplate = () => {
        const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "apotheken-vorlage.csv"
        a.click()
        URL.revokeObjectURL(url)
    }

    const handleImport = async () => {
        if (validRows.length === 0) return
        setLoading(true)
        const payload = validRows.map((r) => ({
            name: r.name,
            address: r.address,
            plz: r.plz,
            ort: r.ort,
            region: r.region as Region,
            priority: r.priority as Priority,
            notes: r.notes,
        }))
        const result = await importApotheken(payload)
        setLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            const { imported, skipped } = result
            toast.success(
                `${imported} Apotheke${imported !== 1 ? "n" : ""} importiert` +
                (skipped > 0 ? `, ${skipped} bereits vorhanden übersprungen` : "")
            )
            handleClose()
            onImported?.()
        }
    }

    const handleClose = () => {
        setRows([])
        setFileName(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Apotheken per CSV importieren</DialogTitle>
                    <DialogDescription>
                        Laden Sie eine CSV-Datei hoch. Gültige Zeilen werden als neue Apotheken angelegt.
                        Bereits vorhandene (gleicher Name + PLZ) werden übersprungen.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 py-2">
                    {/* Format description */}
                    <div className="rounded-md border bg-muted/40 p-4 text-sm space-y-2">
                        <p className="font-medium">CSV-Format:</p>
                        <code className="block text-xs font-mono text-muted-foreground whitespace-pre">
                            {`Name,Adresse,PLZ,Ort,Region,Priorität,Notizen\nMarien Apotheke,Hauptstraße 1,6020,Innsbruck,Tirol,normal,Optional`}
                        </code>
                        <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside mt-1">
                            <li><strong>Pflicht:</strong> Name, PLZ, Ort, Region</li>
                            <li><strong>Region:</strong> {REGIONS.join(" | ")}</li>
                            <li><strong>Priorität:</strong> normal | top_kunde (Standard: normal)</li>
                            <li>Trennzeichen: Komma <code>,</code> oder Semikolon <code>;</code> (wird automatisch erkannt)</li>
                            <li>Erste Zeile = Kopfzeile (wird übersprungen)</li>
                        </ul>
                        <Button size="sm" variant="outline" onClick={handleDownloadTemplate} className="mt-1">
                            <Download className="mr-2 h-3.5 w-3.5" />
                            Vorlage herunterladen
                        </Button>
                    </div>

                    {/* File upload */}
                    <div
                        className="rounded-md border-2 border-dashed p-6 text-center cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {fileName ? (
                            <div className="flex items-center justify-center gap-2 text-sm">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{fileName}</span>
                                <span className="text-muted-foreground">— {rows.length} Zeile{rows.length !== 1 ? "n" : ""} erkannt</span>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">CSV-Datei auswählen oder hierher ziehen</p>
                                <p className="text-xs text-muted-foreground">Unterstützt: .csv</p>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,text/csv"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>

                    {/* Preview table */}
                    {rows.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 text-sm">
                                <span className="flex items-center gap-1 text-green-700">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {validRows.length} gültig
                                </span>
                                {invalidRows.length > 0 && (
                                    <span className="flex items-center gap-1 text-destructive">
                                        <XCircle className="h-3.5 w-3.5" />
                                        {invalidRows.length} fehlerhaft
                                    </span>
                                )}
                            </div>
                            <div className="rounded-md border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-10">#</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>PLZ / Ort</TableHead>
                                            <TableHead>Region</TableHead>
                                            <TableHead>Priorität</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rows.slice(0, 50).map((row) => (
                                            <TableRow
                                                key={row.rowIndex}
                                                className={row.errors.length > 0 ? "bg-destructive/5" : ""}
                                            >
                                                <TableCell className="text-muted-foreground text-xs">{row.rowIndex}</TableCell>
                                                <TableCell className="font-medium text-sm">{row.name || <span className="text-destructive italic">leer</span>}</TableCell>
                                                <TableCell className="text-sm">{row.plz} {row.ort}</TableCell>
                                                <TableCell className="text-sm">{row.region}</TableCell>
                                                <TableCell className="text-sm">
                                                    {row.priority === "top_kunde"
                                                        ? <Badge variant="secondary" className="text-xs">Top-Kunde</Badge>
                                                        : <span className="text-muted-foreground text-xs">Normal</span>
                                                    }
                                                </TableCell>
                                                <TableCell>
                                                    {row.errors.length === 0 ? (
                                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <div className="space-y-0.5">
                                                            {row.errors.map((e, i) => (
                                                                <p key={i} className="text-xs text-destructive">{e}</p>
                                                            ))}
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {rows.length > 50 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-2">
                                                    ... und {rows.length - 50} weitere Zeilen
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={loading}>
                        Abbrechen
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={validRows.length === 0 || loading}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {validRows.length > 0
                            ? `${validRows.length} Apotheke${validRows.length !== 1 ? "n" : ""} importieren`
                            : "Importieren"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
