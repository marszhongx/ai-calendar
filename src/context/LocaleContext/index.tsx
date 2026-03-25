import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import I18n, { initialLocale } from '@/i18n'
import type { Locale } from '@/i18n/types'
import type { LocaleContextType } from './types'

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

type LocaleProviderProps = {
  children: ReactNode
}

export const LocaleProvider = ({ children }: LocaleProviderProps) => {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

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
