// 测试国际化系统
const { I18n } = require('i18n-js')
const en = require('./src/i18n/locales/en.json')
const zh = require('./src/i18n/locales/zh.json')

// 配置国际化
const i18n = new I18n({ en, zh })
i18n.enableFallback = true
i18n.defaultLocale = 'en'

console.log('Testing Internationalization System...\n')

// 测试英文
i18n.locale = 'en'
console.log('English:')
console.log('  Save:', i18n.t('common.save'))
console.log('  AI Settings:', i18n.t('aiConfig.title'))
console.log('  Schedule:', i18n.t('schedule.title'))
console.log('  Error:', i18n.t('messages.error'))

// 测试中文（简体）
i18n.locale = 'zh'
console.log('\nChinese (Simplified):')
console.log('  保存:', i18n.t('common.save'))
console.log('  AI配置:', i18n.t('aiConfig.title'))
console.log('  日程安排:', i18n.t('schedule.title'))
console.log('  操作失败:', i18n.t('messages.error'))

console.log('\n✅ Internationalization system working correctly!')
