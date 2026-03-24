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
      <TextArea
        aria-label={t('schedule.aiInputPlaceholder')}
        value={message}
        onChangeText={setMessage}
        size="$4"
        backgroundColor="white"
        borderWidth={0}
        borderRadius={16}
        minHeight={120}
        maxHeight={240}
        placeholder={t('schedule.aiInputPlaceholder')}
        focusStyle={{ borderWidth: 0 }}
      />
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
