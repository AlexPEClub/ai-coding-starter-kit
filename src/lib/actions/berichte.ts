"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { Bericht } from "@/lib/types"

export async function getBerichte(filters: {
    trainerId?: string
    region?: string
    dateFrom?: string
    dateTo?: string
    isDraft?: boolean
    page?: number
    pageSize?: number
} = {}) {
    const supabase = await createClient()
    const { trainerId, region, dateFrom, dateTo, isDraft, page = 1, pageSize = 25 } = filters
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
        .from("berichte")
        .select(`
      *,
      termin:termine(
        id, datum, apotheke_id, trainer_id, status,
        apotheke:apotheken(id, name, region)
      )
    `, { count: "exact" })
        .order("submitted_at", { ascending: false })
        .range(from, to)

    if (isDraft !== undefined) {
        query = query.eq("is_draft", isDraft)
    }
    if (trainerId && trainerId !== "alle") {
        query = query.eq("termine.trainer_id", trainerId)
    }
    if (region && region !== "alle") {
        query = query.eq("termine.apotheken.region", region)
    }
    if (dateFrom) {
        query = query.gte("termine.datum", dateFrom)
    }
    if (dateTo) {
        query = query.lte("termine.datum", dateTo)
    }

    const { data, error, count } = await query
    if (error) throw new Error(error.message)

    const berichte = data ?? []
    const trainerIds = [...new Set(berichte.map((b) => (b.termin as any)?.trainer_id).filter(Boolean))]
    const trainerMap: Record<string, { id: string; full_name: string }> = {}
    if (trainerIds.length > 0) {
        const { data: profiles } = await supabase
            .from("user_profiles")
            .select("id, full_name")
            .in("id", trainerIds)
        for (const p of profiles ?? []) trainerMap[p.id] = p
    }

    return {
        data: berichte.map((b) => ({
            ...b,
            termin: b.termin ? {
                ...(b.termin as any),
                trainer: (b.termin as any).trainer_id ? (trainerMap[(b.termin as any).trainer_id] ?? null) : null,
            } : null,
        })),
        count: count ?? 0,
    }
}

export async function getBericht(terminId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from("berichte")
        .select("*")
        .eq("termin_id", terminId)
        .maybeSingle()

    if (error) throw new Error(error.message)
    return data
}

export async function getMissingBerichte() {
    const supabase = await createClient()

    // Find durchgefuehrt termine that have no submitted bericht
    const { data, error } = await supabase
        .from("termine")
        .select(`
      id, datum, apotheke_id, trainer_id,
      apotheke:apotheken(id, name),
      berichte(id, is_draft)
    `)
        .eq("status", "durchgefuehrt")
        .order("datum", { ascending: false })
        .limit(200)

    if (error) throw new Error(error.message)

    // Filter: no bericht at all, or only a draft
    const missing = (data ?? []).filter((t) => {
        const berichte = t.berichte as { id: string; is_draft: boolean }[] | null
        if (!berichte || berichte.length === 0) return true
        return berichte.every((b) => b.is_draft)
    })

    const trainerIds = [...new Set(missing.map((t) => t.trainer_id).filter(Boolean))]
    const trainerMap: Record<string, { id: string; full_name: string }> = {}
    if (trainerIds.length > 0) {
        const { data: profiles } = await supabase
            .from("user_profiles")
            .select("id, full_name")
            .in("id", trainerIds)
        for (const p of profiles ?? []) trainerMap[p.id] = p
    }

    return missing.map((t) => ({ ...t, trainer: t.trainer_id ? (trainerMap[t.trainer_id] ?? null) : null }))
}

export async function upsertBericht(
    data: Omit<Bericht, "id" | "submitted_at" | "is_draft" | "submitted_by"> & { termin_id: string },
    isDraft: boolean
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Nicht angemeldet")

    // Server-side validation for final submission
    if (!isDraft) {
        const required = [
            "teilnehmer_anzahl",
            "dauer_stunden",
            "rating_verstaendlichkeit",
            "rating_nutzbarkeit",
            "rating_kompetenz",
        ] as const
        for (const field of required) {
            if (!data[field]) {
                return { error: `Pflichtfeld fehlt: ${field}` }
            }
        }
    }

    const payload = {
        ...data,
        is_draft: isDraft,
        submitted_by: user.id,
        submitted_at: isDraft ? null : new Date().toISOString(),
    }

    const { error } = await supabase
        .from("berichte")
        .upsert(payload, { onConflict: "termin_id" })

    if (error) return { error: error.message }

    revalidatePath(`/termine/${data.termin_id}`)
    revalidatePath("/berichte")
    revalidatePath("/dashboard")
    return { success: true }
}
