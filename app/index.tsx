import { useState } from 'react';
import { Text, View } from 'react-native';

import { MessageInputForm } from '../src/components/message-input-form';
import { normalizeDraft } from '../src/features/schedule/normalizer';
import { parseMessage } from '../src/features/schedule/parse-message';
import type { ScheduleDraft } from '../src/types';

type IndexScreenProps = {
  onSubmit?(message: string): Promise<ScheduleDraft>;
};

async function defaultSubmit(message: string) {
  const endpoint = process.env.EXPO_PUBLIC_PARSE_API_URL ?? '';
  const result = await parseMessage(message, endpoint);

  if (!result.ok) {
    throw new Error(result.error);
  }

  return normalizeDraft(result.data);
}

export default function IndexScreen({ onSubmit = defaultSubmit }: IndexScreenProps) {
  const [draft, setDraft] = useState<ScheduleDraft | null>(null);
  const [error, setError] = useState('');

  async function handleSubmit(message: string) {
    setError('');
    const nextDraft = await onSubmit(message);
    setDraft(nextDraft);
  }

  return (
    <View>
      <MessageInputForm onSubmit={handleSubmit} error={error} />
      {draft ? (
        <View>
          <Text>已生成草案</Text>
          <Text>{draft.title}</Text>
        </View>
      ) : null}
    </View>
  );
}
