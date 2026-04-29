import { Stack } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { Button, Input, Label, SizableText, Spinner, YStack } from 'tamagui'
import { SafePageView } from '@/components/safe-page-view'
import { ACCENT_COLOR, ACCENT_COLOR_PRESSED, SaveStatus } from '@/constants'
import { useLocale } from '@/context/LocaleContext'
import { getAiConfig, setAiConfig } from '@/services/ai-config'
import type { AiConfig } from '@/types/ai-config'

export default function ConfigScreen() {
  const { t } = useLocale()
  const [config, setConfig] = useState<AiConfig>({
    baseUrl: '',
    apiKey: '',
    modelName: '',
  })
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(SaveStatus.IDLE)

  useEffect(() => {
    getAiConfig().then(setConfig)
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    setSaveStatus(SaveStatus.IDLE)
    try {
      await setAiConfig(config)
      setSaveStatus(SaveStatus.SUCCESS)
    } catch {
      setSaveStatus(SaveStatus.ERROR)
    } finally {
      setSaving(false)
    }
  }, [config])

  return (
    <>
      <Stack.Screen options={{ title: t('aiConfig.title') }} />
      <SafePageView scroll gap="$3">
        <YStack gap="$1">
          <Label htmlFor="baseUrl">{t('aiConfig.baseUrl')}</Label>
          <Input
            id="baseUrl"
            value={config.baseUrl}
            onChangeText={(v) => setConfig((c) => ({ ...c, baseUrl: v }))}
            placeholder={t('aiConfig.baseUrlPlaceholder')}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </YStack>

        <YStack gap="$1">
          <Label htmlFor="apiKey">{t('aiConfig.apiKey')}</Label>
          <Input
            id="apiKey"
            value={config.apiKey}
            onChangeText={(v) => setConfig((c) => ({ ...c, apiKey: v }))}
            placeholder="sk-..."
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </YStack>

        <YStack gap="$1">
          <Label htmlFor="modelName">{t('aiConfig.modelName')}</Label>
          <Input
            id="modelName"
            value={config.modelName}
            onChangeText={(v) => setConfig((c) => ({ ...c, modelName: v }))}
            placeholder="deepseek-v4-pro"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </YStack>

        {saveStatus !== SaveStatus.IDLE ? (
          <SizableText
            color={saveStatus === SaveStatus.SUCCESS ? '$green10' : '$red10'}
            textAlign="center"
          >
            {saveStatus === SaveStatus.SUCCESS
              ? t('aiConfig.saveSuccess')
              : t('aiConfig.saveFailed')}
          </SizableText>
        ) : null}

        <Button
          backgroundColor={ACCENT_COLOR}
          onPress={handleSave}
          disabled={saving}
          hoverStyle={{ backgroundColor: ACCENT_COLOR }}
          pressStyle={{ backgroundColor: ACCENT_COLOR_PRESSED }}
          disabledStyle={{ opacity: 0.6, backgroundColor: ACCENT_COLOR }}
          marginTop="$2"
        >
          {saving ? (
            <Spinner color="white" />
          ) : (
            <SizableText color="white">
              {t('aiConfig.saveSettings')}
            </SizableText>
          )}
        </Button>
      </SafePageView>
    </>
  )
}
