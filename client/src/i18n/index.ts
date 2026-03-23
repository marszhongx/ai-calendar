import { getLocales } from 'expo-localization'
import { I18n } from 'i18n-js'
import en from './locales/en.json'
import zh from './locales/zh.json'
import zhTW from './locales/zh-TW.json'
import type { Locale } from './types'

const translations = {
  en,
  zh,
  'zh-TW': zhTW,
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
      if (
        ['zh-Hant', 'zh-TW', 'zh-HK', 'zh-MO'].some((tag) =>
          locale.startsWith(tag),
        )
      ) {
        return 'zh-TW'
      }
      return 'zh'
    }
  } catch {}

  return 'en'
}

const initialLocale = getSystemLocale()
i18nInstance.locale = initialLocale

export { i18nInstance as I18n, initialLocale }
export default i18nInstance
