import { asyncStorage, type KeyValueStorage } from '../lib/storage';
import type { Schedule } from '../types';

const SCHEDULES_STORAGE_KEY = 'schedules';

async function readSchedules(storage: KeyValueStorage) {
  try {
    const raw = await storage.getItem(SCHEDULES_STORAGE_KEY);
    if (!raw) {
      return [] as Schedule[];
    }
    return JSON.parse(raw) as Schedule[];
  } catch {
    return [] as Schedule[];
  }
}

async function writeSchedules(storage: KeyValueStorage, schedules: Schedule[]) {
  await storage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(schedules));
}

export function createScheduleRepository(storage: KeyValueStorage = asyncStorage) {
  return {
    async createSchedule(schedule: Schedule) {
      const schedules = await readSchedules(storage);
      await writeSchedules(storage, [...schedules, schedule]);
      return schedule;
    },
    async listSchedules() {
      return readSchedules(storage);
    },
    async getScheduleById(id: string) {
      const schedules = await readSchedules(storage);
      return schedules.find((item) => item.id === id);
    },
    async updateSchedule(schedule: Schedule) {
      const schedules = await readSchedules(storage);
      const updated = schedules.map((item) => (item.id === schedule.id ? schedule : item));
      await writeSchedules(storage, updated);
      return schedule;
    },
    async deleteSchedule(id: string) {
      const schedules = await readSchedules(storage);
      await writeSchedules(
        storage,
        schedules.filter((item) => item.id !== id),
      );
    },
  };
}
