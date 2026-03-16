import { useState } from 'react';
import { ActivityIndicator, Button, Text, TextInput, View } from 'react-native';

type MessageInputFormProps = {
  onSubmit(message: string): Promise<void>;
  error?: string;
};

export function MessageInputForm({ onSubmit, error }: MessageInputFormProps) {
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
      <Text>输入消息</Text>
      <TextInput accessibilityLabel="消息输入框" value={message} onChangeText={setMessage} />
      <Button title="开始解析" onPress={handleSubmit} />
      {submitting ? <ActivityIndicator /> : null}
      {error ? <Text>{error}</Text> : null}
    </View>
  );
}
