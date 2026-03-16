// app/index.tsx
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useLocale } from '../src/context/LocaleContext';

import { MessageInputForm } from '../src/components/message-input-form';
import { normalizeDraft } from '../src/features/schedule/normalizer';
import { parseMessageWithAI } from '../src/features/schedule/parse-message';
import { ConfigManager } from '../src/config/ai-config';
import type { ScheduleDraft } from '../src/types';

type IndexScreenProps = {
  onSubmit?(message: string): Promise<ScheduleDraft>;
};

function getErrorMessage(error: unknown, t: (key: string) => string) {
  if (error instanceof Error) {
    switch (error.message) {
      case 'service_unavailable':
        return t('messages.serverError');
      case 'empty_response':
        return t('messages.dataLoadFailed');
      case 'invalid_format':
        return t('messages.validationError');
      default:
        return t('messages.error');
    }
  }

  return t('messages.error');
}

async function defaultSubmit(message: string) {
  const configManager = ConfigManager.getInstance();
  const aiConfig = configManager.getAIConfig();

  if (!aiConfig.apiKey) {
    throw new Error('AI API key is not configured');
  }

  const result = await parseMessageWithAI(message, aiConfig);

  if (!result.ok) {
    throw new Error(result.error);
  }

  return normalizeDraft(result.data);
}

export default function IndexScreen({ onSubmit = defaultSubmit }: IndexScreenProps) {
  const { t } = useLocale(); // 添加国际化钩子
  const [draft, setDraft] = useState<ScheduleDraft | null>(null);
  const [error, setError] = useState('');

  async function handleSubmit(message: string) {
    setError('');

    try {
      const nextDraft = await onSubmit(message);
      setDraft(nextDraft);
    } catch (error) {
      setError(getErrorMessage(error, t));
    }
  }

  return (
    <View>
      <MessageInputForm onSubmit={handleSubmit} error={error} />
      {draft ? (
        <View>
          <Text>{t('schedule.draftSaved')}</Text>
          <Text>{draft.title}</Text>
        </View>
      ) : null}
    </View>
  );
}