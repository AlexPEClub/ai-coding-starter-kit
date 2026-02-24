"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { Tour } from "@/lib/types"

export async function getTouren(filters: { trainerId?: string; region?: string } = {}) {
    const supabase = await createClient()

    let query = supabase
        .from("touren")
        .select("*, termine(count)")
        .order("start_date", { ascending: false })
        .limit(200)

    if (filters.trainerId && filters.trainerId !== "alle") {
        query = query.eq("trainer_id", filters.trainerId)
    }
    if (filters.region && filters.region !== "alle") {
        query = query.eq("region", filters.region)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)

    const touren = data ?? []
    const trainerIds = [...new Set(touren.map((t) => t.trainer_id).filter(Boolean))]
    const trainerMap: Record<string, { id: string; full_name: string }> = {}
    if (trainerIds.length > 0) {
        const { data: profiles } = await supabase
            .from("user_profiles")
            .select("id, full_name")
            .in("id", trainerIds)
        for (const p of profiles ?? []) trainerMap[p.id] = p
    }

    return touren.map((t) => ({ ...t, trainer: t.trainer_id ? (trainerMap[t.trainer_id] ?? null) : null }))
}

export async function getTour(id: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from("touren")
        .select(`
      *,
      termine(
        *,
        apotheke:apotheken(id, name, ort, region),
        berichte(id, is_draft, submitted_at)
      )
    `)
        .eq("id", id)
        .single()

    if (error) throw new Error(error.message)

    let trainer = null
    if (data.trainer_id) {
        const { data: profile } = await supabase
            .from("user_profiles")
            .select("id, full_name")
            .eq("id", data.trainer_id)
            .maybeSingle()
        trainer = profile
    }

    return { ...data, trainer }
}

export async function createTour(
    formData: Omit<Tour, "id" | "created_at">
) {
    const supabase = await createClient()
    const { error } = await supabase.from("touren").insert(formData)
    if (error) return { error: error.message }
    revalidatePath("/touren")
    return { success: true }
}

export async function updateTour(id: string, formData: Partial<Omit<Tour, "id" | "created_at">>) {
    const supabase = await createClient()
    const { error } = await supabase.from("touren").update(formData).eq("id", id)
    if (error) return { error: error.message }
    revalidatePath("/touren")
    revalidatePath(`/touren/${id}`)
    return { success: true }
}

export async function deleteTour(id: string) {
    const supabase = await createClient()

    // Check for non-cancelled appointments
    const { data: activeTermine } = await supabase
        .from("termine")
        .select("id")
        .eq("tour_id", id)
        .neq("status", "abgesagt")

    if (activeTermine && activeTermine.length > 0) {
        return {
            error: `Diese Tour hat noch ${activeTermine.length} aktive Termine. Bitte zuerst alle Termine absagen.`,
        }
    }

    const { error } = await supabase.from("touren").delete().eq("id", id)
    if (error) return { error: error.message }
    revalidatePath("/touren")
    return { success: true }
}
