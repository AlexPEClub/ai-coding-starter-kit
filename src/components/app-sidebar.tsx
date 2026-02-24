"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Building2,
  Route,
  CalendarDays,
  Calendar,
  FileText,
  Users,
  LogOut,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/lib/user-context"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import type { UserRole } from "@/lib/types"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "trainer", "management"] },
  { title: "Apotheken", href: "/apotheken", icon: Building2, roles: ["admin", "trainer", "management"] },
  { title: "Touren", href: "/touren", icon: Route, roles: ["admin"] },
  { title: "Termine", href: "/termine", icon: CalendarDays, roles: ["admin", "trainer"] },
  { title: "Kalender", href: "/kalender", icon: Calendar, roles: ["admin", "trainer"] },
  { title: "Berichte", href: "/berichte", icon: FileText, roles: ["admin", "trainer", "management"] },
]

const adminItems: NavItem[] = [
  { title: "Benutzerverwaltung", href: "/admin/users", icon: Users, roles: ["admin"] },
]

const roleLabels: Record<string, string> = {
  admin: "Admin",
  trainer: "Trainer",
  management: "Management",
}

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useUser()
  const router = useRouter()
  const supabase = createClient()

  if (!user) return null

  const visibleNav = navItems.filter((item) =>
    item.roles.includes(user.role)
  )
  const visibleAdmin = adminItems.filter((item) =>
    item.roles.includes(user.role)
  )

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error("Abmelden fehlgeschlagen")
    } else {
      router.push("/login")
    }
  }

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            MW
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Apo-Schulungs-Manager</span>
            <span className="text-xs text-muted-foreground">MW Education</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {visibleAdmin.length > 0 && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Administration</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleAdmin.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname.startsWith(item.href)}
                        tooltip={item.title}
                      >
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
            {user.full_name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-sm font-medium">{user.full_name}</span>
            <Badge variant="secondary" className="w-fit text-xs">
              {roleLabels[user.role]}
            </Badge>
          </div>
          <button
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Abmelden"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
