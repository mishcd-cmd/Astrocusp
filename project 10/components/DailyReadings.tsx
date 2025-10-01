// components/DailyReadings.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Sparkles } from 'lucide-react-native';
import { getDailyForecast, type HemiAny, type DailyRow } from '@/utils/daily';

type Nullable<T> = T | null | undefined;

type Props = {
  /** e.g. "Aries" or "Aries–Taurus Cusp" (we’ll pass this straight into your utils) */
  primarySign: Nullable<string>;
  /** 'Northern' | 'Southern' (or NH/SH works too). If null, we default to 'Southern' to satisfy the util. */
  hemisphere: Nullable<'Northern' | 'Southern'>;
  /** ISO string recommended; we slice YYYY-MM-DD and pass as forceDate into your util */
  serviceDateUTC?: Nullable<string>;
  /** Optional: show simple “not found” message when there’s no row */
  showEmptyState?: boolean;
};

export default function DailyReadings({
  primarySign,
  hemisphere,
  serviceDateUTC,
  showEmptyState,
}: Props) {
  const [row, setRow] = useState<DailyRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Normalize inputs for your util
  const cleanSign = useMemo(() => (primarySign ?? '').trim(), [primarySign]);
  const hemi: HemiAny = (hemisphere ?? 'Southern') as HemiAny; // your util requires a value
  const forceDate = useMemo(
    () => (serviceDateUTC ? serviceDateUTC.slice(0, 10) : undefined),
    [serviceDateUTC]
  );

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setRow(null);

    if (!cleanSign) {
      setError('No sign available.');
      return;
    }

    (async () => {
      try {
        const data = await getDailyForecast(cleanSign, hemi, {
          forceDate,
          // cache + safe defaults are already inside your util
          useCache: true,
          debug: false,
          // Your util: for cusp labels, it won’t fall back to true signs (good)
        });
        if (!cancelled) setRow(data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load daily readings.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cleanSign, hemi, forceDate]);

  if (error) {
    return (
      <View style={styles.card}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!row) {
    if (showEmptyState) {
      return (
        <View style={styles.card}>
          <Text style={styles.metaDim}>No daily reading found for today.</Text>
        </View>
      );
    }
    return null;
  }

  // row contains: sign, hemisphere, date, daily_horoscope, affirmation, deeper_insight
  const guidance = row.daily_horoscope || '';
  const affirmation = row.affirmation || '';
  const deeper = row.deeper_insight || '';

  return (
    <View style={{ gap: 12 }}>
      {/* Guidance */}
      {guidance ? (
        <LinearGradient colors={['rgba(139,157,195,0.20)', 'rgba(139,157,195,0.10)']} style={styles.card}>
          <View style={styles.header}>
            <Sparkles size={18} color="#8b9dc3" />
            <Text style={styles.title}>Daily Horoscope</Text>
            <Text style={styles.meta}>
              {row.sign} • {row.hemisphere}
            </Text>
          </View>
          <Text style={styles.body}>{guidance}</Text>
        </LinearGradient>
      ) : null}

      {/* Affirmation */}
      {affirmation ? (
        <LinearGradient colors={['rgba(212,175,55,0.20)', 'rgba(212,175,55,0.10)']} style={styles.card}>
          <View style={styles.header}>
            <Crown size={18} color="#d4af37" />
            <Text style={styles.title}>Daily Affirmation</Text>
          </View>
          <Text style={styles.affirmation}>"{affirmation}"</Text>
        </LinearGradient>
      ) : null}

      {/* Astral Plane */}
      {deeper ? (
        <LinearGradient colors={['rgba(212,175,55,0.18)', 'rgba(212,175,55,0.08)']} style={styles.card}>
          <View style={styles.header}>
            <Crown size={18} color="#d4af37" />
            <Text style={styles.title}>Daily Astral Plane</Text>
          </View>
          <Text style={styles.body}>{deeper}</Text>
        </LinearGradient>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(139,157,195,0.30)',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  title: { fontSize: 16, color: '#e8e8e8', fontFamily: 'Vazirmatn-SemiBold', flex: 1 },
  meta: { fontSize: 12, color: '#8b9dc3', fontFamily: 'Inter-Regular' },
  metaDim: { fontSize: 12, color: '#8b9dc3', fontFamily: 'Inter-Regular', textAlign: 'center' },
  body: { fontSize: 14, color: '#e8e8e8', lineHeight: 20, fontFamily: 'Vazirmatn-Regular' },
  affirmation: {
    fontSize: 15,
    color: '#e8e8e8',
    lineHeight: 22,
    fontFamily: 'Vazirmatn-Regular',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  errorText: { color: '#ff6b6b', fontFamily: 'Vazirmatn-Medium' },
});
