import { useTranslation } from '../i18n'
import type { Language } from '../i18n'

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'de', label: 'DE' },
  { code: 'fr', label: 'FR' },
  { code: 'it', label: 'IT' },
]

interface LanguageSwitcherProps {
  primaryColor: string
}

export function LanguageSwitcher({ primaryColor }: LanguageSwitcherProps) {
  const { lang, setLang } = useTranslation()

  return (
    <div className="hsf-lang-switcher">
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          className={`hsf-lang-btn ${lang === code ? 'hsf-lang-active' : ''}`}
          style={lang === code ? { color: primaryColor, borderColor: primaryColor } : {}}
          onClick={() => setLang(code)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
