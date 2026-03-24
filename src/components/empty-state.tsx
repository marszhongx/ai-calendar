import { SizableText, YStack } from 'tamagui'
import { LABEL_COLOR } from '../constants'

type EmptyStateProps = {
  icon: string
  iconBg?: string
  title: string
  subtitle?: string
}

export function EmptyState({
  icon,
  iconBg = '#F3F4F6',
  title,
  subtitle,
}: EmptyStateProps) {
  return (
    <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
      <YStack
        width={80}
        height={80}
        borderRadius={40}
        backgroundColor={iconBg}
        justifyContent="center"
        alignItems="center"
      >
        <SizableText fontSize={36}>{icon}</SizableText>
      </YStack>
      <SizableText fontWeight="600" size="$4" color="#111" marginTop="$3">
        {title}
      </SizableText>
      {subtitle ? (
        <SizableText
          size="$3"
          color={LABEL_COLOR}
          marginTop="$1"
          textAlign="center"
        >
          {subtitle}
        </SizableText>
      ) : null}
    </YStack>
  )
}
