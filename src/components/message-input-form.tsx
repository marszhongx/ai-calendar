import { useState } from 'react'
import { Button, SizableText, Spinner, TextArea, YStack } from 'tamagui'
import { useLocale } from '../context/LocaleContext'

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
    <YStack gap="$3" padding="$4">
      <SizableText size="$5" fontWeight="bold">
        {t('schedule.description')}
      </SizableText>
      <TextArea
        accessibilityLabel={t('schedule.description')}
        value={message}
        onChangeText={setMessage}
        size="$4"
        borderWidth={1}
        borderColor="$borderColor"
        borderRadius="$4"
        minHeight={120}
        placeholder={t('schedule.description')}
      />
      <Button
        size="$4"
        theme="active"
        onPress={handleSubmit}
        disabled={submitting}
        icon={submitting ? <Spinner size="small" /> : undefined}
      >
        {t('schedule.create')}
      </Button>
      {error ? (
        <SizableText color="$red10">
          {error}
        </SizableText>
      ) : null}
    </YStack>
  )
}
