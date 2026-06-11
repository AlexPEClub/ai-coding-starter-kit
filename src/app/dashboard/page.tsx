import { createClient } from '@/lib/supabase-server'
import { LogoutButton } from './logout-button'
import { GenerateButton } from './generate-button'
import { DashboardClient } from './dashboard-client'
import type { Suggestion } from './suggestion-card'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [listResult, implCount, appCount, rejCount] = await Promise.all([
    supabase
      .from('suggestions')
      .select('id, title, body, insight, source, category, status, report_date')
      .order('report_date', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(500),
    supabase.from('suggestions').select('*', { count: 'exact', head: true }).eq('status', 'implemented'),
    supabase.from('suggestions').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('suggestions').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
  ])

  const suggestions = (listResult.data ?? []) as Suggestion[]
  const allTimeCounts = {
    implemented: implCount.count ?? 0,
    approved: appCount.count ?? 0,
    rejected: rejCount.count ?? 0,
  }

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
        <div className="flex items-center gap-2">
          <GenerateButton />
          <LogoutButton />
        </div>
      </header>

      <DashboardClient initialSuggestions={suggestions} allTimeCounts={allTimeCounts} />
    </div>
  )
}
