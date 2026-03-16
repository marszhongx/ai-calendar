// src/components/ai-config-form.tsx
import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLocale } from '../context/LocaleContext';
import { ConfigManager } from '../config/ai-config';

interface AIConfigFormProps {
  onConfigChange?: () => void;
}

export const AIConfigForm: React.FC<AIConfigFormProps> = ({ onConfigChange }) => {
  const { t } = useLocale(); // 添加国际化钩子
  const configManager = ConfigManager.getInstance();
  const currentConfig = configManager.getConfig();

  const [provider, setProvider] = useState(currentConfig.aiProvider);
  const [model, setModel] = useState(currentConfig.aiModel);
  const [apiKey, setApiKey] = useState(currentConfig.aiApiKey);
  const [baseUrl, setBaseUrl] = useState(currentConfig.aiBaseUrl || '');

  useEffect(() => {
    setProvider(currentConfig.aiProvider);
    setModel(currentConfig.aiModel);
    setApiKey(currentConfig.aiApiKey);
    setBaseUrl(currentConfig.aiBaseUrl || '');
  }, []);

  const handleSave = () => {
    if (!apiKey.trim()) {
      Alert.alert(t('messages.error'), t('messages.invalidInput'));
      return;
    }

    configManager.updateConfig({
      aiProvider: provider as 'google' | 'openai' | 'anthropic',
      aiModel: model,
      aiApiKey: apiKey,
      aiBaseUrl: baseUrl || undefined
    });

    Alert.alert(t('messages.success'), t('ai_config.saveSuccess'));

    if (onConfigChange) {
      onConfigChange();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('ai_config.provider')}:</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.optionButton, provider === 'google' && styles.selectedOption]}
          onPress={() => setProvider('google')}
        >
          <Text style={[styles.optionText, provider === 'google' && styles.selectedOptionText]}>Google</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.optionButton, provider === 'openai' && styles.selectedOption]}
          onPress={() => setProvider('openai')}
        >
          <Text style={[styles.optionText, provider === 'openai' && styles.selectedOptionText]}>OpenAI</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.optionButton, provider === 'anthropic' && styles.selectedOption]}
          onPress={() => setProvider('anthropic')}
        >
          <Text style={[styles.optionText, provider === 'anthropic' && styles.selectedOptionText]}>Anthropic</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>{t('ai_config.modelName')}:</Text>
      <TextInput
        style={styles.input}
        value={model}
        onChangeText={setModel}
        placeholder={t('ai_config.defaultModel')}
      />

      <Text style={styles.label}>{t('ai_config.apiKey')}:</Text>
      <TextInput
        style={styles.input}
        value={apiKey}
        onChangeText={setApiKey}
        placeholder={t('ai_config.apiKey')}
        secureTextEntry={true}
      />

      <Text style={styles.label}>{t('ai_config.baseUrl')}:</Text>
      <TextInput
        style={styles.input}
        value={baseUrl}
        onChangeText={setBaseUrl}
        placeholder={t('ai_config.baseUrlPlaceholder')}
        keyboardType="url"
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>{t('ai_config.saveSettings')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginVertical: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  optionButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 4,
  },
  selectedOption: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionText: {
    color: '#333',
  },
  selectedOptionText: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginBottom: 16,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});