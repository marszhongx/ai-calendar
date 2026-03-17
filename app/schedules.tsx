import { useEffect, useState } from 'react'
import { SizableText, YStack } from 'tamagui'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocale } from '../src/context/LocaleContext'

import { ScheduleList } from '../src/components/schedule-list'
import { createScheduleRepository } from '../src/features/schedule/repository'
import type { Schedule } from '../src/types'

type SchedulesScreenProps = {
  schedules?: Schedule[]
}

export default function SchedulesScreen({ schedules }: SchedulesScreenProps) {
  const { t } = useLocale()
  const [items, setItems] = useState<Schedule[]>(schedules ?? [])

  useEffect(() => {
    if (schedules) {
      setItems(schedules)
      return
    }

    createScheduleRepository()
      .listSchedules()
      .then(setItems)
  }, [schedules])

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YStack flex={1} backgroundColor="$background" padding="$4">
        <SizableText size="$8" fontWeight="bold" marginBottom="$4">
          {t('schedule.scheduleList')}
        </SizableText>
        <ScheduleList schedules={items} />
      </YStack>
    </SafeAreaView>
  )
}
