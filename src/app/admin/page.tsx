'use client'

import { AdminDashboard } from "@/components/admin/admin-dashboard"

export default function AdminPage() {
  // Mock user data - in production, this would come from authentication
  const mockUser = {
    email: "admin@example.com",
    name: "Administrator"
  }

  return <AdminDashboard user={mockUser} />
}