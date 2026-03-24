import { Stack } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { Button, Input, Label, SizableText, Spinner, YStack } from 'tamagui'
import { type AiConfig, getAiConfig, setAiConfig } from '@/config/ai-config'
import {
  ACCENT_COLOR,
  ACCENT_COLOR_PRESSED,
  PAGE_BACKGROUND,
} from '@/constants'
import { useLocale } from '@/context/LocaleContext'

export default function ConfigScreen() {
  const { t } = useLocale()
  const [config, setConfig] = useState<AiConfig>({
    baseUrl: '',
    apiKey: '',
    modelName: '',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    getAiConfig().then(setConfig)
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    setMessage('')
    try {
      await setAiConfig(config)
      setMessage(t('aiConfig.saveSuccess'))
    } catch {
      setMessage(t('aiConfig.saveFailed'))
    } finally {
      setSaving(false)
    }
  }, [config, t])

  return (
    <>
      <Stack.Screen options={{ title: t('aiConfig.title') }} />
      <YStack flex={1} backgroundColor={PAGE_BACKGROUND} padding="$4" gap="$3">
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
            placeholder="gpt-4o-mini"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </YStack>

        {message ? (
          <SizableText
            color={
              message === t('aiConfig.saveSuccess') ? '$green10' : '$red10'
            }
            textAlign="center"
          >
            {message}
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
      </YStack>
    </>
  )
}
