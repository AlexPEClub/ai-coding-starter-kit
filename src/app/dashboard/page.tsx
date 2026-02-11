'use client'

import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  User, 
  Calendar, 
  Mail, 
  Shield, 
  Settings, 
  FileText, 
  Activity,
  Bell,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

export default function DashboardPage() {
  // Mock user data
  const user = {
    displayName: 'Max Mustermann',
    email: 'user@example.com',
    avatarUrl: null,
    emailVerified: true,
    createdAt: '2024-01-15T10:30:00Z',
    lastLoginAt: '2024-02-05T14:22:00Z'
  }

  // Mock stats
  const stats = {
    totalLogins: 42,
    profileCompleteness: 85,
    securityScore: 'High',
    lastActivity: '2024-02-05T16:30:00Z'
  }

  // Mock notifications
  const notifications = [
    {
      id: 1,
      type: 'success',
      title: 'Profil aktualisiert',
      message: 'Dein Profil wurde erfolgreich aktualisiert',
      timestamp: '2 Stunden ago'
    },
    {
      id: 2,
      type: 'warning',
      title: 'Sicherheitshinweis',
      message: 'Neue Anmeldung von unerkanntem Gerät',
      timestamp: '1 Tag ago'
    },
    {
      id: 3,
      type: 'info',
      title: 'Willkommen!',
      message: 'Danke für die Registrierung bei unserer Plattform',
      timestamp: '3 Wochen ago'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Willkommen zurück, {user.displayName}!</h1>
          <p className="text-gray-600 mt-1">
            Hier ist eine Übersicht über dein Konto und deine Aktivitäten
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={user.emailVerified ? "default" : "secondary"}>
            {user.emailVerified ? "Verifiziert" : "Nicht verifiziert"}
          </Badge>
          <Button asChild>
            <Link href="/dashboard/profile">
              <User className="mr-2 h-4 w-4" />
              Profil bearbeiten
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold">{stats.totalLogins}</p>
                <p className="text-sm text-gray-600">Gesamte Logins</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <User className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold">{stats.profileCompleteness}%</p>
                <p className="text-sm text-gray-600">Profil-Vollständigkeit</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold">{stats.securityScore}</p>
                <p className="text-sm text-gray-600">Sicherheits-Level</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-bold">
                  {new Date(stats.lastActivity).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: 'short'
                  })}
                </p>
                <p className="text-sm text-gray-600">Letzte Aktivität</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Overview */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Konto-Übersicht
              </CardTitle>
              <CardDescription>
                Wichtige Informationen über dein Konto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatarUrl || undefined} />
                    <AvatarFallback>
                      {user.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.displayName}</p>
                    <p className="text-sm text-gray-500">Profil-Name</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Mail className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{user.email}</p>
                    <p className="text-sm text-gray-500">Email-Adresse</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Verifiziert</p>
                    <p className="text-sm text-gray-500">Email-Status</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {new Date(user.createdAt).toLocaleDateString('de-DE')}
                    </p>
                    <p className="text-sm text-gray-500">Mitglied seit</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="flex-1">
                  <Link href="/dashboard/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profil bearbeiten
                  </Link>
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Einstellungen
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Schnellaktionen</CardTitle>
              <CardDescription>
                Häufig genutzte Funktionen und Einstellungen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button variant="outline" asChild className="justify-start h-auto p-4">
                  <Link href="/dashboard/profile" className="flex items-center">
                    <User className="mr-3 h-5 w-5" />
                    <div className="text-left">
                      <p className="font-medium">Profil aktualisieren</p>
                      <p className="text-sm text-gray-500">Name und Avatar ändern</p>
                    </div>
                  </Link>
                </Button>
                
                <Button variant="outline" asChild className="justify-start h-auto p-4">
                  <Link href="/dashboard/profile?tab=security" className="flex items-center">
                    <Shield className="mr-3 h-5 w-5" />
                    <div className="text-left">
                      <p className="font-medium">Sicherheit</p>
                      <p className="text-sm text-gray-500">Passwort ändern</p>
                    </div>
                  </Link>
                </Button>
                
                <Button variant="outline" asChild className="justify-start h-auto p-4">
                  <Link href="/dashboard/settings" className="flex items-center">
                    <Settings className="mr-3 h-5 w-5" />
                    <div className="text-left">
                      <p className="font-medium">Einstellungen</p>
                      <p className="text-sm text-gray-500">Präferenzen anpassen</p>
                    </div>
                  </Link>
                </Button>
                
                <Button variant="outline" asChild className="justify-start h-auto p-4">
                  <Link href="/dashboard/profile?tab=activity" className="flex items-center">
                    <Activity className="mr-3 h-5 w-5" />
                    <div className="text-left">
                      <p className="font-medium">Aktivität</p>
                      <p className="text-sm text-gray-500">Login-Verlauf ansehen</p>
                    </div>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Benachrichtigungen
              </CardTitle>
              <CardDescription>
                Aktuelle Updates und Warnungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className="mt-0.5">
                    {notification.type === 'success' && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                    {notification.type === 'warning' && (
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    )}
                    {notification.type === 'info' && (
                      <FileText className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="text-sm text-gray-500">{notification.message}</p>
                    <p className="text-xs text-gray-400">{notification.timestamp}</p>
                  </div>
                </div>
              ))}
              
              <Button variant="outline" className="w-full">
                Alle Benachrichtigungen anzeigen
              </Button>
            </CardContent>
          </Card>

          {/* Security Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Sicherheits-Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Email-Verifizierung</span>
                  <Badge variant="default">Aktiv</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Passwort-Stärke</span>
                  <Badge variant="default">Stark</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Zwei-Faktor-Auth</span>
                  <Badge variant="secondary">Nicht aktiv</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Aktive Sitzungen</span>
                  <Badge variant="outline">1 Gerät</Badge>
                </div>
              </div>
              
              <Button asChild className="w-full">
                <Link href="/dashboard/profile?tab=security">
                  Sicherheit verbessern
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}