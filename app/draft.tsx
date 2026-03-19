import { useEffect, useState } from 'react'
import { ScrollView } from 'react-native'
import { Button, Spinner, YStack } from 'tamagui'
import { Stack, useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useLocale } from '../src/context/LocaleContext'

import { ScheduleDraftForm } from '../src/components/schedule-draft-form'
import { createScheduleRepository } from '../src/features/schedule/repository'
import { createReminderScheduler } from '../src/features/schedule/reminders'
import { validateDraft } from '../src/features/schedule/validation'
import { PENDING_DRAFT_KEY, Recurrence } from '../src/constants'
import type { Schedule, ScheduleDraft } from '../src/types'

const fallbackDraft: ScheduleDraft = {
  title: '',
  startAt: new Date().toISOString(),
  timezone: 'Asia/Shanghai',
  reminderMinutesBefore: 30,
  recurrence: Recurrence.NONE,
  notes: '',
  confidence: 0.5,
  missingFields: [],
}

type DraftScreenProps = {
  initialDraft?: ScheduleDraft
  onCreate?(draft: ScheduleDraft): Promise<Schedule>
}

export default function DraftScreen({ initialDraft, onCreate }: DraftScreenProps) {
  const { t } = useLocale()
  const router = useRouter()
  const [draft, setDraft] = useState<ScheduleDraft>(initialDraft ?? fallbackDraft)
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

  async function createSchedule(scheduleDraft: ScheduleDraft) {
    const repository = createScheduleRepository()
    const reminders = createReminderScheduler()
    const now = new Date().toISOString()
    const scheduleBase: Schedule = {
      id: `schedule-${Date.now()}`,
      title: scheduleDraft.title,
      startAt: scheduleDraft.startAt,
      endAt: scheduleDraft.endAt,
      timezone: scheduleDraft.timezone,
      reminderMinutesBefore: scheduleDraft.reminderMinutesBefore,
      recurrence: scheduleDraft.recurrence,
      notes: scheduleDraft.notes,
      createdAt: now,
      updatedAt: now,
    }

    try {
      const notificationId = await reminders.scheduleReminder(scheduleBase, t)
      const schedule = { ...scheduleBase, notificationId }
      await repository.createSchedule(schedule)
      return schedule
    } catch (error) {
      console.error('Failed to create schedule:', error)
      throw error
    }
  }

  async function handleSubmit() {
    const result = validateDraft(draft)
    setErrors(result.errors)

    if (!result.valid) {
      return
    }

    setSubmitting(true)
    try {
      const handler = onCreate ?? createSchedule
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
        <YStack flex={1} justifyContent="center" alignItems="center">
          <Spinner size="large" />
        </YStack>
      </>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: t('schedule.saveDraft') }} />
      <ScrollView>
        <YStack flex={1} backgroundColor="$background" padding="$4" gap="$3">
          <ScheduleDraftForm draft={draft} errors={errors} onChange={setDraft} onSubmit={handleSubmit} disabled={submitting} />
          {submitting ? (
            <Spinner size="large" />
          ) : null}
        </YStack>
      </ScrollView>
    </>
  )
}
