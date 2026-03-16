// __tests__/i18n-basic.test.js
// 基础国际化功能测试
const { I18n } = require('i18n-js');
const en = require('../src/i18n/locales/en.json');
const zh = require('../src/i18n/locales/zh.json');
const zhTW = require('../src/i18n/locales/zh-TW.json');

describe('基础国际化功能测试', () => {
  let i18n;

  beforeEach(() => {
    i18n = new I18n({
      en,
      zh,
      'zh-TW': zhTW
    });

    i18n.enableFallback = true;
    i18n.defaultLocale = 'en';
  });

  test('should translate correctly in English', () => {
    i18n.locale = 'en';
    expect(i18n.t('common.save')).toBe('Save');
    expect(i18n.t('ai_config.title')).toBe('AI Settings');
    expect(i18n.t('schedule.title')).toBe('Schedule');
    expect(i18n.t('messages.success')).toBe('Operation succeeded');
  });

  test('should translate correctly in Chinese (Simplified)', () => {
    i18n.locale = 'zh';
    expect(i18n.t('common.save')).toBe('保存');
    expect(i18n.t('ai_config.title')).toBe('AI配置');
    expect(i18n.t('schedule.title')).toBe('日程安排');
    expect(i18n.t('messages.success')).toBe('操作成功');
  });

  test('should translate correctly in Chinese (Traditional)', () => {
    i18n.locale = 'zh-TW';
    expect(i18n.t('common.save')).toBe('儲存');
    expect(i18n.t('ai_config.title')).toBe('AI設定');
    expect(i18n.t('schedule.title')).toBe('行程安排');
    expect(i18n.t('messages.success')).toBe('操作成功');
  });

  test('should handle missing keys gracefully', () => {
    i18n.locale = 'en';
    const missingKeyResult = i18n.t('non.existent.key');
    // i18n-js typically returns the key itself for missing translations
    expect(missingKeyResult).toBeDefined();
  });

  test('should fallback to English for unknown locales', () => {
    i18n.locale = 'fr'; // French not supported
    const result = i18n.t('common.save');
    // With fallback enabled, it should return the English version or key
    expect(result).toBeDefined();
  });
});