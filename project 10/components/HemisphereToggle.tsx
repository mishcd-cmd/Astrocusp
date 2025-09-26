import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useHemisphere } from '@/providers/HemisphereProvider';

export default function HemisphereToggle() {
  const { hemisphere, setHemisphereSafe, saving } = useHemisphere();

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <TouchableOpacity
        style={[styles.btn, hemisphere === 'Northern' && styles.active]}
        onPress={() => setHemisphereSafe('Northern')}
        disabled={saving}
      >
        <Text style={[styles.txt, hemisphere === 'Northern' && styles.activeTxt]}>Northern</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, hemisphere === 'Southern' && styles.active]}
        onPress={() => setHemisphereSafe('Southern')}
        disabled={saving}
      >
        <Text style={[styles.txt, hemisphere === 'Southern' && styles.activeTxt]}>Southern</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { 
    flexDirection: 'row', 
    gap: 12, 
    zIndex: 2,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  btn: { 
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    backgroundColor: 'rgba(26, 26, 46, 0.2)',
    alignItems: 'center',
  },
  active: { 
    backgroundColor: 'rgba(212, 175, 55, 0.2)', 
    borderColor: '#d4af37',
  },
  txt: { 
    fontSize: 14, 
    fontFamily: 'Vazirmatn-Medium', 
    color: '#8b9dc3',
  },
  activeTxt: {
    color: '#d4af37',
  },
});