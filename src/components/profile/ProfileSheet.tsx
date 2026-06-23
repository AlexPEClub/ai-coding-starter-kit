'use client'

import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'
import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { ProfileSection } from './ProfileSection'
import { CalendarConnectionSection } from './CalendarConnectionSection'
import { DateBlocksSection } from './DateBlocksSection'
import { ArchiveTab } from './ArchiveTab'

interface ProfileSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileSheet({ open, onOpenChange }: ProfileSheetProps) {
  const { signOut } = useAuth()
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

  async function handleLogout() {
    setLogoutDialogOpen(false)
    await signOut()
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[90dvh] bg-bg border-t border-line p-0 flex flex-col rounded-t-[24px]"
        >
          <SheetHeader className="px-5 pt-5 pb-0 flex-shrink-0">
            <SheetTitle className="text-[18px] font-[800] text-ink text-left">
              Mein Konto
            </SheetTitle>
          </SheetHeader>

          <Tabs defaultValue="profil" className="flex-1 flex flex-col min-h-0 mt-3">
            <TabsList className="flex-shrink-0 mx-5 bg-surface-2 rounded-[10px] p-0.5 h-9">
              <TabsTrigger
                value="profil"
                className="flex-1 text-[13px] font-[700] rounded-[8px] data-[state=active]:bg-surface data-[state=active]:text-ink data-[state=active]:shadow-sm text-ink-3"
              >
                Profil
              </TabsTrigger>
              <TabsTrigger
                value="archiv"
                className="flex-1 text-[13px] font-[700] rounded-[8px] data-[state=active]:bg-surface data-[state=active]:text-ink data-[state=active]:shadow-sm text-ink-3"
              >
                Archiv
              </TabsTrigger>
            </TabsList>

            {/* Profil Tab */}
            <TabsContent value="profil" className="flex-1 overflow-y-auto mt-0">
              <div className="px-5 pt-4 pb-6 space-y-5">
                <ProfileSection />

                <Separator className="bg-line" />

                <CalendarConnectionSection />

                <Separator className="bg-line" />

                <DateBlocksSection />

                <Separator className="bg-line" />

                {/* Logout */}
                <Button
                  variant="outline"
                  onClick={() => setLogoutDialogOpen(true)}
                  className="w-full border-error/30 text-error hover:text-error hover:bg-error-soft text-[14px] font-[700] rounded-[12px] gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Ausloggen
                </Button>
              </div>
            </TabsContent>

            {/* Archiv Tab */}
            <TabsContent value="archiv" className="flex-1 overflow-y-auto mt-0">
              <ArchiveTab />
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent className="bg-surface border-line rounded-[18px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-ink">Ausloggen?</AlertDialogTitle>
            <AlertDialogDescription className="text-ink-3">
              Du wirst von deinem Konto abgemeldet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-line text-ink-2">Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-error hover:bg-error text-white"
            >
              Ausloggen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
