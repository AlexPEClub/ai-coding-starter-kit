import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { UserRole, UserStatus } from "@/lib/roles";

const PUBLIC_PATHS = ["/login", "/passwort-vergessen", "/auth"];
const PASSWORD_PATH = "/passwort-aendern";

/**
 * Erneuert die Supabase-Session und erzwingt den Routenschutz:
 * - nicht angemeldet -> /login
 * - deaktiviert -> abmelden + /login?error=disabled
 * - Passwortwechsel offen -> /passwort-aendern
 * - /verwaltung nur für Rolle "admin", außer /verwaltung/cms (zusätzlich "redaktion")
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  // Redirect-Helfer: behält die ggf. erneuerten Session-Cookies bei.
  const redirectTo = (path: string, params?: Record<string, string>) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  };

  if (!user) {
    return isPublic ? response : redirectTo("/login");
  }

  // Angemeldet: Profil prüfen (RLS erlaubt das eigene Profil).
  const { data: profile } = await supabase
    .from("profiles")
    .select("roles, status, must_change_password")
    .eq("id", user.id)
    .single<{ roles: UserRole[]; status: UserStatus; must_change_password: boolean }>();

  if (!profile || profile.status === "deaktiviert") {
    // Session-Cookies löschen, damit alte/ungültige Sessions nicht
    // eine Endlosschleife erzeugen.
    const redirect = redirectTo("/login", { error: "disabled" });
    redirect.cookies.set("sb-access-token", "", { maxAge: 0, path: "/" });
    redirect.cookies.set("sb-refresh-token", "", { maxAge: 0, path: "/" });
    redirect.cookies.set("sb-auth-token", "", { maxAge: 0, path: "/" });
    return redirect;
  }

  if (profile.must_change_password && pathname !== PASSWORD_PATH) {
    return redirectTo(PASSWORD_PATH);
  }

  if (pathname === "/login" || pathname === "/") {
    return redirectTo("/dashboard");
  }

  const hasAdmin = !!profile.roles?.includes("admin");
  const hasRedaktion = !!profile.roles?.includes("redaktion");
  const isCmsPath = pathname.startsWith("/verwaltung/cms");
  if (pathname.startsWith("/verwaltung") && !hasAdmin && !(isCmsPath && hasRedaktion)) {
    return redirectTo("/dashboard");
  }

  return response;
}
