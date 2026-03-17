import '@testing-library/react-native/build/matchers/extend-expect';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notification-id'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('./src/theme/tamagui.config', () => {
  const { createTamagui } = require('tamagui');
  const { config } = require('@tamagui/config/v3');
  return { __esModule: true, default: createTamagui(config) };
});
