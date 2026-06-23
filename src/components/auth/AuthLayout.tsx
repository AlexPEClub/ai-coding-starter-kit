import type { ReactNode } from 'react'

type AuthLayoutProps = {
  children: ReactNode
  title: string
  subtitle?: string
  footer?: ReactNode
}

export function AuthLayout({ children, title, subtitle, footer }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-2xl font-black uppercase tracking-[0.2em] text-foreground">
            ZUSAMMEN
          </span>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-md p-6 space-y-6">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {children}
        </div>

        {footer && (
          <div className="text-center mt-5 text-sm text-muted-foreground">
            {footer}
          </div>
        )}
      </div>
    </main>
  )
}
