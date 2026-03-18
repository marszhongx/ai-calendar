import { useState } from 'react'
import { ScrollView } from 'react-native'
import { Button, SizableText, Spinner, YStack } from 'tamagui'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocale } from '../src/context/LocaleContext'

import { ScheduleDraftForm } from '../src/components/schedule-draft-form'
import { createScheduleRepository } from '../src/features/schedule/repository'
import { createReminderScheduler } from '../src/features/schedule/reminders'
import { validateDraft } from '../src/features/schedule/validation'
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

export default function DraftScreen({ initialDraft = fallbackDraft, onCreate }: DraftScreenProps) {
  const { t } = useLocale()
  const [draft, setDraft] = useState(initialDraft)
  const [errors, setErrors] = useState<string[]>([])
  const [createdSchedule, setCreatedSchedule] = useState<Schedule | null>(null)
  const [submitting, setSubmitting] = useState(false)

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
    } catch {
      setErrors([t('messages.saveFailed')])
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView>
        <YStack flex={1} backgroundColor="$background" padding="$4" gap="$3">
          <SizableText size="$6" fontWeight="bold">
            {t('schedule.saveDraft')}
          </SizableText>
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
