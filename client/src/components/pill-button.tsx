import { Button, SizableText } from 'tamagui'
import { ACCENT_COLOR, ACCENT_COLOR_PRESSED, PILL_UNSELECTED_BG, SECONDARY_TEXT } from '../constants'

type PillButtonProps = {
  selected: boolean
  onPress(): void
  disabled?: boolean
  children: string
}

export function PillButton({ selected, onPress, disabled, children }: PillButtonProps) {
  return (
    <Button
      size="$3"
      borderRadius={20}
      borderWidth={0}
      backgroundColor={selected ? ACCENT_COLOR : PILL_UNSELECTED_BG}
      onPress={onPress}
      disabled={disabled}
      hoverStyle={{
        backgroundColor: selected ? ACCENT_COLOR : '#E5E7EB',
      }}
      pressStyle={{
        backgroundColor: selected ? ACCENT_COLOR_PRESSED : '#D1D5DB',
      }}
      disabledStyle={{
        backgroundColor: selected ? ACCENT_COLOR : PILL_UNSELECTED_BG,
        opacity: 0.5,
      }}
    >
      <SizableText size="$3" color={selected ? 'white' : SECONDARY_TEXT}>
        {children}
      </SizableText>
    </Button>
  )
}
