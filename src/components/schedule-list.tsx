import { Text, View } from 'react-native';
import { useLocale } from '../context/LocaleContext';

import type { Schedule } from '../types';

type ScheduleListProps = {
  schedules: Schedule[];
};

export function ScheduleList({ schedules }: ScheduleListProps) {
  const { t } = useLocale(); // 添加国际化钩子

  if (schedules.length === 0) {
    return <Text>{t('schedule.emptyList')}</Text>;
  }

  return (
    <View>
      {schedules.map((schedule) => (
        <View key={schedule.id}>
          <Text>{schedule.title}</Text>
          <Text>{schedule.startAt}</Text>
          <Text>{schedule.notes}</Text>
        </View>
      ))}
    </View>
  );
}
