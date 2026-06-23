'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Group, GroupMember, GroupRole } from '@/lib/group-types'
import { generateInviteCode } from '@/lib/group-types'

export function useGroupDetail(groupId: string | null) {
  const { user } = useAuth()
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const myMembership = members.find((m) => m.user_id === user?.id)
  const myRole = myMembership?.role ?? null
  const isAdmin = myRole === 'admin'
  const otherAdmins = members.filter((m) => m.user_id !== user?.id && m.role === 'admin')
  const isLastAdmin = isAdmin && otherAdmins.length === 0
  const isLastMember = members.length === 1 && isAdmin

  const fetchDetail = useCallback(async () => {
    if (!groupId || !user) return
    setError(null)

    const [{ data: groupData, error: groupErr }, { data: membersData, error: membersErr }] =
      await Promise.all([
        supabase.from('groups').select('*').eq('id', groupId).single(),
        supabase
          .from('group_members')
          .select('group_id, user_id, role, joined_at, profiles(id, display_name, avatar_url)')
          .eq('group_id', groupId),
      ])

    if (groupErr) {
      setError(groupErr.message)
      return
    }

    setGroup(groupData ? { ...groupData, invite_code: groupData.invite_code ?? null } : null)
    setMembers(
      (membersData ?? []).map((m) => ({
        group_id: m.group_id,
        user_id: m.user_id,
        role: m.role as GroupRole,
        joined_at: m.joined_at,
        profile: (m.profiles as unknown as { id: string; display_name: string; avatar_url: string | null }) ?? {
          id: m.user_id,
          display_name: 'Unbekannt',
          avatar_url: null,
        },
      }))
    )

    if (membersErr) setError(membersErr.message)
  }, [groupId, user])

  useEffect(() => {
    if (!groupId) {
      setGroup(null)
      setMembers([])
      setLoading(false)
      channelRef.current?.unsubscribe()
      channelRef.current = null
      return
    }

    setLoading(true)
    fetchDetail().finally(() => setLoading(false))

    channelRef.current?.unsubscribe()
    channelRef.current = supabase
      .channel(`group-detail-${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'group_members', filter: `group_id=eq.${groupId}` },
        fetchDetail
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'groups', filter: `id=eq.${groupId}` },
        fetchDetail
      )
      .subscribe()

    return () => {
      channelRef.current?.unsubscribe()
      channelRef.current = null
    }
  }, [groupId, fetchDetail])

  async function updateGroupName(name: string): Promise<{ error: string | null }> {
    if (!groupId) return { error: 'Keine Gruppe ausgewählt' }
    const { error } = await supabase.from('groups').update({ name }).eq('id', groupId)
    if (!error) await fetchDetail()
    return { error: error?.message ?? null }
  }

  async function regenerateInviteCode(): Promise<{ code: string | null; error: string | null }> {
    if (!groupId) return { code: null, error: 'Keine Gruppe ausgewählt' }

    // Try Edge Function first
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('generate-invite-code', {
        body: { group_id: groupId },
      })
      if (!fnErr && data?.invite_code) {
        await fetchDetail()
        return { code: data.invite_code, error: null }
      }
    } catch {
      // Fall through to client-side generation
    }

    // Client-side fallback
    let code = generateInviteCode()
    for (let i = 0; i < 5; i++) {
      const { error } = await supabase.from('groups').update({ invite_code: code }).eq('id', groupId)
      if (!error) {
        await fetchDetail()
        return { code, error: null }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((error as any)?.code === '23505') {
        code = generateInviteCode()
      } else {
        return { code: null, error: error.message }
      }
    }
    return { code: null, error: 'Fehler beim Generieren des Einladungs-Codes' }
  }

  async function changeMemberRole(userId: string, role: GroupRole): Promise<{ error: string | null }> {
    if (!groupId) return { error: 'Keine Gruppe ausgewählt' }
    const { error } = await supabase
      .from('group_members')
      .update({ role })
      .eq('group_id', groupId)
      .eq('user_id', userId)
    if (!error) await fetchDetail()
    return { error: error?.message ?? null }
  }

  async function removeMember(userId: string): Promise<{ error: string | null }> {
    if (!groupId) return { error: 'Keine Gruppe ausgewählt' }
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId)
    if (!error) await fetchDetail()
    return { error: error?.message ?? null }
  }

  async function transferAdminAndLeave(newAdminId: string): Promise<{ error: string | null }> {
    if (!groupId || !user) return { error: 'Nicht eingeloggt' }

    const { error: promoteErr } = await supabase
      .from('group_members')
      .update({ role: 'admin' })
      .eq('group_id', groupId)
      .eq('user_id', newAdminId)

    if (promoteErr) return { error: promoteErr.message }

    return removeMember(user.id)
  }

  async function leaveGroup(): Promise<{ error: string | null }> {
    if (!user) return { error: 'Nicht eingeloggt' }
    return removeMember(user.id)
  }

  async function deleteGroup(): Promise<{ error: string | null }> {
    if (!groupId) return { error: 'Keine Gruppe ausgewählt' }
    // group_members.group_id has ON DELETE CASCADE — deleting the group cascades to members
    const { error } = await supabase.from('groups').delete().eq('id', groupId)
    return { error: error?.message ?? null }
  }

  return {
    group,
    members,
    myRole,
    isAdmin,
    isLastAdmin,
    isLastMember,
    loading,
    error,
    refetch: fetchDetail,
    updateGroupName,
    regenerateInviteCode,
    changeMemberRole,
    removeMember,
    transferAdminAndLeave,
    leaveGroup,
    deleteGroup,
  }
}
