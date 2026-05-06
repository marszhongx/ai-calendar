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
  const [validationError, setValidationError] = useState('')

  async function handleSubmit() {
    const trimmedMessage = message.trim()
    if (!trimmedMessage) {
      setValidationError(t('validation.messageRequired'))
      return
    }

    setValidationError('')
    setSubmitting(true)

    try {
      await onSubmit(trimmedMessage)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <YStack gap="$3">
      <TextArea
        aria-label={t('schedule.aiInputPlaceholder')}
        value={message}
        onChangeText={(value) => {
          setMessage(value)
          if (validationError && value.trim()) setValidationError('')
        }}
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
      {validationError ? <ErrorBanner message={validationError} /> : null}
      {error ? <ErrorBanner message={error} /> : null}
    </YStack>
  )
}
