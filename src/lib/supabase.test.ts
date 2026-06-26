import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Tests für die Fail-Fast-Env-Var-Prüfung (PROJ-1, AC9)
describe('createClient (Browser-Supabase-Client)', () => {
  const ORIGINAL_ENV = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it('wirft einen klaren Fehler, wenn NEXT_PUBLIC_SUPABASE_URL fehlt', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

    const { createClient } = await import('./supabase')
    expect(() => createClient()).toThrowError(/NEXT_PUBLIC_SUPABASE_URL/)
  })

  it('wirft einen klaren Fehler, wenn NEXT_PUBLIC_SUPABASE_ANON_KEY fehlt', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const { createClient } = await import('./supabase')
    expect(() => createClient()).toThrowError(/NEXT_PUBLIC_SUPABASE_ANON_KEY/)
  })

  it('erstellt einen Client, wenn beide Variablen gesetzt sind', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

    const { createClient } = await import('./supabase')
    const client = createClient()
    expect(client).toBeDefined()
    expect(client.auth).toBeDefined()
  })
})
