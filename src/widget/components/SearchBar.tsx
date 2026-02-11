import { useState, useEffect, useRef } from 'react'
import { useTranslation } from '../i18n'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  primaryColor: string
}

export function SearchBar({ value, onChange, primaryColor }: SearchBarProps) {
  const { t } = useTranslation()
  const [input, setInput] = useState(value)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    setInput(value)
  }, [value])

  const handleChange = (val: string) => {
    setInput(val)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onChange(val), 300)
  }

  return (
    <div className="hsf-search">
      <svg className="hsf-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        type="text"
        className="hsf-search-input"
        placeholder={t('search.placeholder')}
        value={input}
        onChange={(e) => handleChange(e.target.value)}
      />
      {input && (
        <button
          type="button"
          className="hsf-search-clear"
          onClick={() => handleChange('')}
          aria-label="Clear"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
