'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const RegisterSchema = z.object({
  practiceName: z.string().min(1, 'Praxisname ist erforderlich').max(200),
  firstName:    z.string().min(1, 'Vorname ist erforderlich').max(100),
  lastName:     z.string().min(1, 'Nachname ist erforderlich').max(100),
  email:        z.string().min(1, 'E-Mail ist erforderlich').refine(
                  (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
                  'Gültige E-Mail-Adresse eingeben'
                ),
  password:     z.string().min(8, 'Passwort muss mindestens 8 Zeichen haben'),
})
type RegisterValues = z.infer<typeof RegisterSchema>

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const form = useForm<RegisterValues>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { practiceName: '', firstName: '', lastName: '', email: '', password: '' },
  })

  async function onSubmit(values: RegisterValues) {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email:    values.email,
        password: values.password,
        options: {
          data: {
            practice_name: values.practiceName,
            first_name:    values.firstName,
            last_name:     values.lastName,
            full_name:     `${values.firstName} ${values.lastName}`.trim(),
          },
        },
      })

      if (error) {
        console.error('[register] Supabase error:', error)
        if (error.message.toLowerCase().includes('already registered') ||
            error.message.toLowerCase().includes('already been registered') ||
            error.message.toLowerCase().includes('user already exists')) {
          form.setError('email', { message: 'Diese E-Mail ist bereits registriert' })
        } else if (error.message.toLowerCase().includes('email rate limit') ||
                   error.message.toLowerCase().includes('rate limit')) {
          form.setError('root', { message: 'Zu viele Versuche. Bitte warte kurz und versuche es erneut.' })
        } else {
          // Show the actual error in dev so we can diagnose
          form.setError('root', { message: `Fehler: ${error.message}` })
        }
        return
      }

      if (data.session) {
        // Email verification disabled for beta → session is immediately available
        window.location.href = '/dashboard'
      } else {
        setSuccess(true)
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Registrierung erfolgreich!</CardTitle>
          <CardDescription>
            Bitte überprüfe deine E-Mails und bestätige deine E-Mail-Adresse, um fortzufahren.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/login" className="text-primary hover:underline text-sm">
            Zur Anmeldung
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl font-bold font-[var(--font-outfit)] text-primary">TierPhysio</span>
        </div>
        <CardTitle className="text-xl">Praxis registrieren</CardTitle>
        <CardDescription>Erstelle deinen Workspace und lege dein Konto an.</CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="practiceName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Praxisname</FormLabel>
                  <FormControl>
                    <Input placeholder="Tierphysio München" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vorname</FormLabel>
                    <FormControl>
                      <Input placeholder="Anna" autoComplete="given-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nachname</FormLabel>
                    <FormControl>
                      <Input placeholder="Müller" autoComplete="family-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-Mail</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="deine@email.de" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Passwort</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Mindestens 8 Zeichen" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Registrierung…' : 'Praxis anlegen'}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter>
        <p className="text-sm text-muted-foreground text-center w-full">
          Bereits registriert?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Anmelden
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
