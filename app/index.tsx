import { useState } from 'react'
import { SizableText, YStack } from 'tamagui'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocale } from '../src/context/LocaleContext'

import { MessageInputForm } from '../src/components/message-input-form'
import { normalizeDraft } from '../src/features/schedule/normalizer'
import { parseMessageWithAI } from '../src/features/schedule/parse-message'
import { ConfigManager } from '../src/config/ai-config'
import type { ScheduleDraft } from '../src/types'

type IndexScreenProps = {
  onSubmit?(message: string): Promise<ScheduleDraft>
}

function getErrorMessage(error: unknown, t: (key: string) => string) {
  if (error instanceof Error) {
    switch (error.message) {
      case 'service_unavailable':
        return t('messages.serverError')
      case 'empty_response':
        return t('messages.dataLoadFailed')
      case 'invalid_format':
        return t('messages.validationError')
      case 'timeout':
        return t('messages.timeoutError')
      default:
        return t('messages.error')
    }
  }

  return t('messages.error')
}

async function defaultSubmit(message: string) {
  const configManager = ConfigManager.getInstance()
  const aiConfig = configManager.getAIConfig()

  if (!aiConfig.apiKey) {
    throw new Error('service_unavailable')
  }

  const result = await parseMessageWithAI(message, aiConfig)

  if (!result.ok) {
    throw new Error(result.error)
  }

  return normalizeDraft(result.data)
}

export default function IndexScreen({ onSubmit = defaultSubmit }: IndexScreenProps) {
  const { t } = useLocale()
  const [draft, setDraft] = useState<ScheduleDraft | null>(null)
  const [error, setError] = useState('')

  async function handleSubmit(message: string) {
    setError('')

    try {
      const nextDraft = await onSubmit(message)
      setDraft(nextDraft)
    } catch (err) {
      setError(getErrorMessage(err, t))
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YStack flex={1} backgroundColor="$background" padding="$4">
        <MessageInputForm onSubmit={handleSubmit} error={error} />
        {draft ? (
          <YStack padding="$4" gap="$2">
            <SizableText color="$green10">{t('schedule.draftSaved')}</SizableText>
            <SizableText size="$5" fontWeight="bold">{draft.title}</SizableText>
          </YStack>
        ) : null}
      </YStack>
    </SafeAreaView>
  )
}
