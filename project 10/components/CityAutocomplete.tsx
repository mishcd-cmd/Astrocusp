import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';

// --- Offline fallback list (extend anytime) ---
type City = {
  name: string;
  country: string;
  lat: number;
  lon: number;
};

const OFFLINE_CITIES: City[] = [
  // Australia (capitals + majors)
  { name: 'Sydney', country: 'Australia', lat: -33.8688, lon: 151.2093 },
  { name: 'Melbourne', country: 'Australia', lat: -37.8136, lon: 144.9631 },
  { name: 'Brisbane', country: 'Australia', lat: -27.4698, lon: 153.0251 },
  { name: 'Perth', country: 'Australia', lat: -31.9523, lon: 115.8613 },
  { name: 'Adelaide', country: 'Australia', lat: -34.9285, lon: 138.6007 },
  { name: 'Hobart', country: 'Australia', lat: -42.8821, lon: 147.3272 },
  { name: 'Canberra', country: 'Australia', lat: -35.2809, lon: 149.1300 },
  { name: 'Darwin', country: 'Australia', lat: -12.4634, lon: 130.8456 },
  { name: 'Gold Coast', country: 'Australia', lat: -28.0167, lon: 153.4000 },

  // New Zealand
  { name: 'Auckland', country: 'New Zealand', lat: -36.8509, lon: 174.7645 },
  { name: 'Wellington', country: 'New Zealand', lat: -41.2866, lon: 174.7756 },
  { name: 'Christchurch', country: 'New Zealand', lat: -43.5321, lon: 172.6362 },

  // SE Asia hubs
  { name: 'Singapore', country: 'Singapore', lat: 1.3521, lon: 103.8198 },
  { name: 'Bangkok', country: 'Thailand', lat: 13.7563, lon: 100.5018 },
  { name: 'Kuala Lumpur', country: 'Malaysia', lat: 3.1390, lon: 101.6869 },
  { name: 'Jakarta', country: 'Indonesia', lat: -6.2088, lon: 106.8456 },
  { name: 'Manila', country: 'Philippines', lat: 14.5995, lon: 120.9842 },
  { name: 'Ho Chi Minh City', country: 'Vietnam', lat: 10.8231, lon: 106.6297 },
  { name: 'Hanoi', country: 'Vietnam', lat: 21.0278, lon: 105.8342 },

  // East Asia
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503 },
  { name: 'Seoul', country: 'South Korea', lat: 37.5665, lon: 126.9780 },
  { name: 'Hong Kong', country: 'China', lat: 22.3193, lon: 114.1694 },
  { name: 'Taipei', country: 'Taiwan', lat: 25.0330, lon: 121.5654 },
  { name: 'Shanghai', country: 'China', lat: 31.2304, lon: 121.4737 },
  { name: 'Beijing', country: 'China', lat: 39.9042, lon: 116.4074 },

  // Europe capitals/majors
  { name: 'London', country: 'United Kingdom', lat: 51.5074, lon: -0.1278 },
  { name: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522 },
  { name: 'Berlin', country: 'Germany', lat: 52.5200, lon: 13.4050 },
  { name: 'Madrid', country: 'Spain', lat: 40.4168, lon: -3.7038 },
  { name: 'Rome', country: 'Italy', lat: 41.9028, lon: 12.4964 },
  { name: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lon: 4.9041 },
  { name: 'Barcelona', country: 'Spain', lat: 41.3851, lon: 2.1734 },
  { name: 'Dublin', country: 'Ireland', lat: 53.3498, lon: -6.2603 },
  { name: 'Lisbon', country: 'Portugal', lat: 38.7223, lon: -9.1393 },
  { name: 'Athens', country: 'Greece', lat: 37.9838, lon: 23.7275 },
  { name: 'Vienna', country: 'Austria', lat: 48.2082, lon: 16.3738 },
  { name: 'Zurich', country: 'Switzerland', lat: 47.3769, lon: 8.5417 },
  { name: 'Prague', country: 'Czechia', lat: 50.0755, lon: 14.4378 },

  // Americas
  { name: 'New York', country: 'United States', lat: 40.7128, lon: -74.0060 },
  { name: 'Los Angeles', country: 'United States', lat: 34.0522, lon: -118.2437 },
  { name: 'Chicago', country: 'United States', lat: 41.8781, lon: -87.6298 },
  { name: 'Toronto', country: 'Canada', lat: 43.6532, lon: -79.3832 },
  { name: 'Vancouver', country: 'Canada', lat: 49.2827, lon: -123.1207 },
  { name: 'Mexico City', country: 'Mexico', lat: 19.4326, lon: -99.1332 },
  { name: 'Rio de Janeiro', country: 'Brazil', lat: -22.9068, lon: -43.1729 },
  { name: 'São Paulo', country: 'Brazil', lat: -23.5558, lon: -46.6396 },
  { name: 'Buenos Aires', country: 'Argentina', lat: -34.6037, lon: -58.3816 },

  // Middle East & Africa
  { name: 'Dubai', country: 'UAE', lat: 25.2048, lon: 55.2708 },
  { name: 'Abu Dhabi', country: 'UAE', lat: 24.4539, lon: 54.3773 },
  { name: 'Doha', country: 'Qatar', lat: 25.2854, lon: 51.5310 },
  { name: 'Riyadh', country: 'Saudi Arabia', lat: 24.7136, lon: 46.6753 },
  { name: 'Istanbul', country: 'Türkiye', lat: 41.0082, lon: 28.9784 },
  { name: 'Cairo', country: 'Egypt', lat: 30.0444, lon: 31.2357 },
  { name: 'Johannesburg', country: 'South Africa', lat: -26.2041, lon: 28.0473 },
  { name: 'Cape Town', country: 'South Africa', lat: -33.9249, lon: 18.4241 },
];

export type CityResult = City & {
  displayName: string;
  hemisphere: 'Northern' | 'Southern';
};

export type CityAutocompleteProps = {
  label?: string;
  placeholder?: string;
  value?: CityResult | null;
  onChange: (city: CityResult | null) => void;
  autoFocus?: boolean;
  minChars?: number;
};

function hemiFromLat(lat: number): 'Northern' | 'Southern' {
  return lat >= 0 ? 'Northern' : 'Southern';
}

export default function CityAutocomplete({
  label = 'City / Town',
  placeholder = 'Start typing a city…',
  value,
  onChange,
  autoFocus,
  minChars = 2,
}: CityAutocompleteProps) {
  const [query, setQuery] = useState<string>(value ? value.displayName : '');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CityResult[]>([]);
  const [touched, setTouched] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<any>(null);

  // local filter for offline list
  const offlineSearch = (q: string): CityResult[] => {
    const qq = q.toLowerCase();
    return OFFLINE_CITIES
      .filter(c => c.name.toLowerCase().includes(qq) || c.country.toLowerCase().includes(qq))
      .slice(0, 20)
      .map(c => ({
        ...c,
        displayName: `${c.name}, ${c.country}`,
        hemisphere: hemiFromLat(c.lat),
      }));
  };

  const search = (q: string) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    // If too short, show nothing (or offline quick hits)
    if (q.trim().length < minChars) {
      setResults([]);
      return;
    }

    setLoading(true);

    // Primary: Nominatim (OpenStreetMap)
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=12&accept-language=en&q=${encodeURIComponent(
      q
    )}`;

    fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Astrocusp/1.0 (https://astrocusp.com.au)',
        'Accept': 'application/json',
      },
      signal: abortRef.current.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`Nominatim error ${r.status}`);
        const data = (await r.json()) as any[];
        const mapped: CityResult[] = data
          .map(item => {
            const lat = parseFloat(item.lat);
            const lon = parseFloat(item.lon);
            const addr = item.address || {};
            const cityName =
              addr.city || addr.town || addr.village || addr.municipality || item.display_name?.split(',')?.[0] || 'Unknown';
            const country = addr.country || addr.country_code?.toUpperCase() || '';
            return {
              name: cityName,
              country,
              lat,
              lon,
              displayName: `${cityName}${country ? `, ${country}` : ''}`,
              hemisphere: hemiFromLat(lat),
            } as CityResult;
          })
          // prefer places that are cities/towns, remove duplicates by name+country
          .filter(Boolean)
          .reduce((acc: CityResult[], cur) => {
            const key = `${cur.name}|${cur.country}`;
            if (!acc.find(x => `${x.name}|${x.country}` === key)) acc.push(cur);
            return acc;
          }, []);

        if (mapped.length > 0) {
          setResults(mapped);
        } else {
          // Fallback to offline list if API found nothing useful
          setResults(offlineSearch(q));
        }
      })
      .catch(() => {
        // Offline or blocked → fallback
        setResults(offlineSearch(q));
      })
      .finally(() => setLoading(false));
  };

  // Debounce queries
  useEffect(() => {
    if (!touched) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(query), 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const select = (city: CityResult) => {
    setQuery(city.displayName);
    setResults([]);
    onChange(city);
  };

  const clear = () => {
    setQuery('');
    setResults([]);
    onChange(null);
  };

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={styles.inputRow}>
        <TextInput
          value={query}
          onChangeText={t => {
            if (!touched) setTouched(true);
            setQuery(t);
          }}
          placeholder={placeholder}
          placeholderTextColor="#8b9dc3"
          style={styles.input}
          autoFocus={autoFocus}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="search"
        />
        {loading ? <ActivityIndicator size="small" color="#d4af37" style={{ marginLeft: 8 }} /> : null}
        {query.length > 0 ? (
          <TouchableOpacity onPress={clear} style={styles.clear}>
            <Text style={styles.clearText}>×</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {results.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            keyboardShouldPersistTaps="handled"
            data={results}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => select(item)} style={styles.item}>
                <Text style={styles.itemName}>{item.displayName}</Text>
                <Text style={styles.itemMeta}>
                  {item.hemisphere} • {item.lat.toFixed(2)}, {item.lon.toFixed(2)}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(it) => `${it.name}-${it.country}-${it.lat}-${it.lon}`}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16, zIndex: Platform.OS === 'web' ? 100 : 1 },
  label: {
    color: '#e8e8e8',
    fontSize: 14,
    marginBottom: 6,
    fontFamily: 'Vazirmatn-Medium',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26,26,46,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(139,157,195,0.35)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'web' ? 10 : 8,
  },
  input: {
    flex: 1,
    color: '#e8e8e8',
    fontSize: 16,
    fontFamily: 'Vazirmatn-Regular',
    paddingVertical: 4,
  },
  clear: {
    marginLeft: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139,157,195,0.25)',
  },
  clearText: { color: '#e8e8e8', fontSize: 18, marginTop: -1 },

  dropdown: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139,157,195,0.35)',
    backgroundColor: 'rgba(10,10,22,0.96)',
    maxHeight: 260,
    overflow: 'hidden',
  },
  item: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139,157,195,0.15)',
  },
  itemName: { color: '#e8e8e8', fontSize: 15, fontFamily: 'Vazirmatn-Medium' },
  itemMeta: { color: '#8b9dc3', fontSize: 12, marginTop: 2, fontFamily: 'Inter-Regular' },
});
