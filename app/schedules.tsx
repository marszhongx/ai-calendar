import { useCallback, useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { Button, SizableText, YStack } from 'tamagui'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useLocale } from '../src/context/LocaleContext'

import { ScheduleList } from '../src/components/schedule-list'
import { createScheduleRepository } from '../src/features/schedule/repository'
import { createReminderScheduler } from '../src/features/schedule/reminders'
import type { Schedule } from '../src/types'

type SchedulesScreenProps = {
  schedules?: Schedule[]
}

export default function SchedulesScreen({ schedules }: SchedulesScreenProps) {
  const { t } = useLocale()
  const router = useRouter()
  const [items, setItems] = useState<Schedule[]>(schedules ?? [])
  const [error, setError] = useState('')

  useEffect(() => {
    if (schedules) {
      setItems(schedules)
      return
    }

    createScheduleRepository()
      .listSchedules()
      .then(setItems)
      .catch(() => setError(t('messages.dataLoadFailed')))
  }, [schedules])

  const handleDelete = useCallback((schedule: Schedule) => {
    Alert.alert(
      t('schedule.delete'),
      t('schedule.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const repository = createScheduleRepository()
              const reminders = createReminderScheduler()
              if (schedule.notificationId) {
                await reminders.cancelReminder(schedule.notificationId)
              }
              await repository.deleteSchedule(schedule.id)
              setItems((prev) => prev.filter((item) => item.id !== schedule.id))
            } catch {
              Alert.alert(t('messages.error'), t('messages.deleteFailed'))
            }
          },
        },
      ],
    )
  }, [t])

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YStack flex={1} backgroundColor="$background" padding="$4">
        <SizableText size="$8" fontWeight="bold" marginBottom="$4">
          {t('schedule.scheduleList')}
        </SizableText>
        {error ? (
          <SizableText color="$red10">{error}</SizableText>
        ) : null}
        <ScheduleList schedules={items} onDelete={handleDelete} />
        <Button marginTop="$4" variant="outlined" onPress={() => router.push('/')}>
          {t('schedule.newSchedule')}
        </Button>
      </YStack>
    </SafeAreaView>
  )
}
