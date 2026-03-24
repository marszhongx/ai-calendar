import type { ReactNode } from 'react'
import { ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { YStackProps } from 'tamagui'
import { YStack } from 'tamagui'
import { PAGE_BACKGROUND } from '@/constants'

type SafePageViewProps = {
  children: ReactNode
  scroll?: boolean
  gap?: YStackProps['gap']
}

export function SafePageView({
  children,
  scroll = false,
  gap,
}: SafePageViewProps) {
  const insets = useSafeAreaInsets()
  const paddingBottom = insets.bottom + 16

  if (scroll) {
    return (
      <ScrollView contentContainerStyle={{ paddingBottom }}>
        <YStack
          flex={1}
          backgroundColor={PAGE_BACKGROUND}
          padding="$4"
          gap={gap}
        >
          {children}
        </YStack>
      </ScrollView>
    )
  }

  return (
    <YStack
      flex={1}
      backgroundColor={PAGE_BACKGROUND}
      padding="$4"
      paddingBottom={paddingBottom}
      gap={gap}
    >
      {children}
    </YStack>
  )
}
