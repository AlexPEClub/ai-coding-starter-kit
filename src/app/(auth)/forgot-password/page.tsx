'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, ArrowLeft, Clock, Shield } from 'lucide-react'
import Link from 'next/link'

const formSchema = z.object({
  email: z.string().email("Ungültige Email-Adresse")
})

type FormData = z.infer<typeof formSchema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submittedEmail, setSubmittedEmail] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(formSchema)
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setError(null)

    try {
      // TODO: Implement actual password reset request with Supabase
      console.log('Password reset request for:', data.email)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setSubmittedEmail(data.email)
      setIsSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Anfrage fehlgeschlagen')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Email gesendet</CardTitle>
            <CardDescription>
              Wir haben dir einen Link zum Zurücksetzen des Passworts gesendet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Sende einen Link zu <span className="font-medium">{submittedEmail}</span>
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center space-x-2 text-blue-700">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">Link gültig für 15 Minuten</span>
                </div>
                <div className="flex items-center space-x-2 text-blue-700">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm">Aus Sicherheitsgründen zeigen wir nicht an, ob die Email existiert</span>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 space-y-1">
                <p>• Überprüfe deinen Posteingang</p>
                <p>• Kontrolle auch den Spam-Ordner</p>
                <p>• Warte einige Minuten auf die Zustellung</p>
              </div>
            </div>
            
            <div className="space-y-2 pt-4 border-t">
              <p className="text-center text-sm text-gray-600">
                Keine Email erhalten?
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsSubmitted(false)}
                disabled={isLoading}
              >
                Erneut versuchen
              </Button>
            </div>
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Passwort vergessen</CardTitle>
          <CardDescription className="text-center">
            Gib deine Email-Adresse ein und wir senden dir einen Link zum Zurücksetzen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Security Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Shield className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Hinweis zur Sicherheit</p>
                <p>
                  Aus Schutz deiner Privatsphäre zeigen wir nicht an, ob eine Email-Adresse 
                  registriert ist. Wenn du keine Email erhältst, überprüfe deine Eingabe 
                  oder wende dich an den Support.
                </p>
              </div>
            </div>
          </div>

          {/* Rate Limiting Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span className="text-xs">
                Du kannst maximal 3 Anfragen pro Stunde stellen. Rate Limiting ist aktiv.
              </span>
            </div>
          </div>

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

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird gesendet...
                </>
              ) : (
                'Link zum Zurücksetzen senden'
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