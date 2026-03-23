import { useState } from 'react'
import { Spinner, TextArea, YStack } from 'tamagui'
import { useLocale } from '../context/LocaleContext'
import { AccentButton } from './accent-button'
import { ErrorBanner } from './error-banner'

type MessageInputFormProps = {
  onSubmit(message: string): Promise<void>
  error?: string
}

export function MessageInputForm({ onSubmit, error }: MessageInputFormProps) {
  const { t } = useLocale()
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    setSubmitting(true)

    try {
      await onSubmit(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <YStack gap="$3">
      <YStack
        backgroundColor="white"
        borderRadius={16}
        paddingHorizontal="$4"
        paddingVertical="$3"
        elevation={2}
      >
        <TextArea
          aria-label={t('schedule.aiInputPlaceholder')}
          value={message}
          onChangeText={setMessage}
          size="$4"
          borderWidth={0}
          outlineWidth={0}
          backgroundColor="transparent"
          paddingHorizontal={0}
          minHeight={120}
          placeholder={t('schedule.aiInputPlaceholder')}
          focusStyle={{ borderWidth: 0, outlineWidth: 0 }}
          style={{ resize: 'none' }}
        />
      </YStack>
      <AccentButton
        label={t('schedule.create')}
        onPress={handleSubmit}
        disabled={submitting}
        icon={submitting ? <Spinner size="small" /> : undefined}
      />
      {error ? <ErrorBanner message={error} /> : null}
    </YStack>
  )
}
