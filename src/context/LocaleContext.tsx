// src/context/LocaleContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import I18n from '../i18n';
import { Locale } from '../i18n/types';

type LocaleContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: keyof any, options?: any) => string;
};

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

type LocaleProviderProps = {
  children: ReactNode;
};

export const LocaleProvider = ({ children }: LocaleProviderProps) => {
  const [locale, setLocaleState] = useState<Locale>('zh'); // 默认为简体中文

  // 初始化语言环境
  useEffect(() => {
    // 在测试环境中跳过动态导入
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
      // 在测试环境中直接使用初始语言
      return;
    }

    // 尝试获取系统语言
    import('../i18n').then(({ initialLocale }) => {
      setLocaleState(initialLocale);
      I18n.locale = initialLocale;
    });
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    I18n.locale = newLocale;
  };

  const t = (key: keyof any, options?: any) => {
    // 通过点号访问嵌套对象，例如 'common.save'
    return I18n.t(key, options);
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
};