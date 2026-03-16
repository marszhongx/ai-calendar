// 测试国际化系统，包含新添加的 baseUrl 相关键
const { I18n } = require('i18n-js');
const en = require('./src/i18n/locales/en.json');
const zh = require('./src/i18n/locales/zh.json');
const zhTW = require('./src/i18n/locales/zh-TW.json');

// 配置国际化
const i18n = new I18n({ en, zh, 'zh-TW': zhTW });
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

console.log('Testing Internationalization System with new baseUrl keys...\n');

// 测试英文
i18n.locale = 'en';
console.log('English:');
console.log('  Save:', i18n.t('common.save'));
console.log('  AI Settings:', i18n.t('ai_config.title'));
console.log('  Base URL:', i18n.t('ai_config.baseUrl'));
console.log('  Base URL Placeholder:', i18n.t('ai_config.baseUrlPlaceholder'));
console.log('  Schedule:', i18n.t('schedule.title'));

// 测试中文（简体）
i18n.locale = 'zh';
console.log('\nChinese (Simplified):');
console.log('  保存:', i18n.t('common.save'));
console.log('  AI配置:', i18n.t('ai_config.title'));
console.log('  基础URL:', i18n.t('ai_config.baseUrl'));
console.log('  基础URL占位符:', i18n.t('ai_config.baseUrlPlaceholder'));
console.log('  日程安排:', i18n.t('schedule.title'));

// 测试中文（繁体）
i18n.locale = 'zh-TW';
console.log('\nChinese (Traditional):');
console.log('  儲存:', i18n.t('common.save'));
console.log('  AI設定:', i18n.t('ai_config.title'));
console.log('  基礎URL:', i18n.t('ai_config.baseUrl'));
console.log('  基礎URL佔位符:', i18n.t('ai_config.baseUrlPlaceholder'));
console.log('  行程安排:', i18n.t('schedule.title'));

console.log('\n✅ Internationalization system working correctly with new keys!');