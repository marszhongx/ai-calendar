import type { Recurrence } from '../constants'

export type ScheduleDraft = {
  title: string
  startAt: string
  endAt?: string
  reminderMinutesBefore: number
  recurrence: Recurrence
  notes: string
  originalMessage: string
  confidence: number
}

export type Schedule = {
  id: string
  title: string
  startAt: string
  endAt?: string
  reminderMinutesBefore: number
  recurrence: Recurrence
  notes: string
  originalMessage: string
  notificationId?: string
  createdAt: string
  updatedAt: string
}

export type ValidationResult = {
  valid: boolean
  errors: string[]
}

export type ParsedSchedulePayload = {
  title: string
  start_time: string
  end_time: string | null
  reminder_minutes_before: number
  recurrence: string
  notes: string | null
  confidence: number
}

export type SchedulePayload = {
  title: string
  startAt: string
  endAt?: string
  reminderMinutesBefore: number
  recurrence: Recurrence
  notes: string
  originalMessage?: string
}

export type ParseMessageSuccess = {
  ok: true
  data: ParsedSchedulePayload
}

export type ParseMessageFailure = {
  ok: false
  error: 'service_unavailable' | 'empty_response' | 'invalid_format'
}

export type ParseMessageResult = ParseMessageSuccess | ParseMessageFailure
