import AsyncStorage from '@react-native-async-storage/async-storage'
import { Stack, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { SafePageView } from '@/components/safe-page-view'
import { ScheduleDraftForm } from '@/components/schedule-draft-form'
import { SkeletonCard } from '@/components/skeleton-card'
import { Recurrence, StorageKey } from '@/constants'
import { useLocale } from '@/context/LocaleContext'
import { parseMessage } from '@/services/ai'
import { createSchedule } from '@/services/schedule'
import type {
  ParsedSchedulePayload,
  Schedule,
  ScheduleDraft,
} from '@/types/schedule'
import { draftToPayload, normalizeDraft } from '@/utils/schedule-normalizer'
import { validateDraft } from '@/utils/schedule-validation'

const fallbackDraft: ScheduleDraft = {
  title: '',
  startAt: new Date().toISOString(),
  reminderMinutesBefore: 30,
  recurrence: Recurrence.NONE,
  notes: '',
  originalMessage: '',
}

type DraftScreenProps = {
  initialDraft?: ScheduleDraft
  submitLabel?: string
  onCreate?(draft: ScheduleDraft): Promise<Schedule>
}

function getParseErrorMessage(error: unknown, t: (key: string) => string) {
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
    AsyncStorage.getItem(StorageKey.PENDING_DRAFT)
      .then((raw) => {
        if (cancelled) return
        if (raw) {
          setDraft(JSON.parse(raw))
          AsyncStorage.removeItem(StorageKey.PENDING_DRAFT)
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

    try {
      const data = (await parseMessage(
        draft.originalMessage,
      )) as ParsedSchedulePayload
      setDraft(normalizeDraft(data, draft.originalMessage))
      setErrors([])
    } catch (err) {
      setErrors([getParseErrorMessage(err, t)])
    }
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
        <SafePageView>
          <SkeletonCard count={5} />
        </SafePageView>
      </>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: t('schedule.saveDraft') }} />
      <SafePageView scroll gap="$3">
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
