import { Recurrence } from '../constants'
import type { Schedule, ScheduleDraft, ValidationResult } from '../types'

function isAllowedRecurrence(value: string) {
  return Object.values(Recurrence).includes(value as Recurrence)
}

export function validateDraft(draft: ScheduleDraft): ValidationResult {
  const errors: string[] = []

  if (!draft.title.trim()) {
    errors.push('validation.titleRequired')
  }

  if (!draft.startAt.trim()) {
    errors.push('validation.startAtRequired')
  }

  if (!isAllowedRecurrence(draft.recurrence)) {
    errors.push('validation.invalidRecurrence')
  }

  if (
    !Number.isInteger(draft.reminderMinutesBefore) ||
    draft.reminderMinutesBefore < 0 ||
    draft.reminderMinutesBefore > 1440
  ) {
    errors.push('validation.reminderRange')
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
