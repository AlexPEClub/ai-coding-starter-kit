'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const LoginSchema = z.object({
  email:    z.string().email('Gültige E-Mail-Adresse eingeben'),
  password: z.string().min(1, 'Passwort eingeben'),
})
type LoginValues = z.infer<typeof LoginSchema>

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const form = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: LoginValues) {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email:    values.email,
        password: values.password,
      })
      if (error || !data.session) {
        form.setError('root', { message: 'E-Mail oder Passwort ist falsch' })
        return
      }
      window.location.href = '/dashboard'
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl font-bold font-[var(--font-outfit)] text-primary">TierPhysio</span>
        </div>
        <CardTitle className="text-xl">Anmelden</CardTitle>
        <CardDescription>Melde dich mit deiner E-Mail und deinem Passwort an.</CardDescription>
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

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Passwort</FormLabel>
                    <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary">
                      Passwort vergessen?
                    </Link>
                  </div>
                  <FormControl>
                    <Input type="password" autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Anmelden…' : 'Anmelden'}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter>
        <p className="text-sm text-muted-foreground text-center w-full">
          Noch kein Konto?{' '}
          <Link href="/register" className="text-primary hover:underline font-medium">
            Jetzt registrieren
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
