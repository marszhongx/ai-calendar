// src/i18n/index.ts
import { Localization } from 'expo-localization';
import { I18n } from 'i18n-js';
import en from './locales/en.json';
import zh from './locales/zh.json';
import zhTW from './locales/zh-TW.json';
import { Locale } from './types';

// 本地化资源映射
const translations = {
  en,
  zh,
  'zh-TW': zhTW,
};

// 创建i18n实例
const i18nInstance = new I18n(translations);

// 设置默认语言
i18nInstance.enableFallback = true;

// 获取系统首选语言
const getSystemLocale = (): Locale => {
  // 在测试环境中没有 expo-localization，提供一个备用方案
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    // 测试环境中默认使用英文
    return 'en';
  }

  if (typeof Localization === 'undefined') {
    return 'en'; // 默认返回英文
  }

  const locale = Localization.locale;

  // 如果系统语言以 'zh' 开头，判断是否为繁体
  if (locale?.startsWith('zh')) {
    // 检查是否是繁体中文区域
    if (['zh-Hant', 'zh-TW', 'zh-HK', 'zh-MO'].includes(locale)) {
      return 'zh-TW';
    }
    // 默认为简体中文
    return 'zh';
  }

  // 其他情况返回英语作为后备
  return 'en';
};

// 设置初始语言
const initialLocale = getSystemLocale();
i18nInstance.locale = initialLocale;

export { i18nInstance as I18n, initialLocale };
export default i18nInstance;