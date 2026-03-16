import type { ParseMessageResult } from '../../types';
import { getAIService, createAIService } from '../../services';

export async function parseMessageWithAI(message: string): Promise<ParseMessageResult> {
  // 从环境变量获取API密钥和URL
  const apiKey = process.env.EXPO_PUBLIC_AI_API_KEY;
  const apiUrl = process.env.EXPO_PUBLIC_AI_API_URL;

  if (!apiKey) {
    console.error('AI API key is not configured');
    return {
      ok: false,
      error: 'service_unavailable',
    };
  }

  // 获取或创建AI服务实例
  let aiService = getAIService();
  if (!aiService) {
    aiService = createAIService({
      apiKey,
      apiUrl,
    });
  }

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
