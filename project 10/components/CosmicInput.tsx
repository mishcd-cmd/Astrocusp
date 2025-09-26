import React, { useState } from 'react';
import {
  TextInput,
  Text,
  View,
  StyleSheet,
  TextInputProps,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface CosmicInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  label: string;
  error?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  dateInput?: boolean;
}

export default function CosmicInput({
  label,
  error,
  value = '',
  onChangeText,
  dateInput = false,
  ...textInputProps
}: CosmicInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const formatDateInput = (text: string) => {
    if (!dateInput) return text;
    
    // Extract only digits, preserving order
    const digits = text.replace(/\D/g, '');
    
    // Format with static slashes
    if (digits.length <= 2) {
      return digits;
    } else if (digits.length <= 4) {
      return digits.slice(0, 2) + '/' + digits.slice(2);
    } else if (digits.length <= 8) {
      return digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4, 8);
    }
    
    return digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4, 8);
  };

  const formatTimeInput = (text: string) => {
    // Enhanced time formatting with static colon for 24-hour format
    let numbers = '';
    for (const char of text) {
      if ((char >= '0' && char <= '9') && numbers.length < 4) {
        numbers += char;
      }
    }
    
    // Format with static colon - always show HH:MM format
    if (numbers.length <= 2) {
      return numbers + (numbers.length === 2 ? ':' : '');
    } else {
      return numbers.slice(0, 2) + ':' + numbers.slice(2);
    }
  };

  const handleTextChange = (text: string) => {
    if (dateInput) {
      const formatted = formatDateInput(text);
      onChangeText?.(formatted);
    } else if (label === 'Birth Time') {
      const formatted = formatTimeInput(text);
      onChangeText?.(formatted);
    } else {
      onChangeText?.(text);
    }
  };


  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
        <LinearGradient
          colors={['rgba(26, 26, 46, 0.4)', 'rgba(26, 26, 46, 0.2)']}
          style={styles.inputBackground}
        >
          <TextInput
            style={[
              styles.input,
              dateInput && styles.dateInput,
            ]}
            placeholderTextColor="#8b9dc3"
            value={value}
            onChangeText={handleTextChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            keyboardType={dateInput || label === 'Birth Time' ? 'numeric' : 'default'}
            maxLength={dateInput ? 10 : label === 'Birth Time' ? 5 : undefined}
            {...textInputProps}
          />
        </LinearGradient>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    fontSize: 18,
    fontFamily: 'Vazirmatn-Medium',
    color: '#e8e8e8',
    marginBottom: 8,
  },
  inputContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  inputContainerFocused: {
    borderColor: 'rgba(212, 175, 55, 0.6)',
  },
  inputBackground: {
    backgroundColor: 'rgba(26, 26, 46, 0.4)',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    fontFamily: 'Vazirmatn-Regular',
    color: '#e8e8e8',
    minHeight: 52,
  },
  dateInput: {
    fontFamily: 'Vazirmatn-Medium',
    letterSpacing: 1,
  },
  error: {
    fontSize: 14,
    fontFamily: 'Vazirmatn-Regular',
    color: '#ff6b6b',
    marginTop: 4,
  },
});