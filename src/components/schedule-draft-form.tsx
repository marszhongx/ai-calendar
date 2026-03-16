import { Button, Text, TextInput, View } from 'react-native';
import { useLocale } from '../context/LocaleContext';

import type { ScheduleDraft } from '../types';

type ScheduleDraftFormProps = {
  draft: ScheduleDraft;
  errors: string[];
  onChange(draft: ScheduleDraft): void;
  onSubmit(): void;
};

export function ScheduleDraftForm({ draft, errors, onChange, onSubmit }: ScheduleDraftFormProps) {
  const { t } = useLocale(); // 添加国际化钩子

  return (
    <View>
      <TextInput
        accessibilityLabel={t('schedule.eventName')}
        value={draft.title}
        onChangeText={(title) => onChange({ ...draft, title })}
      />
      <TextInput
        accessibilityLabel={t('schedule.startTime')}
        value={draft.startAt}
        onChangeText={(startAt) => onChange({ ...draft, startAt })}
      />
      <TextInput
        accessibilityLabel={t('schedule.remindMe')}
        value={String(draft.reminderMinutesBefore)}
        onChangeText={(value) =>
          onChange({
            ...draft,
            reminderMinutesBefore: Number.isNaN(Number(value)) ? 0 : Number(value),
          })
        }
      />
      <View>
        <Text>{t('schedule.repeat')}</Text>
        <View>
          <Button title={t('schedule.never')} onPress={() => onChange({ ...draft, recurrence: 'NONE' })} />
          <Button title={t('schedule.daily')} onPress={() => onChange({ ...draft, recurrence: 'DAILY' })} />
          <Button title={t('schedule.weekly')} onPress={() => onChange({ ...draft, recurrence: 'WEEKLY' })} />
          <Button title={t('schedule.monthly')} onPress={() => onChange({ ...draft, recurrence: 'MONTHLY' })} />
        </View>
        <Text>{draft.recurrence}</Text>
      </View>
      <TextInput
        accessibilityLabel={t('schedule.description')}
        value={draft.notes}
        onChangeText={(notes) => onChange({ ...draft, notes })}
      />
      <Button title={t('schedule.create')} onPress={onSubmit} />
      {errors.map((error) => (
        <Text key={error}>{error}</Text>
      ))}
    </View>
  );
}
