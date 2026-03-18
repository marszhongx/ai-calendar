import { useState } from 'react'
import { Alert } from 'react-native'
import { Button, Input, SizableText, XStack, YStack } from 'tamagui'
import { useLocale } from '../context/LocaleContext'
import { ConfigManager } from '../config/ai-config'
import { FormField } from './form-field'

type AIConfigFormProps = {
  onConfigChange?: () => void
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function AIConfigForm({ onConfigChange }: AIConfigFormProps) {
  const { t } = useLocale()
  const configManager = ConfigManager.getInstance()
  const currentConfig = configManager.getConfig()

  const [provider, setProvider] = useState(currentConfig.aiProvider)
  const [model, setModel] = useState(currentConfig.aiModel)
  const [apiKey, setApiKey] = useState(currentConfig.aiApiKey)
  const [baseUrl, setBaseUrl] = useState(currentConfig.aiBaseUrl || '')
  const [errors, setErrors] = useState<string[]>([])

  function handleSave() {
    const validationErrors: string[] = []

    if (!apiKey.trim()) {
      validationErrors.push(t('messages.invalidInput'))
    }

    if (!model.trim()) {
      validationErrors.push(t('messages.requiredField'))
    }

    if (baseUrl.trim() && !isValidUrl(baseUrl.trim())) {
      validationErrors.push(t('messages.invalidUrl'))
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors([])

    configManager.updateConfig({
      aiProvider: provider,
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

      {errors.map((error) => (
        <SizableText key={error} color="$red10">
          {error}
        </SizableText>
      ))}

      <Button size="$4" theme="active" onPress={handleSave}>
        {t('ai_config.saveSettings')}
      </Button>
    </YStack>
  )
}
