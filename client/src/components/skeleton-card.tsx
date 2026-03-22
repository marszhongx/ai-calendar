import { useEffect, useRef } from 'react'
import { Animated } from 'react-native'
import { YStack } from 'tamagui'

type SkeletonCardProps = {
  count?: number
}

function SkeletonLine({ width, height, delay }: { width: string; height: number; delay: number }) {
  const opacity = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 750,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    )
    animation.start()
    return () => animation.stop()
  }, [opacity, delay])

  return (
    <Animated.View
      style={{
        width,
        height,
        borderRadius: 4,
        backgroundColor: '#E5E7EB',
        opacity,
      }}
    />
  )
}

export function SkeletonCard({ count = 3 }: SkeletonCardProps) {
  return (
    <YStack gap="$2.5">
      {Array.from({ length: count }, (_, i) => (
        <YStack
          key={i}
          backgroundColor="#F3F4F6"
          borderRadius={16}
          paddingHorizontal="$4"
          paddingVertical="$3"
          gap="$2"
        >
          <SkeletonLine width="60%" height={16} delay={i * 200} />
          <SkeletonLine width="40%" height={12} delay={i * 200 + 100} />
        </YStack>
      ))}
    </YStack>
  )
}
