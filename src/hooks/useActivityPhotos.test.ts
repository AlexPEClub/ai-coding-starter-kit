import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useActivityPhotos } from './useActivityPhotos'

// ─── Supabase mock ─────────────────────────────────────────────────────────────

const { mockQueryResult, mockStorageUpload, mockStorageRemove, mockGetUser } = vi.hoisted(() => ({
  mockQueryResult: vi.fn(),
  mockStorageUpload: vi.fn(),
  mockStorageRemove: vi.fn(),
  mockGetUser: vi.fn(),
}))

const mockInsert = vi.fn()
const mockDeleteEq = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => mockQueryResult(),
        }),
      }),
      insert: () => mockInsert(),
      delete: () => ({
        eq: () => mockDeleteEq(),
      }),
    }),
    storage: {
      from: () => ({
        upload: mockStorageUpload,
        remove: mockStorageRemove,
        getPublicUrl: () => ({ data: { publicUrl: 'https://example.com/photo.jpg' } }),
      }),
    },
    auth: {
      getUser: mockGetUser,
    },
  },
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const USER_1 = 'user-1'
const USER_2 = 'user-2'

function makePhoto(id: string, userId: string) {
  return { id, activity_id: 'act-1', user_id: userId, storage_path: `act-1/${userId}/${id}.jpg`, created_at: '2026-01-01' }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useActivityPhotos — userPhotoCount', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: USER_1 } } })
  })

  it('returns 0 when there are no photos', async () => {
    mockQueryResult.mockResolvedValue({ data: [], error: null })
    const { result } = renderHook(() => useActivityPhotos('act-1', USER_1))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.userPhotoCount).toBe(0)
  })

  it('counts only the current user photos, not others', async () => {
    mockQueryResult.mockResolvedValue({
      data: [makePhoto('p1', USER_1), makePhoto('p2', USER_1), makePhoto('p3', USER_2)],
      error: null,
    })
    const { result } = renderHook(() => useActivityPhotos('act-1', USER_1))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.userPhotoCount).toBe(2)
    expect(result.current.photos).toHaveLength(3)
  })

  it('sets error state when fetch fails', async () => {
    mockQueryResult.mockResolvedValue({ data: null, error: { message: 'Network error' } })
    const { result } = renderHook(() => useActivityPhotos('act-1', USER_1))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toMatch(/konnten nicht geladen/)
    expect(result.current.photos).toHaveLength(0)
  })

  it('does not fetch when activityId is null', () => {
    const { result } = renderHook(() => useActivityPhotos(null, USER_1))
    expect(result.current.loading).toBe(false)
    expect(mockQueryResult).not.toHaveBeenCalled()
  })
})

describe('useActivityPhotos — uploadPhoto validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQueryResult.mockResolvedValue({ data: [], error: null })
    mockGetUser.mockResolvedValue({ data: { user: { id: USER_1 } } })
    mockStorageUpload.mockResolvedValue({ error: null })
    mockInsert.mockResolvedValue({ error: null })
  })

  it('rejects files over 5 MB without calling storage', async () => {
    const { result } = renderHook(() => useActivityPhotos('act-1', USER_1))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const bigFile = new File(['x'], 'big.jpg', { type: 'image/jpeg' })
    Object.defineProperty(bigFile, 'size', { value: 6 * 1024 * 1024 })

    let uploadResult: { error?: string } = {}
    await act(async () => {
      uploadResult = await result.current.uploadPhoto('act-1', bigFile)
    })

    expect(uploadResult.error).toBe('Datei zu groß (max. 5 MB)')
    expect(mockStorageUpload).not.toHaveBeenCalled()
  })

  it('accepts files exactly at the 5 MB limit', async () => {
    const { result } = renderHook(() => useActivityPhotos('act-1', USER_1))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const file = new File(['x'], 'exact.jpg', { type: 'image/jpeg' })
    Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 })

    let uploadResult: { error?: string } = {}
    await act(async () => {
      uploadResult = await result.current.uploadPhoto('act-1', file)
    })

    expect(uploadResult.error).toBeUndefined()
    expect(mockStorageUpload).toHaveBeenCalledOnce()
  })

  it('rejects upload when user already has 5 photos', async () => {
    const fivePhotos = Array.from({ length: 5 }, (_, i) => makePhoto(`p${i}`, USER_1))
    mockQueryResult.mockResolvedValue({ data: fivePhotos, error: null })

    const { result } = renderHook(() => useActivityPhotos('act-1', USER_1))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.userPhotoCount).toBe(5)

    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' })
    let uploadResult: { error?: string } = {}
    await act(async () => {
      uploadResult = await result.current.uploadPhoto('act-1', file)
    })

    expect(uploadResult.error).toBe('Du hast dein Limit von 5 Fotos erreicht')
    expect(mockStorageUpload).not.toHaveBeenCalled()
  })

  it('allows upload when user has exactly 4 photos (below limit)', async () => {
    const fourPhotos = Array.from({ length: 4 }, (_, i) => makePhoto(`p${i}`, USER_1))
    mockQueryResult.mockResolvedValue({ data: fourPhotos, error: null })

    const { result } = renderHook(() => useActivityPhotos('act-1', USER_1))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' })
    let uploadResult: { error?: string } = {}
    await act(async () => {
      uploadResult = await result.current.uploadPhoto('act-1', file)
    })

    expect(uploadResult.error).toBeUndefined()
    expect(mockStorageUpload).toHaveBeenCalledOnce()
  })

  it('rolls back storage file when DB insert fails', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'Insert failed' } })

    const { result } = renderHook(() => useActivityPhotos('act-1', USER_1))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' })
    let uploadResult: { error?: string } = {}
    await act(async () => {
      uploadResult = await result.current.uploadPhoto('act-1', file)
    })

    expect(uploadResult.error).toBe('Foto konnte nicht gespeichert werden')
    expect(mockStorageRemove).toHaveBeenCalledOnce()
  })
})
