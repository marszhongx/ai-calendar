import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Crypto from 'expo-crypto'
import { StorageKey } from '../constants'
import type { Schedule, SchedulePayload } from '../types/schedule'

async function readSchedules(): Promise<Schedule[]> {
  const raw = await AsyncStorage.getItem(StorageKey.SCHEDULES)
  if (!raw) return []
  try {
    return JSON.parse(raw) as Schedule[]
  } catch {
    return []
  }
}

async function writeSchedules(schedules: Schedule[]): Promise<void> {
  await AsyncStorage.setItem(StorageKey.SCHEDULES, JSON.stringify(schedules))
}

export async function listSchedules(): Promise<Schedule[]> {
  return readSchedules()
}

export async function createSchedule(data: SchedulePayload): Promise<Schedule> {
  const schedules = await readSchedules()
  const now = new Date().toISOString()
  const schedule: Schedule = {
    id: Crypto.randomUUID(),
    title: data.title,
    startAt: data.startAt,
    endAt: data.endAt,
    reminderMinutesBefore: data.reminderMinutesBefore,
    recurrence: data.recurrence,
    notes: data.notes,
    originalMessage: data.originalMessage || '',
    createdAt: now,
    updatedAt: now,
  }
  schedules.push(schedule)
  await writeSchedules(schedules)
  return schedule
}

export async function updateSchedule(
  id: string,
  data: Omit<SchedulePayload, 'originalMessage'>,
): Promise<Schedule> {
  const schedules = await readSchedules()
  const index = schedules.findIndex((s) => s.id === id)
  if (index === -1) throw new Error('Schedule not found')

  const updated: Schedule = {
    ...schedules[index],
    title: data.title,
    startAt: data.startAt,
    endAt: data.endAt,
    reminderMinutesBefore: data.reminderMinutesBefore,
    recurrence: data.recurrence,
    notes: data.notes,
    updatedAt: new Date().toISOString(),
  }
  schedules[index] = updated
  await writeSchedules(schedules)
  return updated
}

export async function deleteSchedule(id: string): Promise<void> {
  const schedules = await readSchedules()
  const filtered = schedules.filter((s) => s.id !== id)
  await writeSchedules(filtered)
}
