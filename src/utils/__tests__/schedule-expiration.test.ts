import { Recurrence } from '@/constants'
import type { Schedule } from '@/types/schedule'
import { isExpired } from '../schedule-expiration'

function makeSchedule(overrides: Partial<Schedule> = {}): Schedule {
  return {
    id: '1',
    title: 'Test',
    startAt: '2026-03-20T10:00:00.000Z',
    reminderMinutesBefore: 0,
    recurrence: Recurrence.NONE,
    notes: '',
    originalMessage: '',
    createdAt: '2026-03-20T00:00:00.000Z',
    updatedAt: '2026-03-20T00:00:00.000Z',
    ...overrides,
  }
}

describe('isExpired', () => {
  it('returns false when referenceDate is the same day as startAt (no endAt)', () => {
    const s = makeSchedule({ startAt: '2026-03-25T10:00:00.000Z' })
    expect(isExpired(s, '2026-03-25')).toBe(false)
  })

  it('returns true when referenceDate is after startAt day (no endAt)', () => {
    const s = makeSchedule({ startAt: '2026-03-25T10:00:00.000Z' })
    expect(isExpired(s, '2026-03-26')).toBe(true)
  })

  it('returns false when referenceDate is before startAt day', () => {
    const s = makeSchedule({ startAt: '2026-03-25T10:00:00.000Z' })
    expect(isExpired(s, '2026-03-24')).toBe(false)
  })

  it('uses endAt as boundary when present', () => {
    const s = makeSchedule({
      startAt: '2026-03-20T10:00:00.000Z',
      endAt: '2026-03-28T06:00:00.000Z',
    })
    expect(isExpired(s, '2026-03-28')).toBe(false)
    expect(isExpired(s, '2026-03-29')).toBe(true)
  })

  it('works with recurring schedules (endAt is the termination line)', () => {
    const s = makeSchedule({
      startAt: '2026-03-01T09:00:00.000Z',
      endAt: '2026-03-15T09:00:00.000Z',
      recurrence: Recurrence.DAILY,
    })
    expect(isExpired(s, '2026-03-15')).toBe(false)
    expect(isExpired(s, '2026-03-16')).toBe(true)
  })

  it('defaults referenceDate to today when omitted', () => {
    const past = makeSchedule({ startAt: '2020-01-01T10:00:00.000Z' })
    expect(isExpired(past)).toBe(true)

    const future = makeSchedule({ startAt: '2099-12-31T10:00:00.000Z' })
    expect(isExpired(future)).toBe(false)
  })
})
