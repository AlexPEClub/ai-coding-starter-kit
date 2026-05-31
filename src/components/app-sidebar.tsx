'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Calendar,
  Dumbbell,
  ClipboardList,
  Settings,
  LogOut,
  ChevronUp,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

type Profile = {
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  tenant: { name: string } | null
}

const navItems = [
  { label: 'Dashboard',      href: '/dashboard',       icon: LayoutDashboard },
  { label: 'Patienten',      href: '/patients',        icon: Users },
  { label: 'Termine',        href: '/appointments',    icon: Calendar },
  { label: 'Übungen',        href: '/exercises',       icon: Dumbbell },
  { label: 'Trainingspläne', href: '/training-plans',  icon: ClipboardList },
  { label: 'Einstellungen',  href: '/settings/profile', icon: Settings },
]

function initials(profile: Profile | null) {
  if (!profile) return '?'
  const f = profile.first_name?.[0] ?? ''
  const l = profile.last_name?.[0] ?? ''
  return (f + l).toUpperCase() || '?'
}

export function AppSidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setProfile(data))
      .catch(() => null)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const displayName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Therapeut'
    : 'Laden…'

  return (
    <Sidebar>
      {/* Logo / Practice Name */}
      <SidebarHeader className="px-4 py-5">
        <div>
          <p className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider mb-0.5">
            TierPhysio
          </p>
          <p className="text-sm font-semibold text-sidebar-foreground truncate">
            {profile?.tenant?.name ?? '…'}
          </p>
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link href={item.href} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User footer */}
      <SidebarFooter className="p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                  {initials(profile)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-left text-sm leading-tight overflow-hidden">
                <span className="truncate font-semibold">{displayName}</span>
              </div>
              <ChevronUp className="ml-auto h-4 w-4 shrink-0" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/settings/profile">
                <Settings className="mr-2 h-4 w-4" />
                Profil-Einstellungen
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings/workspace">
                <Settings className="mr-2 h-4 w-4" />
                Praxis-Einstellungen
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Abmelden
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
