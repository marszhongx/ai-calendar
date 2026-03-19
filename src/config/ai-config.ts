// src/config/ai-config.ts
import { AIServiceConfig } from '../services/ai';

export interface AppConfig {
  aiProvider: 'google' | 'openai' | 'anthropic';
  aiModel: string;
  aiApiKey: string;
  aiBaseUrl?: string;
}

export class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig;

  private constructor() {
    // 从环境变量或默认值初始化配置
    this.config = {
      aiProvider: (process.env.EXPO_PUBLIC_AI_PROVIDER as 'google' | 'openai' | 'anthropic') || 'google',
      aiModel: process.env.EXPO_PUBLIC_AI_MODEL_NAME || 'gemini-2.5-pro',
      aiApiKey: process.env.EXPO_PUBLIC_AI_API_KEY || '',
      aiBaseUrl: process.env.EXPO_PUBLIC_AI_BASE_URL || undefined,
    };
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public getConfig(): AppConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<AppConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getAIConfig(): AIServiceConfig {
    return {
      apiKey: this.config.aiApiKey,
      provider: this.config.aiProvider,
      model: this.config.aiModel,
      baseUrl: this.config.aiBaseUrl || undefined,
    };
  }

  public setProvider(provider: 'google' | 'openai' | 'anthropic'): void {
    this.config.aiProvider = provider;
  }

  public setModel(model: string): void {
    this.config.aiModel = model;
  }

  public setApiKey(apiKey: string): void {
    this.config.aiApiKey = apiKey;
  }

  public setBaseUrl(baseUrl: string): void {
    this.config.aiBaseUrl = baseUrl;
  }

  public getProvider(): 'google' | 'openai' | 'anthropic' {
    return this.config.aiProvider;
  }

  public getModel(): string {
    return this.config.aiModel;
  }

  public getApiKey(): string {
    return this.config.aiApiKey;
  }

  public getBaseUrl(): string | undefined {
    return this.config.aiBaseUrl;
  }
}