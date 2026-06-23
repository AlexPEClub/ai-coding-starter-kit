import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProfile } from './useProfile'

// ─── Supabase mock ─────────────────────────────────────────────────────────────

const { mockUpdateEq, mockStorageUpload, mockGetPublicUrl } = vi.hoisted(() => ({
  mockUpdateEq: vi.fn(),
  mockStorageUpload: vi.fn(),
  mockGetPublicUrl: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      update: () => ({
        eq: mockUpdateEq,
      }),
    }),
    storage: {
      from: () => ({
        upload: mockStorageUpload,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
  },
}))

// ─── Auth mock ─────────────────────────────────────────────────────────────────

const mockRefreshProfile = vi.fn()

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    refreshProfile: mockRefreshProfile,
  }),
}))

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useProfile — updateDisplayName', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRefreshProfile.mockResolvedValue(undefined)
  })

  it('rejects empty display name (whitespace-only)', async () => {
    const { result } = renderHook(() => useProfile())
    let ok: boolean
    await act(async () => {
      ok = await result.current.updateDisplayName('   ')
    })
    expect(ok!).toBe(false)
    expect(result.current.error).toBe('Name darf nicht leer sein')
    expect(mockUpdateEq).not.toHaveBeenCalled()
  })

  it('rejects name longer than 50 characters', async () => {
    const { result } = renderHook(() => useProfile())
    const longName = 'a'.repeat(51)
    let ok: boolean
    await act(async () => {
      ok = await result.current.updateDisplayName(longName)
    })
    expect(ok!).toBe(false)
    expect(result.current.error).toBe('Name darf maximal 50 Zeichen lang sein')
    expect(mockUpdateEq).not.toHaveBeenCalled()
  })

  it('accepts a name of exactly 50 characters', async () => {
    mockUpdateEq.mockResolvedValue({ error: null })
    const { result } = renderHook(() => useProfile())
    const maxName = 'a'.repeat(50)
    let ok: boolean
    await act(async () => {
      ok = await result.current.updateDisplayName(maxName)
    })
    expect(ok!).toBe(true)
    expect(mockUpdateEq).toHaveBeenCalledTimes(1)
    expect(mockRefreshProfile).toHaveBeenCalledTimes(1)
  })

  it('saves trimmed name and refreshes profile on success', async () => {
    mockUpdateEq.mockResolvedValue({ error: null })
    const { result } = renderHook(() => useProfile())
    let ok: boolean
    await act(async () => {
      ok = await result.current.updateDisplayName('  Max Mustermann  ')
    })
    expect(ok!).toBe(true)
    expect(result.current.error).toBeNull()
    expect(mockRefreshProfile).toHaveBeenCalledTimes(1)
  })

  it('sets error and returns false on DB error', async () => {
    mockUpdateEq.mockResolvedValue({ error: { message: 'DB error' } })
    const { result } = renderHook(() => useProfile())
    let ok: boolean
    await act(async () => {
      ok = await result.current.updateDisplayName('Valid Name')
    })
    expect(ok!).toBe(false)
    expect(result.current.error).toBe('DB error')
    expect(mockRefreshProfile).not.toHaveBeenCalled()
  })
})

describe('useProfile — uploadAvatar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRefreshProfile.mockResolvedValue(undefined)
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://example.com/avatars/user-1/avatar.jpg' } })
  })

  function makeFile(sizeBytes: number, name = 'photo.jpg', type = 'image/jpeg'): File {
    return new File([new ArrayBuffer(sizeBytes)], name, { type })
  }

  it('rejects files larger than 5 MB before upload', async () => {
    const { result } = renderHook(() => useProfile())
    const bigFile = makeFile(5 * 1024 * 1024 + 1)
    let ok: boolean
    await act(async () => {
      ok = await result.current.uploadAvatar(bigFile)
    })
    expect(ok!).toBe(false)
    expect(result.current.error).toBe('Das Bild darf maximal 5 MB groß sein')
    expect(mockStorageUpload).not.toHaveBeenCalled()
  })

  it('accepts file exactly at 5 MB limit', async () => {
    mockStorageUpload.mockResolvedValue({ error: null })
    mockUpdateEq.mockResolvedValue({ error: null })
    const { result } = renderHook(() => useProfile())
    const maxFile = makeFile(5 * 1024 * 1024)
    let ok: boolean
    await act(async () => {
      ok = await result.current.uploadAvatar(maxFile)
    })
    expect(ok!).toBe(true)
    expect(mockStorageUpload).toHaveBeenCalledTimes(1)
  })

  it('uploads file, updates profile URL, and refreshes on success', async () => {
    mockStorageUpload.mockResolvedValue({ error: null })
    mockUpdateEq.mockResolvedValue({ error: null })
    const { result } = renderHook(() => useProfile())
    let ok: boolean
    await act(async () => {
      ok = await result.current.uploadAvatar(makeFile(100 * 1024))
    })
    expect(ok!).toBe(true)
    expect(mockStorageUpload).toHaveBeenCalledTimes(1)
    expect(mockUpdateEq).toHaveBeenCalledTimes(1)
    expect(mockRefreshProfile).toHaveBeenCalledTimes(1)
  })

  it('returns false and sets error when storage upload fails', async () => {
    mockStorageUpload.mockResolvedValue({ error: { message: 'upload failed' } })
    const { result } = renderHook(() => useProfile())
    let ok: boolean
    await act(async () => {
      ok = await result.current.uploadAvatar(makeFile(100 * 1024))
    })
    expect(ok!).toBe(false)
    expect(result.current.error).toBe('Profilbild konnte nicht hochgeladen werden')
    expect(mockUpdateEq).not.toHaveBeenCalled()
    expect(mockRefreshProfile).not.toHaveBeenCalled()
  })
})
