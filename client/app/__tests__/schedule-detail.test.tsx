import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { TamaguiProvider } from 'tamagui';
import config from '@/theme/tamagui.config';
import { LocaleProvider } from '@/context/LocaleContext';
import { Recurrence } from '@/constants';
import type { Schedule } from '@/types';

const mockListSchedules = jest.fn();
const mockUpdateSchedule = jest.fn();

jest.mock('@/services', () => ({
  listSchedules: (...args: unknown[]) => mockListSchedules(...args),
  updateSchedule: (...args: unknown[]) => mockUpdateSchedule(...args),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn().mockResolvedValue('test-device-id'),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

const mockRouterBack = (globalThis as Record<string, unknown>).__mockRouterBack as jest.Mock;

import ScheduleDetailScreen from '../schedule/[id]';

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <TamaguiProvider config={config} defaultTheme="light">
      <LocaleProvider>
        {ui}
      </LocaleProvider>
    </TamaguiProvider>
  );
}

const baseSchedule: Schedule = {
  id: 'schedule-edit-1',
  title: '需求评审会',
  startAt: '2026-03-20T15:00:00.000Z',
  timezone: 'Asia/Shanghai',
  reminderMinutesBefore: 30,
  recurrence: Recurrence.NONE,
  notes: '带上原型',
  createdAt: '2026-03-19T09:00:00.000Z',
  updatedAt: '2026-03-19T09:00:00.000Z',
};

describe('schedule detail page', () => {
  beforeEach(() => {
    mockRouterBack.mockClear();
    mockListSchedules.mockClear();
    mockUpdateSchedule.mockClear();
    (globalThis as Record<string, unknown>).__mockSearchParams = { id: 'schedule-edit-1' };
    mockListSchedules.mockResolvedValue([baseSchedule]);
  });

  it('loads and displays the schedule in the form', async () => {
    renderWithProviders(<ScheduleDetailScreen />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('需求评审会')).toBeOnTheScreen();
    });
    expect(screen.getByDisplayValue('带上原型')).toBeOnTheScreen();
    expect(screen.getByText('Save')).toBeOnTheScreen();
  });

  it('saves edited schedule and navigates back', async () => {
    mockUpdateSchedule.mockResolvedValue({ ...baseSchedule, title: '更新后的会议' });
    renderWithProviders(<ScheduleDetailScreen />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('需求评审会')).toBeOnTheScreen();
    });

    fireEvent.changeText(screen.getByLabelText('Event Name'), '更新后的会议');
    fireEvent.press(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockRouterBack).toHaveBeenCalled();
    });

    expect(mockUpdateSchedule).toHaveBeenCalledWith(
      'schedule-edit-1',
      expect.objectContaining({ title: '更新后的会议' }),
    );
  });

  it('navigates back when schedule is not found', async () => {
    (globalThis as Record<string, unknown>).__mockSearchParams = { id: 'non-existent' };
    renderWithProviders(<ScheduleDetailScreen />);

    await waitFor(() => {
      expect(mockRouterBack).toHaveBeenCalled();
    });
  });
});
