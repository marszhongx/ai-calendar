import { getLocales } from 'expo-localization'
import { I18n } from 'i18n-js'
import en from './locales/en.json'
import zh from './locales/zh.json'
import type { Locale } from './types'

const translations = {
  en,
  zh,
}

const i18nInstance = new I18n(translations)

i18nInstance.enableFallback = true

const getSystemLocale = (): Locale => {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    return 'en'
  }

  try {
    const locales = getLocales()
    const locale = locales[0]?.languageTag

    if (locale?.startsWith('zh')) {
      return 'zh'
    }
  } catch {}

  return 'en'
}

const initialLocale = getSystemLocale()
i18nInstance.locale = initialLocale

export { i18nInstance as I18n, initialLocale }
export default i18nInstance
