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

  it('shows a fallback parse error when parsing fails with an unknown code', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('parse failed'));
    render(<IndexScreen onSubmit={onSubmit} />);

    fireEvent.changeText(screen.getByLabelText('消息输入框'), '这是一条无法解析的消息');
    fireEvent.press(screen.getByText('开始解析'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('这是一条无法解析的消息');
    });

    expect(screen.getByText('解析失败，请稍后再试')).toBeOnTheScreen();
    expect(screen.queryByText('已生成草案')).not.toBeOnTheScreen();
  });

  it('shows the service unavailable message for service_unavailable errors', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('service_unavailable'));
    render(<IndexScreen onSubmit={onSubmit} />);

    fireEvent.changeText(screen.getByLabelText('消息输入框'), '服务暂不可用');
    fireEvent.press(screen.getByText('开始解析'));

    expect(await screen.findByText('解析服务暂时不可用，请稍后再试')).toBeOnTheScreen();
  });

  it('shows the empty response message for empty_response errors', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('empty_response'));
    render(<IndexScreen onSubmit={onSubmit} />);

    fireEvent.changeText(screen.getByLabelText('消息输入框'), '返回为空');
    fireEvent.press(screen.getByText('开始解析'));

    expect(await screen.findByText('未能解析出日程信息，请换一种描述再试')).toBeOnTheScreen();
  });

  it('shows the invalid format message for invalid_format errors', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('invalid_format'));
    render(<IndexScreen onSubmit={onSubmit} />);

    fireEvent.changeText(screen.getByLabelText('消息输入框'), '格式异常');
    fireEvent.press(screen.getByText('开始解析'));

    expect(await screen.findByText('解析结果格式异常，请稍后再试')).toBeOnTheScreen();
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
    render(<IndexScreen onSubmit={onSubmit} />);

    fireEvent.changeText(screen.getByLabelText('消息输入框'), '先失败一次');
    fireEvent.press(screen.getByText('开始解析'));

    expect(await screen.findByText('解析失败，请稍后再试')).toBeOnTheScreen();

    fireEvent.changeText(screen.getByLabelText('消息输入框'), '明天下午三点开需求评审会');
    fireEvent.press(screen.getByText('开始解析'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenNthCalledWith(1, '先失败一次');
      expect(onSubmit).toHaveBeenNthCalledWith(2, '明天下午三点开需求评审会');
    });

    expect(screen.queryByText('解析失败，请稍后再试')).not.toBeOnTheScreen();
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
