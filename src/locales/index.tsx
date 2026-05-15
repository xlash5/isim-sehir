import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import tr from './tr'
import en from './en'
import es from './es'
import pt from './pt'
import fr from './fr'
import de from './de'

export type Locale = 'tr' | 'en' | 'es' | 'pt' | 'fr' | 'de'

const LOCALE_MAP: Record<Locale, Record<string, string>> = { tr, en, es, pt, fr, de }

interface LocaleContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const LocaleContext = createContext<LocaleContextType | null>(null)

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    params[key] !== undefined ? String(params[key]) : `{${key}}`,
  )
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() =>
    (localStorage.getItem('locale') as Locale) || 'tr',
  )

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('locale', newLocale)
  }, [])

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const dict = LOCALE_MAP[locale]
      let value = dict[key]
      if (value === undefined) {
        const fallback = LOCALE_MAP['tr'][key]
        if (fallback !== undefined) return interpolate(fallback, params)
        if (import.meta.env.DEV) {
          console.warn(`[locale] Missing translation key: "${key}"`)
        }
        return key
      }
      return interpolate(value, params)
    },
    [locale],
  )

  const ctx = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return (
    <LocaleContext.Provider value={ctx}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale(): LocaleContextType {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
