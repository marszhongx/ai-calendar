import { Text, TextInput, View } from 'react-native';

type FormFieldProps = {
  label: string;
  value: string;
  onChangeText(value: string): void;
};

export function FormField({ label, value, onChangeText }: FormFieldProps) {
  return (
    <View>
      <Text>{label}</Text>
      <TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} />
    </View>
  );
}
