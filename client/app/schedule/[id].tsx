import { useCallback, useEffect, useState } from 'react'
import { ScrollView } from 'react-native'
import { YStack } from 'tamagui'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useLocale } from '@/context/LocaleContext'

import { ScheduleDraftForm } from '@/components/schedule-draft-form'
import { SkeletonCard } from '@/components/skeleton-card'
import { EmptyState } from '@/components/empty-state'
import { listSchedules as apiListSchedules, updateSchedule as apiUpdateSchedule } from '@/services'
import { validateDraft } from '@/utils/schedule-validation'
import { PAGE_BACKGROUND } from '@/constants'
import { useDeviceId } from '@/hooks/useDeviceId'
import type { Schedule, ScheduleDraft } from '@/types'

function scheduleToDraft(schedule: Schedule): ScheduleDraft {
  return {
    title: schedule.title,
    startAt: schedule.startAt,
    endAt: schedule.endAt,
    timezone: schedule.timezone,
    reminderMinutesBefore: schedule.reminderMinutesBefore,
    recurrence: schedule.recurrence,
    notes: schedule.notes,
    confidence: 1,
    missingFields: [],
  }
}

export default function ScheduleDetailScreen() {
  const { t } = useLocale()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { deviceId, loading: deviceLoading } = useDeviceId()
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [draft, setDraft] = useState<ScheduleDraft | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!deviceId) return

    apiListSchedules(deviceId).then((schedules) => {
      const found = (schedules as Schedule[]).find((s) => s.id === id)
      if (!found) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setSchedule(found)
      setDraft(scheduleToDraft(found))
      setLoading(false)
    })
  }, [id, deviceId])

  const handleSubmit = useCallback(async () => {
    if (!draft || !schedule) return

    const result = validateDraft(draft)
    setErrors(result.errors)
    if (!result.valid) return

    setSubmitting(true)
    try {
      await apiUpdateSchedule(schedule.id, {
        title: draft.title,
        startAt: draft.startAt,
        endAt: draft.endAt,
        timezone: draft.timezone,
        reminderMinutesBefore: draft.reminderMinutesBefore,
        recurrence: draft.recurrence,
        notes: draft.notes,
      })
      router.back()
    } catch {
      setErrors([t('messages.saveFailed')])
    } finally {
      setSubmitting(false)
    }
  }, [draft, schedule, router, t])

  if (loading || deviceLoading) {
    return (
      <>
        <Stack.Screen options={{ title: t('schedule.title') }} />
        <YStack flex={1} backgroundColor={PAGE_BACKGROUND} padding="$4">
          <SkeletonCard count={5} />
        </YStack>
      </>
    )
  }

  if (notFound) {
    return (
      <>
        <Stack.Screen options={{ title: t('schedule.title') }} />
        <YStack flex={1} backgroundColor={PAGE_BACKGROUND}>
          <EmptyState icon="🔍" iconBg="#F3F4F6" title={t('schedule.notFound')} />
        </YStack>
      </>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: draft?.title ?? t('schedule.title') }} />
      <ScrollView>
        <YStack flex={1} backgroundColor={PAGE_BACKGROUND} padding="$4" gap="$3">
          {draft ? (
            <ScheduleDraftForm
              draft={draft}
              errors={errors}
              onChange={setDraft}
              onSubmit={handleSubmit}
              disabled={submitting}
              submitLabel={t('common.save')}
            />
          ) : null}
        </YStack>
      </ScrollView>
    </>
  )
}
