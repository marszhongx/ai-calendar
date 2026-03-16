import type { ParsedSchedulePayload, Recurrence, ScheduleDraft } from '../../types';

function toRecurrence(value?: string): Recurrence {
  if (value === 'DAILY' || value === 'WEEKLY' || value === 'MONTHLY') {
    return value;
  }

  return 'NONE';
}

export function normalizeDraft(payload: ParsedSchedulePayload): ScheduleDraft {
  const title = payload.title?.trim() ?? '';
  const startAt = payload.start_time?.trim() ?? '';

  return {
    title,
    startAt,
    endAt: payload.end_time?.trim() || undefined,
    timezone: payload.timezone?.trim() || 'Asia/Shanghai',
    reminderMinutesBefore: payload.reminder_minutes_before ?? 30,
    recurrence: toRecurrence(payload.recurrence),
    notes: payload.notes?.trim() ?? '',
    confidence: payload.confidence ?? 0,
    missingFields: [
      ...(title ? [] : ['title' as const]),
      ...(startAt ? [] : ['startAt' as const]),
    ],
  };
}
