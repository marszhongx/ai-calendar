import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { ScrollView } from 'react-native'
import { YStack } from 'tamagui'
import { EmptyState } from '@/components/empty-state'

import { ScheduleDraftForm } from '@/components/schedule-draft-form'
import { SkeletonCard } from '@/components/skeleton-card'
import { PAGE_BACKGROUND } from '@/constants'
import { useLocale } from '@/context/LocaleContext'
import {
  listSchedules as apiListSchedules,
  updateSchedule as apiUpdateSchedule,
} from '@/services'
import type { ScheduleDraft } from '@/types'
import { draftToPayload, scheduleToDraft } from '@/utils/schedule-normalizer'
import { validateDraft } from '@/utils/schedule-validation'

export default function ScheduleDetailScreen() {
  const { t } = useLocale()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [draft, setDraft] = useState<ScheduleDraft | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    apiListSchedules()
      .then((schedules) => {
        if (cancelled) return
        const found = schedules.find((s) => s.id === id)
        if (!found) {
          setNotFound(true)
        } else {
          setDraft(scheduleToDraft(found))
        }
      })
      .catch(() => {
        if (!cancelled) setErrors([t('messages.dataLoadFailed')])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id, t])

  const handleSubmit = useCallback(async () => {
    if (!draft) return

    const result = validateDraft(draft)
    setErrors(result.errors.map((key) => t(key)))
    if (!result.valid) return

    setSubmitting(true)
    try {
      const { originalMessage, ...payload } = draftToPayload(draft)
      await apiUpdateSchedule(id, payload)
      router.back()
    } catch {
      setErrors([t('messages.saveFailed')])
    } finally {
      setSubmitting(false)
    }
  }, [draft, id, router, t])

  if (loading) {
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
          <EmptyState
            icon="🔍"
            iconBg="#F3F4F6"
            title={t('schedule.notFound')}
          />
        </YStack>
      </>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: draft?.title ?? t('schedule.title') }} />
      <ScrollView>
        <YStack
          flex={1}
          backgroundColor={PAGE_BACKGROUND}
          padding="$4"
          gap="$3"
        >
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
