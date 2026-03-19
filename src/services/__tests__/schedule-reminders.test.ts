import { Recurrence } from '../../constants';
import type { Schedule } from '../../types';
import { createReminderScheduler } from '../schedule-reminders';

describe('reminder scheduler', () => {
  const schedule: Schedule = {
    id: 'schedule-1',
    title: '需求评审会',
    startAt: '2026-03-17T15:00:00.000Z',
    endAt: '2026-03-17T16:00:00.000Z',
    timezone: 'Asia/Shanghai',
    reminderMinutesBefore: 30,
    recurrence: Recurrence.WEEKLY,
    notes: '',
    notificationId: undefined,
    createdAt: '2026-03-16T09:00:00.000Z',
    updatedAt: '2026-03-16T09:00:00.000Z',
  };

  it('creates a reminder notification', async () => {
    const mockTranslate = jest.fn().mockReturnValue('你有一个即将到来的日程');
    const scheduler = createReminderScheduler({
      scheduleNotification: jest.fn().mockResolvedValue('notification-1'),
      cancelNotification: jest.fn(),
    });

    await expect(scheduler.scheduleReminder(schedule, mockTranslate)).resolves.toBe('notification-1');
  });

  it('replaces an old notification when updating a reminder', async () => {
    const cancelNotification = jest.fn();
    const mockTranslate = jest.fn().mockReturnValue('你有一个即将到来的日程');
    const scheduler = createReminderScheduler({
      scheduleNotification: jest.fn().mockResolvedValue('notification-2'),
      cancelNotification,
    });

    await expect(
      scheduler.updateReminder({
        ...schedule,
        notificationId: 'notification-1',
      }, mockTranslate)
    ).resolves.toBe('notification-2');
    expect(cancelNotification).toHaveBeenCalledWith('notification-1');
  });

  it('cancels a reminder when deleting a schedule', async () => {
    const cancelNotification = jest.fn();
    const scheduler = createReminderScheduler({
      scheduleNotification: jest.fn(),
      cancelNotification,
    });

    await scheduler.cancelReminder('notification-1');

    expect(cancelNotification).toHaveBeenCalledWith('notification-1');
  });

  it('maps recurrence values into repeat triggers', async () => {
    const scheduleNotification = jest.fn().mockResolvedValue('notification-3');
    const mockTranslate = jest.fn().mockReturnValue('你有一个即将到来的日程');
    const scheduler = createReminderScheduler({
      scheduleNotification,
      cancelNotification: jest.fn(),
    });

    await scheduler.scheduleReminder(schedule, mockTranslate);

    expect(scheduleNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'weekly',
        hour: 14,
        minute: 30,
        weekday: 3,
      }),
      expect.objectContaining({
        title: '需求评审会',
      }),
    );
    expect(scheduleNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'weekly', weekday: 3 }),
      expect.anything(),
    );
  });
});
