import { useCallback, useState } from 'react'
import { Alert, Platform } from 'react-native'
import { Button, SizableText, Spinner, XStack, YStack } from 'tamagui'
import { Stack, useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import dayjs from 'dayjs'
import { useLocale } from '@/context/LocaleContext'
import { ScheduleTab } from '@/constants'

import { ScheduleList } from '@/components/schedule-list'
import { listSchedules as apiListSchedules, deleteSchedule as apiDeleteSchedule } from '@/services'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Schedule } from '@/types'

function occursOnDay(schedule: Schedule, target: dayjs.Dayjs): boolean {
  const start = dayjs(schedule.startAt)
  if (start.isSame(target, 'day')) return true
  if (start.isAfter(target, 'day')) return false

  switch (schedule.recurrence) {
    case 'DAILY':
      return true
    case 'WEEKLY':
      return start.day() === target.day()
    case 'MONTHLY':
      return start.date() === target.date()
    default:
      return false
  }
}

function filterSchedules(schedules: Schedule[], tab: ScheduleTab): Schedule[] {
  const sorted = [...schedules].sort((a, b) => dayjs(a.startAt).valueOf() - dayjs(b.startAt).valueOf())
  if (tab === ScheduleTab.ALL) return sorted
  const target = tab === ScheduleTab.TODAY ? dayjs() : dayjs().add(1, 'day')
  return sorted.filter((s) => occursOnDay(s, target))
}

type IndexScreenProps = {
  schedules?: Schedule[]
}

export default function IndexScreen({ schedules }: IndexScreenProps) {
  const { t } = useLocale()
  const router = useRouter()
  const [items, setItems] = useState<Schedule[]>(schedules ?? [])
  const [loading, setLoading] = useState(!schedules)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<ScheduleTab>(ScheduleTab.TODAY)

  const TAB_LABELS: { key: ScheduleTab; label: string }[] = [
    { key: ScheduleTab.TODAY, label: t('schedule.tabToday') },
    { key: ScheduleTab.TOMORROW, label: t('schedule.tabTomorrow') },
    { key: ScheduleTab.ALL, label: t('schedule.tabAll') },
  ]

  const filteredItems = filterSchedules(items, activeTab)

  const emptyMessage = activeTab === ScheduleTab.TODAY
    ? t('schedule.emptyToday')
    : activeTab === ScheduleTab.TOMORROW
      ? t('schedule.emptyTomorrow')
      : undefined

  useFocusEffect(
    useCallback(() => {
      if (schedules) return

      let cancelled = false
      setLoading(true)

      AsyncStorage.getItem('deviceId').then((deviceId) => {
        if (!deviceId || cancelled) {
          setLoading(false)
          return
        }
        return apiListSchedules(deviceId) as Promise<Schedule[]>
      }).then((data) => {
        if (!cancelled && data) {
          setItems(data)
          setError('')
        }
      }).catch(() => {
        if (!cancelled) setError(t('messages.dataLoadFailed'))
      }).finally(() => {
        if (!cancelled) setLoading(false)
      })

      return () => { cancelled = true }
    }, [schedules, t])
  )

  const performDelete = useCallback(async (schedule: Schedule) => {
    try {
      await apiDeleteSchedule(schedule.id)
      setItems((prev) => prev.filter((item) => item.id !== schedule.id))
    } catch {
      if (Platform.OS === 'web') {
        window.alert(t('messages.deleteFailed'))
      } else {
        Alert.alert(t('messages.error'), t('messages.deleteFailed'))
      }
    }
  }, [t])

  const handlePress = useCallback((schedule: Schedule) => {
    router.push(`/schedule/${schedule.id}`)
  }, [router])

  const handleDelete = useCallback((schedule: Schedule) => {
    if (Platform.OS === 'web') {
      if (window.confirm(t('schedule.deleteConfirm'))) {
        performDelete(schedule)
      }
    } else {
      Alert.alert(
        t('schedule.delete'),
        t('schedule.deleteConfirm'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.delete'),
            style: 'destructive',
            onPress: () => performDelete(schedule),
          },
        ],
      )
    }
  }, [t, performDelete])

  return (
    <>
      <Stack.Screen
        options={{
          title: t('schedule.scheduleList'),
        }}
      />
      <YStack flex={1} backgroundColor="$background" padding="$4">
        <XStack
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$4"
          overflow="hidden"
          marginBottom="$3"
        >
          {TAB_LABELS.map(({ key, label }) => (
            <Button
              key={key}
              flex={1}
              size="$3"
              borderRadius={0}
              backgroundColor={activeTab === key ? '$blue10' : 'transparent'}
              onPress={() => setActiveTab(key)}
            >
              <SizableText size="$3" color={activeTab === key ? 'white' : '$color'}>
                {label}
              </SizableText>
            </Button>
          ))}
        </XStack>
        {loading ? (
          <YStack flex={1} justifyContent="center" alignItems="center">
            <Spinner size="large" />
          </YStack>
        ) : error ? (
          <SizableText color="$red10">{error}</SizableText>
        ) : (
          <ScheduleList schedules={filteredItems} emptyMessage={emptyMessage} onDelete={handleDelete} onPress={handlePress} />
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
