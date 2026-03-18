import { YStack } from 'tamagui'
import { Stack } from 'expo-router'
import { useLocale } from '../src/context/LocaleContext'
import { AIConfigForm } from '../src/components/ai-config-form'

export default function ConfigScreen() {
  const { t } = useLocale()

  return (
    <>
      <Stack.Screen options={{ title: t('ai_config.title') }} />
      <YStack flex={1} backgroundColor="$background" padding="$4">
        <AIConfigForm />
      </YStack>
    </>
  )
}
