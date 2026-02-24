"use client"

import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { UserPlus, MoreHorizontal, ShieldCheck, User, Crown, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { getUsers, inviteUser, updateUserRole, toggleUserActive } from "@/lib/actions/users"
import type { UserRole, UserProfile } from "@/lib/types"

const roleConfig: Record<UserRole, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
    admin: { label: "Admin", icon: ShieldCheck, color: "bg-red-100 text-red-800" },
    trainer: { label: "Trainer", icon: User, color: "bg-blue-100 text-blue-800" },
    management: { label: "Management", icon: Crown, color: "bg-purple-100 text-purple-800" },
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [inviteOpen, setInviteOpen] = useState(false)
    const [deactivateUser, setDeactivateUser] = useState<UserProfile | null>(null)
    const [actionLoading, setActionLoading] = useState(false)

    // Invite form state
    const [inviteEmail, setInviteEmail] = useState("")
    const [inviteFullName, setInviteFullName] = useState("")
    const [inviteRole, setInviteRole] = useState<UserRole>("trainer")
    const [inviteError, setInviteError] = useState("")

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const data = await getUsers()
            setUsers(data as UserProfile[])
        } catch (e) {
            toast.error("Fehler beim Laden der Benutzer")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    const handleInvite = async () => {
        if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
            setInviteError("Bitte geben Sie eine gültige E-Mail-Adresse ein.")
            return
        }
        if (!inviteFullName.trim()) {
            setInviteError("Bitte geben Sie den vollständigen Namen ein.")
            return
        }
        setActionLoading(true)
        const result = await inviteUser(inviteEmail, inviteRole, inviteFullName)
        setActionLoading(false)
        if (result.error) {
            setInviteError(result.error)
            return
        }
        toast.success(`Einladung an ${inviteEmail} gesendet.`)
        setInviteEmail("")
        setInviteFullName("")
        setInviteRole("trainer")
        setInviteError("")
        setInviteOpen(false)
        load()
    }

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        const result = await updateUserRole(userId, newRole)
        if (result.error) {
            toast.error(result.error)
            return
        }
        toast.success("Rolle aktualisiert.")
        load()
    }

    const handleToggleActive = async (user: UserProfile) => {
        setActionLoading(true)
        const result = await toggleUserActive(user.id, user.is_active)
        setActionLoading(false)
        if (result.error) {
            toast.error(result.error)
            setDeactivateUser(null)
            return
        }
        toast.success(user.is_active ? "Benutzer deaktiviert." : "Benutzer reaktiviert.")
        setDeactivateUser(null)
        load()
    }

    const activeCount = users.filter((u) => u.is_active).length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Benutzerverwaltung</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {loading ? "Laden…" : `${activeCount} aktive Benutzer von ${users.length} gesamt`}
                    </p>
                </div>
                <Button onClick={() => setInviteOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Benutzer einladen
                </Button>
            </div>

            {/* Users Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>E-Mail</TableHead>
                            <TableHead>Rolle</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Erstellt am</TableHead>
                            <TableHead className="w-[60px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                                </TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    Keine Benutzer gefunden.
                                </TableCell>
                            </TableRow>
                        ) : users.map((user) => {
                            const role = roleConfig[user.role]
                            const RoleIcon = role.icon
                            return (
                                <TableRow key={user.id} className={!user.is_active ? "opacity-60" : ""}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium shrink-0">
                                                {user.full_name
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .join("")}
                                            </div>
                                            <span className="font-medium">{user.full_name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={role.color}>
                                            <RoleIcon className="mr-1 h-3 w-3" />
                                            {role.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {user.is_active ? (
                                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                                                Aktiv
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                                Deaktiviert
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {format(new Date(user.created_at), "dd.MM.yyyy", { locale: de })}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Aktionen</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => handleRoleChange(user.id, "admin")}
                                                    disabled={user.role === "admin"}
                                                >
                                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                                    Zu Admin machen
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleRoleChange(user.id, "trainer")}
                                                    disabled={user.role === "trainer"}
                                                >
                                                    <User className="mr-2 h-4 w-4" />
                                                    Zu Trainer machen
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleRoleChange(user.id, "management")}
                                                    disabled={user.role === "management"}
                                                >
                                                    <Crown className="mr-2 h-4 w-4" />
                                                    Zu Management machen
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className={user.is_active ? "text-destructive focus:text-destructive" : ""}
                                                    onClick={() => {
                                                        if (user.is_active) {
                                                            setDeactivateUser(user)
                                                        } else {
                                                            handleToggleActive(user)
                                                        }
                                                    }}
                                                >
                                                    {user.is_active ? "Deaktivieren" : "Reaktivieren"}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Invite Dialog */}
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle>Benutzer einladen</DialogTitle>
                        <DialogDescription>
                            Der Benutzer erhält eine Einladungs-E-Mail mit einem Link zur Registrierung.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="invite-name">Vollständiger Name *</Label>
                            <Input
                                id="invite-name"
                                type="text"
                                placeholder="Max Mustermann"
                                value={inviteFullName}
                                onChange={(e) => {
                                    setInviteFullName(e.target.value)
                                    if (inviteError) setInviteError("")
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="invite-email">E-Mail-Adresse *</Label>
                            <Input
                                id="invite-email"
                                type="email"
                                placeholder="name@mw-education.at"
                                value={inviteEmail}
                                onChange={(e) => {
                                    setInviteEmail(e.target.value)
                                    if (inviteError) setInviteError("")
                                }}
                            />
                            {inviteError && (
                                <p className="text-sm text-destructive">{inviteError}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="invite-role">Rolle</Label>
                            <Select
                                value={inviteRole}
                                onValueChange={(v) => setInviteRole(v as UserRole)}
                            >
                                <SelectTrigger id="invite-role">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="trainer">Trainer</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="management">Management</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setInviteOpen(false)}>
                            Abbrechen
                        </Button>
                        <Button onClick={handleInvite} disabled={actionLoading}>
                            {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <UserPlus className="mr-2 h-4 w-4" />
                            Einladung senden
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Deactivate Confirmation */}
            <AlertDialog
                open={!!deactivateUser}
                onOpenChange={(open) => { if (!open) setDeactivateUser(null) }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Benutzer deaktivieren?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {deactivateUser?.full_name} wird deaktiviert und kann sich nicht mehr anmelden.
                            Der Benutzer kann jederzeit reaktiviert werden.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deactivateUser && handleToggleActive(deactivateUser)}
                            disabled={actionLoading}
                        >
                            {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Deaktivieren
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
