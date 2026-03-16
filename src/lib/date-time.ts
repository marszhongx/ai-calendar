import type { Recurrence, RepeatTrigger } from '../types';

export function subtractMinutes(isoString: string, minutes: number) {
  return new Date(new Date(isoString).getTime() - minutes * 60 * 1000);
}

export function getRepeatTrigger(recurrence: Recurrence, date: Date): RepeatTrigger | null {
  if (recurrence === 'DAILY') {
    return {
      type: 'daily',
      hour: date.getUTCHours(),
      minute: date.getUTCMinutes(),
    };
  }

  if (recurrence === 'WEEKLY') {
    return {
      type: 'weekly',
      weekday: date.getUTCDay() + 1,
      hour: date.getUTCHours(),
      minute: date.getUTCMinutes(),
    };
  }

  if (recurrence === 'MONTHLY') {
    return {
      type: 'monthly',
      day: date.getUTCDate(),
      hour: date.getUTCHours(),
      minute: date.getUTCMinutes(),
    };
  }

  return null;
}
