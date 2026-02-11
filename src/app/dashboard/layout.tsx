'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { User, Settings, LogOut, Home, Shield, Crown } from 'lucide-react'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  // Mock user data - in real app this would come from auth context
  const user = {
    displayName: 'Max Mustermann',
    email: 'user@example.com',
    avatarUrl: null
  }

  const handleLogout = async () => {
    try {
      // TODO: Implement actual logout with Supabase
      console.log('Logging out...')
      
      // Simulate logout
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Hard redirect to login as per frontend-dev.md
      window.location.href = '/login'
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Home className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-semibold text-gray-900">Dashboard</span>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link 
                href="/dashboard" 
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Übersicht
              </Link>
              <Link 
                href="/dashboard/profile" 
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Profil
              </Link>
              <Link 
                href="/dashboard/settings" 
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Einstellungen
              </Link>
            </nav>

            {/* User Menu */}
            <div className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatarUrl || undefined} />
                      <AvatarFallback>
                        {user.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.displayName}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Einstellungen
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/security" className="flex items-center">
                      <Shield className="mr-2 h-4 w-4" />
                      Sicherheit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-center">
                      <Crown className="mr-2 h-4 w-4" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="flex items-center cursor-pointer"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Ausloggen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Mobile Navigation (if needed) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t">
        <nav className="flex justify-around items-center h-16">
          <Link 
            href="/dashboard" 
            className="flex flex-col items-center justify-center text-gray-700 hover:text-gray-900"
          >
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Übersicht</span>
          </Link>
          <Link 
            href="/dashboard/profile" 
            className="flex flex-col items-center justify-center text-gray-700 hover:text-gray-900"
          >
            <User className="h-5 w-5" />
            <span className="text-xs mt-1">Profil</span>
          </Link>
          <Link 
            href="/dashboard/settings" 
            className="flex flex-col items-center justify-center text-gray-700 hover:text-gray-900"
          >
            <Settings className="h-5 w-5" />
            <span className="text-xs mt-1">Einstellungen</span>
          </Link>
        </nav>
      </div>
    </div>
  )
}