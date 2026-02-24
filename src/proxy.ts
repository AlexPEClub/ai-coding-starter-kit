import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Refresh session — IMPORTANT: do not add any logic between createServerClient and getUser()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    // Auth routes: redirect authenticated users to dashboard
    if (user && (pathname === "/" || pathname === "/login" || pathname === "/reset-password")) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // Protected routes: redirect unauthenticated users to login
    const isAuthRoute =
        pathname.startsWith("/login") ||
        pathname.startsWith("/reset-password") ||
        pathname.startsWith("/update-password") ||
        pathname.startsWith("/api/kalender/")  // token-based ICS feed — no cookie auth needed
    if (!user && !isAuthRoute) {
        return NextResponse.redirect(new URL("/login", request.url))
    }

    // Role-based route protection (requires user profile lookup)
    if (user) {
        const { data: profile } = await supabase
            .from("user_profiles")
            .select("role, is_active")
            .eq("id", user.id)
            .single()

        // Deactivated users are logged out
        if (profile && !profile.is_active) {
            await supabase.auth.signOut()
            return NextResponse.redirect(new URL("/login?error=deactivated", request.url))
        }

        // Admin-only routes (Trainers can access /touren to view their own tours)
        const adminOnlyRoutes = ["/admin"]
        const isAdminRoute = adminOnlyRoutes.some((r) => pathname.startsWith(r))
        // Only redirect if we have a confirmed non-admin profile
        if (isAdminRoute && profile && profile.role !== "admin") {
            return NextResponse.redirect(new URL("/dashboard", request.url))
        }

        // Management-only: no write routes (enforced by RLS + UI, not middleware)
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico, sitemap.xml, robots.txt
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
}
