import { createContext, useContext } from 'react'
import { de } from './de'
import { fr } from './fr'
import { it } from './it'

export type Language = 'de' | 'fr' | 'it'
type TranslationKey = keyof typeof de

const translations: Record<Language, Record<string, string>> = { de, fr, it }

const STORAGE_KEY = 'heizmann-storefinder-lang'

export function detectLanguage(defaultLang: Language = 'de'): Language {
  // 1. localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && stored in translations) return stored as Language
  } catch { /* localStorage unavailable */ }

  // 2. Browser language
  const browserLang = navigator.language?.slice(0, 2)
  if (browserLang && browserLang in translations) return browserLang as Language

  // 3. Default from config
  return defaultLang
}

export function saveLanguage(lang: Language) {
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch { /* ignore */ }
}

export function translate(
  key: TranslationKey | string,
  lang: Language,
  params?: Record<string, string | number>
): string {
  let text = translations[lang]?.[key] ?? translations.de[key] ?? key

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v))
    }
  }

  return text
}

// React context
interface I18nContextValue {
  lang: Language
  t: (key: string, params?: Record<string, string | number>) => string
  setLang: (lang: Language) => void
}

export const I18nContext = createContext<I18nContextValue>({
  lang: 'de',
  t: (key) => key,
  setLang: () => {},
})

export function useTranslation() {
  return useContext(I18nContext)
}
