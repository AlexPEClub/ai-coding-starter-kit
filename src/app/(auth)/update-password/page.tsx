"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

export default function UpdatePasswordPage() {
    const router = useRouter()
    const [password, setPassword] = useState("")
    const [confirm, setConfirm] = useState("")
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Exchange the code from the URL for a session (PKCE flow)
    useEffect(() => {
        const supabase = createClient()
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            // SESSION is set after code exchange — no action needed, just wait for form
            if (event === "PASSWORD_RECOVERY") {
                // User arrived via password reset link — session is ready
            }
        })
        return () => subscription.unsubscribe()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (password.length < 8) {
            setError("Das Passwort muss mindestens 8 Zeichen lang sein.")
            return
        }
        if (password !== confirm) {
            setError("Die Passwörter stimmen nicht überein.")
            return
        }

        setLoading(true)
        const supabase = createClient()
        const { error } = await supabase.auth.updateUser({ password })
        setLoading(false)

        if (error) {
            setError(error.message)
            return
        }

        setDone(true)
        setTimeout(() => {
            window.location.href = "/dashboard"
        }, 2000)
    }

    if (done) {
        return (
            <Card>
                <CardContent className="pt-6 text-center space-y-4">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                    <div>
                        <p className="font-medium">Passwort erfolgreich gesetzt</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Sie werden weitergeleitet…
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-xl">Passwort festlegen</CardTitle>
                <CardDescription>
                    Wählen Sie ein neues Passwort für Ihr Konto.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="password">Neues Passwort</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Mindestens 8 Zeichen"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirm">Passwort bestätigen</Label>
                        <Input
                            id="confirm"
                            type="password"
                            placeholder="Passwort wiederholen"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            required
                            autoComplete="new-password"
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Speichern…
                            </>
                        ) : (
                            "Passwort speichern"
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
