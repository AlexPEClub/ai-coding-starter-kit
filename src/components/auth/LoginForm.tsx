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
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { OAuthButton } from './OAuthButton'

const loginSchema = z.object({
  email: z.string().email('Bitte gib eine gültige E-Mail-Adresse ein'),
  password: z.string().min(1, 'Passwort ist erforderlich'),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSent, setResendSent] = useState(false)

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const isLoading = form.formState.isSubmitting

  async function onSubmit(values: LoginValues) {
    setError(null)
    setPendingEmail(null)
    setResendSent(false)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        setPendingEmail(values.email)
      } else {
        setError('E-Mail oder Passwort falsch')
      }
      return
    }

    if (data.session) {
      window.location.href = '/'
    }
  }

  async function handleResend() {
    if (!pendingEmail) return
    setResendLoading(true)
    await supabase.auth.resend({ type: 'signup', email: pendingEmail })
    setResendLoading(false)
    setResendSent(true)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
              <div className="flex items-center justify-between">
                <FormLabel>Passwort</FormLabel>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Passwort vergessen?
                </Link>
              </div>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {pendingEmail && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <p>Bitte bestätige zuerst deine E-Mail-Adresse.</p>
              {resendSent ? (
                <p className="text-sm text-muted-foreground">Mail wurde erneut gesendet.</p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="text-sm font-semibold text-primary hover:underline disabled:opacity-50"
                >
                  {resendLoading ? 'Wird gesendet…' : 'Mail erneut senden'}
                </button>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Einloggen…' : 'Einloggen'}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">oder</span>
          </div>
        </div>

        <div className="space-y-2">
          <OAuthButton provider="google" label="Mit Google einloggen" />
          <OAuthButton provider="apple" label="Mit Apple einloggen" />
          <OAuthButton provider="facebook" label="Mit Facebook einloggen" />
        </div>
      </form>
    </Form>
  )
}
