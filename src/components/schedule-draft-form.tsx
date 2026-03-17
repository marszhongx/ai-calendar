import { Button, Input, Label, SizableText, TextArea, XStack, YStack } from 'tamagui'
import { useLocale } from '../context/LocaleContext'

import type { ScheduleDraft } from '../types'

type ScheduleDraftFormProps = {
  draft: ScheduleDraft
  errors: string[]
  onChange(draft: ScheduleDraft): void
  onSubmit(): void
}

const RECURRENCE_OPTIONS = ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY'] as const

export function ScheduleDraftForm({ draft, errors, onChange, onSubmit }: ScheduleDraftFormProps) {
  const { t } = useLocale()

  const recurrenceLabels: Record<string, string> = {
    NONE: t('schedule.never'),
    DAILY: t('schedule.daily'),
    WEEKLY: t('schedule.weekly'),
    MONTHLY: t('schedule.monthly'),
  }

  return (
    <YStack gap="$3" padding="$4">
      <YStack gap="$2">
        <Label fontSize="$4" fontWeight="bold">{t('schedule.eventName')}</Label>
        <Input
          accessibilityLabel={t('schedule.eventName')}
          value={draft.title}
          onChangeText={(title) => onChange({ ...draft, title })}
          size="$4"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$4"
        />
      </YStack>

      <YStack gap="$2">
        <Label fontSize="$4" fontWeight="bold">{t('schedule.startTime')}</Label>
        <Input
          accessibilityLabel={t('schedule.startTime')}
          value={draft.startAt}
          onChangeText={(startAt) => onChange({ ...draft, startAt })}
          size="$4"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$4"
        />
      </YStack>

      <YStack gap="$2">
        <Label fontSize="$4" fontWeight="bold">{t('schedule.remindMe')}</Label>
        <Input
          accessibilityLabel={t('schedule.remindMe')}
          value={String(draft.reminderMinutesBefore)}
          onChangeText={(value) =>
            onChange({
              ...draft,
              reminderMinutesBefore: Number.isNaN(Number(value)) ? 0 : Number(value),
            })
          }
          size="$4"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$4"
          keyboardType="numeric"
        />
      </YStack>

      <YStack gap="$2">
        <Label fontSize="$4" fontWeight="bold">{t('schedule.repeat')}</Label>
        <XStack gap="$2" flexWrap="wrap">
          {RECURRENCE_OPTIONS.map((option) => (
            <Button
              key={option}
              size="$3"
              theme={draft.recurrence === option ? 'active' : undefined}
              onPress={() => onChange({ ...draft, recurrence: option })}
            >
              {recurrenceLabels[option]}
            </Button>
          ))}
        </XStack>
        <SizableText size="$3" color="$colorFocus">{draft.recurrence}</SizableText>
      </YStack>

      <YStack gap="$2">
        <Label fontSize="$4" fontWeight="bold">{t('schedule.description')}</Label>
        <TextArea
          accessibilityLabel={t('schedule.description')}
          value={draft.notes}
          onChangeText={(notes) => onChange({ ...draft, notes })}
          size="$4"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$4"
          minHeight={80}
        />
      </YStack>

      <Button
        size="$4"
        theme="active"
        onPress={onSubmit}
      >
        {t('schedule.create')}
      </Button>

      {errors.map((error) => (
        <SizableText key={error} color="$red10">
          {error}
        </SizableText>
      ))}
    </YStack>
  )
}
