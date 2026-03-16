// app/config.tsx
import { View, Text } from 'react-native';
import { AIConfigForm } from '../src/components/ai-config-form';

export default function ConfigScreen() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>AI 配置</Text>
      <AIConfigForm />
    </View>
  );
}