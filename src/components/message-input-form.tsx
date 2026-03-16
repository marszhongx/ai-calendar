import { useState } from 'react';
import { ActivityIndicator, Button, Text, TextInput, View } from 'react-native';
import { useLocale } from '../context/LocaleContext';

type MessageInputFormProps = {
  onSubmit(message: string): Promise<void>;
  error?: string;
};

export function MessageInputForm({ onSubmit, error }: MessageInputFormProps) {
  const { t } = useLocale(); // 添加国际化钩子
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);

    try {
      await onSubmit(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View>
      <Text>{t('schedule.description')}</Text>
      <TextInput accessibilityLabel={t('schedule.description')} value={message} onChangeText={setMessage} />
      <Button title={t('schedule.create')} onPress={handleSubmit} />
      {submitting ? <ActivityIndicator /> : null}
      {error ? <Text>{error}</Text> : null}
    </View>
  );
}
