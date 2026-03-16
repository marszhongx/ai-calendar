import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { LocaleProvider } from '../../src/context/LocaleContext';

import DraftScreen from '../draft';
import IndexScreen from '../index';
import SchedulesScreen from '../schedules';
import type { ScheduleDraft } from '../../src/types';

describe('input to draft flow', () => {
  it('renders the input screen placeholder', () => {
    render(
      <LocaleProvider>
        <IndexScreen />
      </LocaleProvider>
    );

    expect(screen.getByText('Description')).toBeOnTheScreen(); // Actual English text in test env
  });

  it('renders the draft screen placeholder', () => {
    render(
      <LocaleProvider>
        <DraftScreen />
      </LocaleProvider>
    );

    expect(screen.getByText('Save Draft')).toBeOnTheScreen(); // Actual English text in test env
  });

  it('renders the schedules screen placeholder', async () => {
    render(
      <LocaleProvider>
        <SchedulesScreen />
      </LocaleProvider>
    );

    expect(screen.getByText('Schedule List')).toBeOnTheScreen(); // Actual English text in test env
    await waitFor(() => {
      expect(screen.getByText('No schedules yet')).toBeOnTheScreen(); // Actual English text in test env
    });
  });

  it('shows a fallback parse error when parsing fails with an unknown code', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('parse failed'));
    render(
      <LocaleProvider>
        <IndexScreen onSubmit={onSubmit} />
      </LocaleProvider>
    );

    fireEvent.changeText(screen.getByLabelText('Description'), '这是一条无法解析的消息');
    fireEvent.press(screen.getByText('Create Schedule')); // Actual English text in test env

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('这是一条无法解析的消息');
    });

    expect(screen.getByText('Operation failed')).toBeOnTheScreen(); // Actual English text in test env
    expect(screen.queryByText('Draft saved')).not.toBeOnTheScreen(); // Using actual text
  });

  it('shows the service unavailable message for service_unavailable errors', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('service_unavailable'));
    render(
      <LocaleProvider>
        <IndexScreen onSubmit={onSubmit} />
      </LocaleProvider>
    );

    fireEvent.changeText(screen.getByLabelText('Description'), '服务暂不可用');
    fireEvent.press(screen.getByText('Create Schedule')); // Actual English text in test env

    expect(await screen.findByText('Server error')).toBeOnTheScreen(); // Actual English text in test env
  });

  it('shows the empty response message for empty_response errors', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('empty_response'));
    render(
      <LocaleProvider>
        <IndexScreen onSubmit={onSubmit} />
      </LocaleProvider>
    );

    fireEvent.changeText(screen.getByLabelText('Description'), '返回为空');
    fireEvent.press(screen.getByText('Create Schedule')); // Actual English text in test env

    expect(await screen.findByText('Data loading failed')).toBeOnTheScreen(); // Actual English text in test env
  });

  it('shows the invalid format message for invalid_format errors', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('invalid_format'));
    render(
      <LocaleProvider>
        <IndexScreen onSubmit={onSubmit} />
      </LocaleProvider>
    );

    fireEvent.changeText(screen.getByLabelText('Description'), '格式异常');
    fireEvent.press(screen.getByText('Create Schedule')); // Actual English text in test env

    expect(await screen.findByText('Data validation error')).toBeOnTheScreen(); // Actual English text in test env
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
    render(
      <LocaleProvider>
        <IndexScreen onSubmit={onSubmit} />
      </LocaleProvider>
    );

    fireEvent.changeText(screen.getByLabelText('Description'), '先失败一次');
    fireEvent.press(screen.getByText('Create Schedule')); // Actual English text in test env

    expect(await screen.findByText('Operation failed')).toBeOnTheScreen(); // Actual English text in test env

    fireEvent.changeText(screen.getByLabelText('Description'), '明天下午三点开需求评审会');
    fireEvent.press(screen.getByText('Create Schedule')); // Actual English text in test env

    await waitFor(() => {
      expect(onSubmit).toHaveBeenNthCalledWith(1, '先失败一次');
      expect(onSubmit).toHaveBeenNthCalledWith(2, '明天下午三点开需求评审会');
    });

    expect(screen.queryByText('Operation failed')).not.toBeOnTheScreen(); // Actual English text in test env
    expect(screen.getByText('Draft saved')).toBeOnTheScreen(); // Actual English text in test env
    expect(screen.getByText('需求评审会')).toBeOnTheScreen();
  });

  it('shows draft validation errors when required fields are missing', () => {
    render(
      <LocaleProvider>
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
      </LocaleProvider>
    );

    fireEvent.press(screen.getByText('Create Schedule')); // Actual English text in test env

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

    render(
      <LocaleProvider>
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
      </LocaleProvider>
    );

    fireEvent.changeText(screen.getByLabelText('Remind me'), '10');
    fireEvent.press(screen.getByText('Weekly')); // Actual English text in test env
    fireEvent.changeText(screen.getByLabelText('Description'), '带上原型');
    fireEvent.press(screen.getByText('Create Schedule')); // Actual English text in test env

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          reminderMinutesBefore: 10,
          recurrence: 'WEEKLY',
          notes: '带上原型',
        }),
      );
    });

    expect(screen.getByText('Published')).toBeOnTheScreen(); // Actual English text in test env

    render(
      <LocaleProvider>
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
      </LocaleProvider>
    );

    expect(screen.getAllByText('需求评审会').length).toBeGreaterThan(0);
    expect(screen.getByText('带上原型')).toBeOnTheScreen();
  });
});
