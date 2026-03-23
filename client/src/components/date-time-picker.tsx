import DateTimePicker from '@react-native-community/datetimepicker'
import { useState } from 'react'
import { Modal, Platform, Pressable } from 'react-native'
import { Button, SizableText, XStack, YStack } from 'tamagui'
import { useLocale } from '../context/LocaleContext'
import {
  formatDatePart,
  formatTime,
  toDatetimeLocalValue,
  toIntlLocale,
} from '../lib/date-format'

type DateTimePickerFieldProps = {
  value: string
  onChange(isoString: string): void
  disabled?: boolean
  locale?: string
}

export function DateTimePickerField({
  value,
  onChange,
  disabled,
  locale,
}: DateTimePickerFieldProps) {
  const dateValue = value ? new Date(value) : new Date()
  const isValidDate = !Number.isNaN(dateValue.getTime())
  const safeDate = isValidDate ? dateValue : new Date()

  if (Platform.OS === 'web') {
    return (
      <input
        type="datetime-local"
        value={toDatetimeLocalValue(value)}
        onChange={(e) => {
          const date = new Date(e.target.value)
          if (!Number.isNaN(date.getTime())) {
            onChange(date.toISOString())
          }
        }}
        disabled={disabled}
        style={{
          fontSize: 14,
          padding: '8px 12px',
          borderRadius: 12,
          border: '1px solid #e0e0e0',
          backgroundColor: '#F3F4F6',
          color: '#1a1a1a',
          flex: 1,
          boxSizing: 'border-box' as const,
        }}
      />
    )
  }

  return (
    <NativeDateTimePicker
      value={safeDate}
      onChange={onChange}
      disabled={disabled}
      locale={locale}
    />
  )
}

type NativeDateTimePickerProps = {
  value: Date
  onChange(isoString: string): void
  disabled?: boolean
  locale?: string
}

function NativeDateTimePicker({
  value,
  onChange,
  disabled,
  locale,
}: NativeDateTimePickerProps) {
  const { t } = useLocale()
  const [show, setShow] = useState(false)
  const [mode, setMode] = useState<'date' | 'time'>('date')
  const [tempDate, setTempDate] = useState(value)

  const intlLocale = toIntlLocale(locale ?? 'en')

  const openPicker = () => {
    if (disabled) return
    setTempDate(value)
    setMode('date')
    setShow(true)
  }

  const handleChange = (_event: unknown, selectedDate?: Date) => {
    if (!selectedDate) {
      if (Platform.OS === 'android') setShow(false)
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
    }
  }

  const handleIOSConfirm = () => {
    if (mode === 'date') {
      setMode('time')
    } else {
      onChange(tempDate.toISOString())
      setShow(false)
    }
  }

  const handleIOSCancel = () => {
    setShow(false)
  }

  return (
    <YStack>
      <Pressable onPress={openPicker}>
        <XStack gap="$2" alignItems="center">
          <SizableText
            size="$3"
            paddingVertical="$2"
            paddingHorizontal="$3"
            backgroundColor="$backgroundHover"
            borderRadius={12}
            opacity={disabled ? 0.5 : 1}
          >
            {formatDatePart(value.toISOString(), intlLocale)}
          </SizableText>
          <SizableText
            size="$3"
            paddingVertical="$2"
            paddingHorizontal="$3"
            backgroundColor="$backgroundHover"
            borderRadius={12}
            opacity={disabled ? 0.5 : 1}
          >
            {formatTime(value.toISOString(), intlLocale)}
          </SizableText>
        </XStack>
      </Pressable>

      {show && Platform.OS === 'ios' && (
        <Modal transparent animationType="slide">
          <Pressable
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.4)',
              justifyContent: 'flex-end',
            }}
            onPress={handleIOSCancel}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <YStack
                backgroundColor="$background"
                borderTopLeftRadius={16}
                borderTopRightRadius={16}
                paddingBottom="$6"
              >
                <XStack
                  justifyContent="space-between"
                  alignItems="center"
                  padding="$3"
                >
                  <Button chromeless size="$3" onPress={handleIOSCancel}>
                    <Button.Text color="$color">
                      {t('picker.cancel')}
                    </Button.Text>
                  </Button>
                  <SizableText size="$3" fontWeight="600">
                    {mode === 'date'
                      ? t('picker.selectDate')
                      : t('picker.selectTime')}
                  </SizableText>
                  <Button chromeless size="$3" onPress={handleIOSConfirm}>
                    <Button.Text color="$blue10">
                      {mode === 'date' ? t('picker.next') : t('picker.confirm')}
                    </Button.Text>
                  </Button>
                </XStack>
                <DateTimePicker
                  value={tempDate}
                  mode={mode}
                  display="spinner"
                  onChange={handleChange}
                />
              </YStack>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {show && Platform.OS === 'android' && (
        <DateTimePicker
          value={tempDate}
          mode={mode}
          display="default"
          onChange={handleChange}
        />
      )}
    </YStack>
  )
}
