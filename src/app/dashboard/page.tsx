import { LogoutButton } from './logout-button'

export default function DashboardPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#070B1E', fontFamily: 'var(--font-sora), sans-serif' }}
    >
      <header
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: '#1C2340' }}
      >
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
        <LogoutButton />
      </header>

      <main className="flex-1 flex items-center justify-center">
        <p style={{ color: '#8892B0' }}>Dashboard — wird in PROJ-3 gebaut</p>
      </main>
    </div>
  )
}
