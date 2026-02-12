import type { Stuetzpunkt } from '../types'
import { useTranslation } from '../i18n'
import { LucideIcon } from './LucideIcon'

interface LocationCardProps {
  stuetzpunkt: Stuetzpunkt
  primaryColor: string
  isSelected: boolean
  onClick: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}

export function LocationCard({
  stuetzpunkt: sp,
  primaryColor,
  isSelected,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: LocationCardProps) {
  const { t } = useTranslation()

  const hours = sp.oeffnungszeiten_typ === '24h'
    ? t('card.hours.24h')
    : sp.oeffnungszeiten_von && sp.oeffnungszeiten_bis
      ? t('card.hours.daytime', { from: sp.oeffnungszeiten_von, to: sp.oeffnungszeiten_bis })
      : null

  return (
    <div
      className={`hsf-card ${isSelected ? 'hsf-card-selected' : ''}`}
      style={isSelected ? { borderColor: primaryColor } : {}}
      onClick={(e) => {
        // Don't trigger card selection when clicking on links
        if ((e.target as HTMLElement).closest('a')) return
        onClick()
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick() }}
    >
      {sp.bild_url ? (
        <img
          src={sp.bild_url}
          alt={sp.name}
          className="hsf-card-image"
          loading="lazy"
        />
      ) : (
        <div className="hsf-card-image-placeholder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32" opacity="0.3">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>
      )}

      <div className="hsf-card-body">
        <div className="hsf-card-header">
          <h3 className="hsf-card-name">{sp.name}</h3>
          {sp.status === 'temporaer_geschlossen' && (
            <span className="hsf-badge-closed">{t('card.closed')}</span>
          )}
        </div>

        <div className="hsf-card-address">
          {sp.strasse} {sp.hausnummer}<br />
          {sp.plz} {sp.ort}
        </div>

        <div className="hsf-card-contact">
          <a href={`tel:${sp.telefon}`} className="hsf-card-link" style={{ color: primaryColor }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            {sp.telefon}
          </a>
          {sp.email && (
            <a href={`mailto:${sp.email}`} className="hsf-card-link" style={{ color: primaryColor }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              {sp.email}
            </a>
          )}
          {sp.website && (
            <a
              href={sp.website}
              target="_blank"
              rel="noopener noreferrer"
              className="hsf-card-link"
              style={{ color: primaryColor }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              {sp.website.replace(/^https?:\/\/(www\.)?/, '')}
            </a>
          )}
        </div>

        {sp.stuetzpunkt_services?.length > 0 && (
          <div className="hsf-card-services">
            {sp.stuetzpunkt_services.map((ss) => (
              <span key={ss.service_typ_id} className="hsf-service-badge" title={ss.service_typen?.name}>
                <LucideIcon name={ss.service_typen?.icon || 'circle'} size={12} />
                <span className="hsf-service-name">{ss.service_typen?.name}</span>
              </span>
            ))}
          </div>
        )}

        {hours && (
          <div className="hsf-card-hours">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {hours}
          </div>
        )}
      </div>
    </div>
  )
}
