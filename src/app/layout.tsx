import type { Metadata } from 'next'
import { Sora } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'NORA — Kordix AI BizDev Agent',
  description: 'Daily BizDev suggestions powered by NORA',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de" className={sora.variable}>
      <body className={`${sora.className} antialiased`} style={{ background: '#070B1E', color: '#FFFFFF' }}>
        {children}
        <Toaster richColors theme="dark" />
      </body>
    </html>
  )
}
