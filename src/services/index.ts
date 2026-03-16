// src/services/index.ts
// 统一的服务入口，包含AI服务和日历事件服务

import { ParseMessageResult, ParsedSchedulePayload, Schedule, ScheduleDraft } from '../types';

// ===== AI Service =====
export interface IAIService {
  parseMessage(message: string): Promise<ParseMessageResult>;
}

export interface AIServiceConfig {
  apiKey: string;
  apiUrl?: string;
  model?: string;
}

export class AIService implements IAIService {
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    this.config = {
      apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-flash:generateContent',
      model: 'gemini-2.5-pro-flash',
      ...config
    };
  }

  async parseMessage(message: string): Promise<ParseMessageResult> {
    try {
      const response = await fetch(`${this.config.apiUrl}?key=${this.config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `请解析以下日程安排请求并返回JSON格式的数据：\n\n"${message}"\n\n请按以下格式返回数据：\n{\n  "title": "日程标题",\n  "start_time": "开始时间(ISO 8601格式)",\n  "end_time": "结束时间(ISO 8601格式)",\n  "timezone": "时区",\n  "reminder_minutes_before": "提前几分钟提醒",\n  "recurrence": "重复频率",\n  "notes": "备注"\n}`
            }]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        console.error(`AI API error: ${response.status} ${response.statusText}`);
        return {
          ok: false,
          error: 'service_unavailable',
        };
      }

      const data = await response.json();

      // 提取AI响应中的内容
      let contentText = '';
      try {
        contentText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // 清理响应文本，移除可能的markdown代码块标记
        contentText = contentText.replace(/```json\n?/, '').replace(/\n?```/, '');

        const parsedData: ParsedSchedulePayload = JSON.parse(contentText);

        if (!parsedData) {
          return {
            ok: false,
            error: 'empty_response',
          };
        }

        return {
          ok: true,
          data: parsedData,
        };
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError, contentText);
        return {
          ok: false,
          error: 'invalid_format',
        };
      }
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

export function createAIService(config: AIServiceConfig): IAIService {
  aiService = new AIService(config);
  return aiService;
}

export function getAIService(): IAIService | null {
  return aiService;
}

export function resetAIService(): void {
  aiService = null;
}

// ===== Calendar Event Service =====
export interface ICalendarEventService {
  createEvent(event: Schedule | ScheduleDraft): Promise<Schedule>;
  getEvents(): Promise<Schedule[]>;
  getEventById(id: string): Promise<Schedule | undefined>;
  updateEvent(id: string, updatedData: Partial<Schedule>): Promise<Schedule | undefined>;
  deleteEvent(id: string): Promise<boolean>;
}

export interface CalendarEventServiceConfig {
  storagePath?: string;
  maxEvents?: number;
}

export class CalendarEventService implements ICalendarEventService {
  private events: Schedule[] = [];
  private config: CalendarEventServiceConfig;

  constructor(config?: CalendarEventServiceConfig) {
    this.config = {
      storagePath: './events.json',
      maxEvents: 1000,
      ...config
    };

    // 初始化可能从存储中加载现有事件
    this.loadEvents();
  }

  public async createEvent(event: Schedule | ScheduleDraft): Promise<Schedule> {
    // 为新事件生成ID（如果不存在）
    const newEvent = {
      ...event,
      id: event.id || this.generateId(),
      createdAt: event.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Schedule;

    // 验证是否是有效的Schedule类型
    if (!this.isValidSchedule(newEvent)) {
      throw new Error('Invalid schedule data provided');
    }

    this.events.push(newEvent);
    await this.saveEvents();

    return newEvent;
  }

  public async getEvents(): Promise<Schedule[]> {
    return [...this.events];
  }

  public async getEventById(id: string): Promise<Schedule | undefined> {
    return this.events.find(event => event.id === id);
  }

  public async updateEvent(id: string, updatedData: Partial<Schedule>): Promise<Schedule | undefined> {
    const index = this.events.findIndex(event => event.id === id);
    if (index !== -1) {
      const updatedEvent = {
        ...this.events[index],
        ...updatedData,
        updatedAt: new Date().toISOString()
      };

      this.events[index] = updatedEvent;
      await this.saveEvents();
      return this.events[index];
    }
    return undefined;
  }

  public async deleteEvent(id: string): Promise<boolean> {
    const initialLength = this.events.length;
    this.events = this.events.filter(event => event.id !== id);

    if (initialLength !== this.events.length) {
      await this.saveEvents();
      return true;
    }
    return false;
  }

  private isValidSchedule(schedule: any): schedule is Schedule {
    return (
      typeof schedule.id === 'string' &&
      typeof schedule.title === 'string' &&
      typeof schedule.startAt === 'string' &&
      typeof schedule.timezone === 'string' &&
      typeof schedule.reminderMinutesBefore === 'number' &&
      typeof schedule.recurrence === 'string' &&
      typeof schedule.notes === 'string' &&
      typeof schedule.createdAt === 'string' &&
      typeof schedule.updatedAt === 'string'
    );
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  private async loadEvents(): Promise<void> {
    // 从持久化存储加载事件的逻辑
    // 这里可以根据需要实现具体的存储方式（如本地存储、数据库等）
    try {
      if (this.config.storagePath) {
        // 实现从文件系统或其他存储加载事件的逻辑
        // 为了演示目的，暂时保留为空数组
        this.events = [];
      }
    } catch (error) {
      console.error('Failed to load events:', error);
      this.events = [];
    }
  }

  private async saveEvents(): Promise<void> {
    // 将事件保存到持久化存储的逻辑
    // 这里可以根据需要实现具体的存储方式（如本地存储、数据库等）
    try {
      if (this.config.storagePath) {
        // 实现保存到文件系统或其他存储的逻辑
        // 为了演示目的，暂时只记录到控制台
        console.log(`Saving ${this.events.length} events to ${this.config.storagePath}`);
      }
    } catch (error) {
      console.error('Failed to save events:', error);
    }
  }
}

let calendarEventService: ICalendarEventService | null = null;

export function createCalendarEventService(config?: CalendarEventServiceConfig): ICalendarEventService {
  if (!calendarEventService) {
    calendarEventService = new CalendarEventService(config);
  }
  return calendarEventService;
}

export function getCalendarEventService(): ICalendarEventService | null {
  return calendarEventService;
}

export function resetCalendarEventService(): void {
  calendarEventService = null;
}