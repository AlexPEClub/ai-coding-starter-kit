"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { Termin, TerminStatus } from "@/lib/types"

export interface GetTermineFilters {
    trainerId?: string
    region?: string
    status?: string
    dateFrom?: string
    dateTo?: string
    page?: number
    pageSize?: number
}

export async function getTermine(filters: GetTermineFilters = {}) {
    const supabase = await createClient()
    const { trainerId, region, status, dateFrom, dateTo, page = 1, pageSize = 25 } = filters
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
        .from("termine")
        .select(`
      *,
      apotheke:apotheken(id, name, ort, region),
      tour:touren(id, name),
      berichte(id, is_draft, teilnehmer_anzahl)
    `, { count: "exact" })
        .order("datum", { ascending: true })
        .order("zeit_start", { ascending: true })
        .range(from, to)

    if (trainerId && trainerId !== "alle") {
        query = query.eq("trainer_id", trainerId)
    }
    if (region && region !== "alle") {
        query = query.eq("apotheken.region", region)
    }
    if (status && status !== "alle") {
        query = query.eq("status", status)
    }
    if (dateFrom) {
        query = query.gte("datum", dateFrom)
    }
    if (dateTo) {
        query = query.lte("datum", dateTo)
    }

    const { data, error, count } = await query
    if (error) throw new Error(error.message)

    const termine = data ?? []
    const trainerIds = [...new Set(termine.map((t) => t.trainer_id).filter(Boolean))]
    const trainerMap: Record<string, { id: string; full_name: string }> = {}
    if (trainerIds.length > 0) {
        const { data: profiles } = await supabase
            .from("user_profiles")
            .select("id, full_name")
            .in("id", trainerIds)
        for (const p of profiles ?? []) trainerMap[p.id] = p
    }

    return {
        data: termine.map((t) => ({ ...t, trainer: t.trainer_id ? (trainerMap[t.trainer_id] ?? null) : null })),
        count: count ?? 0,
    }
}

export async function getTermin(id: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from("termine")
        .select(`
      *,
      apotheke:apotheken(*),
      tour:touren(id, name),
      berichte(*)
    `)
        .eq("id", id)
        .single()

    if (error) throw new Error(error.message)

    let trainer = null
    if (data.trainer_id) {
        const { data: profile } = await supabase
            .from("user_profiles")
            .select("id, full_name, email")
            .eq("id", data.trainer_id)
            .maybeSingle()
        trainer = profile
    }

    return { ...data, trainer }
}

export async function createTermin(
    formData: Omit<Termin, "id" | "created_at" | "created_by">
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Nicht angemeldet")

    const { error } = await supabase
        .from("termine")
        .insert({ ...formData, created_by: user.id })

    if (error) return { error: error.message }
    revalidatePath("/termine")
    revalidatePath("/kalender")
    revalidatePath("/dashboard")
    return { success: true }
}

export async function updateTermin(
    id: string,
    formData: Partial<Omit<Termin, "id" | "created_at" | "created_by">>
) {
    const supabase = await createClient()
    const { error } = await supabase.from("termine").update(formData).eq("id", id)
    if (error) return { error: error.message }
    revalidatePath("/termine")
    revalidatePath(`/termine/${id}`)
    revalidatePath("/kalender")
    return { success: true }
}

export async function updateTerminStatus(
    id: string,
    status: TerminStatus,
    cancelReason?: string
) {
    const supabase = await createClient()

    const update: Record<string, unknown> = { status }
    if (status === "abgesagt" && cancelReason) {
        update.cancel_reason = cancelReason
    }

    const { error } = await supabase.from("termine").update(update).eq("id", id)
    if (error) return { error: error.message }

    revalidatePath("/termine")
    revalidatePath(`/termine/${id}`)
    revalidatePath("/kalender")
    revalidatePath("/dashboard")
    return { success: true }
}

export async function deleteTermin(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from("termine").delete().eq("id", id)
    if (error) return { error: error.message }
    revalidatePath("/termine")
    revalidatePath("/kalender")
    return { success: true }
}
