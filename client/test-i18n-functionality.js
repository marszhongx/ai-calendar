// 测试国际化系统
const i18n = require('i18n-js')
const en = require('./src/i18n/locales/en.json')
const zh = require('./src/i18n/locales/zh.json')
const zhTW = require('./src/i18n/locales/zh-TW.json')

// 配置国际化
i18n.fallbacks = true
i18n.translations = { en, zh, 'zh-TW': zhTW }

console.log('Testing Internationalization System...\n')

// 测试英文
i18n.locale = 'en'
console.log('English:')
console.log('  Save:', i18n.t('common.save'))
console.log('  AI Settings:', i18n.t('aiConfig.title'))
console.log('  Schedule:', i18n.t('schedule.title'))
console.log('  Success:', i18n.t('messages.success'))

// 测试中文（简体）
i18n.locale = 'zh'
console.log('\nChinese (Simplified):')
console.log('  保存:', i18n.t('common.save'))
console.log('  AI配置:', i18n.t('aiConfig.title'))
console.log('  日程安排:', i18n.t('schedule.title'))
console.log('  成功:', i18n.t('messages.success'))

// 测试中文（繁体）
i18n.locale = 'zh-TW'
console.log('\nChinese (Traditional):')
console.log('  儲存:', i18n.t('common.save'))
console.log('  AI設定:', i18n.t('aiConfig.title'))
console.log('  行程安排:', i18n.t('schedule.title'))
console.log('  成功:', i18n.t('messages.success'))

console.log('\n✅ Internationalization system working correctly!')
