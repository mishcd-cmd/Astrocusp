import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import AuthGate from '../../components/AuthGate';

export default function TabLayout() {
  return (
    <AuthGate>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#1a1a2e',
            borderTopColor: 'rgba(212, 175, 55, 0.3)',
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 90 : 70,
            paddingBottom: Platform.OS === 'ios' ? 30 : 10,
            paddingTop: 10,
          },
          tabBarActiveTintColor: '#d4af37',
          tabBarInactiveTintColor: '#8b9dc3',
          tabBarLabelStyle: {
            fontSize: 12,
            fontFamily: 'Vazirmatn-Medium',
            marginTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="astrology"
          options={{
            title: 'Daily',
            tabBarIcon: ({ size, color }: { size: number; color: string }) => (
              <Ionicons name="star" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="monthly"
          options={{
            title: 'Monthly',
            tabBarIcon: ({ size, color }: { size: number; color: string }) => (
              <Ionicons name="calendar" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="mystic-mish"
          options={{
            title: 'Mystic Mish',
            tabBarIcon: ({ size, color }: { size: number; color: string }) => (
              // change to a valid Ionicon if "sparkles" isn't found:
              <Ionicons name="sparkles" size={size} color={color} />
              // e.g. fallback: <Ionicons name="flash" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="find-cusp"
          options={{
            href: null, // hidden from tab bar
            title: 'Calculator',
            tabBarIcon: ({ size, color }: { size: number; color: string }) => (
              <Ionicons name="calculator" size={size} color={color} />
              // or "calculator-outline"
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ size, color }: { size: number; color: string }) => (
              <Ionicons name="settings" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen name="rising" options={{ href: null }} />
        <Tabs.Screen name="horoscope" options={{ href: null }} />
      </Tabs>
    </AuthGate>
  );
}
