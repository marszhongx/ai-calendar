import { normalizeDraft } from '../schedule-normalizer'

describe('normalizeDraft', () => {
  it('maps parsed payload fields into a schedule draft', () => {
    const result = normalizeDraft({
      title: '需求评审会',
      start_time: '2026-03-17T15:00:00.000Z',
      end_time: '2026-03-17T16:00:00.000Z',
      timezone: 'Asia/Shanghai',
      reminder_minutes_before: 45,
      recurrence: 'WEEKLY',
      notes: '带上原型',
      confidence: 0.91,
    })

    expect(result).toEqual({
      title: '需求评审会',
      startAt: '2026-03-17T15:00:00.000Z',
      endAt: '2026-03-17T16:00:00.000Z',
      timezone: 'Asia/Shanghai',
      reminderMinutesBefore: 45,
      recurrence: 'WEEKLY',
      notes: '带上原型',
      originalMessage: '',
      confidence: 0.91,
      missingFields: [],
    })
  })

  it('applies default reminder and empty notes', () => {
    const result = normalizeDraft({
      title: '医生复诊',
      start_time: '2026-03-21T02:00:00.000Z',
      timezone: 'Asia/Shanghai',
    })

    expect(result.reminderMinutesBefore).toBe(30)
    expect(result.notes).toBe('')
    expect(result.recurrence).toBe('NONE')
  })

  it('keeps recurrence values after type relocation', () => {
    const result = normalizeDraft({ recurrence: 'WEEKLY' })
    expect(result.recurrence).toBe('WEEKLY')
  })

  it('tracks missing required fields', () => {
    const result = normalizeDraft({
      title: '',
      start_time: '',
      timezone: 'Asia/Shanghai',
    })

    expect(result.missingFields).toEqual(['title', 'startAt'])
  })

  it('keeps low confidence drafts for manual confirmation', () => {
    const result = normalizeDraft({
      title: '开会',
      start_time: '',
      timezone: 'Asia/Shanghai',
      confidence: 0.3,
    })

    expect(result.confidence).toBe(0.3)
    expect(result.missingFields).toContain('startAt')
  })
})
