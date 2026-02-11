'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff, Github, Chrome, AlertCircle } from 'lucide-react'
import Link from 'next/link'

const formSchema = z.object({
  email: z.string().email("Ungültige Email-Adresse"),
  password: z.string().min(1, "Passwort ist erforderlich"),
  rememberMe: z.boolean().optional()
})

type FormData = z.infer<typeof formSchema>

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(formSchema)
  })

  // Check for session expired flag in URL or localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const expired = urlParams.get('expired')
    const localExpired = localStorage.getItem('session_expired')
    
    if (expired === 'true' || localExpired === 'true') {
      setSessionExpired(true)
      localStorage.removeItem('session_expired')
    }
  }, [])

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setError(null)

    try {
      // TODO: Implement actual login logic with Supabase
      console.log('Login data:', data)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simulate successful login - redirect to dashboard
      // Using window.location.href for hard redirect as per frontend-dev.md
      window.location.href = '/dashboard'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login fehlgeschlagen')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setIsLoading(true)
    setError(null)
    
    try {
      // TODO: Implement OAuth login with Supabase
      console.log(`OAuth login with ${provider}`)
      
      // Simulate OAuth flow
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Simulate successful OAuth login
      window.location.href = '/dashboard'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OAuth Login fehlgeschlagen')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Willkommen zurück</CardTitle>
          <CardDescription className="text-center">
            Melde dich mit deinem Konto an
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessionExpired && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.
              </AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email-Adresse</Label>
              <Input
                id="email"
                type="email"
                placeholder="deine@email.de"
                autoComplete="email"
                {...register('email')}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Passwort"
                  autoComplete="current-password"
                  {...register('password')}
                  className={errors.password ? 'border-red-500' : ''}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  {...register('rememberMe')}
                />
                <Label htmlFor="rememberMe" className="text-sm cursor-pointer">
                  Angemeldet bleiben
                </Label>
              </div>
              <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                Passwort vergessen?
              </Link>
            </div>

            <div className="text-xs text-gray-500">
              <p>
                <strong>"Angemeldet bleiben"</strong> hält dich für 30 Tage eingeloggt.
                Ohne diese Option wirst du beim Schließen des Browsers ausgeloggt.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Anmeldung läuft...
                </>
              ) : (
                'Anmelden'
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Oder anmelden mit</span>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleOAuthLogin('google')}
              disabled={isLoading}
            >
              <Chrome className="mr-2 h-4 w-4" />
              Google
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleOAuthLogin('github')}
              disabled={isLoading}
            >
              <Github className="mr-2 h-4 w-4" />
              GitHub
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center">
          <p className="text-sm text-gray-600">
            Noch kein Konto?{' '}
            <Link href="/register" className="text-blue-600 hover:underline">
              Registrieren
            </Link>
          </p>
          <p className="text-xs text-gray-500">
            By logging in, you agree to our{' '}
            <Link href="/terms" className="text-blue-600 hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}