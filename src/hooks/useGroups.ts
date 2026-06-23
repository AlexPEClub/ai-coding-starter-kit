'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { GroupWithMeta, GroupRole } from '@/lib/group-types'

export function useGroups() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<GroupWithMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGroups = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    setError(null)

    const { data: memberships, error: memErr } = await supabase
      .from('group_members')
      .select('role, group_id')
      .eq('user_id', user.id)

    if (memErr) {
      setError(memErr.message)
      setLoading(false)
      return
    }

    const groupIds = memberships?.map((m) => m.group_id) ?? []

    if (groupIds.length === 0) {
      setGroups([])
      setLoading(false)
      return
    }

    const [{ data: groupsData, error: groupsErr }, { data: allMembers }] = await Promise.all([
      supabase.from('groups').select('*').in('id', groupIds),
      supabase.from('group_members').select('group_id').in('group_id', groupIds),
    ])

    if (groupsErr) {
      setError(groupsErr.message)
      setLoading(false)
      return
    }

    const countMap: Record<string, number> = {}
    for (const m of allMembers ?? []) {
      countMap[m.group_id] = (countMap[m.group_id] ?? 0) + 1
    }

    const roleMap: Record<string, GroupRole> = {}
    for (const m of memberships ?? []) {
      roleMap[m.group_id] = m.role as GroupRole
    }

    setGroups(
      (groupsData ?? []).map((g) => ({
        ...g,
        invite_code: g.invite_code ?? null,
        member_count: countMap[g.id] ?? 0,
        my_role: roleMap[g.id] ?? 'editor',
      }))
    )
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  // Member counts / memberships can change on another device (e.g. someone
  // joins via invite code). Without server push for group_members we refetch
  // whenever the tab regains focus/visibility, so the list reflects reality
  // without forcing a manual reload.
  useEffect(() => {
    if (!user) return
    function refresh() {
      if (document.visibilityState === 'visible') fetchGroups()
    }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [user, fetchGroups])

  async function createGroup(name: string): Promise<{ groupId: string | null; error: string | null }> {
    if (!user) return { groupId: null, error: 'Nicht eingeloggt' }

    // Group + creator membership are created atomically server-side via a
    // SECURITY DEFINER RPC. Doing the insert client-side fails RLS: the
    // groups SELECT policy (members_read_group) blocks reading the row back
    // before the membership exists.
    const { data, error: rpcErr } = await supabase.rpc('create_group_with_membership', {
      p_name: name.trim(),
    })

    if (rpcErr) return { groupId: null, error: rpcErr.message }

    const result = data as { group_id?: string; error?: string }

    if (result.error === 'not_active') return { groupId: null, error: 'Bitte bestätige zuerst deine E-Mail-Adresse' }
    if (result.error === 'invalid_name') return { groupId: null, error: 'Gruppenname ist erforderlich' }
    if (result.error === 'name_too_long') return { groupId: null, error: 'Gruppenname darf maximal 50 Zeichen lang sein' }
    if (result.error === 'code_generation_failed') return { groupId: null, error: 'Fehler beim Generieren des Einladungs-Codes' }
    if (result.error) return { groupId: null, error: result.error }

    await fetchGroups()
    return { groupId: result.group_id ?? null, error: null }
  }

  async function joinGroup(code: string): Promise<{ groupId: string | null; error: string | null }> {
    if (!user) return { groupId: null, error: 'Nicht eingeloggt' }

    const { data, error: rpcErr } = await supabase.rpc('join_group_by_invite_code', {
      p_invite_code: code.trim(),
    })

    if (rpcErr) return { groupId: null, error: rpcErr.message }

    const result = data as { group_id?: string; error?: string }

    if (result.error === 'invalid_code') return { groupId: null, error: 'Ungültiger Einladungs-Code' }
    if (result.error === 'already_member') return { groupId: null, error: 'Du bist bereits Mitglied dieser Gruppe' }
    if (result.error === 'not_active') return { groupId: null, error: 'Bitte bestätige zuerst deine E-Mail-Adresse' }
    if (result.error) return { groupId: null, error: result.error }

    await fetchGroups()
    return { groupId: result.group_id ?? null, error: null }
  }

  return { groups, loading, error, refetch: fetchGroups, createGroup, joinGroup }
}
