import type { ReactNode } from 'react'
import { Label, YStack } from 'tamagui'

type FormFieldProps = {
  label: string
  children: ReactNode
}

export function FormField({ label, children }: FormFieldProps) {
  return (
    <YStack gap="$2">
      <Label fontSize="$4" fontWeight="bold">
        {label}
      </Label>
      {children}
    </YStack>
  )
}
