import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { UserRole, UserStatus } from "@/lib/roles";

/** Supabase-Client für Server-Komponenten und Server-Actions (Session via Cookies). */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // In Server-Komponenten ist set() nicht erlaubt — die Middleware
            // erneuert die Session-Cookies. Hier bewusst ignorieren.
          }
        },
      },
    },
  );
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  roles: UserRole[];
  status: UserStatus;
  must_change_password: boolean;
}

/** Aktuelles Profil (oder null, wenn nicht angemeldet / kein Profil). */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, roles, status, must_change_password")
    .eq("id", user.id)
    .single();

  return (data as Profile) ?? null;
}
