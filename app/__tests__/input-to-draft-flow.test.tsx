import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { TamaguiProvider } from 'tamagui';
import config from '../../src/theme/tamagui.config';
import { LocaleProvider } from '../../src/context/LocaleContext';

import DraftScreen from '../draft';
import IndexScreen from '../index';
import SchedulesScreen from '../schedules';
import type { ScheduleDraft } from '../../src/types';

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <TamaguiProvider config={config} defaultTheme="light">
      <LocaleProvider>
        {ui}
      </LocaleProvider>
    </TamaguiProvider>
  );
}

describe('input to draft flow', () => {
  it('renders the input screen placeholder', () => {
    renderWithProviders(<IndexScreen />);

    expect(screen.getByText('Description')).toBeOnTheScreen();
  });

  it('renders the draft screen placeholder', () => {
    renderWithProviders(<DraftScreen />);

    expect(screen.getByText('Save Draft')).toBeOnTheScreen();
  });

  it('renders the schedules screen placeholder', async () => {
    renderWithProviders(<SchedulesScreen />);

    expect(screen.getByText('Schedule List')).toBeOnTheScreen();
    await waitFor(() => {
      expect(screen.getByText('No schedules yet')).toBeOnTheScreen();
    });
  });

  it('shows a fallback parse error when parsing fails with an unknown code', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('parse failed'));
    renderWithProviders(<IndexScreen onSubmit={onSubmit} />);

    fireEvent.changeText(screen.getByLabelText('Description'), '这是一条无法解析的消息');
    fireEvent.press(screen.getByText('Create Schedule'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('这是一条无法解析的消息');
    });

    expect(screen.getByText('Operation failed')).toBeOnTheScreen();
    expect(screen.queryByText('Draft saved')).not.toBeOnTheScreen();
  });

  it('shows the service unavailable message for service_unavailable errors', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('service_unavailable'));
    renderWithProviders(<IndexScreen onSubmit={onSubmit} />);

    fireEvent.changeText(screen.getByLabelText('Description'), '服务暂不可用');
    fireEvent.press(screen.getByText('Create Schedule'));

    expect(await screen.findByText('Server error')).toBeOnTheScreen();
  });

  it('shows the empty response message for empty_response errors', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('empty_response'));
    renderWithProviders(<IndexScreen onSubmit={onSubmit} />);

    fireEvent.changeText(screen.getByLabelText('Description'), '返回为空');
    fireEvent.press(screen.getByText('Create Schedule'));

    expect(await screen.findByText('Data loading failed')).toBeOnTheScreen();
  });

  it('shows the invalid format message for invalid_format errors', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('invalid_format'));
    renderWithProviders(<IndexScreen onSubmit={onSubmit} />);

    fireEvent.changeText(screen.getByLabelText('Description'), '格式异常');
    fireEvent.press(screen.getByText('Create Schedule'));

    expect(await screen.findByText('Data validation error')).toBeOnTheScreen();
  });

  it('clears the old parse error after a successful retry and shows the draft', async () => {
    const onSubmit = jest
      .fn()
      .mockRejectedValueOnce(new Error('parse failed'))
      .mockResolvedValueOnce({
        title: '需求评审会',
        startAt: '2026-03-17T15:00:00.000Z',
        timezone: 'Asia/Shanghai',
        reminderMinutesBefore: 30,
        recurrence: 'NONE',
        notes: '',
        confidence: 0.9,
        missingFields: [],
      } satisfies ScheduleDraft);
    renderWithProviders(<IndexScreen onSubmit={onSubmit} />);

    fireEvent.changeText(screen.getByLabelText('Description'), '先失败一次');
    fireEvent.press(screen.getByText('Create Schedule'));

    expect(await screen.findByText('Operation failed')).toBeOnTheScreen();

    fireEvent.changeText(screen.getByLabelText('Description'), '明天下午三点开需求评审会');
    fireEvent.press(screen.getByText('Create Schedule'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenNthCalledWith(1, '先失败一次');
      expect(onSubmit).toHaveBeenNthCalledWith(2, '明天下午三点开需求评审会');
    });

    expect(screen.queryByText('Operation failed')).not.toBeOnTheScreen();
    expect(screen.getByText('Draft saved')).toBeOnTheScreen();
    expect(screen.getByText('需求评审会')).toBeOnTheScreen();
  });

  it('shows draft validation errors when required fields are missing', () => {
    renderWithProviders(
      <DraftScreen
        initialDraft={{
          title: '',
          startAt: '',
          timezone: 'Asia/Shanghai',
          reminderMinutesBefore: 30,
          recurrence: 'NONE',
          notes: '',
          confidence: 0.4,
          missingFields: ['title', 'startAt'],
        }}
      />
    );

    fireEvent.press(screen.getByText('Create Schedule'));

    expect(screen.getByText('title is required')).toBeOnTheScreen();
  });

  it('creates a schedule and renders it in the list screen', async () => {
    const onCreate = jest.fn().mockResolvedValue({
      id: 'schedule-1',
      title: '需求评审会',
      startAt: '2026-03-17T15:00:00.000Z',
      timezone: 'Asia/Shanghai',
      reminderMinutesBefore: 10,
      recurrence: 'WEEKLY',
      notes: '带上原型',
      notificationId: 'notification-1',
      createdAt: '2026-03-16T09:00:00.000Z',
      updatedAt: '2026-03-16T09:00:00.000Z',
    });

    renderWithProviders(
      <DraftScreen
        onCreate={onCreate}
        initialDraft={{
          title: '需求评审会',
          startAt: '2026-03-17T15:00:00.000Z',
          timezone: 'Asia/Shanghai',
          reminderMinutesBefore: 30,
          recurrence: 'NONE',
          notes: '',
          confidence: 0.9,
          missingFields: [],
        }}
      />
    );

    fireEvent.changeText(screen.getByLabelText('Remind me'), '10');
    fireEvent.press(screen.getByText('Weekly'));
    fireEvent.changeText(screen.getByLabelText('Description'), '带上原型');
    fireEvent.press(screen.getByText('Create Schedule'));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          reminderMinutesBefore: 10,
          recurrence: 'WEEKLY',
          notes: '带上原型',
        }),
      );
    });

    expect(screen.getByText('Published')).toBeOnTheScreen();

    renderWithProviders(
      <SchedulesScreen
        schedules={[
          {
            id: 'schedule-1',
            title: '需求评审会',
            startAt: '2026-03-17T15:00:00.000Z',
            timezone: 'Asia/Shanghai',
            reminderMinutesBefore: 10,
            recurrence: 'WEEKLY',
            notes: '带上原型',
            notificationId: 'notification-1',
            createdAt: '2026-03-16T09:00:00.000Z',
            updatedAt: '2026-03-16T09:00:00.000Z',
          },
        ]}
      />
    );

    expect(screen.getAllByText('需求评审会').length).toBeGreaterThan(0);
    expect(screen.getByText('带上原型')).toBeOnTheScreen();
  });

  it('renders schedule card with time range when endAt exists', () => {
    renderWithProviders(
      <SchedulesScreen
        schedules={[
          {
            id: 'schedule-range',
            title: '团队会议',
            startAt: '2026-03-18T09:00:00.000Z',
            endAt: '2026-03-18T10:00:00.000Z',
            timezone: 'Asia/Shanghai',
            reminderMinutesBefore: 10,
            recurrence: 'NONE',
            notes: '',
            notificationId: 'n-1',
            createdAt: '2026-03-17T09:00:00.000Z',
            updatedAt: '2026-03-17T09:00:00.000Z',
          },
        ]}
      />
    );

    expect(screen.getByText('团队会议')).toBeOnTheScreen();
    expect(screen.getByText('2026-03-18T09:00:00.000Z - 2026-03-18T10:00:00.000Z')).toBeOnTheScreen();
  });

  it('hides notes when schedule notes is empty', () => {
    renderWithProviders(
      <SchedulesScreen
        schedules={[
          {
            id: 'schedule-no-notes',
            title: '空备注日程',
            startAt: '2026-03-18T09:00:00.000Z',
            timezone: 'Asia/Shanghai',
            reminderMinutesBefore: 0,
            recurrence: 'NONE',
            notes: '',
            notificationId: 'n-2',
            createdAt: '2026-03-17T09:00:00.000Z',
            updatedAt: '2026-03-17T09:00:00.000Z',
          },
        ]}
      />
    );

    expect(screen.getByText('空备注日程')).toBeOnTheScreen();
    expect(screen.queryByTestId('schedule-notes-schedule-no-notes')).not.toBeOnTheScreen();
  });
});
