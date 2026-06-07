'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } finally {
      window.location.href = '/login'
    }
  }

  return (
    <Button
      onClick={handleLogout}
      disabled={loading}
      variant="outline"
      className="border text-white hover:opacity-90"
      style={{ background: '#0E1430', borderColor: '#1C2340' }}
    >
      {loading ? 'Abmelden…' : 'Abmelden'}
    </Button>
  )
}
