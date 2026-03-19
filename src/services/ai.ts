import type { ParseMessageResult, ParsedSchedulePayload } from '../types';
import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

export interface IAIService {
  parseMessage(message: string): Promise<ParseMessageResult>;
}

export interface AIServiceConfig {
  apiKey: string;
  provider?: 'google' | 'openai' | 'anthropic';
  model?: string;
  baseUrl?: string;
}

type ProviderInstance = ReturnType<typeof createGoogleGenerativeAI> | ReturnType<typeof createOpenAI> | ReturnType<typeof createAnthropic>;

export class AIService implements IAIService {
  private config: AIServiceConfig;
  private providerInstance: ProviderInstance;

  constructor(config: AIServiceConfig) {
    this.config = {
      provider: 'google',
      model: 'gemini-2.5-pro-flash',
      ...config
    };

    switch (this.config.provider) {
      case 'openai':
        this.providerInstance = createOpenAI({
          apiKey: this.config.apiKey,
          baseURL: this.config.baseUrl,
        });
        break;
      case 'anthropic':
        this.providerInstance = createAnthropic({
          apiKey: this.config.apiKey,
          baseURL: this.config.baseUrl
        });
        break;
      default:
        this.providerInstance = createGoogleGenerativeAI({
          apiKey: this.config.apiKey,
          baseURL: this.config.baseUrl
        });
    }
  }

  async parseMessage(message: string): Promise<ParseMessageResult> {
    try {
      const scheduleSchema = z.object({
        title: z.string().describe('Schedule title'),
        start_time: z.string().describe('Start time in ISO 8601 format'),
        end_time: z.optional(z.string()).describe('End time in ISO 8601 format'),
        timezone: z.optional(z.string()).describe('Timezone identifier'),
        reminder_minutes_before: z.optional(z.number()).describe('Minutes before to send reminder'),
        recurrence: z.optional(z.string()).describe('Recurrence frequency'),
        notes: z.optional(z.string()).describe('Additional notes'),
        confidence: z.optional(z.number()).describe('Confidence score between 0 and 1')
      });

      const model = this.config.provider === 'openai'
        ? (this.providerInstance as ReturnType<typeof createOpenAI>).chat(this.config.model!)
        : (this.providerInstance as ReturnType<typeof createGoogleGenerativeAI>)(this.config.model!);
      const result = await generateObject({
        model,
        schema: scheduleSchema,
        prompt: `Parse the following schedule request and return structured data:\n\n"${message}"\n\nReturn the corresponding field data as required.`,
      });

      if (!result.object) {
        return {
          ok: false,
          error: 'empty_response',
        };
      }

      return {
        ok: true,
        data: result.object as ParsedSchedulePayload,
      };
    } catch (error) {
      console.error('Error calling AI service:', error);
      return {
        ok: false,
        error: 'service_unavailable',
      };
    }
  }
}

let aiService: IAIService | null = null;
let currentConfig: AIServiceConfig | null = null;

export function createAIService(config: AIServiceConfig): IAIService {
  if (!currentConfig ||
      currentConfig.apiKey !== config.apiKey ||
      currentConfig.provider !== config.provider ||
      currentConfig.model !== config.model) {
    currentConfig = config;
    aiService = new AIService(config);
  }

  return aiService!;
}

export function getAIService(): IAIService | null {
  return aiService;
}

export function resetAIService(): void {
  aiService = null;
  currentConfig = null;
}
