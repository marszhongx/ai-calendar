import { SizableText, XStack } from 'tamagui'

const ERROR_BG = '#FEF2F2'
const ERROR_TEXT = '#DC2626'

type ErrorBannerProps = {
  message: string
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <XStack
      backgroundColor={ERROR_BG}
      borderRadius={12}
      padding="$3"
      alignItems="center"
      gap="$2"
    >
      <SizableText size="$3">⚠️</SizableText>
      <SizableText color={ERROR_TEXT} size="$3" flex={1}>
        {message}
      </SizableText>
    </XStack>
  )
}
