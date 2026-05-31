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

const ForgotSchema = z.object({
  email: z.string().email('Gültige E-Mail-Adresse eingeben'),
})
type ForgotValues = z.infer<typeof ForgotSchema>

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  const form = useForm<ForgotValues>({
    resolver: zodResolver(ForgotSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: ForgotValues) {
    setLoading(true)
    try {
      await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
      })
      // Always show success — generic to prevent account enumeration
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>E-Mail gesendet</CardTitle>
          <CardDescription>
            Falls ein Konto mit dieser E-Mail-Adresse existiert, haben wir einen Reset-Link gesendet.
            Der Link ist 24 Stunden gültig.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/login" className="text-primary hover:underline text-sm">
            Zurück zur Anmeldung
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
        <CardTitle className="text-xl">Passwort zurücksetzen</CardTitle>
        <CardDescription>Gib deine E-Mail-Adresse ein. Wir senden dir einen Reset-Link.</CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Senden…' : 'Reset-Link senden'}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter>
        <Link href="/login" className="text-sm text-muted-foreground hover:text-primary">
          ← Zurück zur Anmeldung
        </Link>
      </CardFooter>
    </Card>
  )
}
