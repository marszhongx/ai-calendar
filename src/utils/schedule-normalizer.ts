import { Recurrence } from '../constants'
import type {
  ParsedSchedulePayload,
  Schedule,
  ScheduleDraft,
  SchedulePayload,
} from '../types/schedule'

function toRecurrence(value?: string): Recurrence {
  if (
    value === Recurrence.DAILY ||
    value === Recurrence.WEEKLY ||
    value === Recurrence.MONTHLY
  ) {
    return value
  }

  return Recurrence.NONE
}

export function normalizeDraft(
  payload: ParsedSchedulePayload,
  originalMessage = '',
): ScheduleDraft {
  const title = payload.title?.trim() ?? ''
  const startAt = payload.start_time?.trim() ?? ''

  return {
    title,
    startAt,
    endAt: payload.end_time?.trim() || undefined,
    reminderMinutesBefore: payload.reminder_minutes_before ?? 30,
    recurrence: toRecurrence(payload.recurrence),
    notes: payload.notes?.trim() ?? '',
    originalMessage,
    confidence: payload.confidence ?? 0,
    missingFields: [
      ...(title ? [] : ['title' as const]),
      ...(startAt ? [] : ['startAt' as const]),
    ],
  }
}

export function scheduleToDraft(schedule: Schedule): ScheduleDraft {
  return {
    title: schedule.title,
    startAt: schedule.startAt,
    endAt: schedule.endAt,
    reminderMinutesBefore: schedule.reminderMinutesBefore,
    recurrence: schedule.recurrence,
    notes: schedule.notes,
    originalMessage: schedule.originalMessage,
    confidence: 1,
    missingFields: [],
  }
}

export function draftToPayload(draft: ScheduleDraft): SchedulePayload {
  return {
    title: draft.title,
    startAt: draft.startAt,
    endAt: draft.endAt,
    reminderMinutesBefore: draft.reminderMinutesBefore,
    recurrence: draft.recurrence,
    notes: draft.notes,
    originalMessage: draft.originalMessage,
  }
}
