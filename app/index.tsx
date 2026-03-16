// app/index.tsx
import { useState } from 'react';
import { Text, View } from 'react-native';

import { MessageInputForm } from '../src/components/message-input-form';
import { normalizeDraft } from '../src/features/schedule/normalizer';
import { parseMessageWithAI } from '../src/features/schedule/parse-message';
import type { ScheduleDraft } from '../src/types';

type IndexScreenProps = {
  onSubmit?(message: string): Promise<ScheduleDraft>;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    switch (error.message) {
      case 'service_unavailable':
        return '解析服务暂时不可用，请稍后再试';
      case 'empty_response':
        return '未能解析出日程信息，请换一种描述再试';
      case 'invalid_format':
        return '解析结果格式异常，请稍后再试';
      default:
        return '解析失败，请稍后再试';
    }
  }

  return '解析失败，请稍后再试';
}

async function defaultSubmit(message: string) {
  const result = await parseMessageWithAI(message);

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

    try {
      const nextDraft = await onSubmit(message);
      setDraft(nextDraft);
    } catch (error) {
      setError(getErrorMessage(error));
    }
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