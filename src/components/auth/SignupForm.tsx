'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const signupSchema = z.object({
  displayName: z.string().min(1, 'Anzeigename ist erforderlich'),
  email: z.string().email('Bitte gib eine gültige E-Mail-Adresse ein'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
  agb: z.boolean().refine((val) => val === true, {
    message: 'Bitte akzeptiere die AGB und Datenschutzerklärung',
  }),
})

type SignupValues = z.infer<typeof signupSchema>

export function SignupForm() {
  const [error, setError] = useState<string | null>(null)

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { displayName: '', email: '', password: '', agb: false },
  })

  const isLoading = form.formState.isSubmitting

  async function onSubmit(values: SignupValues) {
    setError(null)

    const { data, error: signupError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { display_name: values.displayName },
      },
    })

    if (signupError) {
      const msg = signupError.message.toLowerCase()
      const code = (signupError as { code?: string }).code ?? ''
      const status = (signupError as { status?: number }).status
      if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('user already')) {
        setError('Diese E-Mail-Adresse ist bereits registriert')
      } else if (
        code === 'over_email_send_rate_limit' ||
        status === 429 ||
        msg.includes('rate limit') ||
        msg.includes('too many')
      ) {
        // Supabase's built-in email service has a very low send-rate cap.
        // Surface a clear, honest message instead of a generic "Verbindungsfehler".
        setError(
          'Zu viele Registrierungen in kurzer Zeit. Bitte warte ein paar Minuten und versuche es erneut.'
        )
      } else if (msg.includes('password')) {
        setError('Das Passwort erfüllt nicht die Anforderungen (mind. 8 Zeichen).')
      } else {
        setError(signupError.message || 'Verbindungsfehler — bitte versuche es erneut.')
      }
      return
    }

    if (data.user?.identities?.length === 0) {
      setError('Diese E-Mail-Adresse ist bereits registriert')
      return
    }

    if (data.user) {
      window.location.href = `/signup/pending?email=${encodeURIComponent(values.email)}`
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Anzeigename</FormLabel>
              <FormControl>
                <Input
                  placeholder="Wie sollen dich andere sehen?"
                  autoComplete="name"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-Mail</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="deine@email.de"
                  autoComplete="email"
                  {...field}
                />
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
                <Input
                  type="password"
                  placeholder="Mindestens 8 Zeichen"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="agb"
          render={({ field }) => (
            <FormItem className="flex items-start gap-3 space-y-0">
              <FormControl>
                <Checkbox
                  id="agb-checkbox"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="mt-0.5"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel
                  htmlFor="agb-checkbox"
                  className="text-sm font-normal cursor-pointer leading-relaxed"
                >
                  Ich akzeptiere die{' '}
                  <a href="#" className="text-primary hover:underline font-medium">
                    AGB
                  </a>{' '}
                  und die{' '}
                  <a href="#" className="text-primary hover:underline font-medium">
                    Datenschutzerklärung
                  </a>
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Konto wird erstellt…' : 'Registrieren'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Bereits registriert?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Einloggen
          </Link>
        </p>
      </form>
    </Form>
  )
}
