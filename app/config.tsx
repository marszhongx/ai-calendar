import { SizableText, YStack } from 'tamagui'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocale } from '../src/context/LocaleContext'
import { AIConfigForm } from '../src/components/ai-config-form'

export default function ConfigScreen() {
  const { t } = useLocale()

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YStack flex={1} backgroundColor="$background" padding="$4">
        <SizableText size="$8" fontWeight="bold" marginBottom="$4">
          {t('ai_config.title')}
        </SizableText>
        <AIConfigForm />
      </YStack>
    </SafeAreaView>
  )
}
