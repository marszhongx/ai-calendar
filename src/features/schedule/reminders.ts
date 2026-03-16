import * as Notifications from 'expo-notifications';

import { getRepeatTrigger, subtractMinutes } from '../../lib/date-time';
import type { NotificationTriggerInput } from 'expo-notifications';
import type { RepeatTrigger, Schedule } from '../../types';

type DateTrigger = {
  type: 'date';
  date: Date;
};

type ReminderDriver = {
  scheduleNotification(trigger: RepeatTrigger | DateTrigger, content: { title: string; body: string }): Promise<string>;
  cancelNotification(notificationId: string): void | Promise<void>;
};

const defaultDriver: ReminderDriver = {
  async scheduleNotification(trigger, content) {
    return Notifications.scheduleNotificationAsync({
      content,
      trigger: trigger as NotificationTriggerInput,
    });
  },
  async cancelNotification(notificationId) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  },
};

type ReminderScheduler = {
  scheduleReminder(schedule: Schedule, t?: (key: string) => string): Promise<string>;
  updateReminder(schedule: Schedule, t?: (key: string) => string): Promise<string>;
  cancelReminder(notificationId: string): Promise<void>;
};

export function createReminderScheduler(driver: ReminderDriver = defaultDriver): ReminderScheduler {
  return {
    async scheduleReminder(schedule: Schedule, t?: (key: string) => string) {
      const notificationDate = subtractMinutes(schedule.startAt, schedule.reminderMinutesBefore);
      const trigger = getRepeatTrigger(schedule.recurrence, notificationDate) ?? {
        type: 'date' as const,
        date: notificationDate,
      };

      return driver.scheduleNotification(trigger, {
        title: schedule.title,
        body: schedule.notes || (t ? t('schedule.remindMe') : 'You have an upcoming schedule'),
      });
    },
    async updateReminder(schedule: Schedule, t?: (key: string) => string) {
      if (schedule.notificationId) {
        await driver.cancelNotification(schedule.notificationId);
      }

      return this.scheduleReminder(schedule, t);
    },
    async cancelReminder(notificationId: string) {
      await driver.cancelNotification(notificationId);
    },
  };
}
