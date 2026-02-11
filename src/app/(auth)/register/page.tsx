'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff, Mail, Github, Chrome } from 'lucide-react'
import Link from 'next/link'

const passwordRequirements = [
  { regex: /.{8,}/, text: "Mindestens 8 Zeichen" },
  { regex: /[A-Z]/, text: "1 Großbuchstabe" },
  { regex: /[a-z]/, text: "1 Kleinbuchstabe" },
  { regex: /[0-9]/, text: "1 Zahl" }
]

const formSchema = z.object({
  email: z.string().email("Ungültige Email-Adresse"),
  password: z.string().min(8, "Mindestens 8 Zeichen"),
  confirmPassword: z.string(),
  terms: z.boolean().refine(val => val === true, "AGBs müssen akzeptiert werden")
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwörter stimmen nicht überein",
  path: ["confirmPassword"]
})

type FormData = z.infer<typeof formSchema>

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<FormData>({
    resolver: zodResolver(formSchema)
  })

  const password = watch('password')
  const confirmPassword = watch('confirmPassword')

  // Calculate password strength
  const calculatePasswordStrength = (password: string) => {
    let strength = 0
    passwordRequirements.forEach(req => {
      if (req.regex.test(password)) strength++
    })
    return strength
  }

  // Update password strength when password changes
  const handlePasswordChange = (value: string) => {
    const strength = calculatePasswordStrength(value)
    setPasswordStrength(strength)
  }

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setError(null)

    try {
      // TODO: Implement actual registration logic with Supabase
      console.log('Registration data:', data)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registrierung fehlgeschlagen')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setIsLoading(true)
    try {
      // TODO: Implement OAuth login
      console.log(`OAuth login with ${provider}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OAuth Login fehlgeschlagen')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Verifizierungs-Email gesendet</h2>
              <p className="text-gray-600 mb-6">
                Wir haben dir eine Email mit einem Bestätigungslink gesendet. Bitte überprüfe dein Postfach.
              </p>
              <p className="text-sm text-gray-500">
                Keine Email erhalten? Überprüfe deinen Spam-Ordner.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Konto erstellen</CardTitle>
          <CardDescription className="text-center">
            Registriere dich mit Email und Passwort
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                  {...register('password', {
                    onChange: (e) => handlePasswordChange(e.target.value)
                  })}
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
              
              {/* Password Requirements Checklist */}
              <div className="space-y-1">
                {passwordRequirements.map((req, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      req.regex.test(password) ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                    <span className={`text-xs ${
                      req.regex.test(password) ? 'text-green-700' : 'text-gray-600'
                    }`}>
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Passwort-Stärke</span>
                    <Badge 
                      variant={passwordStrength <= 1 ? "destructive" : passwordStrength <= 2 ? "secondary" : "default"}
                      className="text-xs"
                    >
                      {passwordStrength <= 1 ? "Schwach" : passwordStrength <= 2 ? "Mittel" : "Stark"}
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        passwordStrength <= 1 ? "bg-red-500" : passwordStrength <= 2 ? "bg-yellow-500" : "bg-green-500"
                      }`}
                      style={{ width: `${(passwordStrength / 4) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Passwort wiederholen"
                  {...register('confirmPassword')}
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-sm text-green-500">Passwörter stimmen überein</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                {...register('terms')}
              />
              <Label htmlFor="terms" className="text-sm">
                Ich akzeptiere die{' '}
                <Link href="/terms" className="text-blue-600 hover:underline">
                  Allgemeinen Geschäftsbedingungen
                </Link>{' '}
                und die{' '}
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  Datenschutzrichtlinien
                </Link>
              </Label>
            </div>
            {errors.terms && (
              <p className="text-sm text-red-500">{errors.terms.message}</p>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrierung läuft...
                </>
              ) : (
                'Konto erstellen'
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Oder registrieren mit</span>
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
        <CardFooter className="text-center">
          <p className="text-sm text-gray-600">
            Bereits ein Konto?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              Einloggen
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}