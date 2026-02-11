import { AdminLayout } from '@/components/admin-layout'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayout>{children}</AdminLayout>
}
