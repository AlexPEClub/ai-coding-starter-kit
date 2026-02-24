"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { Apotheke } from "@/lib/types"

export interface GetApotekenFilters {
    search?: string
    region?: string
    priority?: string
    page?: number
    pageSize?: number
}

export async function getApotheken(filters: GetApotekenFilters = {}) {
    const supabase = await createClient()
    const { search, region, priority, page = 1, pageSize = 25 } = filters
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
        .from("apotheken")
        .select("*, termine(count)", { count: "exact" })
        .is("deleted_at", null)
        .order("name")
        .range(from, to)

    if (search) {
        query = query.or(`name.ilike.%${search}%,ort.ilike.%${search}%,plz.ilike.%${search}%`)
    }
    if (region && region !== "alle") {
        query = query.eq("region", region)
    }
    if (priority && priority !== "alle") {
        query = query.eq("priority", priority)
    }

    const { data, error, count } = await query
    if (error) throw new Error(error.message)
    return { data: data ?? [], count: count ?? 0 }
}

export async function getApotheke(id: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from("apotheken")
        .select("*, termine(*)")
        .eq("id", id)
        .is("deleted_at", null)
        .single()

    if (error) throw new Error(error.message)
    return data
}

export async function createApotheke(
    formData: Omit<Apotheke, "id" | "created_at" | "created_by" | "deleted_at" | "termin_count">
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Nicht angemeldet")

    // Duplicate check
    const { data: existing } = await supabase
        .from("apotheken")
        .select("id")
        .eq("name", formData.name)
        .eq("plz", formData.plz)
        .is("deleted_at", null)
        .maybeSingle()

    if (existing) {
        return { error: "Eine Apotheke mit diesem Namen und dieser PLZ existiert bereits." }
    }

    const { error } = await supabase
        .from("apotheken")
        .insert({ ...formData, created_by: user.id })

    if (error) return { error: error.message }
    revalidatePath("/apotheken")
    return { success: true }
}

export async function updateApotheke(
    id: string,
    formData: Partial<Omit<Apotheke, "id" | "created_at" | "created_by" | "deleted_at">>
) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from("apotheken")
        .update(formData)
        .eq("id", id)
        .select("id")

    if (error) return { error: error.message }
    if (!data || data.length === 0) return { error: "Keine Berechtigung. Bitte Admin-Rolle in Supabase setzen." }
    revalidatePath("/apotheken")
    revalidatePath(`/apotheken/${id}`)
    return { success: true }
}

export async function importApotheken(
    rows: Omit<Apotheke, "id" | "created_at" | "created_by" | "deleted_at" | "termin_count">[]
): Promise<{ imported: number; skipped: number; error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { imported: 0, skipped: 0, error: "Nicht angemeldet" }

    let imported = 0
    let skipped = 0

    for (const row of rows) {
        // Duplicate check: same name + plz
        const { data: existing } = await supabase
            .from("apotheken")
            .select("id")
            .eq("name", row.name)
            .eq("plz", row.plz)
            .is("deleted_at", null)
            .maybeSingle()

        if (existing) {
            skipped++
            continue
        }

        const { error } = await supabase
            .from("apotheken")
            .insert({ ...row, created_by: user.id })

        if (error) {
            // If RLS blocks, return error immediately
            return { imported, skipped, error: error.message }
        }
        imported++
    }

    if (imported > 0) revalidatePath("/apotheken")
    return { imported, skipped }
}

export async function deleteApotheke(id: string) {
    const supabase = await createClient()

    // Check for future appointments
    const today = new Date().toISOString().split("T")[0]
    const { data: futureTermine } = await supabase
        .from("termine")
        .select("id, datum, status")
        .eq("apotheke_id", id)
        .gte("datum", today)
        .neq("status", "abgesagt")

    if (futureTermine && futureTermine.length > 0) {
        return {
            error: `Diese Apotheke hat ${futureTermine.length} bevorstehende Termine. Bitte zuerst die Termine absagen.`,
            futureTermine,
        }
    }

    // Soft delete
    const { data, error } = await supabase
        .from("apotheken")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .select("id")

    if (error) return { error: error.message }
    if (!data || data.length === 0) return { error: "Keine Berechtigung. Bitte Admin-Rolle in Supabase setzen." }
    revalidatePath("/apotheken")
    return { success: true }
}
