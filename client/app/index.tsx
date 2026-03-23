import { useFocusEffect } from '@react-navigation/native'
import dayjs from 'dayjs'
import { Stack, useRouter } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { Button, SizableText, XStack, YStack } from 'tamagui'
import { EmptyState } from '@/components/empty-state'
import { PillButton } from '@/components/pill-button'

import { ScheduleList } from '@/components/schedule-list'
import { SkeletonCard } from '@/components/skeleton-card'
import {
  ACCENT_COLOR,
  ACCENT_COLOR_PRESSED,
  PAGE_BACKGROUND,
  Recurrence,
  ScheduleTab,
} from '@/constants'
import { useLocale } from '@/context/LocaleContext'
import { useDeviceId } from '@/hooks/useDeviceId'
import { listSchedules as apiListSchedules } from '@/services'
import type { Schedule } from '@/types'

function occursOnDay(schedule: Schedule, target: dayjs.Dayjs): boolean {
  const start = dayjs(schedule.startAt)
  if (start.isSame(target, 'day')) return true
  if (start.isAfter(target, 'day')) return false

  switch (schedule.recurrence) {
    case Recurrence.DAILY:
      return true
    case Recurrence.WEEKLY:
      return start.day() === target.day()
    case Recurrence.MONTHLY:
      return start.date() === target.date()
    default:
      return false
  }
}

function timeOfDay(iso: string): number {
  const d = dayjs(iso)
  return d.hour() * 60 + d.minute()
}

function filterSchedules(schedules: Schedule[], tab: ScheduleTab): Schedule[] {
  if (tab === ScheduleTab.ALL) {
    return [...schedules].sort(
      (a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf(),
    )
  }
  const target = tab === ScheduleTab.TODAY ? dayjs() : dayjs().add(1, 'day')
  return schedules
    .filter((s) => occursOnDay(s, target))
    .sort((a, b) => timeOfDay(a.startAt) - timeOfDay(b.startAt))
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
  const { deviceId } = useDeviceId()

  const TAB_LABELS: { key: ScheduleTab; label: string }[] = [
    { key: ScheduleTab.TODAY, label: t('schedule.tabToday') },
    { key: ScheduleTab.TOMORROW, label: t('schedule.tabTomorrow') },
    { key: ScheduleTab.ALL, label: t('schedule.tabAll') },
  ]

  const filteredItems = useMemo(
    () => filterSchedules(items, activeTab),
    [items, activeTab],
  )

  useFocusEffect(
    useCallback(() => {
      if (schedules) return
      if (deviceId === null) return

      let cancelled = false
      setLoading(true)

      apiListSchedules(deviceId)
        .then((data) => {
          if (!cancelled && data) {
            setItems(data as Schedule[])
            setError('')
          }
        })
        .catch(() => {
          if (!cancelled) setError(t('messages.dataLoadFailed'))
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })

      return () => {
        cancelled = true
      }
    }, [schedules, t, deviceId]),
  )

  const handlePress = useCallback(
    (schedule: Schedule) => {
      router.push(`/schedule/${schedule.id}`)
    },
    [router],
  )

  return (
    <>
      <Stack.Screen
        options={{
          title: t('schedule.scheduleList'),
        }}
      />
      <YStack flex={1} backgroundColor={PAGE_BACKGROUND} padding="$4">
        <XStack gap="$2" marginBottom="$3">
          {TAB_LABELS.map(({ key, label }) => (
            <PillButton
              key={key}
              selected={activeTab === key}
              onPress={() => setActiveTab(key)}
            >
              {label}
            </PillButton>
          ))}
        </XStack>
        {loading ? (
          <SkeletonCard />
        ) : error ? (
          <SizableText color="$red10">{error}</SizableText>
        ) : filteredItems.length === 0 ? (
          activeTab === ScheduleTab.TODAY ? (
            <EmptyState
              icon="☀️"
              iconBg="#FEF2F0"
              title={t('schedule.emptyToday')}
              subtitle={t('schedule.emptyTodayHint')}
            />
          ) : activeTab === ScheduleTab.TOMORROW ? (
            <EmptyState
              icon="🌙"
              iconBg="#EFF1FE"
              title={t('schedule.emptyTomorrow')}
              subtitle={t('schedule.emptyTomorrowHint')}
            />
          ) : (
            <EmptyState
              icon="📋"
              iconBg="#F0F5F2"
              title={t('schedule.emptyList')}
              subtitle={t('schedule.emptyListHint')}
            />
          )
        ) : (
          <ScheduleList
            schedules={filteredItems}
            onPress={handlePress}
            showDate={activeTab === ScheduleTab.ALL}
          />
        )}
      </YStack>
      <Button
        size="$5"
        circular
        backgroundColor={ACCENT_COLOR}
        position="absolute"
        bottom={24}
        right={24}
        elevation="$4"
        onPress={() => router.push('/new')}
        hoverStyle={{ backgroundColor: ACCENT_COLOR }}
        pressStyle={{ backgroundColor: ACCENT_COLOR_PRESSED }}
      >
        <SizableText color="white" size="$8" fontWeight="bold" marginTop={-2}>
          +
        </SizableText>
      </Button>
    </>
  )
}
