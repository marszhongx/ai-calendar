import AsyncStorage from '@react-native-async-storage/async-storage'
import { Stack, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { YStack } from 'tamagui'
import { ErrorBanner } from '@/components/error-banner'
import { SafePageView } from '@/components/safe-page-view'
import { ScheduleDraftForm } from '@/components/schedule-draft-form'
import { SkeletonCard } from '@/components/skeleton-card'
import { PAGE_BACKGROUND, PENDING_DRAFT_KEY, Recurrence } from '@/constants'
import { useLocale } from '@/context/LocaleContext'
import { createSchedule, parseMessage } from '@/services'
import type { ParsedSchedulePayload, Schedule, ScheduleDraft } from '@/types'
import { draftToPayload, normalizeDraft } from '@/utils/schedule-normalizer'
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
    let cancelled = false
    AsyncStorage.getItem(PENDING_DRAFT_KEY)
      .then((raw) => {
        if (cancelled) return
        if (raw) {
          setDraft(JSON.parse(raw))
          AsyncStorage.removeItem(PENDING_DRAFT_KEY)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [initialDraft])

  async function handleCreateSchedule(scheduleDraft: ScheduleDraft) {
    return createSchedule(draftToPayload(scheduleDraft))
  }

  async function handleReparse() {
    if (!draft.originalMessage) return

    const data = (await parseMessage(
      draft.originalMessage,
    )) as ParsedSchedulePayload
    setDraft(normalizeDraft(data, draft.originalMessage))
    setErrors([])
  }

  async function handleSubmit() {
    const result = validateDraft(draft)
    setErrors(result.errors.map((key) => t(key)))

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
      <SafePageView scroll gap="$3">
        {draft.confidence < 0.6 && (
          <ErrorBanner message={t('validation.lowConfidence')} />
        )}
        <ScheduleDraftForm
          draft={draft}
          errors={errors}
          onChange={setDraft}
          onSubmit={handleSubmit}
          onReparse={handleReparse}
          disabled={submitting}
          submitLabel={submitLabel}
        />
      </SafePageView>
    </>
  )
}
