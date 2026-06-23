'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const forgotSchema = z.object({
  email: z.string().email('Bitte gib eine gültige E-Mail-Adresse ein'),
})

type ForgotValues = z.infer<typeof forgotSchema>

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  })

  const isLoading = form.formState.isSubmitting

  async function onSubmit(values: ForgotValues) {
    await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    })
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="text-center space-y-4 py-2">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-primary" />
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground">Mail gesendet</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Falls diese Adresse registriert ist, wurde eine Mail gesendet.
            Prüfe deinen Posteingang — der Link ist 1 Stunde gültig.
          </p>
        </div>
      </div>
    )
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

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Wird gesendet…' : 'Reset-Link senden'}
        </Button>
      </form>
    </Form>
  )
}
