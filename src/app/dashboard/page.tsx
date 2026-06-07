import { createClient } from '@/lib/supabase-server'
import { LogoutButton } from './logout-button'
import { DashboardClient } from './dashboard-client'
import type { Suggestion } from './suggestion-card'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('suggestions')
    .select('id, title, body, insight, source, category, status, report_date')
    .order('report_date', { ascending: false })
    .order('created_at', { ascending: true })

  const suggestions = (data ?? []) as Suggestion[]

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#070B1E', fontFamily: 'var(--font-sora), sans-serif' }}
    >
      <header
        className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10"
        style={{ borderColor: '#1C2340', background: '#070B1E' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="text-sm font-extrabold tracking-[4px] uppercase"
            style={{
              background: 'linear-gradient(90deg, #38E5FF, #0078FF, #7B81FF, #A720FF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            NEXORA AI
          </div>
          <div
            className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium"
            style={{ background: '#0E1430', color: '#8892B0', border: '1px solid #1C2340' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
            NORA
          </div>
        </div>
        <LogoutButton />
      </header>

      <DashboardClient initialSuggestions={suggestions} />
    </div>
  )
}
