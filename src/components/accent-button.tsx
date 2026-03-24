import { Button, type ButtonProps, SizableText } from 'tamagui'
import { ACCENT_COLOR, ACCENT_COLOR_PRESSED } from '../constants'

type AccentButtonProps = ButtonProps & {
  label: string
}

export function AccentButton({ label, ...props }: AccentButtonProps) {
  return (
    <Button
      size="$5"
      backgroundColor={ACCENT_COLOR}
      borderRadius={12}
      hoverStyle={{ backgroundColor: ACCENT_COLOR }}
      pressStyle={{ backgroundColor: ACCENT_COLOR_PRESSED }}
      disabledStyle={{ backgroundColor: ACCENT_COLOR, opacity: 0.5 }}
      {...props}
    >
      <SizableText color="white" fontWeight="600" size="$4">
        {label}
      </SizableText>
    </Button>
  )
}
