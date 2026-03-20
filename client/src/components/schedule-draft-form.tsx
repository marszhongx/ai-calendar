import { Button, Input, SizableText, TextArea, XStack, YStack } from 'tamagui'
import { useLocale } from '../context/LocaleContext'
import { ACCENT_COLOR, ACCENT_COLOR_PRESSED, Recurrence } from '../constants'
import { DateTimePickerField } from './date-time-picker'

import type { ScheduleDraft } from '../types'

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

export function ScheduleDraftForm({ draft, errors, disabled, submitLabel, onChange, onSubmit }: ScheduleDraftFormProps) {
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
        <SizableText size="$3" color={ACCENT_COLOR} fontWeight="600">
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
        <SizableText size="$3" color={ACCENT_COLOR} fontWeight="600">
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
        <SizableText size="$3" color={ACCENT_COLOR} fontWeight="600">
          {t('schedule.repeat')}
        </SizableText>
        <XStack gap="$2" flexWrap="wrap">
          {RECURRENCE_OPTIONS.map((option) => {
            const selected = draft.recurrence === option
            return (
              <Button
                key={option}
                size="$3"
                borderRadius={20}
                backgroundColor={selected ? ACCENT_COLOR : 'transparent'}
                borderWidth={1}
                borderColor={selected ? ACCENT_COLOR : '$borderColor'}
                hoverStyle={{ backgroundColor: selected ? ACCENT_COLOR : '$backgroundHover' }}
                pressStyle={{ backgroundColor: selected ? ACCENT_COLOR_PRESSED : '$backgroundPress' }}
                onPress={() => onChange({ ...draft, recurrence: option })}
                disabled={disabled}
              >
                <SizableText size="$3" color={selected ? 'white' : '$color'}>
                  {recurrenceLabels[option]}
                </SizableText>
              </Button>
            )
          })}
        </XStack>
      </FormSection>

      {/* Reminder */}
      <FormSection>
        <SizableText size="$3" color={ACCENT_COLOR} fontWeight="600">
          {t('schedule.remindMe')}
        </SizableText>
        <XStack alignItems="center" gap="$3">
          <Input
            aria-label={t('schedule.remindMe')}
            value={String(draft.reminderMinutesBefore)}
            onChangeText={(value) =>
              onChange({
                ...draft,
                reminderMinutesBefore: Number.isNaN(Number(value)) ? 0 : Number(value),
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
            min
          </SizableText>
        </XStack>
      </FormSection>

      {/* Notes */}
      <FormSection>
        <SizableText size="$3" color={ACCENT_COLOR} fontWeight="600">
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
      <Button
        size="$5"
        backgroundColor={ACCENT_COLOR}
        borderRadius={16}
        onPress={onSubmit}
        disabled={disabled}
        hoverStyle={{ backgroundColor: ACCENT_COLOR }}
        pressStyle={{ backgroundColor: ACCENT_COLOR_PRESSED }}
        disabledStyle={{ opacity: 0.5 }}
      >
        <SizableText color="white" fontWeight="bold" size="$4">
          {submitLabel ?? t('schedule.create')}
        </SizableText>
      </Button>

      {errors.map((error) => (
        <SizableText key={error} color="$red10" textAlign="center">
          {error}
        </SizableText>
      ))}
    </YStack>
  )
}
