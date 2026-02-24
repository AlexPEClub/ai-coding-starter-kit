import type { UserProfile } from "@/lib/types"
import { createContext, useContext } from "react"

interface UserContextValue {
    user: UserProfile
}

export const UserContext = createContext<UserContextValue | null>(null)

export function useUser(): UserContextValue {
    const ctx = useContext(UserContext)
    if (!ctx) throw new Error("useUser must be used within UserProvider")
    return ctx
}
