import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Handles the Supabase auth redirect after password-reset email links.
// Supabase appends ?code=<pkce-code> to the redirect URL configured in the
// dashboard. We exchange that code for a session here, then send the user
// to the reset-password page (or dashboard if the flow was a magic link).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Redirect to an error page if the code is missing or exchange fails.
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
