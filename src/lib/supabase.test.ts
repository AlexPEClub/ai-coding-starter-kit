import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: vi.fn() })),
}))

describe('supabase client', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it('throws with correct message when NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-key')
    await expect(import('./supabase')).rejects.toThrow(
      'Missing env var: NEXT_PUBLIC_SUPABASE_URL'
    )
  })

  it('throws with correct message when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')
    await expect(import('./supabase')).rejects.toThrow(
      'Missing env var: NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  })

  it('exports a typed supabase client when both env vars are set', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
    const { supabase } = await import('./supabase')
    expect(supabase).toBeDefined()
  })
})
