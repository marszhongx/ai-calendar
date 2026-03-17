import { ScrollView } from 'react-native'
import { Card, SizableText, YStack } from 'tamagui'
import { useLocale } from '../context/LocaleContext'

import type { Schedule } from '../types'

type ScheduleListProps = {
  schedules: Schedule[]
}

export function ScheduleList({ schedules }: ScheduleListProps) {
  const { t } = useLocale()

  if (schedules.length === 0) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
        <SizableText color="$placeholderColor">{t('schedule.emptyList')}</SizableText>
      </YStack>
    )
  }

  return (
    <ScrollView>
      <YStack gap="$3">
        {schedules.map((schedule) => (
          <Card key={schedule.id} bordered padding="$4" borderRadius="$4">
            <YStack gap="$2">
              <SizableText size="$5" fontWeight="bold">
                {schedule.title}
              </SizableText>
              <SizableText size="$3" color="$placeholderColor">
                {schedule.endAt
                  ? `${schedule.startAt} - ${schedule.endAt}`
                  : schedule.startAt}
              </SizableText>
              {schedule.notes ? (
                <SizableText testID={`schedule-notes-${schedule.id}`} size="$3">
                  {schedule.notes}
                </SizableText>
              ) : null}
            </YStack>
          </Card>
        ))}
      </YStack>
    </ScrollView>
  )
}
