import { useFocusEffect } from '@react-navigation/native'
import dayjs from 'dayjs'
import { Stack, useRouter } from 'expo-router'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, SizableText, XStack, YStack } from 'tamagui'
import { EmptyState } from '@/components/empty-state'
import { PillButton } from '@/components/pill-button'
import { SafePageView } from '@/components/safe-page-view'
import { ScheduleList } from '@/components/schedule-list'
import { SkeletonCard } from '@/components/skeleton-card'
import {
  ACCENT_COLOR,
  ACCENT_COLOR_PRESSED,
  Recurrence,
  ScheduleTab,
} from '@/constants'
import { useLocale } from '@/context/LocaleContext'
import { listSchedules as apiListSchedules } from '@/services/schedule'
import type { Schedule } from '@/types/schedule'
import { isExpired } from '@/utils/schedule-expiration'

function occursOnDay(schedule: Schedule, target: dayjs.Dayjs): boolean {
  if (isExpired(schedule, target.format('YYYY-MM-DD'))) return false

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
  const insets = useSafeAreaInsets()
  const [items, setItems] = useState<Schedule[]>(schedules ?? [])
  const [loading, setLoading] = useState(!schedules)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<ScheduleTab>(ScheduleTab.TODAY)
  const hasLoaded = useRef(!!schedules)

  const TAB_LABELS = useMemo(
    () => [
      { key: ScheduleTab.TODAY, label: t('schedule.tabToday') },
      { key: ScheduleTab.TOMORROW, label: t('schedule.tabTomorrow') },
      { key: ScheduleTab.ALL, label: t('schedule.tabAll') },
    ],
    [t],
  )

  const filteredItems = useMemo(
    () => filterSchedules(items, activeTab),
    [items, activeTab],
  )

  const fetchSchedules = useCallback(() => {
    if (!hasLoaded.current) setLoading(true)
    setError('')
    apiListSchedules()
      .then((data) => {
        if (data) setItems(data)
        hasLoaded.current = true
      })
      .catch(() => setError(t('messages.dataLoadFailed')))
      .finally(() => setLoading(false))
  }, [t])

  useFocusEffect(
    useCallback(() => {
      if (schedules) return
      fetchSchedules()
    }, [schedules, fetchSchedules]),
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
          headerRight: () => (
            <Button
              unstyled
              onPress={() => router.push('/config')}
              paddingHorizontal="$2"
              marginRight="$2"
            >
              <SizableText size="$6">⚙️</SizableText>
            </Button>
          ),
        }}
      />
      <SafePageView>
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
        {loading && items.length === 0 ? (
          <SkeletonCard />
        ) : error ? (
          <YStack alignItems="center" gap="$3" paddingVertical="$6">
            <SizableText color="$red10">{error}</SizableText>
            <PillButton selected={false} onPress={fetchSchedules}>
              {t('messages.retry')}
            </PillButton>
          </YStack>
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
      </SafePageView>
      <Button
        size="$5"
        circular
        backgroundColor={ACCENT_COLOR}
        position="absolute"
        bottom={insets.bottom + 24}
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
