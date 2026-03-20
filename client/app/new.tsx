import { useState } from 'react'
import { YStack } from 'tamagui'
import { Stack, useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useLocale } from '@/context/LocaleContext'

import { MessageInputForm } from '@/components/message-input-form'
import { normalizeDraft } from '@/utils/schedule-normalizer'
import { parseMessage } from '@/services'
import { PENDING_DRAFT_KEY } from '@/constants'
import type { ScheduleDraft, ParsedSchedulePayload } from '@/types'

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
  const deviceId = await AsyncStorage.getItem('deviceId');
  if (!deviceId) throw new Error('service_unavailable');

  const data = await parseMessage(message, deviceId) as ParsedSchedulePayload;
  return normalizeDraft(data);
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
