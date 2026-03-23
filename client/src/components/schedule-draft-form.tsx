import { Input, SizableText, TextArea, XStack, YStack } from 'tamagui'
import { LABEL_COLOR, Recurrence } from '../constants'
import { useLocale } from '../context/LocaleContext'
import type { ScheduleDraft } from '../types'
import { AccentButton } from './accent-button'
import { DateTimePickerField } from './date-time-picker'
import { PillButton } from './pill-button'

type ScheduleDraftFormProps = {
  draft: ScheduleDraft
  errors: string[]
  disabled?: boolean
  submitLabel?: string
  onChange(draft: ScheduleDraft): void
  onSubmit(): void
}

const RECURRENCE_OPTIONS = Object.values(Recurrence)

function FormSection({ children }: { children: React.ReactNode }) {
  return (
    <YStack
      backgroundColor="white"
      borderRadius={16}
      paddingHorizontal="$4"
      paddingVertical="$3"
      gap="$3"
    >
      {children}
    </YStack>
  )
}

export function ScheduleDraftForm({
  draft,
  errors,
  disabled,
  submitLabel,
  onChange,
  onSubmit,
}: ScheduleDraftFormProps) {
  const { t, locale } = useLocale()

  const recurrenceLabels: Record<string, string> = {
    NONE: t('schedule.never'),
    DAILY: t('schedule.daily'),
    WEEKLY: t('schedule.weekly'),
    MONTHLY: t('schedule.monthly'),
  }

  return (
    <YStack gap="$3">
      {/* Title */}
      <FormSection>
        <SizableText size="$3" color={LABEL_COLOR} fontWeight="500">
          {t('schedule.eventName')}
        </SizableText>
        <Input
          aria-label={t('schedule.eventName')}
          placeholder={t('schedule.eventName')}
          value={draft.title}
          onChangeText={(title) => onChange({ ...draft, title })}
          size="$5"
          borderWidth={0}
          backgroundColor="transparent"
          paddingHorizontal={0}
          fontWeight="bold"
          disabled={disabled}
        />
      </FormSection>

      {/* Start / End Time */}
      <FormSection>
        <SizableText size="$3" color={LABEL_COLOR} fontWeight="500">
          {t('schedule.startTime')}
        </SizableText>
        <DateTimePickerField
          value={draft.startAt}
          onChange={(startAt) => onChange({ ...draft, startAt })}
          disabled={disabled}
          locale={locale}
        />
      </FormSection>

      {/* Recurrence */}
      <FormSection>
        <SizableText size="$3" color={LABEL_COLOR} fontWeight="500">
          {t('schedule.repeat')}
        </SizableText>
        <XStack gap="$2" flexWrap="wrap">
          {RECURRENCE_OPTIONS.map((option) => {
            const selected = draft.recurrence === option
            return (
              <PillButton
                key={option}
                selected={selected}
                onPress={() => onChange({ ...draft, recurrence: option })}
                disabled={disabled}
              >
                {recurrenceLabels[option]}
              </PillButton>
            )
          })}
        </XStack>
      </FormSection>

      {/* Reminder */}
      <FormSection>
        <SizableText size="$3" color={LABEL_COLOR} fontWeight="500">
          {t('schedule.remindMe')}
        </SizableText>
        <XStack alignItems="center" gap="$3">
          <Input
            aria-label={t('schedule.remindMe')}
            value={String(draft.reminderMinutesBefore)}
            onChangeText={(value) =>
              onChange({
                ...draft,
                reminderMinutesBefore: Number.isNaN(Number(value))
                  ? 0
                  : Number(value),
              })
            }
            size="$3"
            borderWidth={0}
            backgroundColor="$backgroundHover"
            borderRadius={12}
            keyboardType="numeric"
            disabled={disabled}
            flex={1}
            textAlign="center"
          />
          <SizableText size="$2" color="$placeholderColor" flexShrink={0}>
            {t('schedule.minutes')}
          </SizableText>
        </XStack>
      </FormSection>

      {/* Notes */}
      <FormSection>
        <SizableText size="$3" color={LABEL_COLOR} fontWeight="500">
          {t('schedule.description')}
        </SizableText>
        <TextArea
          aria-label={t('schedule.description')}
          placeholder={t('schedule.description')}
          value={draft.notes}
          onChangeText={(notes) => onChange({ ...draft, notes })}
          size="$4"
          borderWidth={0}
          backgroundColor="transparent"
          paddingHorizontal={0}
          minHeight={60}
          disabled={disabled}
        />
      </FormSection>

      {/* Submit */}
      <AccentButton
        label={submitLabel ?? t('schedule.create')}
        onPress={onSubmit}
        disabled={disabled}
      />

      {errors.map((error) => (
        <XStack
          key={error}
          backgroundColor="#FEF2F2"
          borderRadius={12}
          padding="$3"
          alignItems="center"
          gap="$2"
        >
          <SizableText size="$3">⚠️</SizableText>
          <SizableText color="#DC2626" size="$3" flex={1}>
            {error}
          </SizableText>
        </XStack>
      ))}
    </YStack>
  )
}
