import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Calendar, Dumbbell, ClipboardList } from 'lucide-react'

async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('first_name, tenant:tenants(name)')
    .eq('user_id', user.id)
    .single()

  return data
}

const placeholderCards = [
  { title: 'Patienten',      icon: Users,         description: 'Patienten verwalten', href: '/patients',       value: '—' },
  { title: 'Termine',        icon: Calendar,      description: 'Anstehende Termine',  href: '/appointments',   value: '—' },
  { title: 'Übungen',        icon: Dumbbell,      description: 'Übungsdatenbank',     href: '/exercises',      value: '—' },
  { title: 'Trainingspläne', icon: ClipboardList, description: 'Aktive Pläne',        href: '/training-plans', value: '—' },
]

export default async function DashboardPage() {
  const profile = await getProfile()
  const firstName   = profile?.first_name ?? 'Therapeut'
  const practiceName = (profile?.tenant as { name?: string } | null)?.name ?? ''

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-[var(--font-outfit)]">
          Willkommen, {firstName}!
        </h1>
        {practiceName && (
          <p className="text-muted-foreground mt-1">{practiceName}</p>
        )}
      </div>

      {/* Overview cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {placeholderCards.map((card) => (
          <Card key={card.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Getting started hint */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base text-primary">Erste Schritte</CardTitle>
          <CardDescription>
            Dein Workspace ist eingerichtet. Als nächstes kannst du Patienten anlegen und Termine verwalten.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
