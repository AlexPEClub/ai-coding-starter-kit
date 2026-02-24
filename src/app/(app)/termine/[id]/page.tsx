"use client"

import { use, useState, useEffect } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import {
    ArrowLeft,
    Building2,
    User,
    CalendarDays,
    Clock,
    Route,
    MessageSquare,
    CheckCircle2,
    AlertCircle,
    Pencil,
    FileText,
    Loader2
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { getTermin, updateTerminStatus } from "@/lib/actions/termine"
import { upsertBericht } from "@/lib/actions/berichte"
import { TERMIN_STATUS_CONFIG } from "@/lib/types"
import type { TerminStatus, Bericht } from "@/lib/types"
import { TerminCancelDialog } from "@/components/termin-cancel-dialog"
import { useUser } from "@/lib/user-context"

const RATING_SCALE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

function RatingSelector({
    label,
    value,
    onChange,
}: {
    label: string
    value: number
    onChange: (v: number) => void
}) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="flex gap-1 flex-wrap">
                {RATING_SCALE.map((n) => (
                    <button
                        key={n}
                        type="button"
                        onClick={() => onChange(n)}
                        className={`h-9 w-9 rounded-md border text-sm font-medium transition-colors ${value === n
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-muted border-input"
                            }`}
                    >
                        {n}
                    </button>
                ))}
            </div>
        </div>
    )
}

export default function TerminDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = use(params)
    const [termin, setTermin] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)
    const { user } = useUser()

    const [status, setStatus] = useState<TerminStatus>("geplant")
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
    const [berichtMode, setBerichtMode] = useState<"view" | "edit">("view")

    // Bericht form state
    const [tn, setTn] = useState("")
    const [dauer, setDauer] = useState("")
    const [ratingV, setRatingV] = useState(0)
    const [ratingN, setRatingN] = useState(0)
    const [ratingK, setRatingK] = useState(0)
    const [themen, setThemen] = useState("")
    const [interneNotiz, setInterneNotiz] = useState("")

    // We store the current report here. If it's a draft or submitted, it's here.
    const [currentBericht, setCurrentBericht] = useState<Bericht | null>(null)
    const [formErrors, setFormErrors] = useState<string[]>([])
    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => {
        load()
    }, [id])

    async function load() {
        setLoading(true)
        try {
            const data = await getTermin(id)
            setTermin(data)
            setStatus(data.status)

            // Check for existing bericht (array due to join)
            const berichte = (data.berichte as any[]) || []
            if (berichte.length > 0) {
                const b = berichte[0]
                setCurrentBericht(b)
                setTn(b.teilnehmer_anzahl?.toString() ?? "")
                setDauer(b.dauer_stunden?.toString() ?? "")
                setRatingV(b.rating_verstaendlichkeit ?? 0)
                setRatingN(b.rating_nutzbarkeit ?? 0)
                setRatingK(b.rating_kompetenz ?? 0)
                setThemen(b.themen ?? "")
                setInterneNotiz(b.interne_notiz ?? "")

                // If it's a draft, default to edit mode. If submitted, default to view.
                setBerichtMode(b.is_draft ? "edit" : "view")
            } else {
                // No bericht yet
                setBerichtMode("edit")
            }

        } catch (e) {
            console.error(e)
            toast.error("Termin konnte nicht geladen werden")
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

    if (!termin) {
        return (
            <div className="space-y-4">
                <Link href="/termine" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" /> Zurück zu Termine
                </Link>
                <p className="text-muted-foreground">Termin nicht gefunden.</p>
            </div>
        )
    }

    const apotheke = termin.apotheke
    const trainer = termin.trainer
    const tour = termin.tour
    const statusConfig = TERMIN_STATUS_CONFIG[status]
    const isAdmin = user?.role === "admin"
    const isTrainer = user?.role === "trainer"
    const canEditBericht = isAdmin || isTrainer

    const isDurchgefuehrt = status === "durchgefuehrt"
    const isAbgesagt = status === "abgesagt"

    const handleStatusChange = async (newStatus: TerminStatus) => {
        if (newStatus === "abgesagt") {
            setCancelDialogOpen(true)
            return
        }

        const result = await updateTerminStatus(termin.id, newStatus)
        if (result.error) {
            toast.error(result.error)
        } else {
            setStatus(newStatus)
            toast.success("Status aktualisiert")
            load() // Reload to sync completely
        }
    }

    const validateBericht = () => {
        const errors: string[] = []
        if (!tn || parseInt(tn) < 0) errors.push("Teilnehmerzahl ist erforderlich (≥ 0)")
        if (!dauer || parseFloat(dauer) <= 0) errors.push("Dauer muss größer als 0 sein")
        if (ratingV === 0) errors.push("Bewertung Verständlichkeit ist erforderlich (1–10)")
        if (ratingN === 0) errors.push("Bewertung Nutzbarkeit ist erforderlich (1–10)")
        if (ratingK === 0) errors.push("Bewertung Kompetenz ist erforderlich (1–10)")
        return errors
    }

    const handleSave = async (isDraft: boolean) => {
        setFormErrors([])
        if (!isDraft) {
            const errors = validateBericht()
            if (errors.length > 0) {
                setFormErrors(errors)
                return
            }
        }

        setActionLoading(true)
        const payload = {
            termin_id: termin.id,
            teilnehmer_anzahl: tn ? parseInt(tn) : 0,
            dauer_stunden: dauer ? parseFloat(dauer) : 0,
            rating_verstaendlichkeit: ratingV,
            rating_nutzbarkeit: ratingN,
            rating_kompetenz: ratingK,
            themen,
            interne_notiz: interneNotiz
        }

        const result = await upsertBericht(payload, isDraft)
        setActionLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(isDraft ? "Entwurf gespeichert" : "Bericht erfolgreich eingereicht")
            load() // Reload to get the fresh report state
        }
    }

    const avgRating =
        currentBericht && !currentBericht.is_draft
            ? (
                (currentBericht.rating_verstaendlichkeit +
                    currentBericht.rating_nutzbarkeit +
                    currentBericht.rating_kompetenz) /
                3
            ).toFixed(1)
            : null

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Breadcrumb */}
            <Link
                href="/termine"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Zurück zu Termine
            </Link>

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{apotheke?.name ?? "–"}</h1>
                    <p className="text-muted-foreground">
                        {format(new Date(termin.datum), "EEEE, dd. MMMM yyyy", { locale: de })}
                    </p>
                </div>
                <Badge
                    variant="secondary"
                    className={`${statusConfig.color} text-sm px-3 py-1`}
                >
                    {statusConfig.label}
                </Badge>
            </div>

            {/* Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Termindetails</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-start gap-3">
                        <Building2 className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                            <p className="text-sm font-medium">{apotheke?.name}</p>
                            <p className="text-sm text-muted-foreground">{apotheke?.address}</p>
                            <p className="text-sm text-muted-foreground">
                                {apotheke?.plz} {apotheke?.ort}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                            <p className="text-sm font-medium">{trainer?.full_name ?? "–"}</p>
                            <p className="text-xs text-muted-foreground">Trainer</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                        <p className="text-sm">
                            {format(new Date(termin.datum), "dd.MM.yyyy", { locale: de })}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                        <p className="text-sm">
                            {termin.zeit_start} – {termin.zeit_ende} Uhr
                        </p>
                    </div>

                    {tour && (
                        <div className="flex items-center gap-3 sm:col-span-2">
                            <Route className="h-4 w-4 text-muted-foreground shrink-0" />
                            <Link
                                href={`/touren/${tour.id}`}
                                className="text-sm hover:underline text-primary"
                            >
                                {tour.name}
                            </Link>
                        </div>
                    )}

                    {termin.notiz && (
                        <div className="flex items-start gap-3 sm:col-span-2">
                            <MessageSquare className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                            <p className="text-sm text-muted-foreground">{termin.notiz}</p>
                        </div>
                    )}

                    {isAbgesagt && termin.cancel_reason && (
                        <div className="sm:col-span-2">
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    <span className="font-medium">Absagegrund:</span> {termin.cancel_reason}
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Status Actions */}
            {!isAbgesagt && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Status ändern</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap items-center gap-3">
                        {isAdmin && (
                            <Select
                                value={status}
                                onValueChange={(v) => handleStatusChange(v as TerminStatus)}
                            >
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="geplant">Geplant</SelectItem>
                                    <SelectItem value="fixiert">Fixiert</SelectItem>
                                    <SelectItem value="durchgefuehrt">Durchgeführt</SelectItem>
                                    <SelectItem value="abgesagt">Abgesagt</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                        {isTrainer && status === "fixiert" && (
                            <Button
                                variant="outline"
                                onClick={() => handleStatusChange("durchgefuehrt")}
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Als Durchgeführt markieren
                            </Button>
                        )}
                        {isAdmin && (
                            <Button
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setCancelDialogOpen(true)}
                            >
                                Termin absagen
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Bericht Section */}
            {isDurchgefuehrt && (
                <>
                    <Separator />
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Schulungsbericht
                            </h2>
                            {currentBericht && !currentBericht.is_draft && berichtMode === "view" && canEditBericht && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setBerichtMode("edit")}
                                >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Bearbeiten
                                </Button>
                            )}
                        </div>

                        {/* View Mode (Submitted & Not editing, or management always) */}
                        {currentBericht && !currentBericht.is_draft && (berichtMode === "view" || !canEditBericht) ? (
                            <Card>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div className="text-center p-4 rounded-lg bg-muted">
                                            <p className="text-3xl font-bold">{currentBericht.teilnehmer_anzahl}</p>
                                            <p className="text-sm text-muted-foreground mt-1">Teilnehmer</p>
                                        </div>
                                        <div className="text-center p-4 rounded-lg bg-muted">
                                            <p className="text-3xl font-bold">{currentBericht.dauer_stunden}h</p>
                                            <p className="text-sm text-muted-foreground mt-1">Dauer</p>
                                        </div>
                                        <div className="text-center p-4 rounded-lg bg-muted">
                                            <p className="text-3xl font-bold text-primary">{avgRating}</p>
                                            <p className="text-sm text-muted-foreground mt-1">Ø Bewertung</p>
                                        </div>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-3">
                                        {[
                                            { label: "Verständlichkeit", value: currentBericht.rating_verstaendlichkeit },
                                            { label: "Nutzbarkeit", value: currentBericht.rating_nutzbarkeit },
                                            { label: "Kompetenz", value: currentBericht.rating_kompetenz },
                                        ].map(({ label, value }) => (
                                            <div key={label} className="flex items-center justify-between rounded-md border px-3 py-2">
                                                <span className="text-sm text-muted-foreground">{label}</span>
                                                <span className="font-semibold">{value}/10</span>
                                            </div>
                                        ))}
                                    </div>

                                    {currentBericht.themen && (
                                        <div>
                                            <p className="text-sm font-medium mb-1">Themen</p>
                                            <p className="text-sm text-muted-foreground">{currentBericht.themen}</p>
                                        </div>
                                    )}

                                    {isAdmin && currentBericht.interne_notiz && (
                                        <div>
                                            <p className="text-sm font-medium mb-1">Interne Notiz</p>
                                            <p className="text-sm text-muted-foreground">{currentBericht.interne_notiz}</p>
                                        </div>
                                    )}

                                    <p className="text-xs text-muted-foreground">
                                        Eingereicht am{" "}
                                        {currentBericht.submitted_at
                                            ? format(new Date(currentBericht.submitted_at), "dd.MM.yyyy 'um' HH:mm", { locale: de })
                                            : "–"}
                                    </p>
                                </CardContent>
                            </Card>
                        ) : !canEditBericht ? (
                            <Card>
                                <CardContent className="pt-6 text-sm text-muted-foreground">
                                    {currentBericht?.is_draft
                                        ? "Bericht wurde als Entwurf gespeichert. Noch nicht eingereicht."
                                        : "Kein Schulungsbericht vorhanden."}
                                </CardContent>
                            </Card>
                        ) : (
                            /* Edit / Create Form */
                            <Card>
                                <CardContent className="pt-6 space-y-6">
                                    {!currentBericht && (
                                        <Alert>
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>
                                                Bitte erfassen Sie die Schulungsdaten für diesen abgeschlossenen Termin.
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {currentBericht?.is_draft && (
                                        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                                            Entwurf gespeichert
                                        </Badge>
                                    )}

                                    {formErrors.length > 0 && (
                                        <Alert variant="destructive">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>
                                                <ul className="list-disc list-inside space-y-1">
                                                    {formErrors.map((e) => (
                                                        <li key={e}>{e}</li>
                                                    ))}
                                                </ul>
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="tn">Teilnehmerzahl (TN) *</Label>
                                            <Input
                                                id="tn"
                                                type="number"
                                                min="0"
                                                placeholder="z.B. 8"
                                                value={tn}
                                                onChange={(e) => setTn(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="dauer">Dauer in Stunden *</Label>
                                            <Input
                                                id="dauer"
                                                type="number"
                                                min="0"
                                                step="0.5"
                                                placeholder="z.B. 1.5"
                                                value={dauer}
                                                onChange={(e) => setDauer(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-sm font-medium">Bewertungen (1–10) *</p>
                                        <RatingSelector
                                            label="Verständlichkeit"
                                            value={ratingV}
                                            onChange={setRatingV}
                                        />
                                        <RatingSelector
                                            label="Nutzbarkeit"
                                            value={ratingN}
                                            onChange={setRatingN}
                                        />
                                        <RatingSelector
                                            label="Kompetenz"
                                            value={ratingK}
                                            onChange={setRatingK}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="themen">Themen (optional)</Label>
                                        <Textarea
                                            id="themen"
                                            placeholder="Welche Inhalte wurden geschult?"
                                            value={themen}
                                            onChange={(e) => setThemen(e.target.value)}
                                            rows={3}
                                        />
                                    </div>

                                    {isAdmin && (
                                        <div className="space-y-2">
                                            <Label htmlFor="interne-notiz">Interne Notiz (nur Admin)</Label>
                                            <Textarea
                                                id="interne-notiz"
                                                placeholder="Interne Anmerkungen..."
                                                value={interneNotiz}
                                                onChange={(e) => setInterneNotiz(e.target.value)}
                                                rows={2}
                                            />
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-3">
                                        <Button onClick={() => handleSave(false)} disabled={actionLoading}>
                                            {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                                            Bericht abschicken
                                        </Button>
                                        <Button variant="outline" onClick={() => handleSave(true)} disabled={actionLoading}>
                                            {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                            Entwurf speichern
                                        </Button>
                                        {currentBericht && !currentBericht.is_draft && (
                                            <Button
                                                variant="ghost"
                                                onClick={() => setBerichtMode("view")}
                                                disabled={actionLoading}
                                            >
                                                Abbrechen
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </>
            )}

            {/* Cancel Dialog */}
            <TerminCancelDialog
                open={cancelDialogOpen}
                onOpenChange={(open) => {
                    setCancelDialogOpen(open)
                    // If successfully cancelled, load() is called inside handleStatusChange logic?
                    // Wait, TerminCancelDialog needs to call a server action or callback.
                    // I need to check TerminCancelDialog props.
                }}
                termin={termin}
            />
        </div>
    )
}
