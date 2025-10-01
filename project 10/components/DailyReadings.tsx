// components/DailyReadings.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getDailyForecast, type HemiAny, type DailyRow } from '@/utils/daily';

type Props = {
  /** e.g. "Aries–Taurus Cusp", "Aries-Taurus", or "Aries" */
  primarySign?: string | null;
  /** "Northern" | "Southern" | "NH" | "SH" */
  hemisphere?: HemiAny | null;
  /** Date object or "YYYY-MM-DD" to force a specific day (optional) */
  serviceDateUTC?: Date | string | null;
  /** Show an empty card if nothing found (optional) */
  showEmptyState?: boolean;
  /** Scope cache by user (optional, safe to omit) */
  userId?: string | null;
  /** Verbose console logging */
  debug?: boolean;
};

function pad2(n: number) {
  return `${n}`.padStart(2, '0');
}
function toYmdUTC(input: Date | string | null | undefined): string | undefined {
  if (!input) return undefined;
  if (typeof input === 'string') {
    // If already YYYY-MM-DD, pass through
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
    const d = new Date(input);
    if (isNaN(d.getTime())) return undefined;
    return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
  }
  const d = input as Date;
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

export default function DailyReadings({
  primarySign,
  hemisphere,
  serviceDateUTC,
  showEmptyState,
  userId,
  debug,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<DailyRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resolvedSign = useMemo(() => (primarySign ?? '').trim(), [primarySign]);
  const resolvedHemi = useMemo<HemiAny>(() => (hemisphere ?? 'Southern'), [hemisphere]);
  const forcedYmd = useMemo(() => toYmdUTC(serviceDateUTC), [serviceDateUTC]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!resolvedSign) {
        setLoading(false);
        setRow(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const found = await getDailyForecast(resolvedSign, resolvedHemi, {
          userId: userId ?? undefined,
          forceDate: forcedYmd,
          useCache: true,
          debug: !!debug,
        });
        if (!cancelled) setRow(found);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load daily reading.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [resolvedSign, resolvedHemi, forcedYmd, userId, debug]);

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" color="#d4af37" />
        <Text style={styles.loading}>Fetching your daily guidance…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.card}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!row && !showEmptyState) return null;

  return (
    <LinearGradient
      colors={['rgba(139, 157, 195, 0.22)', 'rgba(139, 157, 195, 0.10)']}
      style={styles.gradientCard}
    >
      <Text style={styles.header}>Daily Horoscope</Text>

      {row?.daily_horoscope ? (
        <Text style={styles.body}>{row.daily_horoscope}</Text>
      ) : (
        <Text style={styles.muted}>No daily guidance found for today.</Text>
      )}

      {row?.affirmation ? (
        <>
          <View style={styles.hr} />
          <Text style={styles.subhead}>Daily Affirmation</Text>
          <Text style={styles.bodyItalic}>{row.affirmation}</Text>
        </>
      ) : null}

      {row?.deeper_insight ? (
        <>
          <View style={styles.hr} />
          <Text style={styles.subhead}>Daily Astral Plane</Text>
          <Text style={styles.body}>{row.deeper_insight}</Text>
        </>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    backgroundColor: 'rgba(26,26,46,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(139,157,195,0.3)',
    alignItems: 'center',
  },
  gradientCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(139,157,195,0.3)',
  },
  header: {
    fontSize: 18,
    fontFamily: 'Vazirmatn-Bold',
    color: '#e8e8e8',
    marginBottom: 8,
    textAlign: 'center',
  },
  subhead: {
    fontSize: 16,
    fontFamily: 'Vazirmatn-SemiBold',
    color: '#d4af37',
    marginBottom: 6,
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    fontFamily: 'Vazirmatn-Regular',
    color: '#e8e8e8',
    lineHeight: 24,
    textAlign: 'center',
  },
  bodyItalic: {
    fontSize: 16,
    fontFamily: 'Vazirmatn-Regular',
    color: '#e8e8e8',
    lineHeight: 24,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  muted: {
    fontSize: 14,
    fontFamily: 'Vazirmatn-Regular',
    color: '#8b9dc3',
    textAlign: 'center',
  },
  hr: {
    height: 1,
    backgroundColor: 'rgba(139,157,195,0.25)',
    marginVertical: 12,
  },
  loading: {
    marginTop: 8,
    fontSize: 14,
    color: '#8b9dc3',
    fontFamily: 'Vazirmatn-Regular',
  },
  error: {
    fontSize: 14,
    color: '#ff6b6b',
    fontFamily: 'Vazirmatn-Medium',
    textAlign: 'center',
  },
});
