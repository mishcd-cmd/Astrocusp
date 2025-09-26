// app/subscription.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Crown, CreditCard, Eye, ArrowLeft, Star, Calendar, Zap } from 'lucide-react-native';

import CosmicBackground from '@/components/CosmicBackground';
import {
  openStripePortal,
  subscribeMonthly,
  subscribeYearly,
  upgradeToYearly,
  buyOneOffReading,
  getSubscriptionStatus,
} from '@/utils/billing';

type SubStatus = {
  active: boolean;
  plan?: 'monthly' | 'yearly';
  renewsAt?: string;
  customerId?: string;
  price_id?: string;
  status?: string;
} | null;

export default function SubscriptionScreen() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SubStatus>(null);
  const [actionLoading, setActionLoading] = useState<null | 'portal' | 'upgrade' | 'monthly' | 'yearly' | 'one-off'>(null);

  const refreshStatus = useCallback(async () => {
    const s = await getSubscriptionStatus();
    setStatus(s);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await refreshStatus();
      } catch (e) {
        console.error('[subscription] status error', e);
        Alert.alert('Error', 'Could not fetch subscription status.');
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshStatus]);

  const handleGoBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/settings');
  };

  const onOpenPortal = async () => {
    try {
      setActionLoading('portal');
      await openStripePortal();
    } catch (e: any) {
      console.error('[subscription] portal error', e);
      Alert.alert('Billing Portal', e?.message || 'Failed to open billing portal.');
    } finally {
      setActionLoading(null);
    }
  };

  const onUpgrade = async () => {
    try {
      setActionLoading('upgrade');
      const res = await upgradeToYearly();
      Alert.alert('Upgrade', res?.message || 'Your plan has been upgraded to yearly.');
      await refreshStatus();
    } catch (e: any) {
      console.error('[subscription] upgrade error', e);
      Alert.alert('Upgrade Failed', e?.message || 'Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const onSubscribeMonthly = async () => {
    try {
      console.log('[settings/subscription] Monthly button clicked - starting process...');
      setActionLoading('monthly');
      
      // Check authentication
      const { getCurrentUser } = await import('@/utils/auth');
      const authUser = await getCurrentUser();
      
      if (!authUser) {
        console.error('[settings/subscription] No authenticated user found');
        Alert.alert('Authentication Required', 'Please sign in to subscribe.');
        setActionLoading(null);
        return;
      }
      
      // Check Stripe configuration
      const { isStripeConfigured } = await import('@/utils/stripe');
      if (!isStripeConfigured()) {
        console.error('[settings/subscription] Stripe not configured');
        Alert.alert('Configuration Error', 'Payment system not configured. Please contact support.');
        setActionLoading(null);
        return;
      }
      
      await subscribeMonthly();
    } catch (e: any) {
      console.error('[subscription] monthly error', e);
      Alert.alert('Subscription Failed', e?.message || 'Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const onSubscribeYearly = async () => {
    try {
      console.log('[settings/subscription] Yearly button clicked - starting process...');
      setActionLoading('yearly');
      
      // Check authentication
      const { getCurrentUser } = await import('@/utils/auth');
      const authUser = await getCurrentUser();
      
      if (!authUser) {
        console.error('[settings/subscription] No authenticated user found');
        Alert.alert('Authentication Required', 'Please sign in to subscribe.');
        setActionLoading(null);
        return;
      }
      
      // Check Stripe configuration
      const { isStripeConfigured } = await import('@/utils/stripe');
      if (!isStripeConfigured()) {
        console.error('[settings/subscription] Stripe not configured');
        Alert.alert('Configuration Error', 'Payment system not configured. Please contact support.');
        setActionLoading(null);
        return;
      }
      
      await subscribeYearly();
    } catch (e: any) {
      console.error('[subscription] yearly error', e);
      Alert.alert('Subscription Failed', e?.message || 'Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const onBuyOneOff = async () => {
    try {
      console.log('[settings/subscription] One-off button clicked - starting process...');
      setActionLoading('one-off');
      
      // Check authentication
      const { getCurrentUser } = await import('@/utils/auth');
      const authUser = await getCurrentUser();
      
      if (!authUser) {
        console.error('[settings/subscription] No authenticated user found');
        Alert.alert('Authentication Required', 'Please sign in to purchase.');
        setActionLoading(null);
        return;
      }
      
      // Check Stripe configuration
      const { isStripeConfigured } = await import('@/utils/stripe');
      if (!isStripeConfigured()) {
        console.error('[settings/subscription] Stripe not configured');
        Alert.alert('Configuration Error', 'Payment system not configured. Please contact support.');
        setActionLoading(null);
        return;
      }
      
      await buyOneOffReading();
    } catch (e: any) {
      console.error('[subscription] one-off error', e);
      Alert.alert('Purchase Failed', e?.message || 'Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <CosmicBackground />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#d4af37" />
            <Text style={styles.loadingText}>Loading subscription details...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const isActive = !!status?.active;
  const isMonthly = status?.plan === 'monthly';
  const isYearly = status?.plan === 'yearly';

  return (
    <View style={styles.container}>
      <CosmicBackground />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <ArrowLeft size={24} color="#8b9dc3" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.content}>
            <Text style={styles.title}>Astral Plane</Text>
            <Text style={styles.subtitle}>Manage your cosmic subscription</Text>

            {/* Current Subscription Status */}
            <LinearGradient
              colors={
                isActive
                  ? ['rgba(139, 195, 74, 0.2)', 'rgba(139, 195, 74, 0.1)']
                  : ['rgba(139, 157, 195, 0.2)', 'rgba(139, 157, 195, 0.1)']
              }
              style={styles.statusCard}
            >
              <View style={styles.statusHeader}>
                <Crown size={24} color={isActive ? '#8bc34a' : '#8b9dc3'} />
                <Text style={styles.statusTitle}>Current Status</Text>
              </View>

              {isActive ? (
                <>
                  <Text style={styles.statusActive}>
                    Active ({isYearly ? 'Yearly' : 'Monthly'} Plan)
                  </Text>
                  {status?.renewsAt && (
                    <Text style={styles.renewalDate}>
                      Renews:{' '}
                      {new Date(status.renewsAt).toLocaleDateString('en-GB', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                  )}

                  <View style={styles.activeFeatures}>
                    <View style={styles.featureItem}>
                      <Star size={16} color="#8bc34a" />
                      <Text style={styles.featureText}>Daily Astral Plane insights</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Calendar size={16} color="#8bc34a" />
                      <Text style={styles.featureText}>Monthly cosmic forecasts</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Zap size={16} color="#8bc34a" />
                      <Text style={styles.featureText}>Astronomical context</Text>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.statusInactive}>No active subscription</Text>
                  <Text style={styles.statusDescription}>
                    Subscribe to unlock deeper cosmic insights and personalized guidance
                  </Text>
                </>
              )}
            </LinearGradient>

            {/* Management (only if active) */}
            {isActive && (
              <LinearGradient
                colors={['rgba(212, 175, 55, 0.15)', 'rgba(212, 175, 55, 0.05)']}
                style={styles.managementCard}
              >
                <View style={styles.managementHeader}>
                  <CreditCard size={20} color="#d4af37" />
                  <Text style={styles.managementTitle}>Manage Subscription</Text>
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.portalButton]}
                    onPress={onOpenPortal}
                    disabled={actionLoading === 'portal'}
                  >
                    <CreditCard size={16} color="#8b9dc3" />
                    <Text style={styles.portalButtonText}>
                      {actionLoading === 'portal' ? 'Opening…' : 'Billing Portal'}
                    </Text>
                  </TouchableOpacity>

                  {isMonthly && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.upgradeButton]}
                      onPress={onUpgrade}
                      disabled={actionLoading === 'upgrade'}
                    >
                      <Crown size={16} color="#1a1a2e" />
                      <Text style={styles.upgradeButtonText}>
                        {actionLoading === 'upgrade' ? 'Upgrading…' : 'Upgrade to Yearly'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.managementNote}>
                  Use the billing portal to update payment methods, view invoices, or cancel your subscription.
                </Text>
              </LinearGradient>
            )}

            {/* Plans (only if not active) */}
            {!isActive && (
              <View style={styles.subscriptionOptions}>
                <Text style={styles.optionsTitle}>Choose Your Plan</Text>

                <LinearGradient
                  colors={['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.1)']}
                  style={styles.planCard}
                >
                  <View style={styles.planHeader}>
                    <Crown size={20} color="#d4af37" />
                    <Text style={styles.planName}>Monthly Plan</Text>
                  </View>
                  <Text style={styles.planPrice}>$8.00 AUD / month</Text>
                  <Text style={styles.planDescription}>
                    Full access to all premium features with monthly billing
                  </Text>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.subscribeButton]}
                    onPress={onSubscribeMonthly}
                    disabled={actionLoading === 'monthly'}
                  >
                    <Text style={styles.subscribeButtonText}>
                      {actionLoading === 'monthly' ? 'Processing…' : 'Start Monthly'}
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>

                <LinearGradient
                  colors={['rgba(212, 175, 55, 0.25)', 'rgba(212, 175, 55, 0.15)']}
                  style={[styles.planCard, styles.yearlyPlanCard]}
                >
                  <View style={styles.planHeader}>
                    <Crown size={20} color="#d4af37" />
                    <Text style={styles.planName}>Yearly Plan</Text>
                    <View style={styles.savingsBadge}>
                      <Text style={styles.savingsText}>Save up to 10%</Text>
                    </View>
                  </View>
                  <Text style={styles.planPrice}>$88.00 AUD / year</Text>
                  <Text style={styles.planEquivalent}>Only $7.33 per month</Text>
                  <Text style={styles.planDescription}>
                    Full access to all premium features with yearly savings
                  </Text>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.subscribeButton]}
                    onPress={onSubscribeYearly}
                    disabled={actionLoading === 'yearly'}
                  >
                    <Text style={styles.subscribeButtonText}>
                      {actionLoading === 'yearly' ? 'Processing…' : 'Start Yearly'}
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            )}

            {/* One-off Reading */}
            <LinearGradient
              colors={['rgba(139, 157, 195, 0.2)', 'rgba(139, 157, 195, 0.1)']}
              style={styles.oneOffCard}
            >
              <View style={styles.oneOffHeader}>
                <Eye size={24} color="#8b9dc3" />
                <Text style={styles.oneOffTitle}>One-Time Reading</Text>
              </View>

              <Text style={styles.oneOffPrice}>$360.00 AUD</Text>
              <Text style={styles.oneOffDescription}>
                Get a comprehensive one-time cusp analysis with detailed insights, birthstone guidance,
                personalized cosmic profile, and a copy of the AstroCusp ebook containing all cusp 
                personalities without a subscription.
              </Text>

              <TouchableOpacity
                style={[styles.actionButton, styles.oneOffButton]}
                onPress={onBuyOneOff}
                disabled={actionLoading === 'one-off'}
              >
                <Eye size={16} color="#1a1a2e" />
                <Text style={styles.oneOffButtonText}>
                  {actionLoading === 'one-off' ? 'Processing…' : 'Purchase Reading'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.oneOffNote}>
                Perfect for exploring cusp astrology without a subscription commitment
              </Text>
            </LinearGradient>

            {/* Action overlay */}
            {actionLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#d4af37" />
                <Text style={styles.loadingActionText}>Processing {actionLoading}…</Text>
              </View>
            )}
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
  content: { flex: 1, paddingTop: 20 },
  title: { fontSize: 36, fontFamily: 'PlayfairDisplay-Bold', color: '#e8e8e8', textAlign: 'center', marginBottom: 8, letterSpacing: 2 },
  subtitle: { fontSize: 16, fontFamily: 'Inter-Regular', color: '#8b9dc3', textAlign: 'center', marginBottom: 32, lineHeight: 24 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, fontFamily: 'Inter-Regular', color: '#8b9dc3', marginTop: 12 },

  statusCard: { borderRadius: 16, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(139, 157, 195, 0.3)' },
  statusHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  statusTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay-Bold', color: '#e8e8e8', marginLeft: 12 },
  statusActive: { fontSize: 18, fontFamily: 'Inter-SemiBold', color: '#8bc34a', textAlign: 'center', marginBottom: 8 },
  statusInactive: { fontSize: 18, fontFamily: 'Inter-SemiBold', color: '#8b9dc3', textAlign: 'center', marginBottom: 8 },
  statusDescription: { fontSize: 14, fontFamily: 'Inter-Regular', color: '#8b9dc3', textAlign: 'center', lineHeight: 20 },
  renewalDate: { fontSize: 14, fontFamily: 'Inter-Regular', color: '#8b9dc3', textAlign: 'center', marginBottom: 16 },

  activeFeatures: { gap: 8, marginTop: 8 },
  featureItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  featureText: { fontSize: 14, fontFamily: 'Inter-Medium', color: '#e8e8e8', marginLeft: 8 },

  managementCard: { borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)' },
  managementHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  managementTitle: { fontSize: 18, fontFamily: 'Inter-SemiBold', color: '#d4af37', marginLeft: 12 },
  buttonRow: { flexDirection: 'row', gap: 12, marginBottom: 12, flexWrap: 'wrap' },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    minHeight: 44,
    gap: 8,
    flex: 1,
    minWidth: 120,
  },
  portalButton: { backgroundColor: 'rgba(139, 157, 195, 0.2)', borderWidth: 1, borderColor: 'rgba(139, 157, 195, 0.4)' },
  portalButtonText: { color: '#8b9dc3', fontFamily: 'Inter-Medium', fontSize: 14 },
  upgradeButton: { backgroundColor: '#d4af37' },
  upgradeButtonText: { color: '#1a1a2e', fontFamily: 'Inter-SemiBold', fontSize: 14 },
  managementNote: { fontSize: 12, fontFamily: 'Inter-Regular', color: '#8b9dc3', textAlign: 'center', lineHeight: 16, fontStyle: 'italic' },

  subscriptionOptions: { marginBottom: 24 },
  optionsTitle: { fontSize: 22, fontFamily: 'PlayfairDisplay-Bold', color: '#e8e8e8', textAlign: 'center', marginBottom: 20 },

  planCard: { borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)' },
  yearlyPlanCard: { borderWidth: 2, borderColor: 'rgba(212, 175, 55, 0.5)' },
  planHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  planName: { fontSize: 18, fontFamily: 'Inter-SemiBold', color: '#e8e8e8', marginLeft: 12, flex: 1 },
  savingsBadge: { backgroundColor: '#8bc34a', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  savingsText: { fontSize: 12, fontFamily: 'Inter-SemiBold', color: '#1a1a2e' },
  planPrice: { fontSize: 24, fontFamily: 'PlayfairDisplay-Bold', color: '#d4af37', textAlign: 'center', marginBottom: 4 },
  planEquivalent: { fontSize: 14, fontFamily: 'Inter-Medium', color: '#8bc34a', textAlign: 'center', marginBottom: 8 },
  planDescription: { fontSize: 14, fontFamily: 'Inter-Regular', color: '#8b9dc3', textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  subscribeButton: { backgroundColor: '#d4af37' },
  subscribeButtonText: { color: '#1a1a2e', fontFamily: 'Inter-SemiBold', fontSize: 16 },

  oneOffCard: { borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(139, 157, 195, 0.3)' },
  oneOffHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  oneOffTitle: { fontSize: 18, fontFamily: 'Inter-SemiBold', color: '#8b9dc3', marginLeft: 12 },
  oneOffPrice: { fontSize: 28, fontFamily: 'PlayfairDisplay-Bold', color: '#8b9dc3', textAlign: 'center', marginBottom: 8 },
  oneOffDescription: { fontSize: 14, fontFamily: 'Inter-Regular', color: '#e8e8e8', textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  oneOffButton: { backgroundColor: '#8b9dc3', marginBottom: 12 },
  oneOffButtonText: { color: '#1a1a2e', fontFamily: 'Inter-SemiBold', fontSize: 16 },
  oneOffNote: { fontSize: 12, fontFamily: 'Inter-Regular', color: '#8b9dc3', textAlign: 'center', lineHeight: 16, fontStyle: 'italic' },

  featuresSection: { marginTop: 16 },
  featuresTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay-Bold', color: '#e8e8e8', textAlign: 'center', marginBottom: 16 },
  featuresList: {
    backgroundColor: 'rgba(26, 26, 46, 0.4)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 157, 195, 0.2)',
    gap: 8,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },

  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(26, 26, 46, 0.8)', alignItems: 'center', justifyContent: 'center', borderRadius: 16,
  },
  loadingActionText: { fontSize: 16, fontFamily: 'Inter-Regular', color: '#8b9dc3', marginTop: 12 },
});
