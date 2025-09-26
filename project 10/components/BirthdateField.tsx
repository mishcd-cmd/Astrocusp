import React, { useState, useEffect } from 'react';
import { Platform, TextInput, View, Text, Pressable, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

type Props = {
  initialISO?: string | null;            // e.g. "1990-07-12" or null
  onValidISO: (iso: string | null) => void; // call this when user saves/blur
};

export default function BirthdateField({ initialISO, onValidISO }: Props) {
  const [raw, setRaw] = useState<string>('');        // <- string while typing
  const [error, setError] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false); // native picker optional

  useEffect(() => {
    // Convert ISO date to DD/MM/YYYY for display
    if (initialISO) {
      try {
        const date = new Date(initialISO);
        if (!isNaN(date.getTime())) {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          setRaw(`${day}/${month}/${year}`);
        } else {
          setRaw('');
        }
      } catch {
        setRaw('');
      }
    } else {
      setRaw('');
    }
  }, [initialISO]);

  // Allow partial input while typing: DD, DD/, DD/MM, DD/MM/YYYY
  const ALLOW_PARTIAL = /^\d{0,2}(\/\d{0,2}(\/\d{0,4})?)?$/;

  function handleChangeText(text: string) {
    console.log('🔍 [BirthdateField] Input received:', text);
    
    // iPhone 8 optimization: Allow deletion and empty input with static slashes
    if (text === '') {
      setRaw('');
      setError(null);
      onValidISO(null);
      return;
    }
    
    // iPhone 8: Ultra-simple number extraction with static slash display
    let numbers = '';
    for (const char of text) {
      if (char >= '0' && char <= '9' && numbers.length < 8) {
        numbers += char;
      }
    }
    
    // iPhone 8: Very simple formatting with static slashes
    let formatted = '';
    if (numbers.length <= 2) {
      formatted = numbers;
    } else if (numbers.length <= 4) {
      formatted = numbers.slice(0, 2) + '/' + numbers.slice(2);
    } else {
      formatted = numbers.slice(0, 2) + '/' + numbers.slice(2, 4) + '/' + numbers.slice(4);
    }
    
    setRaw(formatted);
    setError(null);
    
    // Auto-validate and call onValidISO when we have a complete date
    if (numbers.length === 8) {
      const iso = ddmmyyyyToISO(formatted);
      if (iso) {
        onValidISO(iso);
      }
    }
  }

  function handleChangeTextOld(text: string) {
    if (!ALLOW_PARTIAL.test(text)) return; // ignore illegal characters
    setRaw(text);
    setError(null); // clear while typing
  }

  function ddmmyyyyToISO(text: string): string | null {
    // Only accept full strict DD/MM/YYYY
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(text)) return null;
    const [d, m, y] = text.split('/').map((n) => parseInt(n, 10));
    if (y < 1900 || y > 2100) return null;
    if (m < 1 || m > 12) return null;
    const lastDay = new Date(y, m, 0).getDate();
    if (d < 1 || d > lastDay) return null;
    // Return ISO format for database storage
    return `${y.toString().padStart(4, '0')}-${m.toString().padStart(2, '0')}-${d
      .toString()
      .padStart(2, '0')}`;
  }

  function handleBlur() {
    const iso = ddmmyyyyToISO(raw);
    if (!iso && raw !== '') {
      setError('Use format DD/MM/YYYY (1900–2100).');
      return;
    }
    onValidISO(iso); // could be null if field left blank
  }

  // OPTIONAL: native date picker for iOS/Android (keeps string for web)
  function openPicker() {
    if (Platform.OS === 'web') return; // ignore on web
    setShowPicker(true);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Birth Date (DD/MM/YYYY)</Text>

      {/* Web & native text entry (string, not Date) */}
      <TextInput
        value={raw}
        onChangeText={handleChangeText}
        onBlur={handleBlur}
        placeholder="DD/MM/YYYY"
        inputMode="numeric"          // web keyboards
        keyboardType="numbers-and-punctuation" // native
        autoComplete="bday"
        autoCorrect={false}
        style={[
          styles.input,
          error && styles.inputError
        ]}
      />

      {/* Optional native picker trigger */}
      {Platform.OS !== 'web' && (
        <Pressable onPress={openPicker} style={styles.pickerTrigger}>
          <Text style={styles.pickerText}>📅 Pick with calendar</Text>
        </Pressable>
      )}

      {Platform.OS !== 'web' && showPicker && (
        <DateTimePicker
          value={raw && ddmmyyyyToISO(raw) ? new Date(ddmmyyyyToISO(raw)!) : new Date(1990, 0, 1)}
          mode="date"
          display="spinner"
          onChange={(_, date) => {
            setShowPicker(false);
            if (date) {
              const d = date.getDate().toString().padStart(2, '0');
              const m = (date.getMonth() + 1).toString().padStart(2, '0');
              const y = date.getFullYear();
              const displayDate = `${d}/${m}/${y}`;
              setRaw(displayDate);
              setError(null);
              onValidISO(ddmmyyyyToISO(displayDate));
            }
          }}
          maximumDate={new Date(2100, 11, 31)}
          minimumDate={new Date(1900, 0, 1)}
        />
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#e8e8e8',
    paddingLeft: 44,
  },
  input: {
    backgroundColor: 'rgba(26, 26, 46, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(139, 157, 195, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingLeft: 44,
    color: '#e8e8e8',
    fontSize: 18,
    fontFamily: 'Inter-Regular',
  },
  inputError: {
    borderColor: '#ff6b6b',
  },
  pickerTrigger: {
    opacity: 0.8,
    paddingVertical: 8,
  },
  pickerText: {
    color: '#8b9dc3',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
});