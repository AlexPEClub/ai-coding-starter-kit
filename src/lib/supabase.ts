import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Fehlende Supabase Umgebungsvariablen:\n' +
      (!url ? '  - NEXT_PUBLIC_SUPABASE_URL\n' : '') +
      (!key ? '  - NEXT_PUBLIC_SUPABASE_ANON_KEY\n' : '')
    )
  }

  return createBrowserClient(url, key)
}
