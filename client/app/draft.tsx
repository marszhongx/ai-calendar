import AsyncStorage from '@react-native-async-storage/async-storage'
import { Stack, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ScrollView } from 'react-native'
import { YStack } from 'tamagui'
import { ScheduleDraftForm } from '@/components/schedule-draft-form'
import { SkeletonCard } from '@/components/skeleton-card'
import { PAGE_BACKGROUND, PENDING_DRAFT_KEY, Recurrence } from '@/constants'
import { useLocale } from '@/context/LocaleContext'
import { createSchedule, parseMessage } from '@/services'
import type { ParsedSchedulePayload, Schedule, ScheduleDraft } from '@/types'
import { normalizeDraft } from '@/utils/schedule-normalizer'
import { validateDraft } from '@/utils/schedule-validation'

const fallbackDraft: ScheduleDraft = {
  title: '',
  startAt: new Date().toISOString(),
  reminderMinutesBefore: 30,
  recurrence: Recurrence.NONE,
  notes: '',
  originalMessage: '',
  confidence: 0.5,
  missingFields: [],
}

type DraftScreenProps = {
  initialDraft?: ScheduleDraft
  submitLabel?: string
  onCreate?(draft: ScheduleDraft): Promise<Schedule>
}

export default function DraftScreen({
  initialDraft,
  submitLabel,
  onCreate,
}: DraftScreenProps) {
  const { t } = useLocale()
  const router = useRouter()
  const [draft, setDraft] = useState<ScheduleDraft>(
    initialDraft ?? fallbackDraft,
  )
  const [loading, setLoading] = useState(!initialDraft)
  const [errors, setErrors] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (initialDraft) return
    AsyncStorage.getItem(PENDING_DRAFT_KEY).then((raw) => {
      if (raw) {
        setDraft(JSON.parse(raw))
        AsyncStorage.removeItem(PENDING_DRAFT_KEY)
      }
      setLoading(false)
    })
  }, [initialDraft])

  async function handleCreateSchedule(scheduleDraft: ScheduleDraft) {
    const deviceId = await AsyncStorage.getItem('deviceId')
    if (!deviceId) throw new Error('Device not registered')

    const result = await createSchedule({
      deviceId,
      title: scheduleDraft.title,
      startAt: scheduleDraft.startAt,
      endAt: scheduleDraft.endAt,
      reminderMinutesBefore: scheduleDraft.reminderMinutesBefore,
      recurrence: scheduleDraft.recurrence,
      notes: scheduleDraft.notes,
      originalMessage: scheduleDraft.originalMessage,
    })

    return result as unknown as Schedule
  }

  async function handleReparse() {
    if (!draft.originalMessage) return
    const deviceId = await AsyncStorage.getItem('deviceId')
    if (!deviceId) return

    const data = (await parseMessage(
      draft.originalMessage,
      deviceId,
    )) as ParsedSchedulePayload
    setDraft(normalizeDraft(data, draft.originalMessage))
    setErrors([])
  }

  async function handleSubmit() {
    const result = validateDraft(draft)
    setErrors(result.errors)

    if (!result.valid) {
      return
    }

    setSubmitting(true)
    try {
      const handler = onCreate ?? handleCreateSchedule
      await handler(draft)
      router.dismissAll()
    } catch {
      setErrors([t('messages.saveFailed')])
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: t('schedule.saveDraft') }} />
        <YStack flex={1} backgroundColor={PAGE_BACKGROUND} padding="$4">
          <SkeletonCard count={5} />
        </YStack>
      </>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: t('schedule.saveDraft') }} />
      <ScrollView>
        <YStack
          flex={1}
          backgroundColor={PAGE_BACKGROUND}
          padding="$4"
          gap="$3"
        >
          <ScheduleDraftForm
            draft={draft}
            errors={errors}
            onChange={setDraft}
            onSubmit={handleSubmit}
            onReparse={handleReparse}
            disabled={submitting}
            submitLabel={submitLabel}
          />
        </YStack>
      </ScrollView>
    </>
  )
}
