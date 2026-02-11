import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Storefinder Admin',
  description: 'Storefinder Verwaltung',
}

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
