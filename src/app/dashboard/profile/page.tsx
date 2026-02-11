'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Loader2, 
  Mail, 
  Calendar, 
  Shield, 
  Camera, 
  Save, 
  Eye, 
  EyeOff,
  Download,
  Trash2,
  Clock,
  Monitor,
  MapPin
} from 'lucide-react'

const profileFormSchema = z.object({
  displayName: z.string().min(1, "Anzeigename ist erforderlich").max(50, "Maximal 50 Zeichen"),
  email: z.string().email("Ungültige Email-Adresse")
})

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Aktuelles Passwort ist erforderlich"),
  newPassword: z.string().min(8, "Mindestens 8 Zeichen"),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwörter stimmen nicht überein",
  path: ["confirmPassword"]
})

type ProfileFormData = z.infer<typeof profileFormSchema>
type PasswordFormData = z.infer<typeof passwordFormSchema>

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Mock user data
  const [userData, setUserData] = useState<{
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    emailVerified: boolean;
    createdAt: string;
    lastLoginAt: string;
  }>({
    id: '123',
    email: 'user@example.com',
    displayName: 'Max Mustermann',
    avatarUrl: null,
    emailVerified: true,
    createdAt: '2024-01-15T10:30:00Z',
    lastLoginAt: '2024-02-05T14:22:00Z'
  })

  const [loginHistory] = useState([
    {
      id: 1,
      timestamp: '2024-02-05T14:22:00Z',
      device: 'Chrome 120 on macOS',
      location: 'Berlin, Germany',
      ip: '192.168.1.1'
    },
    {
      id: 2,
      timestamp: '2024-02-04T09:15:00Z',
      device: 'Safari 17 on iPhone',
      location: 'Munich, Germany', 
      ip: '192.168.1.2'
    },
    {
      id: 3,
      timestamp: '2024-02-03T16:45:00Z',
      device: 'Firefox 121 on Windows',
      location: 'Hamburg, Germany',
      ip: '192.168.1.3'
    }
  ])

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: userData.displayName,
      email: userData.email
    }
  })

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    watch: watchPassword
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordFormSchema)
  })

  const newPassword = watchPassword('newPassword')
  const confirmPassword = watchPassword('confirmPassword')

  useEffect(() => {
    resetProfile({
      displayName: userData.displayName,
      email: userData.email
    })
  }, [userData, resetProfile])

  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // TODO: Implement actual profile update with Supabase
      console.log('Profile update:', data)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setUserData(prev => ({
        ...prev,
        displayName: data.displayName,
        email: data.email
      }))
      
      setSuccess('Profil wurde erfolgreich aktualisiert')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profil-Update fehlgeschlagen')
    } finally {
      setIsLoading(false)
    }
  }

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsPasswordLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // TODO: Implement actual password change with Supabase
      console.log('Password change:', { ...data, confirmPassword: undefined })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      resetPassword()
      setSuccess('Passwort wurde erfolgreich geändert')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Passwort-Änderung fehlgeschlagen')
    } finally {
      setIsPasswordLoading(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Bitte lade ein Bild hoch (JPG, PNG)')
      return
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      setError('Bild darf maximal 2MB groß sein')
      return
    }

    setIsLoading(true)
    try {
      // TODO: Implement actual avatar upload with Supabase Storage
      console.log('Avatar upload:', file)
      
      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock successful upload
      setUserData(prev => ({
        ...prev,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`
      }))
      
      setSuccess('Avatar wurde erfolgreich hochgeladen')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Avatar-Upload fehlgeschlagen')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDataExport = async () => {
    try {
      // TODO: Implement actual data export
      console.log('Data export requested')
      
      // Simulate export preparation
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock download
      const dataStr = JSON.stringify(userData, null, 2)
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
      
      const exportFileDefaultName = `user-data-${new Date().toISOString().split('T')[0]}.json`
      
      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()
      
      setSuccess('Daten wurden erfolgreich exportiert')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Daten-Export fehlgeschlagen')
    }
  }

  const handleAccountDeletion = () => {
    // TODO: Implement account deletion flow
    console.log('Account deletion requested')
    alert('Konto-Löschung: Dies würde einen Bestätigungsdialog mit 30-tägiger Grace Period öffnen.')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold text-gray-900">Profil</h1>
          <Badge variant={userData.emailVerified ? "default" : "secondary"}>
            {userData.emailVerified ? "Verifiziert" : "Nicht verifiziert"}
          </Badge>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Overview Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <div className="relative inline-block">
                  <Avatar className="w-24 h-24 mx-auto">
                    <AvatarImage src={userData.avatarUrl || undefined} />
                    <AvatarFallback className="text-2xl">
                      {userData.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full cursor-pointer hover:bg-blue-700">
                    <Camera className="h-4 w-4" />
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={isLoading}
                    />
                  </label>
                </div>
                <CardTitle className="text-xl">{userData.displayName}</CardTitle>
                <CardDescription>{userData.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Email</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">
                    Mitglied seit {new Date(userData.createdAt).toLocaleDateString('de-DE')}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">
                    {userData.emailVerified ? 'Email verifiziert' : 'Email nicht verifiziert'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="profile" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Profil</TabsTrigger>
                <TabsTrigger value="security">Sicherheit</TabsTrigger>
                <TabsTrigger value="activity">Aktivität</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Profil bearbeiten</CardTitle>
                    <CardDescription>
                      Aktualisiere deine persönlichen Informationen
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Anzeigename</Label>
                        <Input
                          id="displayName"
                          placeholder="Dein Name"
                          {...registerProfile('displayName')}
                          className={profileErrors.displayName ? 'border-red-500' : ''}
                        />
                        {profileErrors.displayName && (
                          <p className="text-sm text-red-500">{profileErrors.displayName.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email-Adresse</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="deine@email.de"
                          {...registerProfile('email')}
                          className={profileErrors.email ? 'border-red-500' : ''}
                        />
                        {profileErrors.email && (
                          <p className="text-sm text-red-500">{profileErrors.email.message}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          Email-Änderung erfordert eine Verifikation
                        </p>
                      </div>

                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Wird gespeichert...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Änderungen speichern
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Passwort ändern</CardTitle>
                    <CardDescription>
                      Wähle ein sicheres neues Passwort für dein Konto
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showCurrentPassword ? 'text' : 'password'}
                            placeholder="Aktuelles Passwort"
                            {...registerPassword('currentPassword')}
                            className={passwordErrors.currentPassword ? 'border-red-500' : ''}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        {passwordErrors.currentPassword && (
                          <p className="text-sm text-red-500">{passwordErrors.currentPassword.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newPassword">Neues Passwort</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showNewPassword ? 'text' : 'password'}
                            placeholder="Neues Passwort"
                            {...registerPassword('newPassword')}
                            className={passwordErrors.newPassword ? 'border-red-500' : ''}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        {passwordErrors.newPassword && (
                          <p className="text-sm text-red-500">{passwordErrors.newPassword.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Passwort wiederholen"
                            {...registerPassword('confirmPassword')}
                            className={passwordErrors.confirmPassword ? 'border-red-500' : ''}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        {passwordErrors.confirmPassword && (
                          <p className="text-sm text-red-500">{passwordErrors.confirmPassword.message}</p>
                        )}
                        {confirmPassword && newPassword === confirmPassword && (
                          <p className="text-sm text-green-500">Passwörter stimmen überein</p>
                        )}
                      </div>

                      <Button type="submit" disabled={isPasswordLoading}>
                        {isPasswordLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Passwort wird geändert...
                          </>
                        ) : (
                          'Passwort ändern'
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Account Management */}
                <Card>
                  <CardHeader>
                    <CardTitle>Konto-Verwaltung</CardTitle>
                    <CardDescription>
                      Verwalte deine Daten und Privatsphäre
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button variant="outline" onClick={handleDataExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Daten exportieren
                      </Button>
                      <Button variant="destructive" onClick={handleAccountDeletion}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Konto löschen
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Daten-Export erstellt eine JSON-Datei mit all deinen Informationen. 
                      Konto-Löschung startet einen 30-tägigen Grace Period.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Login-Geschichte</CardTitle>
                    <CardDescription>
                      Die letzten 10 Anmeldungen an deinem Konto
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {loginHistory.map((login, index) => (
                        <div key={login.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Monitor className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium">{login.device}</span>
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span>{login.location}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{new Date(login.timestamp).toLocaleDateString('de-DE', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}</span>
                              </div>
                            </div>
                          </div>
                          {index === 0 && (
                            <Badge variant="default">Aktuell</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}