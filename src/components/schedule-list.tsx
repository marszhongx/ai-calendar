import { FlatList, Pressable } from 'react-native'
import { SizableText, YStack } from 'tamagui'
import { CARD_COLORS, Recurrence, SECONDARY_TEXT } from '../constants'
import { useLocale } from '../context/LocaleContext'
import { formatDate, formatTime, toIntlLocale } from '../lib/date-format'
import type { Schedule } from '../types/schedule'
import { isExpired } from '../utils/schedule-expiration'

type ScheduleListProps = {
  schedules: Schedule[]
  showDate?: boolean
  onPress?(schedule: Schedule): void
}

function getCardColor(index: number): string {
  return CARD_COLORS[index % CARD_COLORS.length]
}

type PressableWebState = {
  pressed: boolean
  hovered: boolean
  focused: boolean
}

function cardStyle(state: PressableWebState) {
  return {
    cursor: 'pointer' as const,
    outlineStyle: state.focused ? 'solid' : 'none',
    outlineWidth: state.focused ? 2 : 0,
    outlineColor: '#2563EB',
    borderRadius: 16,
    transform: [{ translateY: state.hovered ? -2 : state.pressed ? 1 : 0 }],
    shadowColor: '#111827',
    shadowOpacity: state.hovered ? 0.12 : 0,
    shadowRadius: state.hovered ? 10 : 0,
    shadowOffset: { width: 0, height: state.hovered ? 6 : 0 },
  }
}

export function ScheduleList({
  schedules,
  showDate,
  onPress,
}: ScheduleListProps) {
  const { t, locale } = useLocale()
  const intlLocale = toIntlLocale(locale)

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

        const expired = isExpired(schedule)

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={schedule.title}
            onPress={() => onPress?.(schedule)}
            style={cardStyle as never}
          >
            <YStack
              backgroundColor={getCardColor(index)}
              borderRadius={16}
              paddingHorizontal="$4"
              paddingVertical="$3"
              marginBottom="$2.5"
              opacity={expired ? 0.6 : 1}
            >
              <SizableText
                size="$4"
                fontWeight="600"
                numberOfLines={1}
                color={expired ? '$gray8' : undefined}
                textDecorationLine={expired ? 'line-through' : 'none'}
              >
                {schedule.title}
              </SizableText>
              <SizableText
                size="$2"
                color={expired ? '$gray7' : SECONDARY_TEXT}
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
