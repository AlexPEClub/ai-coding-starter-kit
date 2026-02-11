'use client'

import { useState, useEffect, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Eye, EyeOff, AlertTriangle, CheckCircle, Shield, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const passwordRequirements = [
  { regex: /.{8,}/, text: "Mindestens 8 Zeichen" },
  { regex: /[A-Z]/, text: "1 Großbuchstabe" },
  { regex: /[a-z]/, text: "1 Kleinbuchstabe" },
  { regex: /[0-9]/, text: "1 Zahl" }
]

const formSchema = z.object({
  password: z.string().min(8, "Mindestens 8 Zeichen"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwörter stimmen nicht überein",
  path: ["confirmPassword"]
})

type FormData = z.infer<typeof formSchema>

function ResetPasswordPageContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
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

  // Validate token on component mount
  useEffect(() => {
    if (!token) {
      setTokenValid(false)
      setError('Ungültiger Reset-Link. Bitte fordere einen neuen Link an.')
      return
    }

    const validateToken = async () => {
      try {
        // TODO: Implement actual token validation with Supabase
        console.log('Validating token:', token)
        
        // Simulate token validation
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // For demo, consider any token as valid
        setTokenValid(true)
      } catch (err) {
        setTokenValid(false)
        setError(err instanceof Error ? err.message : 'Ungültiger oder abgelaufener Token')
      }
    }

    validateToken()
  }, [token])

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
    if (!token) return

    setIsLoading(true)
    setError(null)

    try {
      // TODO: Implement actual password reset with Supabase
      console.log('Reset password with token:', token, 'new password:', data.password)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Passwort-Reset fehlgeschlagen')
    } finally {
      setIsLoading(false)
    }
  }

  // Token validation loading state
  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Validiere Reset-Link...</h2>
              <p className="text-gray-600">Bitte warten</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Token invalid
  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-800">Ungültiger Link</CardTitle>
            <CardDescription className="text-red-600">
              Dieser Reset-Link ist ungültig oder abgelaufen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-medium mb-1">Mögliche Ursachen:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Der Link wurde bereits verwendet</li>
                    <li>Der Link ist älter als 15 Minuten</li>
                    <li>Der Link wurde manipuliert</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/forgot-password">
                  Neuen Link anfordern
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Zurück zum Login
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">Passwort geändert</CardTitle>
            <CardDescription>
              Dein Passwort wurde erfolgreich zurückgesetzt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2 text-green-700">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm font-medium">Alle Sitzungen wurden beendet</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-600">
                Aus Sicherheitsgründen wurden alle aktiven Sitzungen beendet. 
                Du musst dich neu anmelden.
              </p>
              
              <p className="text-xs text-gray-500">
                Du erhältst in Kürze eine Bestätigungs-Email über die Passwort-Änderung.
              </p>
            </div>
            
            <Button asChild className="w-full">
              <Link href="/login">
                Jetzt anmelden
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Reset password form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Neues Passwort festlegen</CardTitle>
          <CardDescription className="text-center">
            Wähle ein sicheres neues Passwort für dein Konto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Sicherheitshinweis</p>
                <p>
                  Nach der Passwort-Änderung werden alle aktuellen Sitzungen beendet 
                  und du musst dich neu anmelden.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Neues Passwort</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Neues Passwort"
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

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Passwort wird geändert...
                </>
              ) : (
                'Passwort ändern'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center">
          <Link href="/login" className="inline-flex items-center text-sm text-blue-600 hover:underline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zum Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Lade...</h2>
              <p className="text-gray-600">Bitte warten</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <ResetPasswordPageContent />
    </Suspense>
  )
}