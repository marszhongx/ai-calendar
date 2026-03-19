import { YStack } from 'tamagui'
import { Stack, useRouter } from 'expo-router'
import { useLocale } from '@/context/LocaleContext'
import { AIConfigForm } from '@/components/ai-config-form'

export default function ConfigScreen() {
  const { t } = useLocale()
  const router = useRouter()

  return (
    <>
      <Stack.Screen options={{ title: t('aiConfig.title') }} />
      <YStack flex={1} backgroundColor="$background" padding="$4">
        <AIConfigForm onConfigChange={() => router.dismissAll()} />
      </YStack>
    </>
  )
}
