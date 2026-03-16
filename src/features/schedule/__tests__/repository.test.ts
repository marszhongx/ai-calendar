import type { Schedule } from '../../../types';
import { createScheduleRepository } from '../repository';

describe('schedule repository', () => {
  beforeEach(async () => {
    const repository = createScheduleRepository();
    await repository.deleteSchedule('schedule-1');
  });

  const baseSchedule: Schedule = {
    id: 'schedule-1',
    title: '需求评审会',
    startAt: '2026-03-17T15:00:00.000Z',
    endAt: '2026-03-17T16:00:00.000Z',
    timezone: 'Asia/Shanghai',
    reminderMinutesBefore: 30,
    recurrence: 'NONE',
    notes: '',
    notificationId: 'notification-1',
    createdAt: '2026-03-16T09:00:00.000Z',
    updatedAt: '2026-03-16T09:00:00.000Z',
  };

  it('creates and lists schedules', async () => {
    const repository = createScheduleRepository();

    await repository.createSchedule(baseSchedule);

    await expect(repository.listSchedules()).resolves.toEqual([baseSchedule]);
  });

  it('updates an existing schedule', async () => {
    const repository = createScheduleRepository();

    await repository.createSchedule(baseSchedule);
    await repository.updateSchedule({
      ...baseSchedule,
      title: '更新后的会议',
      updatedAt: '2026-03-16T10:00:00.000Z',
    });

    await expect(repository.listSchedules()).resolves.toEqual([
      {
        ...baseSchedule,
        title: '更新后的会议',
        updatedAt: '2026-03-16T10:00:00.000Z',
      },
    ]);
  });

  it('deletes a schedule', async () => {
    const repository = createScheduleRepository();

    await repository.createSchedule(baseSchedule);
    await repository.deleteSchedule(baseSchedule.id);

    await expect(repository.listSchedules()).resolves.toEqual([]);
  });
});
