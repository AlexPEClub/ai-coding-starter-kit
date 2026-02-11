import { createClient } from '@/lib/supabase-server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Wrench, Users, Settings } from 'lucide-react'

async function getDashboardStats() {
  const supabase = await createClient()

  const [stuetzpunkte, services, config] = await Promise.all([
    supabase.from('stuetzpunkte').select('id, status', { count: 'exact' }),
    supabase.from('service_typen').select('id', { count: 'exact' }),
    supabase.from('widget_config').select('map_provider').single(),
  ])

  const aktiv = stuetzpunkte.data?.filter((s) => s.status === 'aktiv').length ?? 0
  const geschlossen = stuetzpunkte.data?.filter((s) => s.status === 'temporaer_geschlossen').length ?? 0

  return {
    totalStuetzpunkte: stuetzpunkte.count ?? 0,
    aktiveStuetzpunkte: aktiv,
    geschlosseneStuetzpunkte: geschlossen,
    totalServices: services.count ?? 0,
    mapProvider: config.data?.map_provider ?? 'openstreetmap',
  }
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Übersicht über den Storefinder
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stützpunkte</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStuetzpunkte}</div>
            <p className="text-xs text-muted-foreground">
              {stats.aktiveStuetzpunkte} aktiv, {stats.geschlosseneStuetzpunkte} geschlossen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service-Typen</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalServices}</div>
            <p className="text-xs text-muted-foreground">
              Konfigurierte Services
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Map Provider</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {stats.mapProvider === 'openstreetmap' ? 'OpenStreetMap' : 'Google Maps'}
            </div>
            <p className="text-xs text-muted-foreground">
              Aktiver Kartenanbieter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Registrierte Administratoren
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
