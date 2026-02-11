import { useTranslation } from '../i18n'

interface RadiusSelectorProps {
  value: number
  onChange: (value: number) => void
}

const RADIUS_OPTIONS = [0, 10, 25, 50, 100]

export function RadiusSelector({ value, onChange }: RadiusSelectorProps) {
  const { t } = useTranslation()

  return (
    <div className="hsf-radius">
      <label className="hsf-radius-label">{t('map.radius')}:</label>
      <select
        className="hsf-select"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {RADIUS_OPTIONS.map((r) => (
          <option key={r} value={r}>
            {r === 0 ? '–' : `${r} km`}
          </option>
        ))}
      </select>
    </div>
  )
}
