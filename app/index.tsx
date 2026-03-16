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
  // 从环境变量获取AI配置
  const provider = process.env.EXPO_PUBLIC_AI_PROVIDER || 'google';
  let apiKey = '';

  switch(provider) {
    case 'google':
      apiKey = process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY || '';
      break;
    case 'openai':
      apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
      break;
    case 'anthropic':
      apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '';
      break;
    default:
      apiKey = process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY || '';
  }

  if (!apiKey) {
    throw new Error('AI API key is not configured');
  }

  const result = await parseMessageWithAI(message, {
    provider: provider as 'google' | 'openai' | 'anthropic',
    apiKey,
    model: process.env.EXPO_PUBLIC_GOOGLE_MODEL_NAME || 'gemini-2.5-pro-exp'
  });

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