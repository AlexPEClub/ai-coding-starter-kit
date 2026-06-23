import { describe, it, expect, vi, beforeEach } from 'vitest'
import { uploadCommentImage, deleteCommentImages } from './useActivityComments'

// ─── Supabase mock ─────────────────────────────────────────────────────────────

const { mockUpload, mockRemove, mockGetPublicUrl, mockGetUser } = vi.hoisted(() => ({
  mockUpload: vi.fn(),
  mockRemove: vi.fn(),
  mockGetPublicUrl: vi.fn(),
  mockGetUser: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: mockUpload,
        remove: mockRemove,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
    auth: {
      getUser: mockGetUser,
    },
  },
}))

// ─── uploadCommentImage ────────────────────────────────────────────────────────

describe('uploadCommentImage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockUpload.mockResolvedValue({ error: null })
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://example.com/image.jpg' } })
  })

  it('rejects files over 5 MB without calling storage', async () => {
    const file = new File(['x'], 'big.png', { type: 'image/png' })
    Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 })

    const result = await uploadCommentImage('act-1', file)

    expect(result.error).toBe('Datei zu groß (max. 5 MB)')
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('rejects when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const file = new File(['x'], 'image.png', { type: 'image/png' })

    const result = await uploadCommentImage('act-1', file)

    expect(result.error).toBe('Nicht eingeloggt')
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('returns public URL on successful upload', async () => {
    const file = new File(['x'], 'image.png', { type: 'image/png' })

    const result = await uploadCommentImage('act-1', file)

    expect(result.error).toBeUndefined()
    expect(result.url).toBe('https://example.com/image.jpg')
    expect(mockUpload).toHaveBeenCalledOnce()
  })

  it('returns error message when storage upload fails', async () => {
    mockUpload.mockResolvedValue({ error: { message: 'Storage error' } })
    const file = new File(['x'], 'image.png', { type: 'image/png' })

    const result = await uploadCommentImage('act-1', file)

    expect(result.error).toBe('Upload fehlgeschlagen')
  })

  it('accepts files exactly at 5 MB limit', async () => {
    const file = new File(['x'], 'exact.png', { type: 'image/png' })
    Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 })

    const result = await uploadCommentImage('act-1', file)

    expect(result.error).toBeUndefined()
    expect(mockUpload).toHaveBeenCalledOnce()
  })

  it('includes activityId in the storage path', async () => {
    const file = new File(['x'], 'image.jpg', { type: 'image/jpeg' })
    await uploadCommentImage('my-act-id', file)

    const uploadPath = mockUpload.mock.calls[0][0] as string
    expect(uploadPath).toContain('my-act-id/')
  })
})

// ─── deleteCommentImages ───────────────────────────────────────────────────────

describe('deleteCommentImages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRemove.mockResolvedValue({})
  })

  it('calls storage remove with the given paths', async () => {
    await deleteCommentImages(['path/to/img1.jpg', 'path/to/img2.jpg'])

    expect(mockRemove).toHaveBeenCalledWith(['path/to/img1.jpg', 'path/to/img2.jpg'])
  })

  it('does NOT call storage remove when paths array is empty', async () => {
    await deleteCommentImages([])

    expect(mockRemove).not.toHaveBeenCalled()
  })
})
