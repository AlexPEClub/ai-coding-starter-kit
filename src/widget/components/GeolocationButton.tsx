import { useState } from 'react'
import { useTranslation } from '../i18n'

interface GeolocationButtonProps {
  onLocation: (lat: number, lng: number) => void
}

export function GeolocationButton({ onLocation }: GeolocationButtonProps) {
  const { t } = useTranslation()
  const [isLocating, setIsLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = () => {
    if (!navigator.geolocation) {
      setError(t('geolocation.error'))
      return
    }

    setIsLocating(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocation(pos.coords.latitude, pos.coords.longitude)
        setIsLocating(false)
      },
      () => {
        setError(t('geolocation.error'))
        setIsLocating(false)
      },
      { enableHighAccuracy: false, timeout: 10000 }
    )
  }

  return (
    <div className="hsf-geolocation">
      <button
        type="button"
        className="hsf-btn hsf-btn-outline"
        onClick={handleClick}
        disabled={isLocating}
      >
        {isLocating ? (
          <svg className="hsf-spinner" viewBox="0 0 24 24" width="16" height="16">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="32" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
          </svg>
        )}
        <span>{t('map.myLocation')}</span>
      </button>
      {error && <span className="hsf-error-text">{error}</span>}
    </div>
  )
}
