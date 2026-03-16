import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocale } from '../src/context/LocaleContext';

import { ScheduleList } from '../src/components/schedule-list';
import { createScheduleRepository } from '../src/features/schedule/repository';
import type { Schedule } from '../src/types';

type SchedulesScreenProps = {
  schedules?: Schedule[];
};

export default function SchedulesScreen({ schedules }: SchedulesScreenProps) {
  const { t } = useLocale(); // 添加国际化钩子
  const [items, setItems] = useState<Schedule[]>(schedules ?? []);

  useEffect(() => {
    if (schedules) {
      setItems(schedules);
      return;
    }

    createScheduleRepository()
      .listSchedules()
      .then(setItems);
  }, [schedules]);

  return (
    <View>
      <Text>{t('schedule.scheduleList')}</Text>
      <ScheduleList schedules={items} />
    </View>
  );
}
