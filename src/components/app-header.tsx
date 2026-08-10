"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronDown,
  KeyRound,
  LogOut,
  Menu,
  Home,
  Truck,
  Package,
  Wrench,
  Cog,
  ShieldCheck,
  Send,
  Users,
  Factory,
  PackageSearch,
  BookOpen,
  Lightbulb,
} from "lucide-react";

import { type UserRole } from "@/lib/roles";
import { signOutAction } from "@/lib/actions/auth";
import { KundenSuche } from "@/components/kunden-suche";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

export interface CurrentUser {
  fullName: string;
  email: string;
  roles: UserRole[];
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigationItems: NavItem[] = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/fahrer", label: "Fahrer", icon: Truck },
  { href: "/wareneingang", label: "Wareneingang", icon: Package },
  { href: "/arbeitsvorbereitung", label: "Arbeitsvorbereitung", icon: Wrench },
  { href: "/maschine", label: "Maschine", icon: Cog },
  { href: "/qualitaetssicherung", label: "Qualitätssicherung", icon: ShieldCheck },
  { href: "/warenausgang", label: "Warenausgang", icon: Send },
];

const adminNavItems: NavItem[] = [
  { href: "/verwaltung/nutzer", label: "Nutzerverwaltung", icon: Users },
  { href: "/verwaltung/abholungskalender", label: "Abholungskalender", icon: CalendarDays },
  { href: "/verwaltung/hersteller", label: "Hersteller", icon: Factory },
  { href: "/verwaltung/artikel", label: "Artikel", icon: PackageSearch },
];

const redaktionNavItems: NavItem[] = [
  { href: "/verwaltung/cms/wissensbasis", label: "Wissensbasis", icon: BookOpen },
  { href: "/verwaltung/cms/themenvorschlaege", label: "Themenvorschläge", icon: Lightbulb },
];

function NavigationSheet({
  isAdmin,
  isRedaktion,
}: {
  isAdmin: boolean;
  isRedaktion: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0"
          aria-label="Navigation öffnen"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b border-border p-4 text-left">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col py-2">
          {/* Home - abgesetzt mit Trennlinie */}
          <div className="border-b border-border pb-2">
            {(() => {
              const item = navigationItems[0];
              const Icon = item.icon;
              return (
                <SheetClose asChild>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                    {item.label}
                  </Link>
                </SheetClose>
              );
            })()}
          </div>

          {/* Restliche Menüpunkte */}
          <div className="pt-2">
            {navigationItems.slice(1).map((item) => {
              const Icon = item.icon;
              return (
                <SheetClose key={item.href} asChild>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                    {item.label}
                  </Link>
                </SheetClose>
              );
            })}
          </div>

          {/* Admin-Bereich */}
          {isAdmin && (
            <>
              <div className="border-t border-border mt-2 pt-2">
                <div className="px-4 py-1 text-xs font-semibold uppercase text-muted-foreground">
                  Verwaltung
                </div>
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SheetClose key={item.href} asChild>
                      <Link
                        href={item.href}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
                      >
                        <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                        {item.label}
                      </Link>
                    </SheetClose>
                  );
                })}
              </div>
            </>
          )}

          {/* CMS-Bereich */}
          {(isRedaktion || isAdmin) && (
            <div className="border-t border-border mt-2 pt-2">
              <div className="px-4 py-1 text-xs font-semibold uppercase text-muted-foreground">
                CMS
              </div>
              {redaktionNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SheetClose key={item.href} asChild>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                      {item.label}
                    </Link>
                  </SheetClose>
                );
              })}
            </div>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export function AppHeader({ user }: { user: CurrentUser }) {
  const router = useRouter();
  const isAdmin = user.roles?.includes("admin") ?? false;
  const isRedaktion = user.roles?.includes("redaktion") ?? false;

  async function handleLogout() {
    await signOutAction();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:gap-4">
        {/* Burger-Menü */}
        <div className="flex shrink-0 items-center">
          <NavigationSheet isAdmin={isAdmin} isRedaktion={isRedaktion} />
        </div>

        {/* Logo */}
        <Link href="/home" className="flex shrink-0 items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Image
              src="/logo.svg"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 brightness-0 invert"
            />
          </span>
          <span className="hidden text-lg font-bold text-foreground sm:inline">TMS 2.0</span>
        </Link>

        {/* Kundensuche — immer sichtbar (PROJ-43) */}
        <div className="min-w-0 flex-1">
          <KundenSuche />
        </div>

        {/* User-Menü */}
        <div className="flex shrink-0 items-center justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-12 gap-2 px-2 sm:px-3"
                aria-label="Benutzermenü"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {initials(user.fullName)}
                </span>
                <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <span className="block text-sm font-medium">{user.fullName}</span>
                <span className="block text-xs text-muted-foreground">
                  {user.email}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isAdmin && (
                <>
                  <DropdownMenuItem onClick={() => router.push("/verwaltung/nutzer")}>
                    <Users className="mr-2 h-4 w-4" />
                    Nutzerverwaltung
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/verwaltung/abholungskalender")}>
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Abholungskalender
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={() => router.push("/passwort-aendern")}>
                <KeyRound className="mr-2 h-4 w-4" />
                Passwort ändern
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Abmelden
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
