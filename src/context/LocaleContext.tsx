import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import I18n from '../i18n'
import type { Locale } from '../i18n/types'

type LocaleContextType = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, options?: Record<string, unknown>) => string
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

type LocaleProviderProps = {
  children: ReactNode
}

export const LocaleProvider = ({ children }: LocaleProviderProps) => {
  const [locale, setLocaleState] = useState<Locale>('zh')

  useEffect(() => {
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
      return
    }

    import('../i18n')
      .then(({ initialLocale }) => {
        setLocaleState(initialLocale)
        I18n.locale = initialLocale
      })
      .catch(() => {})
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    I18n.locale = newLocale
  }, [])

  const t = useCallback((key: string, options?: Record<string, unknown>) => {
    return I18n.t(key, options)
  }, [])

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  )

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  )
}

export const useLocale = () => {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return context
}
