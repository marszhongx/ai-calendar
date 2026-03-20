import { Recurrence } from '../constants';
export { Recurrence };

export type ScheduleDraft = {
  title: string;
  startAt: string;
  endAt?: string;
  timezone: string;
  reminderMinutesBefore: number;
  recurrence: Recurrence;
  notes: string;
  confidence: number;
  missingFields: Array<'title' | 'startAt'>;
};

export type Schedule = {
  id: string;
  title: string;
  startAt: string;
  endAt?: string;
  timezone: string;
  reminderMinutesBefore: number;
  recurrence: Recurrence;
  notes: string;
  notificationId?: string;
  createdAt: string;
  updatedAt: string;
};

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export type ParsedSchedulePayload = {
  title?: string;
  start_time?: string;
  end_time?: string;
  timezone?: string;
  reminder_minutes_before?: number;
  recurrence?: string;
  notes?: string;
  confidence?: number;
};

export type ParseMessageSuccess = {
  ok: true;
  data: ParsedSchedulePayload;
};

export type ParseMessageFailure = {
  ok: false;
  error: 'service_unavailable' | 'empty_response' | 'invalid_format';
};

export type ParseMessageResult = ParseMessageSuccess | ParseMessageFailure;
