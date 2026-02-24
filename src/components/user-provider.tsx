"use client"

import { UserContext } from "@/lib/user-context"
import type { UserProfile } from "@/lib/types"

export function UserProvider({
    user,
    children,
}: {
    user: UserProfile
    children: React.ReactNode
}) {
    return (
        <UserContext.Provider value={{ user }}>
            {children}
        </UserContext.Provider>
    )
}
