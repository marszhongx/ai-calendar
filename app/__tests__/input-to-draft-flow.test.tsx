import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native'
import { TamaguiProvider } from 'tamagui'
import { LocaleProvider } from '@/context/LocaleContext'
import config from '@/theme/tamagui.config'

const mockRouterPush = (globalThis as Record<string, unknown>)
  .__mockRouterPush as jest.Mock
const mockRouterDismissAll = (globalThis as Record<string, unknown>)
  .__mockRouterDismissAll as jest.Mock

import dayjs from 'dayjs'
import { ScheduleList } from '@/components/schedule-list'
import { Recurrence, StorageKey } from '@/constants'
import type { ScheduleDraft } from '@/types/schedule'
import RootLayout from '../_layout'
import ConfigScreen from '../config'
import DraftScreen from '../draft'
import IndexScreen from '../index'
import NewScheduleScreen from '../new'

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <TamaguiProvider config={config} defaultTheme="light">
      <LocaleProvider>{ui}</LocaleProvider>
    </TamaguiProvider>,
  )
}

describe('page navigation flow', () => {
  beforeEach(() => {
    mockRouterPush.mockClear()
    mockRouterDismissAll.mockClear()
  })

  it('renders the new schedule screen with input form', () => {
    renderWithProviders(<NewScheduleScreen />)

    expect(screen.getByLabelText('Enter your schedule...')).toBeOnTheScreen()
  })

  it('renders the draft screen', () => {
    renderWithProviders(
      <DraftScreen
        initialDraft={{
          title: '',
          startAt: new Date().toISOString(),

          reminderMinutesBefore: 30,
          recurrence: Recurrence.NONE,
          notes: '',
          originalMessage: '',
          confidence: 0.5,
        }}
      />,
    )

    expect(screen.getByText('Create Schedule')).toBeOnTheScreen()
  })

  it('renders the home screen with schedule list', async () => {
    renderWithProviders(<IndexScreen schedules={[]} />)

    await waitFor(() => {
      expect(screen.getByText('No schedules today')).toBeOnTheScreen()
    })
  })

  it('uses dark status bar content on the light app background', () => {
    render(<RootLayout />)

    expect(screen.getByTestId('app-status-bar')).toHaveProp('style', 'dark')
  })

  it('shows DeepSeek placeholders on the AI settings screen', async () => {
    renderWithProviders(<ConfigScreen />)

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('https://api.deepseek.com'),
      ).toBeOnTheScreen()
    })
    expect(screen.getByPlaceholderText('deepseek-v4-pro')).toBeOnTheScreen()
  })

  it('shows a fallback parse error when parsing fails with an unknown code', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('parse failed'))
    renderWithProviders(<NewScheduleScreen onSubmit={onSubmit} />)

    fireEvent.changeText(
      screen.getByLabelText('Enter your schedule...'),
      '这是一条无法解析的消息',
    )
    fireEvent.press(screen.getByText('Create Schedule'))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('这是一条无法解析的消息')
    })

    expect(screen.getByText('Operation failed')).toBeOnTheScreen()
    expect(screen.queryByText('Draft saved')).not.toBeOnTheScreen()
  })

  it('shows the service unavailable message for service_unavailable errors', async () => {
    const onSubmit = jest
      .fn()
      .mockRejectedValue(new Error('service_unavailable'))
    renderWithProviders(<NewScheduleScreen onSubmit={onSubmit} />)

    fireEvent.changeText(
      screen.getByLabelText('Enter your schedule...'),
      '服务暂不可用',
    )
    fireEvent.press(screen.getByText('Create Schedule'))

    expect(await screen.findByText('Server error')).toBeOnTheScreen()
  })

  it('shows the empty response message for empty_response errors', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('empty_response'))
    renderWithProviders(<NewScheduleScreen onSubmit={onSubmit} />)

    fireEvent.changeText(
      screen.getByLabelText('Enter your schedule...'),
      '返回为空',
    )
    fireEvent.press(screen.getByText('Create Schedule'))

    expect(await screen.findByText('Data loading failed')).toBeOnTheScreen()
  })

  it('shows the invalid format message for invalid_format errors', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('invalid_format'))
    renderWithProviders(<NewScheduleScreen onSubmit={onSubmit} />)

    fireEvent.changeText(
      screen.getByLabelText('Enter your schedule...'),
      '格式异常',
    )
    fireEvent.press(screen.getByText('Create Schedule'))

    expect(await screen.findByText('Data validation error')).toBeOnTheScreen()
  })

  it('clears the old parse error after a successful retry and navigates to draft', async () => {
    mockRouterPush.mockClear()

    const onSubmit = jest
      .fn()
      .mockRejectedValueOnce(new Error('parse failed'))
      .mockResolvedValueOnce({
        title: '需求评审会',
        startAt: '2026-03-17T15:00:00.000Z',
        reminderMinutesBefore: 30,
        recurrence: Recurrence.NONE,
        notes: '',
        originalMessage: '明天下午三点开需求评审会',
        confidence: 0.9,
      } satisfies ScheduleDraft)
    renderWithProviders(<NewScheduleScreen onSubmit={onSubmit} />)

    fireEvent.changeText(
      screen.getByLabelText('Enter your schedule...'),
      '先失败一次',
    )
    fireEvent.press(screen.getByText('Create Schedule'))

    expect(await screen.findByText('Operation failed')).toBeOnTheScreen()

    fireEvent.changeText(
      screen.getByLabelText('Enter your schedule...'),
      '明天下午三点开需求评审会',
    )
    fireEvent.press(screen.getByText('Create Schedule'))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenNthCalledWith(2, '明天下午三点开需求评审会')
    })

    expect(screen.queryByText('Operation failed')).not.toBeOnTheScreen()
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      StorageKey.PENDING_DRAFT,
      expect.stringContaining('需求评审会'),
    )
    expect(mockRouterPush).toHaveBeenCalledWith('/draft')
  })

  it('shows draft validation errors when required fields are missing', () => {
    renderWithProviders(
      <DraftScreen
        initialDraft={{
          title: '',
          startAt: '',

          reminderMinutesBefore: 30,
          recurrence: Recurrence.NONE,
          notes: '',
          originalMessage: '',
          confidence: 0.4,
        }}
      />,
    )

    fireEvent.press(screen.getByText('Create Schedule'))

    expect(screen.getByText('Event name is required')).toBeOnTheScreen()
  })

  it('calls dismissAll after creating a schedule', async () => {
    const onCreate = jest.fn().mockResolvedValue({
      id: 'schedule-1',
      title: '需求评审会',
      startAt: '2026-03-17T15:00:00.000Z',
      timezone: 'Asia/Shanghai',
      reminderMinutesBefore: 10,
      recurrence: Recurrence.WEEKLY,
      notes: '带上原型',
      originalMessage: '',
      notificationId: 'notification-1',
      createdAt: '2026-03-16T09:00:00.000Z',
      updatedAt: '2026-03-16T09:00:00.000Z',
    })

    renderWithProviders(
      <DraftScreen
        onCreate={onCreate}
        initialDraft={{
          title: '需求评审会',
          startAt: '2026-03-17T15:00:00.000Z',

          reminderMinutesBefore: 30,
          recurrence: Recurrence.NONE,
          notes: '',
          originalMessage: '',
          confidence: 0.9,
        }}
      />,
    )

    fireEvent.changeText(screen.getByLabelText('Remind me'), '10')
    fireEvent.press(screen.getByText('Weekly'))
    fireEvent.changeText(screen.getByLabelText('Description'), '带上原型')
    fireEvent.press(screen.getByText('Create Schedule'))

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          reminderMinutesBefore: 10,
          recurrence: Recurrence.WEEKLY,
          notes: '带上原型',
        }),
      )
    })

    await waitFor(() => {
      expect(mockRouterDismissAll).toHaveBeenCalled()
    })
  })

  it('renders schedule card with time range when endAt exists', () => {
    const now = dayjs().hour(12).minute(0).second(0)
    renderWithProviders(
      <IndexScreen
        schedules={[
          {
            id: 'schedule-range',
            title: '团队会议',
            startAt: now.toISOString(),
            endAt: now.add(1, 'hour').toISOString(),

            reminderMinutesBefore: 10,
            recurrence: Recurrence.NONE,
            notes: '',
            originalMessage: '',
            notificationId: 'n-1',
            createdAt: now.subtract(1, 'day').toISOString(),
            updatedAt: now.subtract(1, 'day').toISOString(),
          },
        ]}
      />,
    )

    expect(screen.getByText('团队会议')).toBeOnTheScreen()
  })

  it('hides notes when schedule notes is empty', () => {
    const now = dayjs().hour(12).minute(0).second(0).toISOString()
    renderWithProviders(
      <IndexScreen
        schedules={[
          {
            id: 'schedule-no-notes',
            title: '空备注日程',
            startAt: now,

            reminderMinutesBefore: 0,
            recurrence: Recurrence.NONE,
            notes: '',
            originalMessage: '',
            notificationId: 'n-2',
            createdAt: now,
            updatedAt: now,
          },
        ]}
      />,
    )

    expect(screen.getByText('空备注日程')).toBeOnTheScreen()
    expect(
      screen.queryByTestId('schedule-notes-schedule-no-notes'),
    ).not.toBeOnTheScreen()
  })

  it('navigates to new schedule page when FAB is pressed', () => {
    renderWithProviders(<IndexScreen schedules={[]} />)

    fireEvent.press(screen.getByText('+'))

    expect(mockRouterPush).toHaveBeenCalledWith('/new')
  })

  it('renders tab controls with Today selected by default', async () => {
    renderWithProviders(<IndexScreen schedules={[]} />)

    await waitFor(() => {
      expect(screen.getByText('Today')).toBeOnTheScreen()
      expect(screen.getByText('Tomorrow')).toBeOnTheScreen()
      expect(screen.getByText('All')).toBeOnTheScreen()
    })
  })

  it('filters schedules by selected tab', async () => {
    const today = dayjs().hour(12).minute(0).second(0).toISOString()
    const tomorrow = dayjs()
      .add(1, 'day')
      .hour(12)
      .minute(0)
      .second(0)
      .toISOString()

    renderWithProviders(
      <IndexScreen
        schedules={[
          {
            id: 's-today',
            title: '今日会议',
            startAt: today,

            reminderMinutesBefore: 10,
            recurrence: Recurrence.NONE,
            notes: '',
            originalMessage: '',
            createdAt: today,
            updatedAt: today,
          },
          {
            id: 's-tomorrow',
            title: '明日会议',
            startAt: tomorrow,

            reminderMinutesBefore: 10,
            recurrence: Recurrence.NONE,
            notes: '',
            originalMessage: '',
            createdAt: today,
            updatedAt: today,
          },
        ]}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('今日会议')).toBeOnTheScreen()
    })
    expect(screen.queryByText('明日会议')).not.toBeOnTheScreen()

    fireEvent.press(screen.getByText('Tomorrow'))

    await waitFor(() => {
      expect(screen.getByText('明日会议')).toBeOnTheScreen()
    })
    expect(screen.queryByText('今日会议')).not.toBeOnTheScreen()

    fireEvent.press(screen.getByText('All'))

    await waitFor(() => {
      expect(screen.getByText('今日会议')).toBeOnTheScreen()
      expect(screen.getByText('明日会议')).toBeOnTheScreen()
    })
  })

  it('renders custom submit label when submitLabel prop is provided', () => {
    renderWithProviders(
      <DraftScreen
        initialDraft={{
          title: 'Test',
          startAt: new Date().toISOString(),

          reminderMinutesBefore: 30,
          recurrence: Recurrence.NONE,
          notes: '',
          originalMessage: '',
          confidence: 0.9,
        }}
        submitLabel="Save"
      />,
    )

    expect(screen.getByText('Save')).toBeOnTheScreen()
    expect(screen.queryByText('Create Schedule')).not.toBeOnTheScreen()
  })

  it('calls onPress when a schedule card is tapped', () => {
    const onPress = jest.fn()
    const now = dayjs().hour(12).minute(0).second(0).toISOString()
    const schedule = {
      id: 's-tap',
      title: '可点击日程',
      startAt: now,
      timezone: 'Asia/Shanghai',
      reminderMinutesBefore: 10,
      recurrence: Recurrence.NONE,
      notes: '',
      originalMessage: '',
      createdAt: now,
      updatedAt: now,
    }

    renderWithProviders(
      <ScheduleList schedules={[schedule]} onPress={onPress} />,
    )

    fireEvent.press(screen.getByText('可点击日程'))
    expect(onPress).toHaveBeenCalledWith(schedule)
  })

  it('navigates to schedule detail when a schedule card is tapped', async () => {
    const now = dayjs().hour(12).minute(0).second(0).toISOString()
    renderWithProviders(
      <IndexScreen
        schedules={[
          {
            id: 's-detail',
            title: '点击查看详情',
            startAt: now,

            reminderMinutesBefore: 10,
            recurrence: Recurrence.NONE,
            notes: '',
            originalMessage: '',
            createdAt: now,
            updatedAt: now,
          },
        ]}
      />,
    )

    fireEvent.press(screen.getByText('点击查看详情'))
    expect(mockRouterPush).toHaveBeenCalledWith('/schedule/s-detail')
  })

  it('shows tab-specific empty message when no schedules match', async () => {
    renderWithProviders(<IndexScreen schedules={[]} />)

    await waitFor(() => {
      expect(screen.getByText('No schedules today')).toBeOnTheScreen()
    })

    fireEvent.press(screen.getByText('Tomorrow'))

    await waitFor(() => {
      expect(screen.getByText('No schedules tomorrow')).toBeOnTheScreen()
    })

    fireEvent.press(screen.getByText('All'))

    await waitFor(() => {
      expect(screen.getByText('No schedules yet')).toBeOnTheScreen()
    })
  })
})
