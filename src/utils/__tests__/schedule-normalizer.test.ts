import { Recurrence } from '@/constants'
import type { Schedule, ScheduleDraft } from '@/types/schedule'
import {
  draftToPayload,
  normalizeDraft,
  scheduleToDraft,
} from '../schedule-normalizer'

describe('normalizeDraft', () => {
  it('maps parsed payload fields into a schedule draft', () => {
    const result = normalizeDraft({
      title: '需求评审会',
      start_time: '2026-03-17T15:00:00.000Z',
      end_time: '2026-03-17T16:00:00.000Z',

      reminder_minutes_before: 45,
      recurrence: 'WEEKLY',
      notes: '带上原型',
      confidence: 0.91,
    })

    expect(result).toEqual({
      title: '需求评审会',
      startAt: '2026-03-17T15:00:00.000Z',
      endAt: '2026-03-17T16:00:00.000Z',

      reminderMinutesBefore: 45,
      recurrence: 'WEEKLY',
      notes: '带上原型',
      originalMessage: '',
      confidence: 0.91,
    })
  })

  it('maps null end time to an open-ended draft', () => {
    const result = normalizeDraft({
      title: '医生复诊',
      start_time: '2026-03-21T02:00:00.000Z',
      end_time: null,
      reminder_minutes_before: 30,
      recurrence: 'NONE',
      notes: null,
      confidence: 0.8,
    })

    expect(result.endAt).toBeUndefined()
    expect(result.notes).toBe('')
  })

  it('keeps low confidence drafts for manual confirmation', () => {
    const result = normalizeDraft({
      title: '开会',
      start_time: '',
      end_time: null,
      reminder_minutes_before: 30,
      recurrence: 'NONE',
      notes: null,
      confidence: 0.3,
    })

    expect(result.confidence).toBe(0.3)
  })
})

describe('scheduleToDraft', () => {
  it('converts a Schedule to ScheduleDraft', () => {
    const schedule: Schedule = {
      id: 'sched-1',
      title: '开会',
      startAt: '2026-03-20T10:00:00Z',
      endAt: '2026-03-20T11:00:00Z',
      reminderMinutesBefore: 15,
      recurrence: Recurrence.WEEKLY,
      notes: '带资料',
      originalMessage: '每周三开会',
      createdAt: '2026-03-19T00:00:00Z',
      updatedAt: '2026-03-19T00:00:00Z',
    }
    const draft = scheduleToDraft(schedule)
    expect(draft).toEqual({
      title: '开会',
      startAt: '2026-03-20T10:00:00Z',
      endAt: '2026-03-20T11:00:00Z',
      reminderMinutesBefore: 15,
      recurrence: Recurrence.WEEKLY,
      notes: '带资料',
      originalMessage: '每周三开会',
      confidence: 1,
    })
  })
})

describe('draftToPayload', () => {
  it('converts a ScheduleDraft to SchedulePayload', () => {
    const draft: ScheduleDraft = {
      title: '开会',
      startAt: '2026-03-20T10:00:00Z',
      endAt: '2026-03-20T11:00:00Z',
      reminderMinutesBefore: 15,
      recurrence: Recurrence.WEEKLY,
      notes: '带资料',
      originalMessage: '每周三开会',
      confidence: 0.9,
    }
    const payload = draftToPayload(draft)
    expect(payload).toEqual({
      title: '开会',
      startAt: '2026-03-20T10:00:00Z',
      endAt: '2026-03-20T11:00:00Z',
      reminderMinutesBefore: 15,
      recurrence: 'WEEKLY',
      notes: '带资料',
      originalMessage: '每周三开会',
    })
    expect(payload).not.toHaveProperty('confidence')
  })
})
