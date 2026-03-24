import AsyncStorage from '@react-native-async-storage/async-storage'
import { Recurrence } from '../../constants'
import {
  createSchedule,
  deleteSchedule,
  listSchedules,
  updateSchedule,
} from '../index'

beforeEach(async () => {
  await AsyncStorage.clear()
})

describe('listSchedules', () => {
  it('returns empty array when no schedules', async () => {
    const result = await listSchedules()
    expect(result).toEqual([])
  })
})

describe('createSchedule', () => {
  it('creates a schedule and returns it with id and timestamps', async () => {
    const payload = {
      title: '开会',
      startAt: '2026-03-20T10:00:00+08:00',
      reminderMinutesBefore: 30,
      recurrence: Recurrence.NONE,
      notes: '',
    }
    const result = await createSchedule(payload)
    expect(result.id).toBeDefined()
    expect(result.title).toBe('开会')
    expect(result.createdAt).toBeDefined()
    expect(result.updatedAt).toBeDefined()

    const all = await listSchedules()
    expect(all).toHaveLength(1)
    expect(all[0].id).toBe(result.id)
  })
})

describe('updateSchedule', () => {
  it('updates an existing schedule', async () => {
    const created = await createSchedule({
      title: '开会',
      startAt: '2026-03-20T10:00:00+08:00',
      reminderMinutesBefore: 30,
      recurrence: Recurrence.NONE,
      notes: '',
    })

    const updated = await updateSchedule(created.id, {
      title: '更新后的会议',
      startAt: '2026-03-20T11:00:00+08:00',
      reminderMinutesBefore: 15,
      recurrence: Recurrence.NONE,
      notes: '备注',
    })

    expect(updated.title).toBe('更新后的会议')
    expect(updated.updatedAt).not.toBe(created.updatedAt)
  })

  it('throws when schedule not found', async () => {
    await expect(
      updateSchedule('nonexistent', {
        title: 'x',
        startAt: '2026-03-20T10:00:00+08:00',
        reminderMinutesBefore: 10,
        recurrence: Recurrence.NONE,
        notes: '',
      }),
    ).rejects.toThrow('Schedule not found')
  })
})

describe('deleteSchedule', () => {
  it('removes a schedule', async () => {
    const created = await createSchedule({
      title: '要删除的',
      startAt: '2026-03-20T10:00:00+08:00',
      reminderMinutesBefore: 10,
      recurrence: Recurrence.NONE,
      notes: '',
    })

    await deleteSchedule(created.id)
    const all = await listSchedules()
    expect(all).toHaveLength(0)
  })
})
