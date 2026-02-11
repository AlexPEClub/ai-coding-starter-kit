'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { IconPicker, LucideIcon } from '@/components/icon-picker'
import { GripVertical, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ServiceTyp {
  id: string
  name: string
  icon: string
  sort_order: number
}

function SortableServiceItem({
  service,
  onEdit,
  onDelete,
}: {
  service: ServiceTyp
  onEdit: (service: ServiceTyp) => void
  onDelete: (service: ServiceTyp) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: service.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 rounded-md border bg-card p-3',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
        <LucideIcon name={service.icon} className="h-5 w-5" />
      </div>
      <span className="flex-1 font-medium">{service.name}</span>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(service)}
          title="Bearbeiten"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(service)}
          title="Löschen"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  )
}

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceTyp[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('circle')
  const [isCreating, setIsCreating] = useState(false)

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false)
  const [editService, setEditService] = useState<ServiceTyp | null>(null)
  const [editName, setEditName] = useState('')
  const [editIcon, setEditIcon] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteService, setDeleteService] = useState<ServiceTyp | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const loadServices = useCallback(async () => {
    setIsLoading(true)
    const response = await fetch('/api/services')
    if (response.ok) {
      const data = await response.json()
      setServices(data.services)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadServices()
  }, [loadServices])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = services.findIndex((s) => s.id === active.id)
    const newIndex = services.findIndex((s) => s.id === over.id)
    const newOrder = arrayMove(services, oldIndex, newIndex)

    setServices(newOrder)

    await fetch('/api/services', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds: newOrder.map((s) => s.id) }),
    })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setError(null)

    const response = await fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, icon: newIcon }),
    })

    if (response.ok) {
      setCreateOpen(false)
      setNewName('')
      setNewIcon('circle')
      setSuccess('Service erfolgreich erstellt')
      loadServices()
    } else {
      const data = await response.json()
      setError(data.error)
    }
    setIsCreating(false)
  }

  const openEdit = (service: ServiceTyp) => {
    setEditService(service)
    setEditName(service.name)
    setEditIcon(service.icon)
    setEditOpen(true)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editService) return
    setIsEditing(true)
    setError(null)

    const response = await fetch(`/api/services/${editService.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, icon: editIcon }),
    })

    if (response.ok) {
      setEditOpen(false)
      setSuccess('Service erfolgreich aktualisiert')
      loadServices()
    } else {
      const data = await response.json()
      setError(data.error)
    }
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (!deleteService) return
    setIsDeleting(true)
    setError(null)

    const response = await fetch(`/api/services/${deleteService.id}`, {
      method: 'DELETE',
    })

    if (response.ok) {
      setDeleteOpen(false)
      setSuccess('Service erfolgreich gelöscht')
      loadServices()
    } else {
      const data = await response.json()
      setError(data.error)
      setDeleteOpen(false)
    }
    setIsDeleting(false)
  }

  // Clear success messages after 3s
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [success])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Service-Typen</h2>
          <p className="text-muted-foreground">
            Verwalten Sie die angebotenen Services. Reihenfolge per Drag & Drop ändern.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Neuer Service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neuen Service-Typ anlegen</DialogTitle>
              <DialogDescription>
                Erstellen Sie einen neuen Service mit Name und Icon.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Name</Label>
                <Input
                  id="create-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="z.B. Hydraulikleitungen"
                  required
                  disabled={isCreating}
                />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <IconPicker value={newIcon} onChange={setNewIcon} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Anlegen
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
          <CardDescription>
            {services.length} Service-Typ{services.length !== 1 ? 'en' : ''} konfiguriert
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : services.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Keine Services vorhanden. Erstellen Sie den ersten Service-Typ.
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={services.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {services.map((service) => (
                    <SortableServiceItem
                      key={service.id}
                      service={service}
                      onEdit={openEdit}
                      onDelete={(s) => {
                        setDeleteService(s)
                        setDeleteOpen(true)
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Service bearbeiten</DialogTitle>
            <DialogDescription>
              Ändern Sie Name oder Icon des Services.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                disabled={isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <IconPicker value={editIcon} onChange={setEditIcon} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isEditing}>
                {isEditing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Pencil className="mr-2 h-4 w-4" />
                )}
                Speichern
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Service löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie den Service &quot;{deleteService?.name}&quot; wirklich löschen?
              Dies kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
