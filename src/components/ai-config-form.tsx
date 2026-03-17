import { useState, useEffect } from 'react'
import { Alert } from 'react-native'
import { Button, Input, XStack, YStack } from 'tamagui'
import { useLocale } from '../context/LocaleContext'
import { ConfigManager } from '../config/ai-config'
import { FormField } from './form-field'

type AIConfigFormProps = {
  onConfigChange?: () => void
}

export function AIConfigForm({ onConfigChange }: AIConfigFormProps) {
  const { t } = useLocale()
  const configManager = ConfigManager.getInstance()
  const currentConfig = configManager.getConfig()

  const [provider, setProvider] = useState(currentConfig.aiProvider)
  const [model, setModel] = useState(currentConfig.aiModel)
  const [apiKey, setApiKey] = useState(currentConfig.aiApiKey)
  const [baseUrl, setBaseUrl] = useState(currentConfig.aiBaseUrl || '')

  useEffect(() => {
    setProvider(currentConfig.aiProvider)
    setModel(currentConfig.aiModel)
    setApiKey(currentConfig.aiApiKey)
    setBaseUrl(currentConfig.aiBaseUrl || '')
  }, [])

  const handleSave = () => {
    if (!apiKey.trim()) {
      Alert.alert(t('messages.error'), t('messages.invalidInput'))
      return
    }

    configManager.updateConfig({
      aiProvider: provider as 'google' | 'openai' | 'anthropic',
      aiModel: model,
      aiApiKey: apiKey,
      aiBaseUrl: baseUrl || undefined
    })

    Alert.alert(t('messages.success'), t('ai_config.saveSuccess'))

    if (onConfigChange) {
      onConfigChange()
    }
  }

  return (
    <YStack gap="$4" padding="$4" backgroundColor="$background" borderRadius="$4">
      <FormField label={t('ai_config.provider')}>
        <XStack gap="$2">
          {(['google', 'openai', 'anthropic'] as const).map((p) => (
            <Button
              key={p}
              flex={1}
              size="$3"
              theme={provider === p ? 'active' : undefined}
              onPress={() => setProvider(p)}
            >
              {p === 'google' ? 'Google' : p === 'openai' ? 'OpenAI' : 'Anthropic'}
            </Button>
          ))}
        </XStack>
      </FormField>

      <FormField label={t('ai_config.modelName')}>
        <Input
          value={model}
          onChangeText={setModel}
          placeholder={t('ai_config.defaultModel')}
          size="$4"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$4"
        />
      </FormField>

      <FormField label={t('ai_config.apiKey')}>
        <Input
          value={apiKey}
          onChangeText={setApiKey}
          placeholder={t('ai_config.apiKey')}
          secureTextEntry
          size="$4"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$4"
        />
      </FormField>

      <FormField label={t('ai_config.baseUrl')}>
        <Input
          value={baseUrl}
          onChangeText={setBaseUrl}
          placeholder={t('ai_config.baseUrlPlaceholder')}
          keyboardType="url"
          size="$4"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$4"
        />
      </FormField>

      <Button size="$4" theme="active" onPress={handleSave}>
        {t('ai_config.saveSettings')}
      </Button>
    </YStack>
  )
}
