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

export function createReminderScheduler(driver: ReminderDriver = defaultDriver) {
  return {
    async scheduleReminder(schedule: Schedule) {
      const notificationDate = subtractMinutes(schedule.startAt, schedule.reminderMinutesBefore);
      const trigger = getRepeatTrigger(schedule.recurrence, notificationDate) ?? {
        type: 'date' as const,
        date: notificationDate,
      };

      return driver.scheduleNotification(trigger, {
        title: schedule.title,
        body: schedule.notes || '你有一个即将开始的日程',
      });
    },
    async updateReminder(schedule: Schedule) {
      if (schedule.notificationId) {
        await driver.cancelNotification(schedule.notificationId);
      }

      return this.scheduleReminder(schedule);
    },
    async cancelReminder(notificationId: string) {
      await driver.cancelNotification(notificationId);
    },
  };
}
