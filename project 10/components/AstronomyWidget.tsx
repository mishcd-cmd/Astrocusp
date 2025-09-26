import React, { useEffect, useState } from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet, Pressable } from 'react-native';
import { getAstronomicalInsightWithApod, type ApodResult } from '@/utils/astronomy';

type Props = { hemisphere: 'Northern' | 'Southern' };

export default function AstronomyWidget({ hemisphere }: Props) {
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState<string>('');
  const [apod, setApod] = useState<ApodResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { insight, apod } = await getAstronomicalInsightWithApod(hemisphere);
        if (!alive) return;
        setInsight(insight);
        setApod(apod);
      } catch (e: any) {
        setErr(e?.message || 'Failed to load astronomy data');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [hemisphere]);

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator />
        <Text style={styles.muted}>Loading celestial goodies…</Text>
      </View>
    );
  }

  if (err) {
    return (
      <View style={styles.card}>
        <Text style={styles.error}>Oops: {err}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Tonight’s Sky</Text>
      <Text style={styles.text}>{insight}</Text>

      {apod && (
        <View style={styles.apodBlock}>
          <Text style={styles.subtitle}>NASA APOD — {apod.title}</Text>
          {apod.mediaType === 'image' && apod.url ? (
            <Image
              source={{ uri: apod.hdurl || apod.url }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <Pressable onPress={() => window.open(apod.url, '_blank', 'noopener,noreferrer')}>
              <Text style={styles.link}>View APOD ({apod.mediaType})</Text>
            </Pressable>
          )}
          {apod.copyright ? <Text style={styles.credit}>© {apod.copyright}</Text> : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)' },
  title: { fontSize: 20, fontWeight: '700', color: '#e8e8e8' },
  subtitle: { fontSize: 16, fontWeight: '600', color: '#d4af37', marginTop: 8 },
  text: { color: '#cfd8ea', lineHeight: 22 },
  image: { width: '100%', height: 220, borderRadius: 10, marginTop: 8 },
  link: { color: '#9ecbff', textDecorationLine: 'underline', marginTop: 8 },
  credit: { color: '#9aa3b2', fontSize: 12, marginTop: 4 },
  muted: { color: '#9aa3b2', marginTop: 8 },
  error: { color: '#ff6b6b' },
  apodBlock: { marginTop: 6 }
});
