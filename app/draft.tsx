import { useState } from 'react';
import { Text, View } from 'react-native';
import { useLocale } from '../src/context/LocaleContext';

import { ScheduleDraftForm } from '../src/components/schedule-draft-form';
import { createScheduleRepository } from '../src/features/schedule/repository';
import { createReminderScheduler } from '../src/features/schedule/reminders';
import { validateDraft } from '../src/features/schedule/validation';
import type { Schedule, ScheduleDraft } from '../src/types';

const fallbackDraft: ScheduleDraft = {
  title: '待确认日程',
  startAt: '2026-03-17T15:00:00.000Z',
  timezone: 'Asia/Shanghai',
  reminderMinutesBefore: 30,
  recurrence: 'NONE',
  notes: '',
  confidence: 0.5,
  missingFields: [],
};

type DraftScreenProps = {
  initialDraft?: ScheduleDraft;
  onCreate?(draft: ScheduleDraft): Promise<Schedule>;
};

async function defaultCreate(draft: ScheduleDraft) {
  const { t } = useLocale(); // 从全局上下文获取国际化函数
  const repository = createScheduleRepository();
  const reminders = createReminderScheduler();
  const now = new Date().toISOString();
  const scheduleBase: Schedule = {
    id: `schedule-${Date.now()}`,
    title: draft.title,
    startAt: draft.startAt,
    endAt: draft.endAt,
    timezone: draft.timezone,
    reminderMinutesBefore: draft.reminderMinutesBefore,
    recurrence: draft.recurrence,
    notes: draft.notes,
    createdAt: now,
    updatedAt: now,
  };
  const notificationId = await reminders.scheduleReminder(scheduleBase, t);
  const schedule = {
    ...scheduleBase,
    notificationId,
  };

  await repository.createSchedule(schedule);

  return schedule;
}

export default function DraftScreen({ initialDraft = fallbackDraft, onCreate = defaultCreate }: DraftScreenProps) {
  const { t } = useLocale(); // 添加国际化钩子
  const [draft, setDraft] = useState(initialDraft);
  const [errors, setErrors] = useState<string[]>([]);
  const [createdSchedule, setCreatedSchedule] = useState<Schedule | null>(null);

  async function handleSubmit() {
    const result = validateDraft(draft);
    setErrors(result.errors);

    if (!result.valid) {
      return;
    }

    const schedule = await onCreate(draft);
    setCreatedSchedule(schedule);
  }

  return (
    <View>
      <Text>{t('schedule.saveDraft')}</Text>
      <ScheduleDraftForm draft={draft} errors={errors} onChange={setDraft} onSubmit={handleSubmit} />
      {createdSchedule ? <Text>{t('schedule.published')}</Text> : null}
    </View>
  );
}
