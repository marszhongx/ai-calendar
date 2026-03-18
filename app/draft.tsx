import { useEffect, useState } from 'react'
import { ScrollView } from 'react-native'
import { Button, SizableText, Spinner, XStack, YStack } from 'tamagui'
import { SafeAreaView } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { useLocale } from '../src/context/LocaleContext'

import { ScheduleDraftForm } from '../src/components/schedule-draft-form'
import { createScheduleRepository } from '../src/features/schedule/repository'
import { createReminderScheduler } from '../src/features/schedule/reminders'
import { validateDraft } from '../src/features/schedule/validation'
import { PENDING_DRAFT_KEY } from './index'
import type { Schedule, ScheduleDraft } from '../src/types'

const fallbackDraft: ScheduleDraft = {
  title: '',
  startAt: new Date().toISOString(),
  timezone: 'Asia/Shanghai',
  reminderMinutesBefore: 30,
  recurrence: 'NONE',
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
  const [createdSchedule, setCreatedSchedule] = useState<Schedule | null>(null)
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
      const schedule = await handler(draft)
      setCreatedSchedule(schedule)
      router.replace('/schedules')
    } catch {
      setErrors([t('messages.saveFailed')])
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <YStack flex={1} justifyContent="center" alignItems="center">
          <Spinner size="large" />
        </YStack>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView>
        <YStack flex={1} backgroundColor="$background" padding="$4" gap="$3">
          <XStack justifyContent="space-between" alignItems="center">
            <SizableText size="$6" fontWeight="bold">
              {t('schedule.saveDraft')}
            </SizableText>
            <Button size="$3" variant="outlined" onPress={() => router.push('/schedules')}>
              {t('schedule.scheduleList')}
            </Button>
          </XStack>
          <ScheduleDraftForm draft={draft} errors={errors} onChange={setDraft} onSubmit={handleSubmit} disabled={submitting} />
          {submitting ? (
            <Spinner size="large" />
          ) : null}
          {createdSchedule ? (
            <SizableText color="$green10">{t('schedule.published')}</SizableText>
          ) : null}
        </YStack>
      </ScrollView>
    </SafeAreaView>
  )
}
