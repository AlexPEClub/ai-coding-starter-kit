import type { ServiceTyp } from '../types'
import { useTranslation } from '../i18n'
import { LucideIcon } from './LucideIcon'

interface ServiceFilterBarProps {
  services: ServiceTyp[]
  activeFilters: string[]
  onToggle: (id: string) => void
  onReset: () => void
  primaryColor: string
}

export function ServiceFilterBar({
  services,
  activeFilters,
  onToggle,
  onReset,
  primaryColor,
}: ServiceFilterBarProps) {
  const { t } = useTranslation()

  if (services.length === 0) return null

  return (
    <div className="hsf-filters">
      <div className="hsf-filter-chips">
        {services.map((service) => {
          const isActive = activeFilters.includes(service.id)
          return (
            <button
              key={service.id}
              type="button"
              className={`hsf-chip ${isActive ? 'hsf-chip-active' : ''}`}
              style={isActive ? { backgroundColor: primaryColor, color: '#fff', borderColor: primaryColor } : {}}
              onClick={() => onToggle(service.id)}
              title={service.name}
            >
              <LucideIcon name={service.icon} size={14} />
              <span>{service.name}</span>
            </button>
          )
        })}
      </div>
      {activeFilters.length > 0 && (
        <button type="button" className="hsf-reset-btn" onClick={onReset}>
          {t('filter.reset')}
        </button>
      )}
    </div>
  )
}
