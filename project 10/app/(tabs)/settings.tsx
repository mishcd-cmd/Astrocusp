import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { User, Info, FileText, Crown, ArrowLeft, Languages } from 'lucide-react-native';
import CosmicBackground from '../../components/CosmicBackground';
import { getUserLanguage, setUserLanguage, type SupportedLanguage } from '@/utils/translation';
import { signOut, getCurrentUser } from '@/utils/auth';
import { clearUserData } from '@/utils/userData';

// --- Paranoid: names/keys that should NEVER show in production
const HIDDEN_KEYS = new Set([
  'admin-clean-duplicate-profile',
  'admin-clean-duplicates',
  'clean-duplicate',
  'remove-duplicate',
]);

function looksLikeHiddenAdminText(txt?: string | null) {
  if (!txt) return false;
  const s = txt.trim();
  return (
    /^:?\s*admin/i.test(s) &&
    /duplicate/i.test(s)
  ) || /clean.*duplicate/i.test(s)
    || /remove.*duplicate/i.test(s);
}

// --- WEB-ONLY SWEEPER (kills injected admin tiles even if some runtime adds them)
function useKillInjectedAdminCards() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !document?.body) return;

    const kill = () => {
      // remove any clickable card whose text matches our admin/duplicate patterns
      const all = Array.from(document.querySelectorAll<HTMLElement>('*'));
      for (const el of all) {
        const text = el.innerText || el.textContent || '';
        if (looksLikeHiddenAdminText(text)) {
          // Remove the nearest card-like container
          const card = el.closest('[role="button"],a,button,div');
          (card as HTMLElement | null)?.remove?.();
        }
      }
    };

    // run once now
    kill();

    // keep watching for runtime injections
    const obs = new MutationObserver(() => kill());
    obs.observe(document.body, { childList: true, subtree: true });

    return () => obs.disconnect();
  }, []);
}

export default function SettingsScreen() {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Run the sweeper on web so injected admin tiles disappear immediately
  useKillInjectedAdminCards();

  useEffect(() => {
    console.log('[settings] PRODUCTION: Settings screen loaded - NO ADMIN CARDS SHOULD BE VISIBLE');
    console.log('[settings] Build timestamp:', new Date().toISOString());
  }, []);

  useEffect(() => {
    loadLanguagePreference();
    checkAuthStatus();
  }, []);

  const loadLanguagePreference = async () => {
    try {
      const language = await getUserLanguage();
      setCurrentLanguage(language);
    } catch (error) {
      console.error('Error loading language preference:', error);
    }
  };

  const checkAuthStatus = async () => {
    try {
      const user = await getCurrentUser();
      setIsAuthenticated(!!user);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/horoscope');
    }
  };

  const handleMenuOption = (option: string) => {
    switch (option) {
      case 'account':
        router.push('/settings/account');
        break;
      case 'subscription':
        router.push('/subscription');
        break;
      case 'about':
        router.push('/about');
        break;
      case 'terms':
        router.push('/terms');
        break;
      case 'translate':
        handleLanguageToggle();
        break;
      case 'signout':
        handleSignOut();
        break;
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearUserData();
              await signOut();
              router.replace('/auth/login');
            } catch (error) {
              console.error('Sign out error:', error);
              router.replace('/auth/login');
            }
          }
        }
      ]
    );
  };

  const handleLanguageToggle = async () => {
    try {
      const newLanguage = currentLanguage === 'en' ? 'zh' : 'en';
      await setUserLanguage(newLanguage);
      setCurrentLanguage(newLanguage);

      setTimeout(async () => {
        try {
          const { getSubscriptionStatus } = await import('@/utils/billing');
          await getSubscriptionStatus();
        } catch (error) {
          console.warn('Failed to refresh subscription after language change:', error);
        }
      }, 1000);

      if (newLanguage === 'zh') {
        Alert.alert(
          '中文翻译已启用 (Chinese Translation Enabled)',
          '应用程序现在将翻译成中文\n\nThe app will now translate to Chinese',
          [{ text: '好的 OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Translation Error',
        'Failed to change language. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <CosmicBackground />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
              <ArrowLeft size={24} color="#8b9dc3" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>
              Manage your cosmic journey and app preferences
            </Text>

            <View style={styles.menuOptions}>
              {/* Cache buster comment - updated 2025-09-05-v3 - KILL ADMIN CARDS */}
              <TouchableOpacity
                style={styles.menuOption}
                onPress={() => handleMenuOption('account')}
              >
                <LinearGradient
                  colors={['rgba(139, 157, 195, 0.2)', 'rgba(139, 157, 195, 0.1)']}
                  style={styles.menuOptionGradient}
                >
                  <User size={24} color="#8b9dc3" />
                  <View style={styles.menuOptionContent}>
                    <Text style={styles.menuOptionTitle}>Account</Text>
                    <Text style={styles.menuOptionDescription}>
                      View and edit your cosmic profile, or <Text style={styles.signOutText}>sign out</Text>
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuOption}
                onPress={() => router.push('/settings/subscription')}
              >
                <LinearGradient
                  colors={['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.1)']}
                  style={styles.menuOptionGradient}
                >
                  <Crown size={24} color="#d4af37" />
                  <View style={styles.menuOptionContent}>
                    <Text style={styles.menuOptionTitle}>Astral Plane</Text>
                    <Text style={styles.menuOptionDescription}>
                      Manage your premium subscription
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Translation feature temporarily hidden - keeping script for future Chinese market
              <TouchableOpacity
                style={styles.menuOption}
                onPress={handleLanguageToggle}
              >
                <LinearGradient
                  colors={['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.1)']}
                  style={styles.menuOptionGradient}
                >
                  <Languages size={24} color="#d4af37" />
                  <View style={styles.menuOptionContent}>
                    <Text style={styles.menuOptionTitle}>
                      {currentLanguage === 'zh' ? '切换到英文 (Switch to English)' : '中文翻译 (Chinese)'}
                    </Text>
                    <Text style={styles.menuOptionDescription}>
                      {currentLanguage === 'zh'
                        ? '切换回英文界面 Switch back to English interface'
                        : 'Translate the app to Mandarin Chinese 将应用翻译成中文'
                      }
                    </Text>
                    <Text style={styles.refreshNote}>
                      You must refresh your page
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
              */}

              <TouchableOpacity
                style={styles.menuOption}
                onPress={() => handleMenuOption('about')}
              >
                <LinearGradient
                  colors={['rgba(139, 157, 195, 0.2)', 'rgba(139, 157, 195, 0.1)']}
                  style={styles.menuOptionGradient}
                >
                  <Info size={24} color="#8b9dc3" />
                  <View style={styles.menuOptionContent}>
                    <Text style={styles.menuOptionTitle}>About Astro Cusp</Text>
                    <Text style={styles.menuOptionDescription}>
                      Learn how to use the app and features
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuOption}
                onPress={() => handleMenuOption('terms')}
              >
                <LinearGradient
                  colors={['rgba(139, 157, 195, 0.2)', 'rgba(139, 157, 195, 0.1)']}
                  style={styles.menuOptionGradient}
                >
                  <FileText size={24} color="#8b9dc3" />
                  <View style={styles.menuOptionContent}>
                    <Text style={styles.menuOptionTitle}>Terms & Conditions</Text>
                    <Text style={styles.menuOptionDescription}>
                      Review our terms and privacy policy
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  backButton: { flexDirection: 'row', alignItems: 'center', paddingTop: 20, paddingBottom: 10 },
  backText: { fontSize: 16, fontFamily: 'Inter-Medium', color: '#8b9dc3', marginLeft: 8 },
  content: { flex: 1, paddingTop: 60 },
  title: { fontSize: 44, fontFamily: 'Vazirmatn-Bold', color: '#e8e8e8', textAlign: 'center', marginBottom: 8, letterSpacing: 2 },
  subtitle: { fontSize: 20, fontFamily: 'Inter-Regular', color: '#8b9dc3', textAlign: 'center', marginBottom: 40, lineHeight: 24 },
  menuOptions: { gap: 20 },
  menuOption: { borderRadius: 16, overflow: 'hidden' },
  menuOptionGradient: { flexDirection: 'row', alignItems: 'center', padding: 24, borderWidth: 1, borderColor: 'rgba(139, 157, 195, 0.3)', borderRadius: 16 },
  menuOptionContent: { marginLeft: 16, flex: 1 },
  menuOptionTitle: { fontSize: 22, fontFamily: 'Inter-SemiBold', color: '#e8e8e8', marginBottom: 4 },
  menuOptionDescription: { fontSize: 18, fontFamily: 'Inter-Regular', color: '#8b9dc3', lineHeight: 20 },
  refreshNote: { fontSize: 14, fontFamily: 'Inter-Regular', color: '#8b9dc3', marginTop: 4, opacity: 0.8 },
  signOutText: { color: '#f87171' },
});