import type { ParseMessageResult } from '../../types';
import { createAIService, AIServiceConfig } from '../../services';
import { ConfigManager } from '../../config/ai-config';

export async function parseMessageWithAI(message: string, config?: AIServiceConfig): Promise<ParseMessageResult> {
  // 如果提供了配置，则使用提供的配置
  if (config) {
    const aiService = createAIService(config);
    return aiService.parseMessage(message);
  }

  // 否则使用配置管理器中的配置
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
  return aiService.parseMessage(message);
}

// 保持原有的函数签名作为备选
export async function parseMessage(message: string, endpoint: string): Promise<ParseMessageResult> {
  // 如果有提供endpoint，则使用旧的API方式
  if (endpoint) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      return {
        ok: false,
        error: 'service_unavailable',
      };
    }

    try {
      const payload = await response.json();

      if (!payload?.draft) {
        return {
          ok: false,
          error: 'empty_response',
        };
      }

      return {
        ok: true,
        data: payload.draft,
      };
    } catch {
      return {
        ok: false,
        error: 'invalid_format',
      };
    }
  } else {
    // 否则使用AI服务
    return parseMessageWithAI(message);
  }
}
