import { useState } from 'react'
import { Platform, Pressable } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { SizableText, YStack } from 'tamagui'

type DateTimePickerFieldProps = {
  value: string
  onChange(isoString: string): void
  disabled?: boolean
  locale?: string
}

function formatForDisplay(isoString: string, locale?: string): string {
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return isoString
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return isoString
  }
}

function toDatetimeLocalValue(isoString: string): string {
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return ''
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
  } catch {
    return ''
  }
}

export function DateTimePickerField({ value, onChange, disabled, locale }: DateTimePickerFieldProps) {
  const dateValue = value ? new Date(value) : new Date()
  const isValidDate = !isNaN(dateValue.getTime())
  const safeDate = isValidDate ? dateValue : new Date()

  if (Platform.OS === 'web') {
    return (
      <input
        type="datetime-local"
        value={toDatetimeLocalValue(value)}
        onChange={(e) => {
          const date = new Date(e.target.value)
          if (!isNaN(date.getTime())) {
            onChange(date.toISOString())
          }
        }}
        disabled={disabled}
        style={{
          fontSize: 16,
          padding: 12,
          borderRadius: 8,
          border: '1px solid var(--borderColor, #ccc)',
          backgroundColor: 'transparent',
          color: 'inherit',
          width: '100%',
          boxSizing: 'border-box',
        }}
      />
    )
  }

  return <NativeDateTimePicker value={safeDate} onChange={onChange} disabled={disabled} locale={locale} />
}

type NativeDateTimePickerProps = {
  value: Date
  onChange(isoString: string): void
  disabled?: boolean
  locale?: string
}

function NativeDateTimePicker({ value, onChange, disabled, locale }: NativeDateTimePickerProps) {
  const [show, setShow] = useState(false)
  const [mode, setMode] = useState<'date' | 'time'>('date')
  const [tempDate, setTempDate] = useState(value)

  const openPicker = () => {
    if (disabled) return
    setTempDate(value)
    setMode('date')
    setShow(true)
  }

  const handleChange = (_event: unknown, selectedDate?: Date) => {
    if (!selectedDate) {
      setShow(false)
      return
    }

    if (Platform.OS === 'android') {
      if (mode === 'date') {
        setTempDate(selectedDate)
        setMode('time')
      } else {
        setShow(false)
        onChange(selectedDate.toISOString())
      }
    } else {
      setTempDate(selectedDate)
      onChange(selectedDate.toISOString())
    }
  }

  return (
    <YStack>
      <Pressable onPress={openPicker}>
        <SizableText
          size="$4"
          paddingVertical="$3"
          paddingHorizontal="$3"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$4"
          opacity={disabled ? 0.5 : 1}
        >
          {formatForDisplay(value.toISOString(), locale)}
        </SizableText>
      </Pressable>

      {show && (
        <DateTimePicker
          value={tempDate}
          mode={mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
        />
      )}
    </YStack>
  )
}
