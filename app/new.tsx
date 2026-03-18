import { useState } from 'react'
import { YStack } from 'tamagui'
import { Stack, useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useLocale } from '../src/context/LocaleContext'

import { MessageInputForm } from '../src/components/message-input-form'
import { normalizeDraft } from '../src/features/schedule/normalizer'
import { parseMessageWithAI } from '../src/features/schedule/parse-message'
import { ConfigManager } from '../src/config/ai-config'
import { PENDING_DRAFT_KEY } from '../src/constants'
import type { ScheduleDraft } from '../src/types'

type NewScheduleScreenProps = {
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

export default function NewScheduleScreen({ onSubmit = defaultSubmit }: NewScheduleScreenProps) {
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
    <>
      <Stack.Screen options={{ title: t('schedule.newSchedule') }} />
      <YStack flex={1} backgroundColor="$background" padding="$4">
        <MessageInputForm onSubmit={handleSubmit} error={error} />
      </YStack>
    </>
  )
}
