'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface CalendarConnection {
  id: string
  user_id: string
  google_email: string
  expires_at: string
  created_at: string
}

export function useCalendarConnection() {
  const { user } = useAuth()
  const [connection, setConnection] = useState<CalendarConnection | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  const fetchConnection = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('calendar_connections')
      .select('id, user_id, google_email, expires_at, created_at')
      .eq('user_id', user.id)
      .maybeSingle()
    setConnection(data ?? null)
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchConnection()
  }, [fetchConnection])

  const isExpired = connection
    ? new Date(connection.expires_at) < new Date()
    : false

  async function connectGoogleCalendar(): Promise<{ error: string | null }> {
    if (!user) return { error: 'Nicht eingeloggt' }
    setConnecting(true)
    try {
      const redirectUrl = `${window.location.origin}/auth/google-calendar/callback`
      const { data, error } = await supabase.functions.invoke('google-calendar-oauth/init', {
        body: { redirect_url: redirectUrl },
      })
      if (error) return { error: error.message }
      if (data?.auth_url) {
        window.location.href = data.auth_url as string
      }
      return { error: null }
    } catch {
      return { error: 'Google Kalender konnte nicht verbunden werden' }
    } finally {
      setConnecting(false)
    }
  }

  async function disconnectCalendar(): Promise<boolean> {
    if (!user || !connection) return false
    setDisconnecting(true)
    const { error } = await supabase
      .from('calendar_connections')
      .delete()
      .eq('user_id', user.id)
    setDisconnecting(false)
    if (error) return false
    setConnection(null)
    return true
  }

  return {
    connection,
    loading,
    connecting,
    disconnecting,
    isExpired,
    connectGoogleCalendar,
    disconnectCalendar,
    refetch: fetchConnection,
  }
}
