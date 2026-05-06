import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { Input, SizableText, TextArea, XStack, YStack } from 'tamagui'
import { LABEL_COLOR, Recurrence } from '../constants'
import { useLocale } from '../context/LocaleContext'
import type { ScheduleDraft } from '../types/schedule'
import { AccentButton } from './accent-button'
import { DateTimePickerField } from './date-time-picker'
import { ErrorBanner } from './error-banner'
import { PillButton } from './pill-button'

type ScheduleDraftFormProps = {
  draft: ScheduleDraft
  errors: string[]
  disabled?: boolean
  submitLabel?: string
  onChange(draft: ScheduleDraft): void
  onSubmit(): void
  onReparse?(): Promise<void>
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
  onReparse,
}: ScheduleDraftFormProps) {
  const { t, locale } = useLocale()
  const [reparsing, setReparsing] = useState(false)

  async function handleReparse() {
    if (!onReparse) return
    setReparsing(true)
    try {
      await onReparse()
    } finally {
      setReparsing(false)
    }
  }

  function handleAddEndTime() {
    onChange({
      ...draft,
      endAt: dayjs(draft.startAt).add(1, 'hour').toISOString(),
    })
  }

  function handleRemoveEndTime() {
    onChange({ ...draft, endAt: undefined })
  }

  const recurrenceLabels = useMemo<Record<string, string>>(
    () => ({
      NONE: t('schedule.never'),
      DAILY: t('schedule.daily'),
      WEEKLY: t('schedule.weekly'),
      MONTHLY: t('schedule.monthly'),
    }),
    [t],
  )

  return (
    <YStack gap="$3">
      {/* Original Message */}
      {draft.originalMessage ? (
        <FormSection>
          <XStack justifyContent="space-between" alignItems="center">
            <SizableText size="$3" color={LABEL_COLOR} fontWeight="500">
              {t('schedule.originalMessage')}
            </SizableText>
            {onReparse ? (
              <PillButton
                selected={false}
                onPress={handleReparse}
                disabled={disabled || reparsing}
              >
                {reparsing ? t('schedule.reParsing') : t('schedule.reParse')}
              </PillButton>
            ) : null}
          </XStack>
          <SizableText size="$3" color="$color11">
            {draft.originalMessage}
          </SizableText>
        </FormSection>
      ) : null}

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
        <SizableText
          size="$3"
          color={LABEL_COLOR}
          fontWeight="500"
          marginTop="$2"
        >
          {t('schedule.endTime')}
        </SizableText>
        {draft.endAt ? (
          <YStack gap="$2">
            <DateTimePickerField
              value={draft.endAt}
              onChange={(endAt) =>
                onChange({ ...draft, endAt: endAt || undefined })
              }
              disabled={disabled}
              locale={locale}
            />
            <PillButton
              selected={false}
              onPress={handleRemoveEndTime}
              disabled={disabled}
            >
              {t('schedule.removeEndTime')}
            </PillButton>
          </YStack>
        ) : (
          <XStack alignItems="center" justifyContent="space-between" gap="$3">
            <SizableText size="$3" color="$placeholderColor" flex={1}>
              {t('schedule.noEndTime')}
            </SizableText>
            <PillButton
              selected={false}
              onPress={handleAddEndTime}
              disabled={disabled}
            >
              {t('schedule.addEndTime')}
            </PillButton>
          </XStack>
        )}
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
            onChangeText={(value) => {
              const num = Number(value)
              onChange({
                ...draft,
                reminderMinutesBefore: Number.isNaN(num)
                  ? 0
                  : Math.max(0, Math.min(1440, Math.trunc(num))),
              })
            }}
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
          maxHeight={200}
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
        <ErrorBanner key={error} message={error} />
      ))}
    </YStack>
  )
}
