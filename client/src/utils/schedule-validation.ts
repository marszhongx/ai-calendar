import { Recurrence } from '../constants'
import type { Schedule, ScheduleDraft, ValidationResult } from '../types'

function isAllowedRecurrence(value: string) {
  return Object.values(Recurrence).includes(value as Recurrence)
}

export function validateDraft(draft: ScheduleDraft): ValidationResult {
  const errors: string[] = []

  if (!draft.title.trim()) {
    errors.push('title is required')
  }

  if (!draft.startAt.trim()) {
    errors.push('startAt is required')
  }

  if (!isAllowedRecurrence(draft.recurrence)) {
    errors.push('recurrence must be one of NONE, DAILY, WEEKLY, MONTHLY')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function validateSchedule(schedule: Schedule): ValidationResult {
  const errors: string[] = []

  if (!schedule.id.trim()) {
    errors.push('id is required')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
