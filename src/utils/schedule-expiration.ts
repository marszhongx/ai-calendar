import dayjs from 'dayjs'
import type { Schedule } from '../types/schedule'

export function isExpired(schedule: Schedule, referenceDate?: string): boolean {
  const boundary = schedule.endAt ?? schedule.startAt
  const ref = referenceDate ? dayjs(referenceDate) : dayjs()
  return ref.isAfter(dayjs(boundary), 'day')
}
