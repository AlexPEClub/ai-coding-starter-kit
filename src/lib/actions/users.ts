"use server"

import { revalidatePath } from "next/cache"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import type { UserRole } from "@/lib/types"

export async function getUsers() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200)

    if (error) throw new Error(error.message)
    return data ?? []
}

export async function inviteUser(email: string, role: UserRole, fullName: string) {
    const adminClient = createAdminClient()

    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
        data: { role, full_name: fullName },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/update-password`,
    })

    if (error) return { error: error.message }

    // The trigger will auto-create the user_profile row.
    // But we can also set the role explicitly in case the trigger hasn't run yet.
    if (data.user) {
        const supabase = await createClient()
        await supabase
            .from("user_profiles")
            .upsert({ id: data.user.id, email, full_name: fullName, role })
    }

    revalidatePath("/admin/users")
    return { success: true }
}

export async function updateUserRole(userId: string, role: UserRole) {
    const supabase = await createClient()

    // Prevent removing the last admin
    if (role !== "admin") {
        const { data: admins } = await supabase
            .from("user_profiles")
            .select("id")
            .eq("role", "admin")
            .eq("is_active", true)

        const { data: { user } } = await supabase.auth.getUser()
        if (admins && admins.length === 1 && admins[0].id === userId && user?.id === userId) {
            return { error: "Der letzte Admin kann nicht degradiert werden." }
        }
    }

    const { error } = await supabase
        .from("user_profiles")
        .update({ role })
        .eq("id", userId)

    if (error) return { error: error.message }
    revalidatePath("/admin/users")
    return { success: true }
}

export async function regenerateCalendarToken() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Nicht angemeldet" }

    const newToken = crypto.randomUUID()
    const { error } = await supabase
        .from("user_profiles")
        .update({ calendar_token: newToken })
        .eq("id", user.id)

    if (error) return { error: error.message }
    revalidatePath("/kalender")
    return { success: true, token: newToken }
}

export async function toggleUserActive(userId: string, currentlyActive: boolean) {
    const supabase = await createClient()

    // Prevent deactivating the last admin
    if (currentlyActive) {
        const { data: profile } = await supabase
            .from("user_profiles")
            .select("role")
            .eq("id", userId)
            .single()

        if (profile?.role === "admin") {
            const { data: admins } = await supabase
                .from("user_profiles")
                .select("id")
                .eq("role", "admin")
                .eq("is_active", true)

            if (admins && admins.length === 1) {
                return { error: "Der letzte Admin kann nicht deaktiviert werden." }
            }
        }
    }

    const { error } = await supabase
        .from("user_profiles")
        .update({ is_active: !currentlyActive })
        .eq("id", userId)

    if (error) return { error: error.message }
    revalidatePath("/admin/users")
    return { success: true }
}
