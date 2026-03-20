import { FlatList, Pressable } from 'react-native'
import { SizableText, XStack, YStack } from 'tamagui'
import { useLocale } from '../context/LocaleContext'
import { CARD_COLORS } from '../constants'

import type { Schedule } from '../types'

type ScheduleListProps = {
  schedules: Schedule[]
  emptyMessage?: string
  onPress?(schedule: Schedule): void
}

function getCardColor(index: number): string {
  return CARD_COLORS[index % CARD_COLORS.length]
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

export function ScheduleList({ schedules, emptyMessage, onPress }: ScheduleListProps) {
  const { t, locale } = useLocale()

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
      renderItem={({ item: schedule, index }) => (
        <Pressable onPress={() => onPress?.(schedule)}>
          <XStack
            backgroundColor={getCardColor(index)}
            borderRadius={16}
            paddingHorizontal="$4"
            paddingVertical="$3"
            marginBottom="$2.5"
            alignItems="center"
          >
            <SizableText
              size="$5"
              fontWeight="bold"
              flex={1}
              numberOfLines={1}
            >
              {schedule.title}
            </SizableText>
            <YStack alignItems="flex-end" marginLeft="$3" flexShrink={0}>
              <SizableText size="$2" color="$placeholderColor">
                {formatDate(schedule.startAt, intlLocale)}
              </SizableText>
              <SizableText size="$2" color="$placeholderColor">
                {formatTime(schedule.startAt, intlLocale)}
              </SizableText>
            </YStack>
          </XStack>
        </Pressable>
      )}
    />
  )
}
