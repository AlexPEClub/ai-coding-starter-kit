'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { PLACEHOLDER_IMAGE } from '@/lib/activity-types'

const DEBOUNCE_MS = 600

export function useOgImage(url: string | null | undefined) {
  const [ogImageUrl, setOgImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [found, setFound] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (!url || url.trim() === '') {
      setOgImageUrl(null)
      setLoading(false)
      setFound(false)
      return
    }

    // Basic URL validation before calling the edge function
    try {
      new URL(url)
    } catch {
      setOgImageUrl(null)
      setFound(false)
      return
    }

    setLoading(true)

    timerRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('fetch-og-image', {
          body: { url },
        })

        if (error || !data) {
          setOgImageUrl(PLACEHOLDER_IMAGE)
          setFound(false)
        } else {
          setOgImageUrl(data.og_image_url ?? PLACEHOLDER_IMAGE)
          setFound(data.found ?? false)
        }
      } catch {
        setOgImageUrl(PLACEHOLDER_IMAGE)
        setFound(false)
      } finally {
        setLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [url])

  return { ogImageUrl, loading, found }
}
