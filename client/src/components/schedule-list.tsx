import { FlatList, Pressable, View } from 'react-native'
import { useState, useEffect } from 'react'
import { SizableText, XStack, YStack } from 'tamagui'
import { useLocale } from '../context/LocaleContext'
import { CARD_COLORS, CARD_PROGRESS_COLORS } from '../constants'

import type { Schedule } from '../types'

type ScheduleListProps = {
  schedules: Schedule[]
  emptyMessage?: string
  onPress?(schedule: Schedule): void
}

function getCardColor(index: number): string {
  return CARD_COLORS[index % CARD_COLORS.length]
}

function getProgressColor(index: number): string {
  return CARD_PROGRESS_COLORS[index % CARD_PROGRESS_COLORS.length]
}

function formatDate(isoString: string, locale?: string) {
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return isoString
    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
    }).format(date)
  } catch {
    return isoString
  }
}

function formatTime(isoString: string, locale?: string) {
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return ''
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return ''
  }
}

function getTimeProgress(startAt: string): number {
  const now = new Date()
  const scheduleDate = new Date(startAt)
  if (isNaN(scheduleDate.getTime())) return 0

  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const scheduleMinutes = scheduleDate.getHours() * 60 + scheduleDate.getMinutes()

  if (scheduleMinutes === 0) return 1
  if (nowMinutes >= scheduleMinutes) return 1

  return nowMinutes / scheduleMinutes
}

export function ScheduleList({ schedules, emptyMessage, onPress }: ScheduleListProps) {
  const { t, locale } = useLocale()
  const [, setTick] = useState(0)

  // Update progress every minute
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000)
    return () => clearInterval(interval)
  }, [])

  const intlLocale = locale === 'zh' ? 'zh-CN' : locale === 'zh-TW' ? 'zh-TW' : 'en-US'

  if (schedules.length === 0) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
        <SizableText color="$placeholderColor">{emptyMessage ?? t('schedule.emptyList')}</SizableText>
      </YStack>
    )
  }

  return (
    <FlatList
      data={schedules}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      renderItem={({ item: schedule, index }) => {
        const progress = getTimeProgress(schedule.startAt)
        return (
          <Pressable onPress={() => onPress?.(schedule)}>
            <XStack
              backgroundColor={getCardColor(index)}
              borderRadius={16}
              paddingHorizontal="$4"
              paddingVertical="$3"
              marginBottom="$2.5"
              alignItems="center"
              overflow="hidden"
              position="relative"
            >
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${Math.round(progress * 100)}%`,
                  backgroundColor: getProgressColor(index),
                  borderTopLeftRadius: 16,
                  borderBottomLeftRadius: 16,
                  borderTopRightRadius: progress >= 1 ? 16 : 8,
                  borderBottomRightRadius: progress >= 1 ? 16 : 8,
                }}
              />
              <SizableText
                size="$5"
                fontWeight="bold"
                flex={1}
                numberOfLines={1}
                zIndex={1}
              >
                {schedule.title}
              </SizableText>
              <YStack alignItems="flex-end" marginLeft="$3" flexShrink={0} zIndex={1}>
                <SizableText size="$2" color="$placeholderColor">
                  {formatDate(schedule.startAt, intlLocale)}
                </SizableText>
                <SizableText size="$2" color="$placeholderColor">
                  {formatTime(schedule.startAt, intlLocale)}
                </SizableText>
              </YStack>
            </XStack>
          </Pressable>
        )
      }}
    />
  )
}
