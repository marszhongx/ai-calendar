import { Recurrence } from '../../constants'
import type { Schedule, ScheduleDraft } from '../../types'
import { validateDraft, validateSchedule } from '../schedule-validation'

describe('validateDraft', () => {
  it('accepts a complete draft', () => {
    const draft: ScheduleDraft = {
      title: '需求评审会',
      startAt: '2026-03-17T15:00:00.000Z',
      endAt: '2026-03-17T16:00:00.000Z',

      reminderMinutesBefore: 30,
      recurrence: Recurrence.WEEKLY,
      notes: '准备原型',
      originalMessage: '',
      confidence: 0.92,
      missingFields: [],
    }

    expect(validateDraft(draft)).toEqual({ valid: true, errors: [] })
  })

  it('rejects a draft without title', () => {
    const draft: ScheduleDraft = {
      title: '',
      startAt: '2026-03-17T15:00:00.000Z',

      reminderMinutesBefore: 30,
      recurrence: Recurrence.NONE,
      notes: '',
      originalMessage: '',
      confidence: 0.8,
      missingFields: [],
    }

    expect(validateDraft(draft)).toEqual({
      valid: false,
      errors: ['validation.titleRequired'],
    })
  })

  it('rejects a draft without start time', () => {
    const draft: ScheduleDraft = {
      title: '医生复诊',
      startAt: '',

      reminderMinutesBefore: 60,
      recurrence: Recurrence.NONE,
      notes: '',
      originalMessage: '',
      confidence: 0.88,
      missingFields: ['startAt'],
    }

    expect(validateDraft(draft)).toEqual({
      valid: false,
      errors: ['validation.startAtRequired'],
    })
  })

  it('rejects a draft with invalid recurrence', () => {
    const draft = {
      title: '周会',
      startAt: '2026-03-17T15:00:00.000Z',

      reminderMinutesBefore: 10,
      recurrence: 'yearly',
      notes: '',
      confidence: 0.6,
      missingFields: [],
    } as unknown as ScheduleDraft

    expect(validateDraft(draft)).toEqual({
      valid: false,
      errors: ['validation.invalidRecurrence'],
    })
  })

  it('rejects negative reminder minutes', () => {
    const draft: ScheduleDraft = {
      title: '开会',
      startAt: '2026-03-17T15:00:00.000Z',
      reminderMinutesBefore: -5,
      recurrence: Recurrence.NONE,
      notes: '',
      originalMessage: '',
      confidence: 0.8,
      missingFields: [],
    }
    expect(validateDraft(draft)).toEqual({
      valid: false,
      errors: ['validation.reminderRange'],
    })
  })

  it('rejects reminder over 1440', () => {
    const draft: ScheduleDraft = {
      title: '开会',
      startAt: '2026-03-17T15:00:00.000Z',
      reminderMinutesBefore: 1500,
      recurrence: Recurrence.NONE,
      notes: '',
      originalMessage: '',
      confidence: 0.8,
      missingFields: [],
    }
    expect(validateDraft(draft)).toEqual({
      valid: false,
      errors: ['validation.reminderRange'],
    })
  })
})

describe('validateSchedule', () => {
  it('accepts a complete schedule', () => {
    const schedule: Schedule = {
      id: 'schedule-1',
      title: '需求评审会',
      startAt: '2026-03-17T15:00:00.000Z',
      endAt: '2026-03-17T16:00:00.000Z',

      reminderMinutesBefore: 30,
      recurrence: Recurrence.NONE,
      notes: '',
      originalMessage: '',
      notificationId: 'notification-1',
      createdAt: '2026-03-16T09:00:00.000Z',
      updatedAt: '2026-03-16T09:00:00.000Z',
    }

    expect(validateSchedule(schedule)).toEqual({ valid: true, errors: [] })
  })

  it('rejects a schedule without id', () => {
    const schedule = {
      id: '',
      title: '需求评审会',
      startAt: '2026-03-17T15:00:00.000Z',

      reminderMinutesBefore: 30,
      recurrence: Recurrence.NONE,
      notes: '',
      originalMessage: '',
      notificationId: 'notification-1',
      createdAt: '2026-03-16T09:00:00.000Z',
      updatedAt: '2026-03-16T09:00:00.000Z',
    } as Schedule

    expect(validateSchedule(schedule)).toEqual({
      valid: false,
      errors: ['id is required'],
    })
  })
})
