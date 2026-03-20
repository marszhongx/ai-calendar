import { useCallback, useEffect, useState } from 'react'
import { Alert, Platform, ScrollView } from 'react-native'
import { Spinner, YStack } from 'tamagui'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useLocale } from '@/context/LocaleContext'

import { ScheduleDraftForm } from '@/components/schedule-draft-form'
import { listSchedules as apiListSchedules, updateSchedule as apiUpdateSchedule } from '@/services'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { validateDraft } from '@/utils/schedule-validation'
import { PAGE_BACKGROUND } from '@/constants'
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
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [draft, setDraft] = useState<ScheduleDraft | null>(null)
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem('deviceId').then(async (deviceId) => {
      if (!deviceId) {
        router.back()
        return
      }
      const schedules = await apiListSchedules(deviceId) as Schedule[]
      const found = schedules.find((s) => s.id === id)
      if (!found) {
        if (Platform.OS === 'web') {
          window.alert(t('messages.notFound'))
        } else {
          Alert.alert(t('messages.error'), t('messages.notFound'))
        }
        router.back()
        return
      }
      setSchedule(found)
      setDraft(scheduleToDraft(found))
      setLoading(false)
    })
  }, [id, router, t])

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

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: t('schedule.title') }} />
        <YStack flex={1} justifyContent="center" alignItems="center">
          <Spinner size="large" />
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
          {submitting ? <Spinner size="large" /> : null}
        </YStack>
      </ScrollView>
    </>
  )
}
