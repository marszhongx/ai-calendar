import { Text, View } from 'react-native';

import type { Schedule } from '../types';

type ScheduleListProps = {
  schedules: Schedule[];
};

export function ScheduleList({ schedules }: ScheduleListProps) {
  if (schedules.length === 0) {
    return <Text>还没有已保存的日程</Text>;
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
