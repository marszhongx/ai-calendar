import { useState } from 'react'
import { Button, YStack } from 'tamagui'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
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

export const PENDING_DRAFT_KEY = 'pending-draft'

export default function IndexScreen({ onSubmit = defaultSubmit }: IndexScreenProps) {
  const { t } = useLocale()
  const router = useRouter()
  const [error, setError] = useState('')

  async function handleSubmit(message: string) {
    setError('')

    try {
      const draft = await onSubmit(message)
      await AsyncStorage.setItem(PENDING_DRAFT_KEY, JSON.stringify(draft))
      router.push('/draft')
    } catch (err) {
      setError(getErrorMessage(err, t))
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YStack flex={1} backgroundColor="$background" padding="$4">
        <MessageInputForm onSubmit={handleSubmit} error={error} />
        <Button marginTop="$4" variant="outlined" onPress={() => router.push('/schedules')}>
          {t('schedule.scheduleList')}
        </Button>
      </YStack>
    </SafeAreaView>
  )
}
