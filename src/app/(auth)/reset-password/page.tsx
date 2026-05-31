'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const ResetSchema = z.object({
  password:        z.string().min(8, 'Passwort muss mindestens 8 Zeichen haben'),
  passwordConfirm: z.string(),
}).refine((d) => d.password === d.passwordConfirm, {
  path: ['passwordConfirm'],
  message: 'Passwörter stimmen nicht überein',
})
type ResetValues = z.infer<typeof ResetSchema>

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const form = useForm<ResetValues>({
    resolver: zodResolver(ResetSchema),
    defaultValues: { password: '', passwordConfirm: '' },
  })

  async function onSubmit(values: ResetValues) {
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: values.password })
      if (error) {
        if (error.message.toLowerCase().includes('expired') || error.message.toLowerCase().includes('invalid')) {
          form.setError('root', {
            message: 'Dieser Link ist nicht mehr gültig. Bitte fordere einen neuen an.',
          })
        } else {
          form.setError('root', { message: 'Passwortänderung fehlgeschlagen. Bitte erneut versuchen.' })
        }
        return
      }
      toast.success('Passwort erfolgreich geändert')
      router.push('/login')
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
        <CardTitle className="text-xl">Neues Passwort setzen</CardTitle>
        <CardDescription>Gib dein neues Passwort ein.</CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Neues Passwort</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Mindestens 8 Zeichen" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="passwordConfirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Passwort bestätigen</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Speichern…' : 'Passwort speichern'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
