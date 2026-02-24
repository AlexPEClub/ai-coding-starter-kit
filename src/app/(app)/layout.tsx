import { redirect } from "next/navigation"
import { Toaster } from "@/components/ui/sonner"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { UserProvider } from "@/components/user-provider"
import { createClient } from "@/lib/supabase/server"
import type { UserProfile } from "@/lib/types"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) {
    // Profile missing — sign out and redirect to login
    await supabase.auth.signOut()
    redirect("/login?error=no_profile")
  }

  const currentUser = profile as UserProfile

  return (
    <UserProvider user={currentUser}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </header>
          <div className="flex-1 overflow-auto p-6">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
      <Toaster />
    </UserProvider>
  )
}
