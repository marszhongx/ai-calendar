import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import DraftScreen from '../draft';
import IndexScreen from '../index';
import SchedulesScreen from '../schedules';
import type { ScheduleDraft } from '../../src/types';

describe('input to draft flow', () => {
  it('renders the input screen placeholder', () => {
    render(<IndexScreen />);

    expect(screen.getByText('输入消息')).toBeOnTheScreen();
  });

  it('renders the draft screen placeholder', () => {
    render(<DraftScreen />);

    expect(screen.getByText('确认草案')).toBeOnTheScreen();
  });

  it('renders the schedules screen placeholder', async () => {
    render(<SchedulesScreen />);

    expect(screen.getByText('我的日程')).toBeOnTheScreen();
    await waitFor(() => {
      expect(screen.getByText('还没有已保存的日程')).toBeOnTheScreen();
    });
  });

  it('submits message input for parsing and surfaces a draft', async () => {
    const onSubmit = jest.fn().mockResolvedValue({
      title: '需求评审会',
      startAt: '2026-03-17T15:00:00.000Z',
      timezone: 'Asia/Shanghai',
      reminderMinutesBefore: 30,
      recurrence: 'NONE',
      notes: '',
      confidence: 0.9,
      missingFields: [],
    } satisfies ScheduleDraft);
    render(<IndexScreen onSubmit={onSubmit} />);

    fireEvent.changeText(screen.getByLabelText('消息输入框'), '明天下午三点开需求评审会');
    fireEvent.press(screen.getByText('开始解析'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('明天下午三点开需求评审会');
    });

    expect(screen.getByText('已生成草案')).toBeOnTheScreen();
    expect(screen.getByText('需求评审会')).toBeOnTheScreen();
  });

  it('shows draft validation errors when required fields are missing', () => {
    render(
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
      />,
    );

    fireEvent.press(screen.getByText('创建日程'));

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
      />,
    );

    fireEvent.changeText(screen.getByLabelText('提醒提前分钟'), '10');
    fireEvent.press(screen.getByText('每周'));
    fireEvent.changeText(screen.getByLabelText('备注'), '带上原型');
    fireEvent.press(screen.getByText('创建日程'));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          reminderMinutesBefore: 10,
          recurrence: 'WEEKLY',
          notes: '带上原型',
        }),
      );
    });

    expect(screen.getByText('已创建日程')).toBeOnTheScreen();

    render(
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
      />,
    );

    expect(screen.getAllByText('需求评审会').length).toBeGreaterThan(0);
    expect(screen.getByText('带上原型')).toBeOnTheScreen();
  });
});
