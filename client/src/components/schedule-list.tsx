import { FlatList, Pressable } from 'react-native'
import { SizableText, YStack } from 'tamagui'
import { CARD_COLORS, Recurrence, SECONDARY_TEXT } from '../constants'
import { useLocale } from '../context/LocaleContext'
import { formatDate, formatTime } from '../lib/date-format'
import type { Schedule } from '../types'

type ScheduleListProps = {
  schedules: Schedule[]
  showDate?: boolean
  onPress?(schedule: Schedule): void
}

function getCardColor(index: number): string {
  return CARD_COLORS[index % CARD_COLORS.length]
}

export function ScheduleList({
  schedules,
  showDate,
  onPress,
}: ScheduleListProps) {
  const { t, locale } = useLocale()
  const intlLocale =
    locale === 'zh' ? 'zh-CN' : locale === 'zh-TW' ? 'zh-TW' : 'en-US'

  return (
    <FlatList
      data={schedules}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      renderItem={({ item: schedule, index }) => {
        // Build meta parts
        const metaParts: string[] = []

        // Date prefix (when showDate)
        if (showDate) {
          metaParts.push(formatDate(schedule.startAt, intlLocale))
        }

        // Time range
        let timeStr = formatTime(schedule.startAt, intlLocale)
        if (schedule.endAt) {
          timeStr += ` – ${formatTime(schedule.endAt, intlLocale)}`
        }
        metaParts.push(timeStr)

        // Recurrence (when not NONE)
        if (schedule.recurrence && schedule.recurrence !== Recurrence.NONE) {
          const recurrenceKey =
            `schedule.${schedule.recurrence.toLowerCase()}` as const
          metaParts.push(t(recurrenceKey))
        }

        // Reminder (when > 0)
        if (
          schedule.reminderMinutesBefore &&
          schedule.reminderMinutesBefore > 0
        ) {
          metaParts.push(
            `🔔 ${schedule.reminderMinutesBefore}${t('schedule.minutes')}`,
          )
        }

        return (
          <Pressable onPress={() => onPress?.(schedule)}>
            <YStack
              backgroundColor={getCardColor(index)}
              borderRadius={16}
              paddingHorizontal="$4"
              paddingVertical="$3"
              marginBottom="$2.5"
            >
              <SizableText size="$4" fontWeight="600" numberOfLines={1}>
                {schedule.title}
              </SizableText>
              <SizableText
                size="$2"
                color={SECONDARY_TEXT}
                marginTop="$1"
                numberOfLines={1}
              >
                {metaParts.join(' · ')}
              </SizableText>
            </YStack>
          </Pressable>
        )
      }}
    />
  )
}
