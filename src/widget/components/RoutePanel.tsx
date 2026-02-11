import { useTranslation } from '../i18n'
import type { RouteData } from '../types'

interface RoutePanelProps {
  route: RouteData
  userLocation: { lat: number; lng: number }
  primaryColor: string
  onClose: () => void
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function RoutePanel({ route, userLocation, primaryColor, onClose }: RoutePanelProps) {
  const { t } = useTranslation()

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${route.target.latitude},${route.target.longitude}&travelmode=driving`
  const appleMapsUrl = `https://maps.apple.com/?saddr=${userLocation.lat},${userLocation.lng}&daddr=${route.target.latitude},${route.target.longitude}&dirflg=d`

  return (
    <div className="hsf-route-panel">
      <div className="hsf-route-panel-header">
        <div className="hsf-route-panel-title">
          {t('route.target', { name: route.target.name })}
        </div>
        <button type="button" className="hsf-route-close-btn" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="hsf-route-panel-info">
        <div className="hsf-route-stat">
          <svg viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2" width="16" height="16">
            <path d="M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.553 2.776A1 1 0 0 0 21 18.882V5.618a1 1 0 0 0-.553-.894L15 2m0 15V2m-6 5l6-5" />
          </svg>
          <span>{t('route.distance', { distance: route.distance.toFixed(1) })}</span>
        </div>
        <div className="hsf-route-stat">
          <svg viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2" width="16" height="16">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span>{t('route.duration', { duration: Math.round(route.duration) })}</span>
        </div>
      </div>

      <div className="hsf-route-panel-address">
        {route.target.strasse} {route.target.hausnummer}, {route.target.plz} {route.target.ort}
      </div>

      <div className="hsf-route-panel-links">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hsf-route-link"
          style={{ color: primaryColor }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          {t('route.openGoogle')}
        </a>
        {isIOS() && (
          <a
            href={appleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hsf-route-link"
            style={{ color: primaryColor }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            {t('route.openApple')}
          </a>
        )}
      </div>
    </div>
  )
}
