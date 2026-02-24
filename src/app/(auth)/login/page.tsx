"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2 } from "lucide-react"

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

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const supabase = createClient()
        const { error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
            setError(
                error.message === "Invalid login credentials"
                    ? "E-Mail-Adresse oder Passwort ist falsch."
                    : error.message
            )
            setLoading(false)
            return
        }

        router.push("/dashboard")
        router.refresh()
    }

    return (
        <Card>
            <CardHeader className="space-y-1 text-center">
                <div className="flex justify-center mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                        MW
                    </div>
                </div>
                <CardTitle className="text-xl">Apo-Schulungs-Manager</CardTitle>
                <CardDescription>Melden Sie sich mit Ihrem Konto an</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
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

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">Passwort</Label>
                            <Link
                                href="/reset-password"
                                className="text-xs text-muted-foreground hover:text-primary"
                            >
                                Passwort vergessen?
                            </Link>
                        </div>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Anmelden…
                            </>
                        ) : (
                            "Anmelden"
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
