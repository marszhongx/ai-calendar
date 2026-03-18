import { useCallback, useState } from 'react'
import { Alert } from 'react-native'
import { Button, SizableText, Spinner, YStack } from 'tamagui'
import { Stack, useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { useLocale } from '../src/context/LocaleContext'

import { ScheduleList } from '../src/components/schedule-list'
import { createScheduleRepository } from '../src/features/schedule/repository'
import { createReminderScheduler } from '../src/features/schedule/reminders'
import type { Schedule } from '../src/types'

type IndexScreenProps = {
  schedules?: Schedule[]
}

export default function IndexScreen({ schedules }: IndexScreenProps) {
  const { t } = useLocale()
  const router = useRouter()
  const [items, setItems] = useState<Schedule[]>(schedules ?? [])
  const [loading, setLoading] = useState(!schedules)
  const [error, setError] = useState('')

  useFocusEffect(
    useCallback(() => {
      if (schedules) return

      let cancelled = false
      setLoading(true)
      createScheduleRepository()
        .listSchedules()
        .then((data) => {
          if (!cancelled) {
            setItems(data)
            setError('')
          }
        })
        .catch(() => {
          if (!cancelled) setError(t('messages.dataLoadFailed'))
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })

      return () => { cancelled = true }
    }, [schedules, t])
  )

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
    <>
      <Stack.Screen
        options={{
          title: t('schedule.scheduleList'),
          headerRight: () => (
            <Button size="$3" chromeless onPress={() => router.push('/config')}>
              <SizableText>⚙</SizableText>
            </Button>
          ),
        }}
      />
      <YStack flex={1} backgroundColor="$background" padding="$4">
        {loading ? (
          <YStack flex={1} justifyContent="center" alignItems="center">
            <Spinner size="large" />
          </YStack>
        ) : error ? (
          <SizableText color="$red10">{error}</SizableText>
        ) : (
          <ScheduleList schedules={items} onDelete={handleDelete} />
        )}
      </YStack>
      <Button
        size="$6"
        circular
        theme="active"
        position="absolute"
        bottom={24}
        right={24}
        elevation="$4"
        onPress={() => router.push('/new')}
      >
        +
      </Button>
    </>
  )
}
