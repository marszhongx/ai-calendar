// src/i18n/types.ts
export interface TranslationKeys {
  common: {
    save: string
    settings: string
  }
  aiConfig: {
    title: string
    apiKey: string
    baseUrl: string
    baseUrlPlaceholder: string
    modelName: string
    saveSettings: string
    saveSuccess: string
    saveFailed: string
  }
  schedule: {
    title: string
    newSchedule: string
    scheduleList: string
    eventName: string
    startTime: string
    endTime: string
    description: string
    aiInputPlaceholder: string
    create: string
    saveDraft: string
    emptyList: string
    emptyToday: string
    emptyTomorrow: string
    emptyTodayHint: string
    emptyTomorrowHint: string
    emptyListHint: string
    remindMe: string
    minutes: string
    repeat: string
    never: string
    daily: string
    weekly: string
    monthly: string
    tabToday: string
    tabTomorrow: string
    tabAll: string
    notFound: string
    originalMessage: string
    reParse: string
    reParsing: string
  }
  picker: {
    cancel: string
    selectDate: string
    selectTime: string
    next: string
    confirm: string
  }
  messages: {
    error: string
    serverError: string
    dataLoadFailed: string
    validationError: string
    timeoutError: string
    saveFailed: string
    retry: string
  }
  validation: {
    titleRequired: string
    startAtRequired: string
    invalidRecurrence: string
    reminderRange: string
  }
}

export type Locale = 'en' | 'zh'
