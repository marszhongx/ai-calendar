import { Button, Text, TextInput, View } from 'react-native';

import type { ScheduleDraft } from '../types';

type ScheduleDraftFormProps = {
  draft: ScheduleDraft;
  errors: string[];
  onChange(draft: ScheduleDraft): void;
  onSubmit(): void;
};

export function ScheduleDraftForm({ draft, errors, onChange, onSubmit }: ScheduleDraftFormProps) {
  return (
    <View>
      <TextInput
        accessibilityLabel="标题"
        value={draft.title}
        onChangeText={(title) => onChange({ ...draft, title })}
      />
      <TextInput
        accessibilityLabel="开始时间"
        value={draft.startAt}
        onChangeText={(startAt) => onChange({ ...draft, startAt })}
      />
      <TextInput
        accessibilityLabel="提醒提前分钟"
        value={String(draft.reminderMinutesBefore)}
        onChangeText={(value) =>
          onChange({
            ...draft,
            reminderMinutesBefore: Number.isNaN(Number(value)) ? 0 : Number(value),
          })
        }
      />
      <View>
        <Text>重复规则</Text>
        <View>
          <Button title="不重复" onPress={() => onChange({ ...draft, recurrence: 'NONE' })} />
          <Button title="每天" onPress={() => onChange({ ...draft, recurrence: 'DAILY' })} />
          <Button title="每周" onPress={() => onChange({ ...draft, recurrence: 'WEEKLY' })} />
          <Button title="每月" onPress={() => onChange({ ...draft, recurrence: 'MONTHLY' })} />
        </View>
        <Text>{draft.recurrence}</Text>
      </View>
      <TextInput
        accessibilityLabel="备注"
        value={draft.notes}
        onChangeText={(notes) => onChange({ ...draft, notes })}
      />
      <Button title="创建日程" onPress={onSubmit} />
      {errors.map((error) => (
        <Text key={error}>{error}</Text>
      ))}
    </View>
  );
}
