import { useState } from 'react'
import { Button, SizableText, Spinner, TextArea, YStack } from 'tamagui'
import { useLocale } from '../context/LocaleContext'
import { ACCENT_COLOR, ACCENT_COLOR_PRESSED } from '../constants'

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
      >
        <TextArea
          aria-label={t('schedule.aiInputPlaceholder')}
          value={message}
          onChangeText={setMessage}
          size="$4"
          borderWidth={0}
          backgroundColor="transparent"
          paddingHorizontal={0}
          minHeight={120}
          placeholder={t('schedule.aiInputPlaceholder')}
        />
      </YStack>
      <Button
        size="$5"
        backgroundColor={ACCENT_COLOR}
        borderRadius={16}
        onPress={handleSubmit}
        disabled={submitting}
        icon={submitting ? <Spinner size="small" /> : undefined}
        hoverStyle={{ backgroundColor: ACCENT_COLOR }}
        pressStyle={{ backgroundColor: ACCENT_COLOR_PRESSED }}
        disabledStyle={{ opacity: 0.5 }}
      >
        <SizableText color="white" fontWeight="bold" size="$4">
          {t('schedule.create')}
        </SizableText>
      </Button>
      {error ? (
        <SizableText color="$red10" textAlign="center">
          {error}
        </SizableText>
      ) : null}
    </YStack>
  )
}
