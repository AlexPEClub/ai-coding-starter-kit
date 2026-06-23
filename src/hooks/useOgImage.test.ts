import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOgImage } from './useOgImage'
import { PLACEHOLDER_IMAGE } from '@/lib/activity-types'

const { mockInvoke } = vi.hoisted(() => ({ mockInvoke: vi.fn() }))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: mockInvoke,
    },
  },
}))

describe('useOgImage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with null ogImageUrl and loading=false when url is null', () => {
    const { result } = renderHook(() => useOgImage(null))
    expect(result.current.ogImageUrl).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.found).toBe(false)
  })

  it('starts with null ogImageUrl when url is empty string', () => {
    const { result } = renderHook(() => useOgImage(''))
    expect(result.current.ogImageUrl).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('does not call invoke for invalid URLs', async () => {
    const { result } = renderHook(() => useOgImage('not-a-url'))
    act(() => { vi.runAllTimers() })
    expect(mockInvoke).not.toHaveBeenCalled()
    expect(result.current.ogImageUrl).toBeNull()
  })

  it('debounces: does not call invoke before 600ms', () => {
    mockInvoke.mockResolvedValue({ data: { og_image_url: 'https://example.com/img.png', found: true }, error: null })
    renderHook(() => useOgImage('https://example.com'))

    act(() => { vi.advanceTimersByTime(400) })
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it('calls invoke after 600ms debounce with a valid URL', async () => {
    mockInvoke.mockResolvedValue({ data: { og_image_url: 'https://example.com/img.png', found: true }, error: null })
    const { result } = renderHook(() => useOgImage('https://example.com'))

    expect(result.current.loading).toBe(true)

    await act(async () => {
      vi.advanceTimersByTime(600)
      await Promise.resolve()
    })

    expect(mockInvoke).toHaveBeenCalledWith('fetch-og-image', { body: { url: 'https://example.com' } })
    expect(result.current.ogImageUrl).toBe('https://example.com/img.png')
    expect(result.current.found).toBe(true)
    expect(result.current.loading).toBe(false)
  })

  it('sets ogImageUrl to placeholder and found=false when API returns no image', async () => {
    mockInvoke.mockResolvedValue({ data: { og_image_url: PLACEHOLDER_IMAGE, found: false }, error: null })
    const { result } = renderHook(() => useOgImage('https://example.com'))

    await act(async () => {
      vi.advanceTimersByTime(600)
      await Promise.resolve()
    })

    expect(result.current.ogImageUrl).toBe(PLACEHOLDER_IMAGE)
    expect(result.current.found).toBe(false)
  })

  it('falls back to placeholder when invoke returns an error', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: { message: 'Edge Function error' } })
    const { result } = renderHook(() => useOgImage('https://example.com'))

    await act(async () => {
      vi.advanceTimersByTime(600)
      await Promise.resolve()
    })

    expect(result.current.ogImageUrl).toBe(PLACEHOLDER_IMAGE)
    expect(result.current.found).toBe(false)
    expect(result.current.loading).toBe(false)
  })

  it('falls back to placeholder when invoke throws', async () => {
    mockInvoke.mockRejectedValue(new Error('Network failure'))
    const { result } = renderHook(() => useOgImage('https://example.com'))

    await act(async () => {
      vi.advanceTimersByTime(600)
      await Promise.resolve()
    })

    expect(result.current.ogImageUrl).toBe(PLACEHOLDER_IMAGE)
    expect(result.current.found).toBe(false)
    expect(result.current.loading).toBe(false)
  })

  it('resets to null when URL is cleared', async () => {
    mockInvoke.mockResolvedValue({ data: { og_image_url: 'https://img.com/img.jpg', found: true }, error: null })
    const { result, rerender } = renderHook(({ url }) => useOgImage(url), {
      initialProps: { url: 'https://example.com' },
    })

    await act(async () => {
      vi.advanceTimersByTime(600)
      await Promise.resolve()
    })
    expect(result.current.ogImageUrl).toBe('https://img.com/img.jpg')

    rerender({ url: '' })
    expect(result.current.ogImageUrl).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('cancels pending debounce when URL changes before timer fires', () => {
    mockInvoke.mockResolvedValue({ data: { og_image_url: 'https://a.com/1.jpg', found: true }, error: null })
    const { rerender } = renderHook(({ url }) => useOgImage(url), {
      initialProps: { url: 'https://first.com' },
    })

    act(() => { vi.advanceTimersByTime(300) })

    rerender({ url: 'https://second.com' })

    act(() => { vi.advanceTimersByTime(300) })

    // Timer for first URL should have been cancelled — invoke not yet called
    expect(mockInvoke).not.toHaveBeenCalled()
  })
})
