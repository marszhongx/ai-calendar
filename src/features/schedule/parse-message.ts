import type { ParseMessageResult } from '../../types';
import { createAIService, AIServiceConfig } from '../../services';
import { ConfigManager } from '../../config/ai-config';

const PARSE_TIMEOUT_MS = 30_000;

export async function parseMessageWithAI(message: string, config?: AIServiceConfig): Promise<ParseMessageResult> {
  if (config) {
    const aiService = createAIService(config);
    return Promise.race([
      aiService.parseMessage(message),
      new Promise<ParseMessageResult>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), PARSE_TIMEOUT_MS)
      ),
    ]);
  }

  const configManager = ConfigManager.getInstance();
  const aiConfig = configManager.getAIConfig();

  if (!aiConfig.apiKey) {
    console.error('AI API key is not configured');
    return {
      ok: false,
      error: 'service_unavailable',
    };
  }

  const aiService = createAIService(aiConfig);
  return Promise.race([
    aiService.parseMessage(message),
    new Promise<ParseMessageResult>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), PARSE_TIMEOUT_MS)
    ),
  ]);
}
