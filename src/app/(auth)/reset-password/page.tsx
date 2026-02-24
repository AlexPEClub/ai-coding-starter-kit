"use client"

import { useState } from "react"
import Link from "next/link"
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

export default function ResetPasswordPage() {
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const supabase = createClient()
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/update-password`,
        })

        if (error) {
            setError(error.message)
            setLoading(false)
            return
        }

        setSent(true)
        setLoading(false)
    }

    if (sent) {
        return (
            <Card>
                <CardContent className="pt-6 text-center space-y-4">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                    <div>
                        <p className="font-medium">E-Mail wurde gesendet</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Überprüfen Sie Ihr Postfach und klicken Sie auf den Link, um Ihr Passwort zurückzusetzen.
                        </p>
                    </div>
                    <Link href="/login" className="text-sm text-primary hover:underline block">
                        Zurück zur Anmeldung
                    </Link>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-xl">Passwort zurücksetzen</CardTitle>
                <CardDescription>
                    Geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen Link zum Zurücksetzen.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleReset} className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email">E-Mail</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@mw-education.at"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Senden…
                            </>
                        ) : (
                            "Link senden"
                        )}
                    </Button>

                    <div className="text-center">
                        <Link href="/login" className="text-sm text-muted-foreground hover:text-primary">
                            Zurück zur Anmeldung
                        </Link>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
