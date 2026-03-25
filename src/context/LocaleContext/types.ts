import type { Locale } from '@/i18n/types'

export type LocaleContextType = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, options?: Record<string, unknown>) => string
}
