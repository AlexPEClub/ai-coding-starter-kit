'use client'

import { useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import MentionExt from '@tiptap/extension-mention'
import ImageExt from '@tiptap/extension-image'
import PlaceholderExt from '@tiptap/extension-placeholder'
import type { JSONContent } from '@tiptap/core'
import {
  X, Pencil, Trash2, Plus, ImageIcon, Send,
  MapPin, ExternalLink, Check, CalendarClock, CalendarPlus,
} from 'lucide-react'
import { toast } from 'sonner'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'
import { exportToIcal } from '@/lib/ical-export'
import { useActivityDetail } from '@/hooks/useActivityDetail'
import { DateFinderSheet } from './DateFinderSheet'
import {
  useActivityComments, uploadCommentImage, deleteCommentImages,
} from '@/hooks/useActivityComments'
import { useActivityResponsibilities } from '@/hooks/useActivityResponsibilities'
import { useActivityPhotos } from '@/hooks/useActivityPhotos'
import type {
  ActivityStatus, ActivityComment, ActivityResponsibility, ActivityPhoto,
} from '@/lib/activity-types'
import { PLACEHOLDER_IMAGE } from '@/lib/activity-types'
import type { GroupMember, GroupRole } from '@/lib/group-types'
import type { Json } from '@/lib/database.types'

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<ActivityStatus, string> = {
  vorschlag: 'Vorschlag',
  zu_planen: 'Zu Planen',
  geplant: 'Geplant',
  in_planung: 'In Planung',
  planung_abgeschlossen: 'Planung abgeschlossen',
  abgeschlossen: 'Abgeschlossen',
}

const STATUS_BADGE: Record<ActivityStatus, string> = {
  vorschlag: 'bg-accent-soft text-accent border border-accent/20',
  zu_planen: 'bg-secondary-soft text-secondary border border-secondary/20',
  geplant: 'bg-secondary-soft text-secondary border border-secondary/20',
  in_planung: 'bg-secondary-soft text-secondary border border-secondary/20',
  planung_abgeschlossen: 'bg-success-soft text-success border border-success/20',
  abgeschlossen: 'bg-success-soft text-success border border-success/20',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateRange(start: string | null, end: string | null): string | null {
  if (!start && !end) return null
  const fmt = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', year: '2-digit',
    })
  if (start && end) return `${fmt(start)} – ${fmt(end)}`
  if (start) return `Ab ${fmt(start)}`
  return null
}

function extractMentionIds(content: JSONContent): string[] {
  const ids: string[] = []
  const walk = (node: JSONContent) => {
    if (node.type === 'mention' && node.attrs?.id) ids.push(node.attrs.id as string)
    node.content?.forEach(walk)
  }
  walk(content)
  return [...new Set(ids)]
}

function extractCommentImagePaths(content: JSONContent): string[] {
  const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/activity-comment-images/`
  const paths: string[] = []
  const walk = (node: JSONContent) => {
    if (node.type === 'image' && typeof node.attrs?.src === 'string' && node.attrs.src.startsWith(prefix)) {
      paths.push(node.attrs.src.slice(prefix.length))
    }
    node.content?.forEach(walk)
  }
  walk(content)
  return paths
}

function getPhotoUrl(storagePath: string): string {
  const { data } = supabase.storage.from('activity-photos').getPublicUrl(storagePath)
  return data.publicUrl
}

function avatarFallback(name: string): string {
  return name.slice(0, 1).toUpperCase()
}

// ─── Tiptap JSON renderer (for read-only comment display) ───────────────────

function TiptapRenderer({ content }: { content: Json }) {
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return <p className="text-[14px] text-ink">{String(content ?? '')}</p>
  }

  function renderNode(n: JSONContent, key: string | number): React.ReactNode {
    if (n.type === 'doc') {
      return <>{n.content?.map((c, i) => renderNode(c, i))}</>
    }
    if (n.type === 'paragraph') {
      const children = n.content?.map((c, i) => renderNode(c, i))
      return <p key={key} className="mb-1 last:mb-0 min-h-[1em]">{children?.length ? children : null}</p>
    }
    if (n.type === 'text') {
      let el: React.ReactNode = n.text ?? ''
      const marks = n.marks ?? []
      if (marks.some(m => m.type === 'bold')) el = <strong>{el}</strong>
      if (marks.some(m => m.type === 'italic')) el = <em>{el}</em>
      return <span key={key}>{el}</span>
    }
    if (n.type === 'bulletList') {
      return (
        <ul key={key} className="list-disc pl-5 mb-1">
          {n.content?.map((c, i) => renderNode(c, i))}
        </ul>
      )
    }
    if (n.type === 'orderedList') {
      return (
        <ol key={key} className="list-decimal pl-5 mb-1">
          {n.content?.map((c, i) => renderNode(c, i))}
        </ol>
      )
    }
    if (n.type === 'listItem') {
      return <li key={key}>{n.content?.map((c, i) => renderNode(c, i))}</li>
    }
    if (n.type === 'mention') {
      return (
        <span key={key} className="font-[700] text-secondary">
          @{(n.attrs?.label as string) ?? (n.attrs?.id as string)}
        </span>
      )
    }
    if (n.type === 'image' && n.attrs?.src) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={key}
          src={n.attrs.src as string}
          alt={(n.attrs.alt as string) ?? ''}
          className="max-w-full rounded-[8px] my-2 block"
        />
      )
    }
    return null
  }

  return (
    <div className="text-[14px] text-ink leading-relaxed">
      {renderNode(content as JSONContent, 0)}
    </div>
  )
}

// ─── Component props ──────────────────────────────────────────────────────────

interface ActivityDetailSheetProps {
  activityId: string | null
  groupId: string
  currentUserId: string
  isAdmin: boolean
  onClose: () => void
  onActivityUpdated?: () => void
  readOnly?: boolean
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ActivityDetailSheet({
  activityId,
  groupId,
  currentUserId,
  isAdmin,
  onClose,
  onActivityUpdated,
  readOnly = false,
}: ActivityDetailSheetProps) {

  // ── Data hooks ─────────────────────────────────────────────────────────────
  const { activity, loading: activityLoading, updateActivity, reload } = useActivityDetail(activityId)
  const { comments, loading: commentsLoading, addComment, deleteComment } = useActivityComments(activityId)
  const { responsibilities, loading: respLoading, addResponsibility, deleteResponsibility } = useActivityResponsibilities(activityId)
  const { photos, loading: photosLoading, uploadPhoto, deletePhoto, userPhotoCount } = useActivityPhotos(activityId, currentUserId)

  // ── Members (for @-mentions + responsibility assignment) ───────────────────
  const [members, setMembers] = useState<GroupMember[]>([])
  const membersRef = useRef<GroupMember[]>([])
  membersRef.current = members

  useEffect(() => {
    if (!groupId) return
    supabase
      .from('group_members')
      .select('group_id, user_id, role, joined_at, profiles(id, display_name, avatar_url)')
      .eq('group_id', groupId)
      .then(({ data }) => {
        if (!data) return
        const m = data.map(row => ({
          group_id: row.group_id,
          user_id: row.user_id,
          role: row.role as GroupRole,
          joined_at: row.joined_at,
          profile: (row.profiles as unknown as GroupMember['profile']) ?? {
            id: row.user_id,
            display_name: 'Unbekannt',
            avatar_url: null,
          },
        }))
        setMembers(m)
        membersRef.current = m
      })
  }, [groupId])

  // ── DateFinder state ───────────────────────────────────────────────────────
  const [dateFinderOpen, setDateFinderOpen] = useState(false)

  // ── Edit form state ────────────────────────────────────────────────────────
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editUrl, setEditUrl] = useState('')
  const [nameError, setNameError] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  // ── Responsibility form state ──────────────────────────────────────────────
  const [addingResp, setAddingResp] = useState(false)
  const [newRespLabel, setNewRespLabel] = useState('')
  const [newRespUserId, setNewRespUserId] = useState('')
  const [savingResp, setSavingResp] = useState(false)
  const [deleteRespTarget, setDeleteRespTarget] = useState<ActivityResponsibility | null>(null)

  // ── Photo state ────────────────────────────────────────────────────────────
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [deletePhotoTarget, setDeletePhotoTarget] = useState<ActivityPhoto | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  // ── Comment state ──────────────────────────────────────────────────────────
  const [sendingComment, setSendingComment] = useState(false)
  const [deleteCommentTarget, setDeleteCommentTarget] = useState<ActivityComment | null>(null)
  const commentImageInputRef = useRef<HTMLInputElement>(null)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  // ── Mention dropdown state ─────────────────────────────────────────────────
  const [mentionOpen, setMentionOpen] = useState(false)
  const [mentionItems, setMentionItems] = useState<GroupMember[]>([])
  const mentionCommandRef = useRef<((attrs: { id: string; label: string }) => void) | null>(null)

  // Stable refs so Tiptap's render closures always call the latest setter
  const setMentionOpenRef = useRef(setMentionOpen)
  setMentionOpenRef.current = setMentionOpen
  const setMentionItemsRef = useRef(setMentionItems)
  setMentionItemsRef.current = setMentionItems

  // Stable ref for activityId (used inside editor callbacks)
  const activityIdRef = useRef(activityId)
  activityIdRef.current = activityId

  // ── Tiptap editor ──────────────────────────────────────────────────────────
  const editorRef = useRef<ReturnType<typeof useEditor>>(null)

  const sendCommentRef = useRef<(() => Promise<void>) | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      PlaceholderExt.configure({ placeholder: 'Kommentar schreiben…' }),
      ImageExt,
      MentionExt.configure({
        HTMLAttributes: { class: 'tiptap-mention' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        suggestion: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          items: ({ query }: any) =>
            membersRef.current.filter(m =>
              m.profile.display_name.toLowerCase().includes(query.toLowerCase())
            ),
          render: () => ({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onStart: (props: any) => {
              mentionCommandRef.current = props.command
              setMentionItemsRef.current(props.items as GroupMember[])
              setMentionOpenRef.current(true)
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onUpdate: (props: any) => {
              mentionCommandRef.current = props.command
              setMentionItemsRef.current(props.items as GroupMember[])
            },
            onExit: () => {
              mentionCommandRef.current = null
              setMentionOpenRef.current(false)
              setMentionItemsRef.current([])
            },
            onKeyDown: () => false,
          }),
        },
      }),
    ],
    editorProps: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handlePaste: (_view: any, event: ClipboardEvent) => {
        const items = Array.from(event.clipboardData?.items ?? [])
        const imageItem = items.find(i => i.type.startsWith('image/'))
        if (imageItem) {
          const file = imageItem.getAsFile()
          if (file && activityIdRef.current) {
            uploadCommentImage(activityIdRef.current, file).then(result => {
              if (result.error) toast.error(result.error)
              else if (result.url) editorRef.current?.commands.insertContent({ type: 'image', attrs: { src: result.url } })
            })
          }
          return true
        }
        return false
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleKeyDown: (_view: any, event: KeyboardEvent) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
          sendCommentRef.current?.()
          return true
        }
        return false
      },
    },
  })

  // Keep editorRef in sync
  editorRef.current = editor

  // ── Derived values ─────────────────────────────────────────────────────────
  const status = activity?.status ?? null
  const canEdit = !readOnly && (isAdmin || activity?.initiator_id === currentUserId)
  const showResponsibilities =
    status === 'in_planung' ||
    status === 'planung_abgeschlossen' ||
    status === 'abgeschlossen'
  const responsibilitiesReadOnly = status === 'abgeschlossen'
  const showPhotos = status === 'abgeschlossen'
  const photoLimitReached = userPhotoCount >= 5
  const isEditorEmpty = editor?.isEmpty ?? true

  // ── Reset editing state when sheet closes ──────────────────────────────────
  useEffect(() => {
    if (!activityId) {
      setEditing(false)
      setAddingResp(false)
      editor?.commands.clearContent()
    }
  }, [activityId, editor])

  // ── Auto-scroll comments to bottom when new arrive ─────────────────────────
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments.length])

  // ── Edit form handlers ─────────────────────────────────────────────────────
  function enterEditMode() {
    if (!activity) return
    setEditName(activity.name)
    setEditDescription(activity.description ?? '')
    setEditLocation(activity.location ?? '')
    setEditUrl(activity.url ?? '')
    setNameError('')
    setEditing(true)
  }

  async function handleSaveEdit() {
    if (!editName.trim()) {
      setNameError('Name ist ein Pflichtfeld')
      return
    }
    setNameError('')
    setSavingEdit(true)
    const ok = await updateActivity({
      name: editName.trim(),
      description: editDescription.trim() || null,
      location: editLocation.trim() || null,
      url: editUrl.trim() || null,
    })
    setSavingEdit(false)
    if (ok) {
      setEditing(false)
      toast.success('Aktivität aktualisiert')
      onActivityUpdated?.()
    } else {
      toast.error('Speichern fehlgeschlagen')
    }
  }

  // ── iCal export ────────────────────────────────────────────────────────────
  function handleIcalExport() {
    if (!activity?.start_date) return
    exportToIcal({
      uid: activity.id,
      summary: activity.name,
      startDate: activity.start_date,
      endDate: activity.end_date ?? activity.start_date,
      description: activity.description,
      location: activity.location,
    })
  }

  // ── Responsibility handlers ────────────────────────────────────────────────
  async function handleAddResponsibility() {
    if (!newRespLabel.trim() || !newRespUserId || !activityId) return
    setSavingResp(true)
    const ok = await addResponsibility({
      activity_id: activityId,
      label: newRespLabel.trim(),
      assigned_user_id: newRespUserId,
    })
    setSavingResp(false)
    if (ok) {
      setNewRespLabel('')
      setNewRespUserId('')
      setAddingResp(false)
    } else {
      toast.error('Verantwortlichkeit konnte nicht gespeichert werden')
    }
  }

  async function handleDeleteResponsibility() {
    if (!deleteRespTarget) return
    const ok = await deleteResponsibility(deleteRespTarget.id)
    setDeleteRespTarget(null)
    if (!ok) toast.error('Löschen fehlgeschlagen')
  }

  // ── Photo handlers ─────────────────────────────────────────────────────────
  async function handlePhotoUpload(file: File) {
    if (!activityId) return
    setUploadingPhoto(true)
    const result = await uploadPhoto(activityId, file)
    setUploadingPhoto(false)
    if (result.error) toast.error(result.error)
  }

  async function handleDeletePhoto() {
    if (!deletePhotoTarget) return
    const ok = await deletePhoto(deletePhotoTarget)
    setDeletePhotoTarget(null)
    if (!ok) toast.error('Foto konnte nicht gelöscht werden')
  }

  // ── Comment handlers ───────────────────────────────────────────────────────
  async function handleSendComment() {
    if (!editor || isEditorEmpty || !activityId) return
    const content = editor.getJSON()
    setSendingComment(true)
    const ok = await addComment({
      activity_id: activityId,
      content: content as Json,
      mentioned_user_ids: extractMentionIds(content),
    })
    setSendingComment(false)
    if (ok) {
      editor.commands.clearContent()
    } else {
      toast.error('Kommentar konnte nicht gespeichert werden')
    }
  }
  sendCommentRef.current = handleSendComment

  async function handleDeleteComment() {
    if (!deleteCommentTarget) return
    const content = deleteCommentTarget.content as JSONContent
    const imagePaths = extractCommentImagePaths(content)
    if (imagePaths.length > 0) {
      await deleteCommentImages(imagePaths)
    }
    const ok = await deleteComment(deleteCommentTarget.id)
    setDeleteCommentTarget(null)
    if (!ok) toast.error('Kommentar konnte nicht gelöscht werden')
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Sheet open={!!activityId} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="bottom"
          className="h-[92dvh] bg-bg border-t border-line p-0 flex flex-col rounded-t-[20px] [&>button]:hidden"
        >
          {/* ── Header ── */}
          <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-line flex items-center gap-3">
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-[8px] flex items-center justify-center text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
              aria-label="Schließen"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="flex-1 text-[17px] font-[800] text-ink truncate">
              {activity?.name ?? ''}
            </p>
            {canEdit && (
              <button
                onClick={editing ? () => setEditing(false) : enterEditMode}
                className={`h-8 w-8 rounded-[8px] flex items-center justify-center transition-colors
                  ${editing
                    ? 'bg-primary-soft text-primary'
                    : 'text-ink-3 hover:text-ink hover:bg-surface-2'
                  }`}
                aria-label={editing ? 'Bearbeitung abbrechen' : 'Bearbeiten'}
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* ── Scrollable feed ── */}
          <div className="flex-1 overflow-y-auto">

            {/* Loading state */}
            {activityLoading && (
              <div className="px-5 pt-5 space-y-4">
                <Skeleton className="h-[160px] w-full rounded-[14px] bg-surface" />
                <Skeleton className="h-5 w-2/3 rounded bg-surface" />
                <Skeleton className="h-4 w-full rounded bg-surface" />
              </div>
            )}

            {activity && (
              <>
                {/* ── Hero ── */}
                <div className="relative w-full h-[180px] flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activity.og_image_url ?? PLACEHOLDER_IMAGE}
                    alt=""
                    aria-hidden
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10.5px] font-[800] uppercase tracking-[0.06em] px-2.5 py-0.5 rounded-pill ${STATUS_BADGE[activity.status]}`}>
                        {STATUS_LABELS[activity.status]}
                      </span>
                      {formatDateRange(activity.start_date, activity.end_date) && (
                        <span className="text-[11px] font-[600] text-white/80">
                          {formatDateRange(activity.start_date, activity.end_date)}
                        </span>
                      )}
                    </div>
                    <p className="text-[18px] font-[800] text-white leading-tight">
                      {activity.name}
                    </p>
                    <p className="text-[12px] text-white/70">
                      von {activity.initiator.display_name}
                    </p>
                  </div>
                </div>

                <div className="px-5 pt-4 pb-6 space-y-5">

                  {/* ── Edit form ── */}
                  {editing && (
                    <div className="space-y-3 bg-surface border border-line rounded-[14px] p-4">
                      <div className="space-y-1.5">
                        <label className="text-[12px] font-[700] text-ink-2 uppercase tracking-[0.05em]">
                          Name *
                        </label>
                        <Input
                          value={editName}
                          onChange={e => { setEditName(e.target.value); setNameError('') }}
                          className="bg-bg border-line text-ink text-[14px]"
                          placeholder="Name der Aktivität"
                        />
                        {nameError && (
                          <p className="text-[12px] text-error">{nameError}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[12px] font-[700] text-ink-2 uppercase tracking-[0.05em]">
                          Beschreibung
                        </label>
                        <Textarea
                          value={editDescription}
                          onChange={e => setEditDescription(e.target.value)}
                          className="bg-bg border-line text-ink text-[14px] min-h-[80px] resize-none"
                          placeholder="Optional"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[12px] font-[700] text-ink-2 uppercase tracking-[0.05em]">
                          Ort
                        </label>
                        <Input
                          value={editLocation}
                          onChange={e => setEditLocation(e.target.value)}
                          className="bg-bg border-line text-ink text-[14px]"
                          placeholder="Optional – z.B. Biergarten Englischer Garten"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[12px] font-[700] text-ink-2 uppercase tracking-[0.05em]">
                          Link / URL
                        </label>
                        <Input
                          type="url"
                          value={editUrl}
                          onChange={e => setEditUrl(e.target.value)}
                          className="bg-bg border-line text-ink text-[14px]"
                          placeholder="Optional – https://…"
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditing(false)}
                          className="flex-1 border-line text-ink-2 text-[13px]"
                        >
                          Abbrechen
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          disabled={savingEdit}
                          className="flex-1 bg-primary hover:bg-primary-600 text-white text-[13px] gap-1"
                        >
                          <Check className="h-3.5 w-3.5" />
                          {savingEdit ? 'Speichern…' : 'Speichern'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* ── Info sections (hidden while editing) ── */}
                  {!editing && (
                    <div className="space-y-3">
                      {activity.description && (
                        <p className="text-[14px] text-ink-2 leading-relaxed">
                          {activity.description}
                        </p>
                      )}
                      {activity.location && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-ink-3 flex-shrink-0 mt-0.5" />
                          <p className="text-[13.5px] text-ink-2">{activity.location}</p>
                        </div>
                      )}
                      {activity.url && (
                        <div className="flex items-start gap-2">
                          <ExternalLink className="h-4 w-4 text-ink-3 flex-shrink-0 mt-0.5" />
                          <a
                            href={activity.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[13.5px] text-secondary underline underline-offset-2 break-all"
                          >
                            {activity.url}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Divider ── */}
                  {(activity.description || activity.location || activity.url || editing) && (
                    <Separator className="bg-line" />
                  )}

                  {/* ── Kalender-Aktionen ── */}
                  {(activity.start_date || (!readOnly && canEdit && (status === 'in_planung' || status === 'planung_abgeschlossen'))) && (
                    <div className="flex flex-col gap-2">
                      {activity.start_date && (
                        <Button
                          variant="outline"
                          onClick={handleIcalExport}
                          className="w-full justify-start gap-2 border-line text-ink-2 rounded-[12px] hover:bg-surface-2 text-[13.5px]"
                        >
                          <CalendarPlus className="h-4 w-4 text-secondary flex-shrink-0" />
                          Zum Kalender hinzufügen
                        </Button>
                      )}
                      {!readOnly && canEdit && (status === 'in_planung' || status === 'planung_abgeschlossen') && (
                        <Button
                          variant="outline"
                          onClick={() => setDateFinderOpen(true)}
                          className="w-full justify-start gap-2 border-line text-ink-2 rounded-[12px] hover:bg-surface-2 text-[13.5px]"
                        >
                          <CalendarClock className="h-4 w-4 text-secondary flex-shrink-0" />
                          Termin anpassen
                        </Button>
                      )}
                      <Separator className="bg-line" />
                    </div>
                  )}

                  {/* ── Verantwortlichkeiten ── */}
                  {showResponsibilities && (
                    <div className="space-y-3">
                      <h3 className="text-[13px] font-[800] text-ink uppercase tracking-[0.06em]">
                        Verantwortlichkeiten
                      </h3>

                      {respLoading ? (
                        <div className="space-y-2">
                          {[1, 2].map(i => (
                            <Skeleton key={i} className="h-[44px] w-full rounded-[12px] bg-surface" />
                          ))}
                        </div>
                      ) : responsibilities.length === 0 && !addingResp && (
                        <p className="text-[13px] text-ink-3">Noch keine Verantwortlichkeiten vergeben.</p>
                      )}

                      {responsibilities.map(resp => (
                        <div
                          key={resp.id}
                          className="flex items-center gap-3 bg-surface border border-line rounded-[12px] px-3 py-2.5"
                        >
                          <Avatar className="h-7 w-7 flex-shrink-0">
                            <AvatarImage src={resp.assigned_user.avatar_url ?? undefined} />
                            <AvatarFallback className="text-[11px] font-[700] bg-secondary-soft text-secondary">
                              {avatarFallback(resp.assigned_user.display_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13.5px] font-[700] text-ink truncate">{resp.label}</p>
                            <p className="text-[12px] text-ink-3 truncate">{resp.assigned_user.display_name}</p>
                          </div>
                          {!responsibilitiesReadOnly && (isAdmin || resp.created_by === currentUserId) && (
                            <button
                              onClick={() => setDeleteRespTarget(resp)}
                              className="flex-shrink-0 h-7 w-7 flex items-center justify-center rounded-[8px] text-ink-3 hover:text-error hover:bg-error-soft transition-colors"
                              aria-label="Löschen"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}

                      {/* Add responsibility form */}
                      {!responsibilitiesReadOnly && addingResp && (
                        <div className="bg-surface border border-line rounded-[12px] p-3 space-y-2.5">
                          <Input
                            value={newRespLabel}
                            onChange={e => setNewRespLabel(e.target.value)}
                            placeholder="Verantwortlichkeit (z.B. Ticketkauf)"
                            className="bg-bg border-line text-ink text-[13.5px]"
                          />
                          <Select value={newRespUserId} onValueChange={setNewRespUserId}>
                            <SelectTrigger className="bg-bg border-line text-[13.5px]">
                              <SelectValue placeholder="Person auswählen" />
                            </SelectTrigger>
                            <SelectContent className="bg-surface border-line">
                              {members.map(m => (
                                <SelectItem key={m.user_id} value={m.user_id} className="text-[13.5px]">
                                  {m.profile.display_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setAddingResp(false); setNewRespLabel(''); setNewRespUserId('') }}
                              className="flex-1 border-line text-ink-2 text-[12.5px]"
                            >
                              Abbrechen
                            </Button>
                            <Button
                              size="sm"
                              disabled={!newRespLabel.trim() || !newRespUserId || savingResp}
                              onClick={handleAddResponsibility}
                              className="flex-1 bg-primary hover:bg-primary-600 text-white text-[12.5px]"
                            >
                              {savingResp ? 'Speichern…' : 'Hinzufügen'}
                            </Button>
                          </div>
                        </div>
                      )}

                      {!responsibilitiesReadOnly && !addingResp && (
                        <button
                          onClick={() => setAddingResp(true)}
                          className="flex items-center gap-2 text-[13px] font-[700] text-primary hover:text-primary-600 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          Verantwortlichkeit hinzufügen
                        </button>
                      )}

                      <Separator className="bg-line" />
                    </div>
                  )}

                  {/* ── Erinnerungsfotos ── */}
                  {showPhotos && (
                    <div className="space-y-3">
                      <h3 className="text-[13px] font-[800] text-ink uppercase tracking-[0.06em]">
                        Erinnerungsfotos
                      </h3>

                      {photosLoading ? (
                        <div className="grid grid-cols-3 gap-2">
                          {[1, 2, 3].map(i => (
                            <Skeleton key={i} className="aspect-square rounded-[10px] bg-surface" />
                          ))}
                        </div>
                      ) : photos.length === 0 && (
                        <p className="text-[13px] text-ink-3">
                          Noch keine Erinnerungsfotos – lad das erste hoch!
                        </p>
                      )}

                      {photos.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {photos.map(photo => (
                            <div key={photo.id} className="relative aspect-square rounded-[10px] overflow-hidden bg-surface-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={getPhotoUrl(photo.storage_path)}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                              {!readOnly && (isAdmin || photo.user_id === currentUserId) && (
                                <button
                                  onClick={() => setDeletePhotoTarget(photo)}
                                  className="absolute top-1.5 right-1.5 h-6 w-6 rounded-[6px] flex items-center justify-center bg-black/50 text-white hover:bg-black/70 transition-colors"
                                  aria-label="Foto löschen"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async e => {
                          const file = e.target.files?.[0]
                          if (file) await handlePhotoUpload(file)
                          e.target.value = ''
                        }}
                      />

                      {!readOnly && (photoLimitReached ? (
                        <p className="text-[12.5px] text-ink-3">
                          Du hast dein Limit von 5 Fotos erreicht.
                        </p>
                      ) : (
                        <button
                          onClick={() => photoInputRef.current?.click()}
                          disabled={uploadingPhoto}
                          className="flex items-center gap-2 text-[13px] font-[700] text-primary hover:text-primary-600 transition-colors disabled:opacity-50"
                        >
                          <Plus className="h-4 w-4" />
                          {uploadingPhoto ? 'Wird hochgeladen…' : 'Foto hinzufügen'}
                        </button>
                      ))}

                      <Separator className="bg-line" />
                    </div>
                  )}

                  {/* ── Kommentare ── */}
                  <div className="space-y-4">
                    <h3 className="text-[13px] font-[800] text-ink uppercase tracking-[0.06em]">
                      Kommentare
                    </h3>

                    {commentsLoading ? (
                      <div className="space-y-3">
                        {[1, 2].map(i => (
                          <div key={i} className="flex gap-3">
                            <Skeleton className="h-8 w-8 rounded-pill bg-surface flex-shrink-0" />
                            <div className="flex-1 space-y-1.5">
                              <Skeleton className="h-3 w-24 rounded bg-surface" />
                              <Skeleton className="h-4 w-full rounded bg-surface" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : comments.length === 0 ? (
                      <p className="text-[13px] text-ink-3">
                        Noch keine Kommentare – schreib den ersten!
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {comments.map(comment => (
                          <div key={comment.id} className="flex gap-3 group">
                            <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
                              <AvatarImage src={comment.author.avatar_url ?? undefined} />
                              <AvatarFallback className="text-[11px] font-[700] bg-secondary-soft text-secondary">
                                {avatarFallback(comment.author.display_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-[12.5px] font-[700] text-ink">
                                  {comment.author.display_name}
                                </span>
                                <span className="text-[11px] text-ink-3">
                                  {new Date(comment.created_at).toLocaleString('de-DE', {
                                    day: '2-digit', month: '2-digit',
                                    hour: '2-digit', minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <div className="bg-surface border border-line rounded-[10px] px-3 py-2.5">
                                <TiptapRenderer content={comment.content} />
                              </div>
                            </div>
                            {!readOnly && (isAdmin || comment.user_id === currentUserId) && (
                              <button
                                onClick={() => setDeleteCommentTarget(comment)}
                                className="flex-shrink-0 h-7 w-7 mt-0.5 flex items-center justify-center rounded-[8px] text-ink-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:text-error hover:bg-error-soft transition-all"
                                aria-label="Kommentar löschen"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                        <div ref={commentsEndRef} />
                      </div>
                    )}
                  </div>

                  {/* Spacer so content isn't hidden behind fixed editor */}
                  <div className="h-4" />
                </div>
              </>
            )}
          </div>

          {/* ── Fixed comment editor ── */}
          {!readOnly && <div className="flex-shrink-0 border-t border-line bg-bg px-4 pt-3 pb-4">
            {/* Mention dropdown */}
            {mentionOpen && mentionItems.length > 0 && (
              <div className="mb-2 bg-surface border border-line rounded-[12px] shadow-lg overflow-hidden max-h-44 overflow-y-auto">
                {mentionItems.map(member => (
                  <button
                    key={member.user_id}
                    onMouseDown={e => {
                      e.preventDefault() // keep editor focused
                      mentionCommandRef.current?.({
                        id: member.user_id,
                        label: member.profile.display_name,
                      })
                    }}
                    className="w-full px-3 py-2.5 flex items-center gap-2.5 text-left hover:bg-surface-2 transition-colors"
                  >
                    <Avatar className="h-6 w-6 flex-shrink-0">
                      <AvatarImage src={member.profile.avatar_url ?? undefined} />
                      <AvatarFallback className="text-[10px] font-[700] bg-secondary-soft text-secondary">
                        {avatarFallback(member.profile.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[13.5px] text-ink">{member.profile.display_name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center gap-1 mb-2">
              <button
                onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleBold().run() }}
                className={`h-7 w-7 flex items-center justify-center rounded-[6px] text-[13px] font-[900] transition-colors
                  ${editor?.isActive('bold') ? 'bg-primary-soft text-primary' : 'text-ink-3 hover:text-ink hover:bg-surface-2'}`}
                aria-label="Fett"
              >
                B
              </button>
              <button
                onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleItalic().run() }}
                className={`h-7 w-7 flex items-center justify-center rounded-[6px] text-[13px] italic font-[800] transition-colors
                  ${editor?.isActive('italic') ? 'bg-primary-soft text-primary' : 'text-ink-3 hover:text-ink hover:bg-surface-2'}`}
                aria-label="Kursiv"
              >
                I
              </button>
              <button
                onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleBulletList().run() }}
                className={`h-7 w-7 flex items-center justify-center rounded-[6px] text-[11px] font-[800] transition-colors
                  ${editor?.isActive('bulletList') ? 'bg-primary-soft text-primary' : 'text-ink-3 hover:text-ink hover:bg-surface-2'}`}
                aria-label="Aufzählung"
              >
                •—
              </button>
              <button
                onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleOrderedList().run() }}
                className={`h-7 w-7 flex items-center justify-center rounded-[6px] text-[11px] font-[800] transition-colors
                  ${editor?.isActive('orderedList') ? 'bg-primary-soft text-primary' : 'text-ink-3 hover:text-ink hover:bg-surface-2'}`}
                aria-label="Nummerierte Liste"
              >
                1.
              </button>

              {/* Image upload button */}
              <input
                ref={commentImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async e => {
                  const file = e.target.files?.[0]
                  if (!file || !activityId) return
                  const result = await uploadCommentImage(activityId, file)
                  if (result.error) toast.error(result.error)
                  else if (result.url) editor?.commands.insertContent({ type: 'image', attrs: { src: result.url } })
                  e.target.value = ''
                }}
              />
              <button
                onMouseDown={e => { e.preventDefault(); commentImageInputRef.current?.click() }}
                className="h-7 w-7 flex items-center justify-center rounded-[6px] text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
                aria-label="Bild einfügen"
              >
                <ImageIcon className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Editor + Send */}
            <div className="flex items-end gap-2">
              <div className="flex-1 bg-surface border border-line rounded-[12px] px-3 py-2 min-h-[40px] max-h-[120px] overflow-y-auto">
                <EditorContent
                  editor={editor}
                  className="tiptap-editor text-[14px] text-ink outline-none"
                />
              </div>
              <button
                onClick={handleSendComment}
                disabled={isEditorEmpty || sendingComment}
                className={`flex-shrink-0 h-9 w-9 rounded-[10px] flex items-center justify-center transition-all
                  ${isEditorEmpty || sendingComment
                    ? 'bg-surface-2 text-ink-3 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary-600 active:scale-95'
                  }`}
                aria-label="Senden"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>}
        </SheetContent>
      </Sheet>

      {/* ── Responsibility delete dialog ── */}
      <AlertDialog open={!!deleteRespTarget} onOpenChange={open => !open && setDeleteRespTarget(null)}>
        <AlertDialogContent className="bg-surface border-line rounded-[18px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-ink">Verantwortlichkeit löschen?</AlertDialogTitle>
            <AlertDialogDescription className="text-ink-3">
              „{deleteRespTarget?.label}" wird entfernt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-line text-ink-2">Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteResponsibility}
              className="bg-error hover:bg-error text-white"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Photo delete dialog ── */}
      <AlertDialog open={!!deletePhotoTarget} onOpenChange={open => !open && setDeletePhotoTarget(null)}>
        <AlertDialogContent className="bg-surface border-line rounded-[18px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-ink">Foto löschen?</AlertDialogTitle>
            <AlertDialogDescription className="text-ink-3">
              Das Foto wird dauerhaft entfernt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-line text-ink-2">Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePhoto}
              className="bg-error hover:bg-error text-white"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Comment delete dialog ── */}
      <AlertDialog open={!!deleteCommentTarget} onOpenChange={open => !open && setDeleteCommentTarget(null)}>
        <AlertDialogContent className="bg-surface border-line rounded-[18px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-ink">Kommentar löschen?</AlertDialogTitle>
            <AlertDialogDescription className="text-ink-3">
              Der Kommentar und alle zugehörigen Bilder werden dauerhaft entfernt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-line text-ink-2">Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteComment}
              className="bg-error hover:bg-error text-white"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Termin anpassen sheet ── */}
      {activity && (
        <DateFinderSheet
          open={dateFinderOpen}
          activityId={activity.id}
          activityName={activity.name}
          groupId={groupId}
          mode="adjust"
          initialDateRange={
            activity.start_date && activity.end_date
              ? {
                  from: new Date(activity.start_date + 'T00:00:00'),
                  to: new Date(activity.end_date + 'T00:00:00'),
                }
              : undefined
          }
          onClose={() => setDateFinderOpen(false)}
          onSuccess={() => { setDateFinderOpen(false); reload(); onActivityUpdated?.() }}
        />
      )}
    </>
  )
}
