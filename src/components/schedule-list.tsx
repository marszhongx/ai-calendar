import { FlatList } from 'react-native'
import { Button, Card, SizableText, XStack, YStack } from 'tamagui'
import { useLocale } from '../context/LocaleContext'

import type { Schedule } from '../types'

type ScheduleListProps = {
  schedules: Schedule[]
  onDelete?(schedule: Schedule): void
}

function formatDateTime(isoString: string, locale?: string) {
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return isoString
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return isoString
  }
}

export function ScheduleList({ schedules, onDelete }: ScheduleListProps) {
  const { t, locale } = useLocale()

  const intlLocale = locale === 'zh' ? 'zh-CN' : locale === 'zh-TW' ? 'zh-TW' : 'en-US'

  if (schedules.length === 0) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
        <SizableText color="$placeholderColor">{t('schedule.emptyList')}</SizableText>
      </YStack>
    )
  }

  return (
    <FlatList
      data={schedules}
      keyExtractor={(item) => item.id}
      renderItem={({ item: schedule }) => (
        <Card borderWidth={1} borderColor="$borderColor" padding="$4" borderRadius="$4" marginBottom="$3">
          <YStack gap="$2">
            <XStack justifyContent="space-between" alignItems="center">
              <SizableText size="$5" fontWeight="bold" flex={1}>
                {schedule.title}
              </SizableText>
              {onDelete ? (
                <Button
                  size="$2"
                  theme="red"
                  onPress={() => onDelete(schedule)}
                >
                  {t('common.delete')}
                </Button>
              ) : null}
            </XStack>
            <SizableText size="$3" color="$placeholderColor">
              {schedule.endAt
                ? `${formatDateTime(schedule.startAt, intlLocale)} - ${formatDateTime(schedule.endAt, intlLocale)}`
                : formatDateTime(schedule.startAt, intlLocale)}
            </SizableText>
            {schedule.notes ? (
              <SizableText testID={`schedule-notes-${schedule.id}`} size="$3">
                {schedule.notes}
              </SizableText>
            ) : null}
          </YStack>
        </Card>
      )}
    />
  )
}
